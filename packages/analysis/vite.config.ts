import { defineConfig } from "vite-plus";

export default defineConfig({
  pack: {
    entry: "src/index.ts",
    deps: {
      alwaysBundle: [/.*/],
      onlyBundle: false,
      onlyImport: [],
    },
    platform: "node",
    target: "node24",
    outDir: "../../analysis/dist",
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
