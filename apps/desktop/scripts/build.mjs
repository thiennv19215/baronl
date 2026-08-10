import { build } from "esbuild";

const common = {
  bundle: true,
  platform: "node",
  target: "node22",
  format: "cjs",
  sourcemap: true,
  minify: false,
  external: ["electron"],
  logLevel: "info"
};

await Promise.all([
  build({ ...common, entryPoints: ["src/main.ts"], outfile: "dist/main.cjs" }),
  build({ ...common, entryPoints: ["src/preload.ts"], outfile: "dist/preload.cjs" })
]);
