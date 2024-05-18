# lint-opam

## Usage

### Example workflow

```yml
jobs:
  lint-opam:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout tree
        uses: actions/checkout@v4

      - name: Set-up OCaml
        uses: ocaml/setup-ocaml@v2
        with:
          ocaml-compiler: "5.2"
          dune-cache: true

      - name: Lint opam
        uses: ocaml/setup-ocaml/lint-opam@v2
```

## Inputs

Consult the [action.yml](./action.yml) for inputs.
