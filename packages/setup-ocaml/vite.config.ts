import { defineConfig } from "vite-plus";

export default defineConfig({
  pack: {
    entry: {
      index: "src/index.ts",
      "post/index": "src/post.ts",
    },
    deps: {
      onlyBundle: false,
    },
    platform: "node",
    target: "node24",
    outDir: "../../dist",
    hash: false,
    minify: true,
  },
  run: {
    tasks: {
      build: {
        command: "vp pack",
      },
      typecheck: {
        command: "tsc",
      },
    },
  },
});
