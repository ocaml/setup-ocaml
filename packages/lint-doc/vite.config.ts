import { defineConfig } from "vite-plus";

export default defineConfig({
  pack: {
    deps: {
      alwaysBundle: [/.*/u],
      onlyBundle: false,
      onlyImport: [],
    },
    entry: "src/index.ts",
    minify: true,
    outDir: "../../lint-doc/dist",
    platform: "node",
    target: "node24",
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
