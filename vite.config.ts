import ultracite from "ultracite/oxfmt";
import { defineConfig } from "vite-plus";

export default defineConfig({
  lint: {
    ignorePatterns: ["**/dist/**"],
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
  fmt: ultracite,
});
