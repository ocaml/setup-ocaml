# Examples

## Using the strategy matrix

```yml
strategy:
  fail-fast: false
  matrix:
    os:
      - macos-latest
      - ubuntu-latest
      - windows-latest
    ocaml-compiler:
      - 4.14

runs-on: ${{ matrix.os }}

steps:
  - name: Checkout tree
    uses: actions/checkout@v3

  - name: Set-up OCaml ${{ matrix.ocaml-compiler }}
    uses: ocaml/setup-ocaml@v2
    with:
      ocaml-compiler: ${{ matrix.ocaml-compiler }}
```

## Using several conditional setup steps

```yml
steps:
  - name: Checkout tree
    uses: actions/checkout@v3

  - name: Set-up OCaml on Windows
    uses: ocaml/setup-ocaml@v2
    if: runner.os == 'Windows'
    with:
      opam-repositories: |
        default: https://github.com/ocaml-opam/opam-repository-mingw.git#sunset

  - name: Set-up OCaml on Unix
    uses: ocaml/setup-ocaml@v2
    if: runner.os != 'Windows'
    with:
      opam-repositories: |
        default: https://github.com/ocaml/opam-repository.git
```

## Using a custom step to choose between the values

```yml
steps:
  - name: Checkout tree
    uses: actions/checkout@v3

  - name: Set opam repository url
    id: repository
    shell: bash
    run: |
      if [ "$RUNNER_OS" == "Windows" ]; then
        echo "::set-output name=url::https://github.com/ocaml-opam/opam-repository-mingw.git#sunset"
      elif [ "$RUNNER_OS" == "macOS" ]; then
        echo "::set-output name=url::https://github.com/custom/opam-repository.git#macOS"
      else
        echo "::set-output name=url::https://github.com/ocaml/opam-repository.git"
      fi

  - name: Set-up OCaml with repository ${{ steps.repository.outputs.url }}
    uses: ocaml/setup-ocaml@v2
    with:
      opam-repositories: |
        default: ${{ steps.repository.outputs.url }}
```

## Using glob patterns to filter local packages

See
[`@actions/glob`](https://github.com/actions/toolkit/tree/main/packages/glob)
for supported patterns.

```yml
steps:
  - name: Checkout tree
    uses: actions/checkout@v3

  - name: Set-up OCaml ${{ matrix.ocaml-compiler }}
    uses: ocaml/setup-ocaml@v2
    with:
      ocaml-compiler: ${{ matrix.ocaml-compiler }}
      opam-local-packages: |
        *.opam
        !exclude.opam
```

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
      - 5.0

container: ${{ matrix.container }}

runs-on: ubuntu-latest

steps:
  - name: Checkout tree
    uses: actions/checkout@v3

  - name: Retrieve new lists of system packages
    run: apt-get update

  - name: Install system packages
    run: apt-get --yes install bubblewrap curl darcs gcc git m4 make mercurial patch rsync sudo unzip

  - name: Set-up OCaml ${{ matrix.ocaml-compiler }}
    uses: ocaml/setup-ocaml@v2
    with:
      ocaml-compiler: ${{ matrix.ocaml-compiler }}
      cache-prefix: v1-${{ matrix.container }}
      opam-disable-sandboxing: true
```
<!-- prettier-ignore-end -->
