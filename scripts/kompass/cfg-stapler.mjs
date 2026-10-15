const PAL = new Set(["[Color_003]", "[Color_001]", "brick_side", "Brick_front"]);
/** Achsen: x, Radmitte y, Radius */
const AX = { front: [3.0, 0.33, 0.33], rear: [1.93, 0.29, 0.29] };
const zOut = (b) => b.max[2] <= -1.64 || b.min[2] >= -1.25;
/** alle Ecken der Box (x/y) liegen im Radkreis */
const inWheel = (b, [cx, cy, r]) => [b.min[0], b.max[0]].every((x) => [b.min[1], b.max[1]].every((y) => Math.hypot(x - cx, y - cy) <= r * 1.08));
const config = {
  name: "stapler", origin: [3.0, 0, -1.445],
  groups: [
    { name: "body" }, { name: "carriage" }, { name: "pallet" }, { name: "load" },
    { name: "wheel_front_l", pivot: [3.0, 0.33, -1.83] }, { name: "wheel_front_r", pivot: [3.0, 0.33, -1.06] },
    { name: "wheel_rear_l", pivot: [1.93, 0.29, -1.83] }, { name: "wheel_rear_r", pivot: [1.93, 0.29, -1.06] },
  ],
  classify(b, mat) {
    if (b.min[0] >= 3.6 && (mat === "[Wood_Plywood_Knots]" || mat === "[Color_000]")) return "pallet";
    if (b.min[0] >= 3.6 && PAL.has(mat)) return "load";
    if (b.min[0] >= 3.28 || mat === "[Color_D06]") return "carriage";
    const l = (b.min[2] + b.max[2]) / 2 < -1.445 ? "l" : "r";
    if (zOut(b) && mat !== "[Color_C02]1") for (const [k, a] of Object.entries(AX)) if (inWheel(b, a)) return `wheel_${k}_${l}`;
    return "body";
  },
};
export default config;
