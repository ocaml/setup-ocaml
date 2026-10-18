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
    outDir: "../../analysis/dist",
    platform: "node",
    target: "node24",
  },
  run: {
    tasks: {
      build: {
        command: "vp pack",
      },
      test: {
        command: "vp test",
      },
      typecheck: {
        command: "tsc",
      },
    },
  },
  test: {
    snapshotSerializers: ["../../vitest.snapshot-serializer.ts"],
  },
});
