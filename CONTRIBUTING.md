### Developement setup

Requirements:

- [Mise](https://mise.jdx.dev)
  - A polyglot tool version manager that manages the Node.js version as specified in [mise.toml](./mise.toml). Yarn is installed via Corepack, using the version specified in the `packageManager` field of [package.json](./package.json).

To regenerated the compiled JavaScript files in `dist/`, call:

```
mise install
yarn install --immutable
yarn build
```
