# Set up OCaml

[![Main workflow](https://github.com/ocaml/setup-ocaml/workflows/Main%20workflow/badge.svg?branch=master)](https://github.com/ocaml/setup-ocaml/actions)
[![CodeQL](https://github.com/ocaml/setup-ocaml/workflows/CodeQL/badge.svg?branch=master)](https://github.com/ocaml/setup-ocaml/actions)

Set up an OCaml and opam environment in
[GitHub Actions](https://github.com/features/actions) and add to PATH.

## Usage

We adhere to [semantic versioning](https://semver.org), it's safe to use the
major version (`v2`) in your workflow. If you use the master branch, this could
break your workflow when we publish a breaking update and increase the major
version.

```yml
- name: Set-up OCaml ${{ matrix.ocaml-compiler }}
  uses: ocaml/setup-ocaml@v2
  #                      ^^^
  with:
    ocaml-compiler: ${{ matrix.ocaml-compiler }}
```

```yml
steps:
  # Reference the major version of a release (most recommended)
  - uses: ocaml/setup-ocaml@v2
  # Reference a specific commit (most strict)
  - uses: ocaml/setup-ocaml@<SHA>
  # Reference a semver version of a release (not recommended)
  - uses: ocaml/setup-ocaml@v2.0.0
  # Reference a branch (most dangerous)
  - uses: ocaml/setup-ocaml@master
```

### Example workflow

See the
[Hello World OCaml Action](https://github.com/avsm/hello-world-action-ocaml)
that uses Dune and opam to build a simple library.

It's possible to feed different values to the input depending on the platform of
the runner. The syntax of GitHub's workflows is flexible enough to offer several
methods to do this.

```yml
name: Main workflow

on:
  pull_request:
  push:
  schedule:
    # Prime the caches every Monday
    - cron: 0 1 * * MON

jobs:
  build:
    strategy:
      fail-fast: false
      matrix:
        os:
          - macos-latest
          - ubuntu-latest
          - windows-latest
        ocaml-compiler:
          - 5.0

    runs-on: ${{ matrix.os }}

    steps:
      - name: Checkout tree
        uses: actions/checkout@v3

      - name: Set-up OCaml ${{ matrix.ocaml-compiler }}
        uses: ocaml/setup-ocaml@v2
        with:
          ocaml-compiler: ${{ matrix.ocaml-compiler }}

      - run: opam install . --deps-only --with-test

      - run: opam exec -- dune build

      - run: opam exec -- dune runtest
```

## Inputs

| Name                      | Required | Description                                                                                                                                                                               | Type   | Default  |
| ------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | -------- |
| `ocaml-compiler`          | Yes      | The OCaml compiler packages to initialise. See the [supported version syntax](#supported-version-syntax) section.                                                                         | string |          |
| `opam-repositories`       | No       | The name and URL pair of the repository to fetch the packages from.                                                                                                                       | string |          |
| `opam-pin`                | No       | Enable the automation feature for opam pin.                                                                                                                                               | bool   | `true`   |
| `opam-depext`             | No       | Enable the automation feature for opam depext.                                                                                                                                            | bool   | `true`   |
| `opam-depext-flags`       | No       | The flags for the opam depext command. The flags must be separated by the comma.                                                                                                          | string |          |
| `opam-local-packages`     | No       | The local packages to be used by `opam-pin` or `opam-depext`. See the [`@actions/glob` documentation](https://github.com/actions/toolkit/tree/main/packages/glob) for supported patterns. | string | `*.opam` |
| `opam-disable-sandboxing` | No       | Disable the opam sandboxing feature.                                                                                                                                                      | bool   | `false`  |
| `dune-cache`              | No       | Enable the dune cache feature. This feature **_requires_** dune 2.8.5 or later on the Windows runners.                                                                                    | bool   | `false`  |
| `cache-prefix`            | No       | The prefix of the cache keys.                                                                                                                                                             | string | `v1`     |

### Supported version syntax

The `ocaml-compiler` input supports the Semantic Versioning Specification, for
more detailed examples please refer to the
[documentation](https://github.com/npm/node-semver#ranges).

> **Note** With the naughty exception of `4.02.2`, point releases are meant to
> be strictly compatible, so once we (OCaml dev team) release a new point
> release, upgrading should be a no-brainer.

Examples:

- Exact package name: `ocaml-base-compiler.5.0.0`,
  `ocaml-variants.4.14.0+mingw64c`
- Multiple package combinations:
  `ocaml-variants.5.0.0+options,ocaml-option-flambda,ocaml-option-musl,ocaml-option-static`
- Minor versions: `4.08`, `4.14`, `5.0`, `5.0.x`
- More specific versions: `~4.02.2`, `5.0.0`,

## Advanced Configurations

See [Examples](examples.md) for more complex patterns.

## Extends

**STATUS: EXPERIMENTAL**

Note: All extends are recommended to use in separate jobs run on
`ubuntu-latest`.

- [deploy-doc](deploy-doc)
- [lint-doc](lint-doc)
- [lint-fmt](lint-fmt)
- [lint-opam](lint-opam)

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
