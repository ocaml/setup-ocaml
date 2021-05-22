# Examples

## Using the strategy matrix

<!-- prettier-ignore-start -->
```yml
strategy:
  fail-fast: false
  matrix:
    os:
      - macos-latest
      - ubuntu-latest
    ocaml-compiler:
      - ocaml-base-compiler.4.12.0
    include:
      - os: windows-latest
        ocaml-compiler: ocaml-variants.4.12.0+mingw64c

runs-on: ${{ matrix.os }}

steps:
  - name: Checkout code
    uses: actions/checkout@v2

  - name: Use OCaml ${{ matrix.ocaml-compiler }}
    uses: avsm/setup-ocaml@v2
    with:
      ocaml-compiler: ${{ matrix.ocaml-compiler }}
```
<!-- prettier-ignore-end -->

## Using several conditional setup steps

<!-- prettier-ignore-start -->
```yml
steps:
  - name: Checkout code
    uses: actions/checkout@v2

  - name: Use OCaml on Windows
    uses: avsm/setup-ocaml@v2
    if: runner.os == 'Windows'
    with:
      ocaml-repository: https://github.com/fdopen/opam-repository-mingw.git#opam2

  - name: Use OCaml on Unix
    uses: avsm/setup-ocaml@v2
    if: runner.os != 'Windows'
    with:
      opam-repository: https://github.com/ocaml/opam-repository.git
```
<!-- prettier-ignore-end -->

## Using a custom step to choose between the values

<!-- prettier-ignore-start -->
```yml
steps:
  - name: Checkout code
    uses: actions/checkout@v2

  - name: Set opam repository url
    id: repository
    shell: bash
    run: |
      if [ "$RUNNER_OS" == "Windows" ]; then
        echo "::set-output name=url::https://github.com/fdopen/opam-repository-mingw.git#opam2"
      elif [ "$RUNNER_OS" == "macOS" ]; then
        echo "::set-output name=url::https://github.com/custom/opam-repository.git#macOS"
      else
        echo "::set-output name=url::https://github.com/ocaml/opam-repository.git"
      fi

  - name: Use OCaml with repository ${{ steps.repository.url }}
    uses: avsm/setup-ocaml@v2
    with:
      opam-repository: ${{ steps.repository.url }}
```
<!-- prettier-ignore-end -->

## Using glob patterns to filter local packages

See
[`@actions/glob`](https://github.com/actions/toolkit/tree/main/packages/glob)
for supported patterns.

<!-- prettier-ignore-start -->
```yml
steps:
  - name: Checkout code
    uses: actions/checkout@v2

  - name: Use OCaml ${{ matrix.ocaml-compiler }}
    uses: avsm/setup-ocaml@v2
    with:
      ocaml-compiler: ${{ matrix.ocaml-compiler }}
      opam-local-packages: |
        *.opam
        !exclude.opam
```
<!-- prettier-ignore-end -->

## Using with [Containers](https://docs.github.com/en/actions/reference/workflow-syntax-for-github-actions#jobsjob_idcontainer)

<!-- prettier-ignore-start -->
```yml
strategy:
  fail-fast: false
  matrix:
    container:
      - debian:latest
      - ubuntu:latest
    ocaml-compiler:
      - ocaml-base-compiler.4.12.0

container: ${{ matrix.container }}

runs-on: ubuntu-latest

steps:
  - name: Checkout code
    uses: actions/checkout@v2

  - name: Retrieve new lists of system packages
    run: apt-get update

  - name: Install system packages
    run: apt-get install bubblewrap curl darcs gcc git m4 make mercurial patch rsync sudo unzip --yes

  - name: Use OCaml ${{ matrix.ocaml-compiler }}
    uses: avsm/setup-ocaml@v2
    with:
      ocaml-compiler: ${{ matrix.ocaml-compiler }}
      cache-prefix: v1-${{ matrix.container }}
      opam-disable-sandboxing: true
```
<!-- prettier-ignore-end -->

## Using [opam-dune-lint](https://github.com/ocurrent/opam-dune-lint) to lint the opam files

<!-- prettier-ignore-start -->
```yml
steps:
  - name: Checkout code
    uses: actions/checkout@v2

  - name: Use OCaml ${{ matrix.ocaml-compiler }}
    uses: avsm/setup-ocaml@v2
    with:
      ocaml-compiler: ${{ matrix.ocaml-compiler }}

  - run: opam depext opam-dune-lint --install

  - run: opam exec -- opam-dune-lint
```
<!-- prettier-ignore-end -->

## Using [OCamlFormat](https://github.com/ocaml-ppx/ocamlformat) and dune [@fmt](https://dune.readthedocs.io/en/stable/formatting.html) alias to check if your files are formatted

<!-- prettier-ignore-start -->
```yml
steps:
  - name: Checkout code
    uses: actions/checkout@v2

  - name: Use OCaml ${{ matrix.ocaml-compiler }}
    uses: avsm/setup-ocaml@v2
    with:
      ocaml-compiler: ${{ matrix.ocaml-compiler }}
      dune-cache: true

  - run: opam depext ocamlformat=$(grep 'version' .ocamlformat | awk -F '=' '{ print $2 }') --install

  - run: opam exec -- dune build @fmt
```
<!-- prettier-ignore-end -->
