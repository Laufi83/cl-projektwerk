/** Modell ohne bewegliche Teile (OC-Stand, Traverse): nur zusammenfassen und komprimieren */
const config = {
  name: "body", origin: [0, 0, 0],
  groups: [{ name: "body" }],
  classify: () => "body",
};
export default config;
