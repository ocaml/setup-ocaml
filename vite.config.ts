import ultracite from "ultracite/oxfmt";
import core from "ultracite/oxlint/core";
import vitest from "ultracite/oxlint/vitest";
import { defineConfig } from "vite-plus";

export default defineConfig({
  fmt: ultracite,
  lint: {
    env: core.env,
    extends: [core, vitest],
    ignorePatterns: core.ignorePatterns,
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
});
