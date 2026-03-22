import { defineConfig } from "vite-plus";

export default defineConfig({
  pack: {
    entry: "src/index.ts",
    deps: {
      onlyBundle: false,
    },
    platform: "node",
    target: "node24",
    outDir: "../../lint-opam/dist",
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
