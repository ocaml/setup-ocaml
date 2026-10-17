import { defineConfig } from "vite-plus";

export default defineConfig({
  pack: {
    entry: {
      index: "src/index.ts",
      "post/index": "src/post.ts",
    },
    deps: {
      alwaysBundle: [/.*/],
      onlyBundle: false,
      onlyImport: [],
    },
    platform: "node",
    target: "node24",
    outDir: "../../dist",
    hash: false,
    minify: false,
  },
  test: {
    setupFiles: ["./test/runner.ts"],
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
