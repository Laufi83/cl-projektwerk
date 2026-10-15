/** Messestand 10 × 10 m: Maßtexte der Planung auf dem Boden entfernen */
const config = {
  name: "stand", origin: [0.3, 0, 0.25],
  groups: [{ name: "body" }],
  simplify: { ratio: 0.2, error: 0.002 },
  drop: (b, mat) => mat === "[Color_009]" && b.max[1] <= 0.01,
  classify: () => "body",
};
export default config;
