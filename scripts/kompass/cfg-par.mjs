const config = { name: "body", origin: [0, 0, 0], groups: [{ name: "body" }], drop: (b, mat) => /^Lx_/.test(mat), classify: () => "body", simplify: { ratio: 0.06, error: 0.004 } };
export default config;
