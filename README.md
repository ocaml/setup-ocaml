# Set up OCaml

[![Main workflow](https://github.com/avsm/setup-ocaml/workflows/Main%20workflow/badge.svg?branch=master)](https://github.com/avsm/setup-ocaml/actions)

Set up an OCaml and opam environment and add to PATH.

## Usage

If you are new, this section is worth reading.

### How to specify the version

There is a point that is particularly easy to misunderstand. It's where you
specify the version of the action _itself_.

```yml
- name: Use OCaml ${{ matrix.ocaml-version }}
  uses: avsm/setup-ocaml@v1
  #                     ^^^
  with:
    ocaml-version: ${{ matrix.ocaml-version }}
```

We recommend that you include the version of the action. We adhere to
[semantic versioning](https://semver.org), it's safe to use the major version
(`v1`) in your workflow. If you use the master branch, this could break your
workflow when we publish a breaking update and increase the major version.

```yml
steps:
  # Reference a specific commit
  - uses: avsm/setup-ocaml@ab6ba4d
  # Reference the major version of a release (recommended)
  - uses: avsm/setup-ocaml@v1
  # Reference a semver version of a release
  - uses: avsm/setup-ocaml@v1.0.1
  # Reference a branch
  - uses: avsm/setup-ocaml@master
```

### Example workflow

See the
[Hello World OCaml Action](https://github.com/avsm/hello-world-action-ocaml)
that uses Dune and opam to build a simple library.

```yml
name: Main workflow

on:
  - push
  - pull_request

jobs:
  build:
    strategy:
      fail-fast: false
      matrix:
        os:
          - macos-latest
          - ubuntu-latest
          - windows-latest
        ocaml-version:
          - 4.10.0
          - 4.09.1
          - 4.08.1

    runs-on: ${{ matrix.os }}

    steps:
      - name: Checkout code
        uses: actions/checkout@v2

      - name: Use OCaml ${{ matrix.ocaml-version }}
        uses: avsm/setup-ocaml@v1
        with:
          ocaml-version: ${{ matrix.ocaml-version }}

      - run: opam pin add hello.dev . --no-action

      - run: opam depext hello --yes --with-doc --with-test

      - run: opam install . --deps-only --with-doc --with-test

      - run: opam exec -- dune build

      - run: opam exec -- dune runtest
```

### What is the difference between opam dependencies and depext dependencies?

- opam dependencies: opam packages installed by `opam install`.
- depext dependencies: System packages installed by `apt install`,
  `yum install`, `brew install`, etc.

For example, the opam package called
[ocurl](https://opam.ocaml.org/packages/ocurl) requires `libcurl4-gnutls-dev` on
the Ubuntu VM, and depext handles the distribution-specific installation of opam
packages' external dependencies for such opam packages.

## Inputs

- `ocaml-version`: the full version of the OCaml compiler (default 4.08.1)

## Action

The action does the following:

- **Ubuntu**: Installs the latest opam with sandboxing active
- **macOS**: Installs the latest opam from Homebrew with sandboxing active
- **Windows**: Installs Cygwin and the
  [fdopen fork](https://fdopen.github.io/opam-repository-mingw) with mingw64c

The repository is initialised to the default one, and then the following plugins
are installed:

- `opam-depext`

The `opam` binary is added to the `PATH` for subsequent actions, so that
executing `opam` commands will just work after that.

## Roadmap

This action aims to provide an OS-neutral interface to `opam`, and so will not
add features that only work on one operating system. It will also track the
latest stable release of opam.

Discussions:
https://discuss.ocaml.org/t/github-actions-for-ocaml-opam-now-available/4745
