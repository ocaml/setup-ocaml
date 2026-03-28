# Examples

## Using the official GitHub Pages actions to deploy odoc to GitHub Pages

```yml
name: Deploy odoc to GitHub Pages

on:
  push:
    branches:
      - main

permissions: read-all

concurrency:
  group: deploy-odoc
  cancel-in-progress: true

jobs:
  deploy-odoc:
    name: Deploy odoc to GitHub Pages

    permissions:
      contents: read
      id-token: write
      pages: write

    runs-on: ubuntu-latest

    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}

    steps:
      - name: Checkout tree
        uses: actions/checkout@v6

      - name: Set-up OCaml
        uses: ocaml/setup-ocaml@v3
        with:
          ocaml-compiler: 5

      - name: Install dependencies
        run: opam install . --deps-only --with-doc

      - name: Build documentation
        run: opam exec -- dune build @doc

      - name: Set-up Pages
        uses: actions/configure-pages@v5

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v4
        with:
          path: _build/default/_doc/_html

      - id: deployment
        name: Deploy odoc to GitHub Pages
        uses: actions/deploy-pages@v4
```

## Using glob patterns to filter local packages

Consult the [`@actions/glob`](https://github.com/actions/toolkit/tree/main/packages/glob) package for supported patterns.

```yml
steps:
  - name: Checkout tree
    uses: actions/checkout@v6

  - name: Set-up OCaml
    uses: ocaml/setup-ocaml@v3
    with:
      ocaml-compiler: ${{ matrix.ocaml-compiler }}
      opam-local-packages: |
        *.opam
        !exclude.opam
```

## Using MSVC on Windows

```yml
runs-on: windows-latest

steps:
  - name: Checkout tree
    uses: actions/checkout@v6

  - name: Set-up OCaml with MSVC
    uses: ocaml/setup-ocaml@v3
    with:
      ocaml-compiler: "5.4"
      windows-compiler: msvc
```

## Using MSYS2 on Windows

```yml
runs-on: windows-latest

steps:
  - name: Checkout tree
    uses: actions/checkout@v6

  - name: Set-up OCaml with MSYS2
    uses: ocaml/setup-ocaml@v3
    with:
      ocaml-compiler: "5.4"
      windows-environment: msys2
```

## Using a custom OCaml compiler

To use a custom or unreleased OCaml compiler, create a custom [opam repository](https://opam.ocaml.org/doc/Manual.html#Repositories) containing the compiler package and add it via the `opam-repositories` input. When specifying a compiler from a custom repository, you must use the full opam package name rather than a semver version range, because semver resolution only queries the official [opam-repository](https://github.com/ocaml/opam-repository).

```yml
steps:
  - name: Checkout tree
    uses: actions/checkout@v6

  - name: Set-up OCaml
    uses: ocaml/setup-ocaml@v3
    with:
      ocaml-compiler: ocaml-base-compiler.5.4.0~dev
      opam-repositories: |
        custom: git+https://github.com/<username>/<custom-opam-repository>.git
        default: git+https://github.com/ocaml/opam-repository.git
```

## Using opam lock files

To use dependencies specified by [opam lock files](https://opam.ocaml.org/doc/Manual.html#opam-lock), set the `OPAMLOCKED` environment variable to `locked` in the setup-ocaml step. This ensures that `opam pin` uses the `.opam.locked` files, so subsequent `opam install . --deps-only --locked` correctly installs the locked dependencies.

```yml
steps:
  - name: Checkout tree
    uses: actions/checkout@v6

  - name: Set-up OCaml
    uses: ocaml/setup-ocaml@v3
    with:
      ocaml-compiler: "5.4"
    env:
      OPAMLOCKED: locked

  - name: Install dependencies
    run: opam install . --deps-only --locked
```

## Using with [Containers](https://docs.github.com/en/actions/reference/workflow-syntax-for-github-actions#jobsjob_idcontainer)

```yml
runs-on: ubuntu-latest

container: ${{ matrix.container }}

strategy:
  matrix:
    container:
      - debian:latest
      - ubuntu:latest
  fail-fast: false

steps:
  - name: Checkout tree
    uses: actions/checkout@v6

  - name: Retrieve new lists of system packages
    run: apt-get update

  - name: Install system packages
    run: apt-get --yes install bubblewrap curl darcs gcc git m4 make mercurial patch rsync sudo unzip

  - name: Set-up OCaml
    uses: ocaml/setup-ocaml@v3
    with:
      ocaml-compiler: 5
      cache-prefix: v1-${{ matrix.container }}
      opam-disable-sandboxing: true
```
