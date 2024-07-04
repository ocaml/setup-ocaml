# lint-fmt

> [!IMPORTANT] Make sure you have an `.ocamlformat` file at the root of your
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

      - name: Set-up OCaml
        uses: ocaml/setup-ocaml@v3
        with:
          ocaml-compiler: "5.2"

      - name: Lint fmt
        uses: ocaml/setup-ocaml/lint-fmt@v3
```

## Inputs

Consult the [action.yml](./action.yml) for inputs.
