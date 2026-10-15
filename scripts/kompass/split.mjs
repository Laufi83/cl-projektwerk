/** Modell in benannte, bewegliche Gruppen aufteilen, Einzelteile je Gruppe zusammenfassen und komprimieren.
 *  Aufruf: node split.mjs in.glb out.glb config.mjs */
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { dedup, join, weld, prune, textureCompress, meshopt, simplify } from "@gltf-transform/functions";
import { MeshoptEncoder, MeshoptSimplifier } from "meshoptimizer";
import sharp from "sharp";
const [inp, out, cfgPath] = process.argv.slice(2);
function getBoundsMeshOnly(n) { const W = n.getWorldMatrix(), min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  for (const p of n.getMesh().listPrimitives()) { const a = p.getAttribute("POSITION"), v = [0, 0, 0];
    for (let i = 0; i < a.getCount(); i++) { a.getElement(i, v); for (let k = 0; k < 3; k++) { const w = W[k] * v[0] + W[4 + k] * v[1] + W[8 + k] * v[2] + W[12 + k]; if (w < min[k]) min[k] = w; if (w > max[k]) max[k] = w; } } }
  return { min, max }; }
const cfg = (await import(new URL(cfgPath, import.meta.url))).default;
await MeshoptEncoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ "meshopt.encoder": MeshoptEncoder });
const doc = await io.read(inp);
const root = doc.getRoot(), scene = root.getDefaultScene() ?? root.listScenes()[0];
const O = cfg.origin;
const top = doc.createNode(cfg.name);
const groups = {};
for (const g of cfg.groups) { const p = g.pivot ?? O; groups[g.name] = { node: doc.createNode(g.name).setTranslation([p[0] - O[0], p[1] - O[1], p[2] - O[2]]), p, n: 0 }; top.addChild(groups[g.name].node); }
const xf = (W, v) => [0, 1, 2].map((k) => W[k] * v[0] + W[4 + k] * v[1] + W[8 + k] * v[2] + W[12 + k]);
function place(n, W, gname) {
  const g = groups[gname]; if (!g) throw new Error("Gruppe fehlt: " + gname);
  const L = [...W]; L[12] -= g.p[0]; L[13] -= g.p[1]; L[14] -= g.p[2];
  n.setMatrix(L); n.listChildren().forEach((c) => n.removeChild(c));
  for (const p of n.listParents()) if (p.propertyType === "Node" || p.propertyType === "Scene") p.removeChild(n);
  g.node.addChild(n); g.n++;
}
cfg.materials?.(root.listMaterials());
const meshNodes = root.listNodes().filter((n) => n.getMesh()).map((n) => ({ n, W: n.getWorldMatrix(), b: getBoundsMeshOnly(n) }));
for (const { n, W, b } of meshNodes) {
  const mat = n.getMesh().listPrimitives()[0]?.getMaterial()?.getName() ?? "";
  if (cfg.drop?.(b, mat)) { n.dispose(); continue; }
  const rc = cfg.recolor?.(b, mat);
  if (rc) {
    // Fläche in einer vorhandenen Modellfarbe füllen (z. B. ausgeschnittene Schriftzüge in Wandfarbe)
    const target = root.listMaterials().find((m) => m.getName() === rc);
    const mesh = doc.createMesh();
    for (const prim of n.getMesh().listPrimitives()) mesh.addPrimitive(prim.clone().setMaterial(target));
    n.setMesh(mesh);
  }
  const fn = cfg.splitTris?.(b, mat);
  if (fn) {
    // Dreiecke einzeln zuordnen (z. B. Hecktüren aus der Kofferwand lösen)
    const buckets = {};
    for (const prim of n.getMesh().listPrimitives()) {
      const pos = prim.getAttribute("POSITION"), idx = prim.getIndices(), count = idx ? idx.getCount() : pos.getCount(), per = {};
      for (let t = 0; t < count; t += 3) {
        const ids = [0, 1, 2].map((k) => (idx ? idx.getScalar(t + k) : t + k));
        const ws = ids.map((i) => xf(W, pos.getElement(i, [0, 0, 0])));
        (per[fn(ws) ?? cfg.classify(b, mat)] ??= []).push(...ids);
      }
      for (const [gname, list] of Object.entries(per)) (buckets[gname] ??= []).push({ prim, list });
    }
    for (const [gname, arr] of Object.entries(buckets)) {
      const mesh = doc.createMesh();
      for (const { prim, list } of arr) { const p2 = prim.clone(); p2.setIndices(doc.createAccessor().setType("SCALAR").setArray(new Uint32Array(list)).setBuffer(root.listBuffers()[0])); mesh.addPrimitive(p2); }
      place(doc.createNode().setMesh(mesh), W, gname);
    }
    n.dispose(); continue;
  }
  place(n, W, cfg.classify(b, mat));
}
for (const c of scene.listChildren()) { scene.removeChild(c); }
scene.addChild(top);
console.log(Object.fromEntries(Object.entries(groups).map(([k, g]) => [k, g.n])));
await MeshoptSimplifier.ready;
await doc.transform(prune(), dedup(), join({ keepNamed: false }), weld(), ...(cfg.simplify ? [simplify({ simplifier: MeshoptSimplifier, ...cfg.simplify })] : []), prune(),
  textureCompress({ encoder: sharp, targetFormat: "webp", resize: [1024, 1024] }), meshopt({ encoder: MeshoptEncoder, level: "medium" }));
// Gruppenknoten tragen ihren Namen; Mesh-Knoten darunter bleiben anonym
await io.write(out, doc);
let tris = 0; for (const m of doc.getRoot().listMeshes()) for (const p of m.listPrimitives()) tris += (p.getIndices()?.getCount() ?? 0) / 3;
console.log("meshes", doc.getRoot().listMeshes().length, "tris", tris);
