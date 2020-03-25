# Create an OCaml Action 

Use this template to bootstrap the creation of an OCaml action.:rocket:

This template installs the [opam](https://opam.ocaml.org) on Ubuntu Linux,
macOS and Windows for use with GitHub Actions.

If you are new, there's also a simpler introduction.  See the [Hello World
OCaml Action](https://github.com/avsm/hello-world-action-ocaml) that uses Dune
and opam to build a simple library.

## Inputs

- `ocaml-version`: the full version of the OCaml compiler (default 4.08.1)

## Action

The action does the following:

- *Ubuntu:* Installs the latest opam with sandboxing active
- *macOS:* Installs the latest opam from Homebrew with sandboxing active
- *Windows:* Installs Cygwin and the [fdopen fork](https://fdopen.github.io/opam-repository-mingw/) with mingw64c

The repository is initialised to the default one, and then the following plugins are installed:
- `opam-depext`

The `opam` binary is added to the `PATH` for subsequent actions, so that
executing `opam` commands will just work after that.

## Example workflow


```
name: Build Hello World executable
on: [push, pull_request]
jobs:
  run:
    name: Build
    runs-on: ${{ matrix.os }}
    strategy:
      fail-fast: false
      matrix:
        os: [macos-latest, ubuntu-latest, windows-latest]
        ocaml-version: ["4.09.0", "4.08.1"]
    steps:
      - name: Checkout code
        uses: actions/checkout@v2.0.0
      - name: Use OCaml ${{ matrix.ocaml-version }}
        uses: avsm/setup-ocaml@v1.0
        with:
          ocaml-version: ${{ matrix.ocaml-version }}
      - run: opam pin add hello.dev -n .
      - run: opam depext -yt hello
      - run: opam install -t . --deps-only
      - run: opam exec -- dune build
      - run: opam exec -- dune runtest
```

## Roadmap

This action aims to provide an OS-neutral interface to `opam`, and so
will not add features that only work on one operating system.  It will
also track the latest stable release of opam.

Discussions: https://discuss.ocaml.org/t/github-actions-for-ocaml-opam-now-available/4745
