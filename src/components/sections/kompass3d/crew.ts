/**
 * Ankunft der Messemonteure für alle Stand-Themen: Der Van fährt links neben dem Stand vor, die Vordertüren öffnen,
 * zwei Monteure steigen aus, gehen vor die Standfläche und beraten sich dort (einmaliger Ablauf ab Szenenstart).
 */
import type { Built, Ctx } from "./engine";
import { at, van, walk, worker } from "./kit";

const VX = -6.6, VZ = 0.3;
/** Treffpunkt vor der offenen Standseite */
const MEET: [number, number][] = [[-3.5, 5.2], [-4.4, 5.7]];

export function withCrew(ctx: Ctx, built: Built): Built {
  const v = van(ctx);
  v.g.position.set(VX, 0, VZ);
  built.root.add(v.g);
  // Fahrtrichtung +z: Fahrerseite links (+x, zum Stand), Beifahrerseite rechts (−x)
  const out = (s: number): [number, number] => [VX + s * (v.side + 0.35), VZ + v.doorZ];
  const a = worker(built.root), b = worker(built.root, "#ff7a1a");
  const [ax, az] = out(1), [bx, bz] = out(-1);
  const pathA: [number, number, number][] = [[6.3, VX + 0.6, az], [6.9, ax, az], [9.0, MEET[0][0], MEET[0][1]]];
  const pathB: [number, number, number][] = [[6.6, VX - 0.6, bz], [7.2, bx, bz], [8.8, bx, VZ + v.front + 0.9], [11.6, MEET[1][0], MEET[1][1]]];
  const faceA = Math.atan2(MEET[1][0] - MEET[0][0], MEET[1][1] - MEET[0][1]);
  const faceB = Math.atan2(MEET[0][0] - MEET[1][0], MEET[0][1] - MEET[1][1]);
  const inner = built.update;
  const update = (t: number, dt: number) => {
    inner?.(t, dt);
    v.g.position.z = at([[0, -30], [5.5, VZ]], t);
    const open = at([[0, 0], [5.6, 0], [6.3, 1], [8.0, 1], [8.8, 0]], t);
    v.door("fl", open); v.door("fr", open);
    a.g.visible = t > 6.2; b.g.visible = t > 6.5;
    walk(a, pathA, t, faceA); walk(b, pathB, t, faceB);
    // beraten: leichtes Zuwenden und Nicken
    if (t > 11.6) {
      a.g.rotation.y = faceA + Math.sin(t * 0.9) * 0.18; b.g.rotation.y = faceB + Math.sin(t * 0.7 + 1) * 0.15;
      a.head.rotation.x = Math.max(0, Math.sin(t * 1.7)) * 0.18; b.head.rotation.x = Math.max(0, Math.sin(t * 1.3 + 2)) * 0.15;
    }
  };
  // Kamera etwas nach links, damit Van und Monteure im Bild sind
  const [px, py, pz] = built.camera.pos, [tx, ty, tz] = built.camera.target;
  return { ...built, update, still: Math.max(built.still ?? 0, 14), camera: { ...built.camera, pos: [px - 1.5, py, pz + 1], target: [tx - 1.6, ty, tz + 0.6] } };
}

