# lint-opam

## Usage

### Example workflow

```yml
jobs:
  lint-opam:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout tree
        uses: actions/checkout@v5
      - name: Set-up OCaml
        uses: ocaml/setup-ocaml@v3
        with:
          ocaml-compiler: 5
      - uses: ocaml/setup-ocaml/lint-opam@v3
```

## Inputs

Consult the [action.yml](./action.yml) for inputs.
