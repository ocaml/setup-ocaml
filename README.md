# Set up OCaml

[![Main workflow](https://github.com/avsm/setup-ocaml/workflows/Main%20workflow/badge.svg?branch=master)](https://github.com/avsm/setup-ocaml/actions)

Set up an OCaml and opam environment and add to PATH.

## Inputs

- `ocaml-version`: the full version of the OCaml compiler (default 4.08.1)

## Action

The action does the following:

- _Ubuntu:_ Installs the latest opam with sandboxing active
- _macOS:_ Installs the latest opam from Homebrew with sandboxing active
- _Windows:_ Installs Cygwin and the
  [fdopen fork](https://fdopen.github.io/opam-repository-mingw) with mingw64c

The repository is initialised to the default one, and then the following plugins
are installed:

- `opam-depext`

The `opam` binary is added to the `PATH` for subsequent actions, so that
executing `opam` commands will just work after that.

## Example workflow

If you are new, there's also a simpler introduction. See the
[Hello World OCaml Action](https://github.com/avsm/hello-world-action-ocaml)
that uses Dune and opam to build a simple library.

```yml
name: Main workflow

on:
  - push
  - pull_request

jobs:
  build:
    name: Build

    strategy:
      fail-fast: false
      matrix:
        os:
          - macos-latest
          - ubuntu-latest
          - windows-latest
        ocaml-version:
          - 4.09.0
          - 4.08.1

    runs-on: ${{ matrix.os }}

    steps:
      - name: Checkout code
        uses: actions/checkout@v2

      - name: Use OCaml ${{ matrix.ocaml-version }}
        uses: avsm/setup-ocaml@v1
        with:
          ocaml-version: ${{ matrix.ocaml-version }}

      - run: opam pin add hello.dev -n .

      - run: opam depext -yt hello

      - run: opam install -t . --deps-only

      - run: opam exec -- dune build

      - run: opam exec -- dune runtest
```

## Roadmap

This action aims to provide an OS-neutral interface to `opam`, and so will not
add features that only work on one operating system. It will also track the
latest stable release of opam.

Discussions:
https://discuss.ocaml.org/t/github-actions-for-ocaml-opam-now-available/4745
