# lint-fmt

Performs several quality checks for OCaml code.

**_First of all, make sure you have an `.ocamlformat` file at the root of your
project._**

## Usage

### Example workflow

```yml
jobs:
  lint-fmt:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout tree
        uses: actions/checkout@v3

      - name: Set-up OCaml 5.0
        uses: ocaml/setup-ocaml@v2
        with:
          ocaml-compiler: "5.0"
          dune-cache: true

      - name: Lint fmt
        uses: ocaml/setup-ocaml/lint-fmt@v2
```

## Inputs

See [action.yml](./action.yml) for inputs.
