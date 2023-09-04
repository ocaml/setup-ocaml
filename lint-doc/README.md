# lint-doc

Performs several quality checks on the _doc comment_.

## Usage

### Example workflow

```yml
jobs:
  lint-doc:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout tree
        uses: actions/checkout@v4

      - name: Set-up OCaml 5.0
        uses: ocaml/setup-ocaml@v2
        with:
          ocaml-compiler: "5.0"
          dune-cache: true

      - name: Lint doc
        uses: ocaml/setup-ocaml/lint-doc@v2
```

## Inputs

Consult the [action.yml](./action.yml) for inputs.
