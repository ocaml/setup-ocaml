# deploy-doc

Generate documentation for your project and deploy it to GitHub Pages.

## Usage

### Example workflow

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
      - name: Checkout tree
        uses: actions/checkout@v3

      - name: Set-up OCaml 5.0
        uses: ocaml/setup-ocaml@v2
        with:
          ocaml-compiler: "5.0"
          dune-cache: true

      - name: Deploy odoc to GitHub Pages
        uses: ocaml/setup-ocaml/deploy-doc@v2
```

## Inputs

See [action.yml](./action.yml) for inputs.
