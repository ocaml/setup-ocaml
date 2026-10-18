import type { SnapshotSerializer } from "vite-plus/test";

export default {
  test: (value) => typeof value === "string",
  serialize: (value, _config, _indentation, depth) =>
    depth === 0 ? value : `"${value}"`,
} satisfies SnapshotSerializer;
