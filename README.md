# Set up OCaml

[![Main workflow](https://github.com/ocaml/setup-ocaml/workflows/Main%20workflow/badge.svg?branch=master)](https://github.com/ocaml/setup-ocaml/actions)
[![CodeQL](https://github.com/ocaml/setup-ocaml/workflows/CodeQL/badge.svg?branch=master)](https://github.com/ocaml/setup-ocaml/actions)

Set up an OCaml and opam environment in
[GitHub Actions](https://github.com/features/actions) and add to PATH.

## Action

The action does the following:

#### Main

1. Change the file system behavioral parameters
   - **Windows only**
1. Retrieve the Cygwin cache
   - **Windows only**
   - If the cache already exists
1. Retrieve the opam cache
   - If the cache already exists
1. Prepare the Cygwin environment
   - **Windows only**
1. Save the Cygwin cache
   - **Windows only**
1. Install opam
1. Initialise the opam state
1. Install the OCaml compiler
   - If the opam cache was not hit
1. Remove the opam repositories
1. Save the opam cache
   - If the opam cache was not hit
1. Initialise the opam repositories
1. Retrieve the opam download cache
1. Install depext
   - On Windows, not only `opam-depext` is installed, but `depext-cygwinports`
     is installed as well
1. Retrieve the dune cache
   - If the dune cache feature is enabled
   - If the cache already exists
1. Install the latest dune and enable the dune cache feature
   - If the dune cache feature is enabled
1. Pin the opam files, if they exist
   - If the opam pin feature is not disabled
   - If there is an opam file in the workspace that matches the glob pattern
1. Install the system dependencies required by the opam files via depext
   - If the opam depext feature is enabled
   - If there is an opam file in the workspace that matches the glob pattern

#### Post

The reason for not caching opam stuff in the post stage (more precisely, why you
can't) is due to the size of the cache and repeatability. They should be cached
immediately after initialisation to minimize the size of the cache.

1. Remove oldest dune cache files to free space
   - If the dune cache feature is enabled
1. Save the dune cache
   - If the dune cache feature is enabled
1. Save the opam download cache

#### What is the difference between opam dependencies and depext dependencies?

- opam dependencies: opam packages installed by `opam install`.
- depext dependencies: System packages installed by `apt-get install`,
  `yum install`, `brew install`, etc.

## Usage

We adhere to [semantic versioning](https://semver.org), it's safe to use the
major version (`v2`) in your workflow. If you use the master branch, this could
break your workflow when we publish a breaking update and increase the major
version.

```yml
- name: Use OCaml ${{ matrix.ocaml-compiler }}
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
          - 4.13.x

    runs-on: ${{ matrix.os }}

    steps:
      - name: Checkout code
        uses: actions/checkout@v2

      - name: Use OCaml ${{ matrix.ocaml-compiler }}
        uses: ocaml/setup-ocaml@v2
        with:
          ocaml-compiler: ${{ matrix.ocaml-compiler }}

      - run: opam install . --deps-only --with-test

      - run: opam exec -- dune build

      - run: opam exec -- dune runtest
```

## Advanced Configurations

See [Examples](examples.md) for more complex patterns.

## Inputs

| Name                      | Required | Description                                                                                                                                                                                                                       | Type   | Default  |
| ------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | -------- |
| `ocaml-compiler`          | Yes      | The OCaml compiler packages to initialise. The packages must be separated by the comma. (e.g. `4.13.x`, `ocaml-base-compiler.4.13.0`, `ocaml-variants.4.13.0+options,ocaml-option-flambda,ocaml-option-musl,ocaml-option-static`) | string |          |
| `opam-repositories`       | No       | The name and URL pair of the repository to fetch the packages from.                                                                                                                                                               | string |          |
| `opam-pin`                | No       | Enable the automation feature for opam pin.                                                                                                                                                                                       | bool   | `true`   |
| `opam-depext`             | No       | Enable the automation feature for opam depext.                                                                                                                                                                                    | bool   | `true`   |
| `opam-depext-flags`       | No       | The flags for the opam depext command. The flags must be separated by the comma.                                                                                                                                                  | string |          |
| `opam-local-packages`     | No       | The local packages to be used by `opam-pin` or `opam-depext`. See [`@actions/glob`](https://github.com/actions/toolkit/tree/main/packages/glob) for supported patterns.                                                           | string | `*.opam` |
| `opam-disable-sandboxing` | No       | Disable the opam sandboxing feature.                                                                                                                                                                                              | bool   | `false`  |
| `dune-cache`              | No       | Enable the dune cache feature. This feature **_requires_** dune 2.8.5 or later on the Windows runners.                                                                                                                            | bool   | `false`  |
| `cache-prefix`            | No       | The prefix of the cache keys.                                                                                                                                                                                                     | string | `v1`     |

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
