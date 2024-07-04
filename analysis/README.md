# analysis

## Usage

### Example workflow

```yml
jobs:
  opam-dependency-submission:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout tree
        uses: actions/checkout@v4

      - name: Set-up OCaml
        uses: ocaml/setup-ocaml@v3
        with:
          ocaml-compiler: "5.2"

      - name: Opam Dependency Submission
        uses: ocaml/setup-ocaml/analysis@v3
```

## Inputs

Consult the [action.yml](./action.yml) for inputs.
