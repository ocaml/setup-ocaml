# lint-doc

```yml
jobs:
  lint-doc:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Use OCaml 5.0.x
        uses: ocaml/setup-ocaml@v2
        with:
          ocaml-compiler: 5.0.x
          dune-cache: true

      - name: Lint doc
        uses: ocaml/setup-ocaml/lint-doc@v2
```

See [action.yml](./action.yml) for inputs.
