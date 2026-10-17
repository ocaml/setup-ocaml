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
  test: {
    snapshotSerializers: ["../../vitest.snapshot-serializer.ts"],
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
});
