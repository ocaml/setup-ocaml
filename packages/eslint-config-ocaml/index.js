/** @type {import('eslint').Linter.Config} */

// eslint-disable-next-line unicorn/prefer-module
module.exports = {
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/strict-type-checked",
    "plugin:@typescript-eslint/stylistic-type-checked",
    "plugin:unicorn/recommended",
    "plugin:import/recommended",
    "plugin:import/typescript",
    "plugin:prettier/recommended",
    "plugin:turbo/recommended",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    project: "tsconfig.json",
    sourceType: "module",
  },
  plugins: ["@typescript-eslint", "simple-import-sort"],
  rules: {
    // [Third party]
    // https://typescript-eslint.io/blog/consistent-type-imports-and-exports-why-and-how
    "@typescript-eslint/consistent-type-imports": "error",
    "@typescript-eslint/no-import-type-side-effects": "error",
    "import/consistent-type-specifier-style": ["error", "prefer-top-level"],
    // https://typescript-eslint.io/rules/restrict-template-expressions
    "@typescript-eslint/restrict-template-expressions": [
      "error",
      { allowNumber: true, allowBoolean: true },
    ],
    // https://typescript-eslint.io/rules/switch-exhaustiveness-check
    "@typescript-eslint/switch-exhaustiveness-check": "error",
    // https://github.com/lydell/eslint-plugin-simple-import-sort#example-configuration
    "import/first": "error",
    "import/newline-after-import": "error",
    "import/no-duplicates": "error",
    "simple-import-sort/exports": "error",
    "simple-import-sort/imports": "error",
    // [Disable]
    "import/order": "off",
    "sort-imports": "off",
    "unicorn/import-style": "off",
    "unicorn/prefer-ternary": "off",
    "unicorn/prefer-top-level-await": "off",
    "unicorn/prevent-abbreviations": "off",
  },
  settings: {
    "import/resolver": {
      typescript: {
        alwaysTryTypes: true,
        project: "tsconfig.json",
      },
    },
  },
  reportUnusedDisableDirectives: true,
};
