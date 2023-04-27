/** @type {import('eslint').Linter.Config} */
// eslint-disable-next-line unicorn/prefer-module
module.exports = {
  extends: [
    "eslint:recommended",
    "plugin:unicorn/recommended",
    "plugin:@typescript-eslint/eslint-recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
    "plugin:@typescript-eslint/strict",
    "plugin:import/recommended",
    "plugin:import/typescript",
    "plugin:prettier/recommended",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    project: "tsconfig.json",
    sourceType: "module",
  },
  plugins: ["@typescript-eslint", "simple-import-sort"],
  rules: {
    "import/first": "error",
    "import/newline-after-import": "error",
    "import/no-duplicates": "error",
    "import/order": "off",
    "simple-import-sort/exports": "error",
    "simple-import-sort/imports": "error",
    "import/exports-last": "off",
    "sort-imports": "off",
    "unicorn/prefer-ternary": "off",
    "unicorn/prefer-top-level-await": "off",
    "unicorn/prevent-abbreviations": "off",
  },
  settings: {
    "import/resolver": {
      typescript: { alwaysTryTypes: true, project: "tsconfig.json" },
    },
  },
  reportUnusedDisableDirectives: true,
};
