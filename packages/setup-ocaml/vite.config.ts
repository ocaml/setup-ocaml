import { defineConfig } from "vite-plus";

export default defineConfig({
  pack: {
    deps: {
      alwaysBundle: [/.*/u],
      onlyBundle: false,
      onlyImport: [],
    },
    entry: {
      index: "src/index.ts",
      "post/index": "src/post.ts",
    },
    hash: false,
    minify: false,
    outDir: "../../dist",
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
    setupFiles: ["./test/runner.ts"],
    snapshotSerializers: ["../../vitest.snapshot-serializer.ts"],
  },
});
