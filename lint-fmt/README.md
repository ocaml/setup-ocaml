# lint-fmt

> **Warning** Make sure you have an `.ocamlformat` file at the root of your
> project.

## Usage

### Example workflow

```yml
jobs:
  lint-fmt:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout tree
        uses: actions/checkout@v4

      - name: Set-up OCaml 5.1
        uses: ocaml/setup-ocaml@v2
        with:
          ocaml-compiler: "5.1"
          dune-cache: true

      - name: Lint fmt
        uses: ocaml/setup-ocaml/lint-fmt@v2
```

## Inputs

Consult the [action.yml](./action.yml) for inputs.
