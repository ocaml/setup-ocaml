### Developement setup

Requirements:
* nodejs
* corepack (shipped with nodejs, however on some distributions it is not distributed, in which case install it through npm using: `npm install -g corepack`)

To regenerated the compiled javascript files in `dist/`, call:
```
corepack enable
yarn build
```
