### Developement setup

Requirements:

- [Mise](https://mise.jdx.dev)
  - A polyglot tool version manager that manages Node.js and Yarn versions as specified in [mise.toml](./mise.toml)

To regenerated the compiled JavaScript files in `dist/`, call:

```
mise install
yarn install --immutable
yarn build
```
