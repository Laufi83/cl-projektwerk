/** Sattelzug (Kühlkoffer): fremde Marken, Schriftzüge und Kennzeichen werden entfernt; Hecktüren und Achsen beweglich.
 *  Koordinaten des Originals: Fahrtrichtung +z, Front bei z = −2,96, Heck bei z = −20,09, Mitte x = −0,48. */
const CX = -0.48, R = 0.61;
const AXLES = { w1: -4.53, w2: -8.27, w3: -14.3, w4: -16.1, w5: -17.9 };
const size = (b, i) => b.max[i] - b.min[i];
const inBox = (b, [x0, x1], [y0, y1], [z0, z1]) => b.min[0] >= x0 && b.max[0] <= x1 && b.min[1] >= y0 && b.max[1] <= y1 && b.min[2] >= z0 && b.max[2] <= z1;
const config = {
  name: "lkw", origin: [CX, 0, -2.96],
  groups: [
    { name: "body" },
    { name: "door_l", pivot: [-1.73, 0, -19.8] }, { name: "door_r", pivot: [0.75, 0, -19.8] },
    ...Object.entries(AXLES).map(([name, z]) => ({ name, pivot: [CX, R, z] })),
  ],
  materials(mats) {
    for (const m of mats) if (m.getName() === "*2") { m.setBaseColorTexture(null); m.setBaseColorFactor([0.05, 0.05, 0.05, 1]); }
  },
  // Schriftzüge auf den Kofferwänden (LOGISTIQUE, Transport LIBERTE …) sind aus der Wand ausgeschnitten → in Wandfarbe füllen
  recolor(b) {
    if ((b.max[0] <= -1.66 || b.min[0] >= 0.68) && b.min[1] >= 1.45 && size(b, 2) < 5 && b.max[2] < -6.4 && size(b, 0) < 0.12) return "[Color_A01]";
    return null;
  },
  drop(b, mat) {
    // Herstellerschriftzug am Kühlaggregat
    if (b.min[1] >= 3.55 && b.min[2] >= -6.75 && b.max[2] <= -6.4 && size(b, 0) < 0.6) return true;
    // Markenzeichen und Typenschild am Kühlergrill
    if (b.max[2] > -3.25 && b.min[1] >= 1.2 && b.max[1] <= 2.3 && size(b, 0) < 0.7 && size(b, 1) < 0.4 && !["[Color_A01]", "[Color_009]", "[Color_008]", "[Color_007]"].includes(mat)) return true;
    // Herstellerschriftzug auf der Seitenverkleidung der Zugmaschine
    if (mat === "Default_Materia1" && (inBox(b, [0.62, 0.72], [0.7, 0.9], [-7.6, -7.0]) || inBox(b, [-1.9, -1.66], [0.7, 0.9], [-7.6, -7.0]))) return true;
    // Kennzeichen vorn, an der Zugmaschine; Kennzeichen und Herstellerschild am Auflieger-Heck
    if (inBox(b, [-1.0, 0.2], [0.38, 0.85], [-3.25, -2.9])) return true;
    if (inBox(b, [-0.1, 0.75], [0.5, 0.85], [-9.0, -8.75])) return true;
    if (inBox(b, [-1.0, 0.05], [0.7, 1.5], [-19.95, -19.6]) && !mat.startsWith("*") && mat !== "[Color_D01]") return true;
    return false;
  },
  splitTris(b) {
    // Rückwand des Koffers → zwei Türflügel
    if (b.min[2] > -19.6 && !(b.max[2] - b.min[2] > 5)) return null;
    return (ws) => (ws.every((v) => v[2] <= -19.7 && v[1] >= 1.3) ? ((ws[0][0] + ws[1][0] + ws[2][0]) / 3 < CX ? "door_l" : "door_r") : null);
  },
  classify(b) {
    // Reifen/Felgen: Box mittig auf der Achse und höchstens so groß wie das Rad – oder alle Ecken (y/z) im Radkreis
    for (const [name, z] of Object.entries(AXLES)) {
      if (size(b, 0) >= 1.2) continue;
      const centred = Math.abs((b.min[1] + b.max[1]) / 2 - R) < 0.08 && Math.abs((b.min[2] + b.max[2]) / 2 - z) < 0.08 && size(b, 1) < 1.2 && size(b, 2) < 1.2;
      if (centred || [b.min[1], b.max[1]].every((y) => [b.min[2], b.max[2]].every((zz) => Math.hypot(y - R, zz - z) <= 0.56 * 1.1))) return name;
    }
    return "body";
  },
};
export default config;
