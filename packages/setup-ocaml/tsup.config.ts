import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/post.ts"],
  outDir: "../../dist",
  bundle: true,
  clean: true,
  format: "cjs",
  minify: false,
  noExternal: [/.*/],
  splitting: false,
  target: "node20",
  treeshake: true,
});
