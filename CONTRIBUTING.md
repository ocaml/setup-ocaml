### Developement setup

Requirements:

- [Node.js](https://nodejs.org)
  - Requires a relatively up-to-date version of Node.js - preferably the version in [.nvmrc](./.nvmrc).
- [Corepack](https://nodejs.org/api/corepack.html)
  - Shipped with Node.js, however on some distributions it is not distributed, in which case install it through npm using: `npm install --global corepack`

To regenerated the compiled JavaScript files in `dist/`, call:

```
nvm install
corepack enable
yarn install --immutable
yarn build
```
