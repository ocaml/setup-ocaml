import type { SnapshotSerializer } from "vite-plus/test";

export default {
  serialize: (value, _config, _indentation, depth) =>
    depth === 0 ? String(value) : `"${String(value)}"`,
  test: (value) => typeof value === "string",
} satisfies SnapshotSerializer;
