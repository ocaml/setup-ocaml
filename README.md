# Set up OCaml

[![Main workflow](https://github.com/ocaml/setup-ocaml/workflows/Main%20workflow/badge.svg?branch=master)](https://github.com/ocaml/setup-ocaml/actions)
[![CodeQL](https://github.com/ocaml/setup-ocaml/workflows/CodeQL/badge.svg?branch=master)](https://github.com/ocaml/setup-ocaml/actions)

Set up an OCaml and opam environment in
[GitHub Actions](https://github.com/features/actions) and add to PATH.

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

## Usage

### How to specify the version of the Action

There is a point that is particularly easy to misunderstand. It's where you
specify the version of the action _itself_.

```yml
- name: Use OCaml ${{ matrix.ocaml-version }}
  uses: ocaml/setup-ocaml@v1
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
  # Reference the major version of a release (most recommended)
  - uses: ocaml/setup-ocaml@v1
  # Reference a specific commit (most strict)
  - uses: ocaml/setup-ocaml@ab6ba4d
  # Reference a semver version of a release (not recommended)
  - uses: ocaml/setup-ocaml@v1.0.1
  # Reference a branch (most dangerous)
  - uses: ocaml/setup-ocaml@master
```

### Example workflow

See the
[Hello World OCaml Action](https://github.com/ocaml/hello-world-action-ocaml)
that uses Dune and opam to build a simple library.

```yml
name: Main workflow

on:
  - pull_request
  - push

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
          - 4.11.0
          - 4.10.1
          - 4.09.1
          - 4.08.1

    runs-on: ${{ matrix.os }}

    steps:
      - name: Checkout code
        uses: actions/checkout@v2

      - name: Use OCaml ${{ matrix.ocaml-version }}
        uses: ocaml/setup-ocaml@v1
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
- `opam-repository`: the URL of the repository opam will use for installing
  packages. The default "" will select
  `https://github.com/ocaml/opam-repository.git` for Ubuntu and macOS and
  `https://github.com/fdopen/opam-repository-mingw.git#opam2` for Windows.

## Advanced Configurations

It is possible to feed different values to `opam-repository` depending on the
platform of the runner. The syntax of Github's workflows is flexible enough to
offer several methods to do this.

For example, using the strategy matrix:

```yml
strategy:
  fail-fast: false
  matrix:
    os:
      - macos-latest
      - ubuntu-latest
      - windows-latest
    include:
      - os: macos-latest
        opam-repo: https://github.com/ocaml/opam-repository.git
      - os: ubuntu-latest
        opam-repo: https://github.com/ocaml/opam-repository.git
      - os: windows-latest
        opam-repo: https://github.com/fdopen/opam-repository-mingw.git#opam2

runs-on: ${{ matrix.os }}

steps:
  - name: Use OCaml with repo ${{ matrix.opam-repo }}
    uses: ocaml/setup-ocaml@v1
    with:
      opam-repository: ${{ matrix.opam-repo }}
```

Using a custom step to choose between the values:

```yml
steps:
  - id: repo
    shell: bash
    run: |
      if [ "$RUNNER_OS" == "Windows" ]; then
        echo "::set-output name=url::https://github.com/fdopen/opam-repository-mingw.git#opam2"
      elif [ "$RUNNER_OS" == "macOS" ]; then
        echo "::set-output name=url::https://github.com/custom/opam-repository.git#macOS"
      else
        echo "::set-output name=url::https://github.com/ocaml/opam-repository.git"
      fi

  - name: Use OCaml with repo ${{ steps.repo.url }}
    uses: ocaml/setup-ocaml@v1
    with:
      opam-repository: ${{ steps.repo.url }}
```

Using several conditional setup steps:

```yml
steps:
  - name: Use OCaml on Windows
    uses: ocaml/setup-ocaml@v1
    if: runner.os == 'Windows'
    with:
      ocaml-repository: https://github.com/fdopen/opam-repository-mingw.git#opam2

  - name: Use OCaml on Unix
    uses: ocaml/setup-ocaml@v1
    if: runner.os != 'Windows'
    with:
      opam-repository: https://github.com/ocaml/opam-repository.git
```

## Roadmap

This action aims to provide an OS-neutral interface to `opam`, and so will not
add features that only work on one operating system. It will also track the
latest stable release of opam.

## Support

Please feel free to post to the discuss.ocaml.org forum with any questions you
have about this action.

Previous discussions include:

- https://discuss.ocaml.org/t/github-actions-for-ocaml-now-stable-and-on-the-ocaml-org/7889
- https://discuss.ocaml.org/t/github-actions-for-ocaml-opam-now-available/4745
