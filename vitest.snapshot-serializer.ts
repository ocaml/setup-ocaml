import type { SnapshotSerializer } from "vite-plus/test";

export default {
  serialize: (value, _config, _indentation, depth) =>
    depth === 0 ? value : `"${value}"`,
  test: (value) => typeof value === "string",
} satisfies SnapshotSerializer;
