# deploy-doc

```yml
name: Deploy odoc

on:
  push:
    branches:
      - master

jobs:
  deploy-doc:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Use OCaml 5.0.x
        uses: ocaml/setup-ocaml@v2
        with:
          ocaml-compiler: 5.0.x
          dune-cache: true

      - name: Deploy odoc to GitHub Pages
        uses: ocaml/setup-ocaml/deploy-doc@v2
```

See [action.yml](./action.yml) for inputs.
