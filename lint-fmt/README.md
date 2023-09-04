# lint-fmt

Performs several quality checks for OCaml code.

> **Warning** First of all, make sure you have an `.ocamlformat` file at the
> root of your project.

## Usage

### Example workflow

```yml
jobs:
  lint-fmt:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout tree
        uses: actions/checkout@v4

      - name: Set-up OCaml 5.0
        uses: ocaml/setup-ocaml@v2
        with:
          ocaml-compiler: "5.0"
          dune-cache: true

      - name: Lint fmt
        uses: ocaml/setup-ocaml/lint-fmt@v2
```

## Inputs

Consult the [action.yml](./action.yml) for inputs.
