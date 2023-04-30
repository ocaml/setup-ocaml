# lint-opam

Perform several quality checks on the opam file.

## Usage

### Example workflow

```yml
jobs:
  lint-opam:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout tree
        uses: actions/checkout@v3

      - name: Set-up OCaml 4.14
        uses: ocaml/setup-ocaml@v2
        with:
          ocaml-compiler: 4.14
          dune-cache: true

      - name: Lint opam
        uses: ocaml/setup-ocaml/lint-opam@v2
```

## Inputs

Consult the [action.yml](./action.yml) for inputs.
