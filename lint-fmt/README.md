# lint-fmt

Note: The ocamlformat configuration file must have the version of the
ocamlformat used in the project.

```yml
jobs:
  lint-fmt:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Use OCaml 5.0.x
        uses: ocaml/setup-ocaml@v2
        with:
          ocaml-compiler: 5.0.x
          dune-cache: true

      - name: Lint fmt
        uses: ocaml/setup-ocaml/lint-fmt@v2
```

See [action.yml](./action.yml) for inputs.
