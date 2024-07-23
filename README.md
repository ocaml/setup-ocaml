# Set up OCaml

**STATUS: STABLE**

Set up an OCaml and opam environment in
[GitHub Actions](https://github.com/features/actions) and add to PATH.

## Usage

### Example workflow

Consult the
[Hello World OCaml Action](https://github.com/avsm/hello-world-action-ocaml)
that uses Dune and opam to build a simple library.

It's possible to feed different values to the input depending on the platform of
the runner. The syntax of GitHub's workflows is flexible enough to offer several
methods to do this.

```yml
name: Builds, tests & co

on:
  - push
  - pull_request

permissions: read-all

jobs:
  build:
    strategy:
      fail-fast: false
      matrix:
        os:
          - ubuntu-latest
          - macos-latest
          - windows-latest

    runs-on: ${{ matrix.os }}

    steps:
      - name: Checkout tree
        uses: actions/checkout@v4

      - name: Set-up OCaml
        uses: ocaml/setup-ocaml@v3
        with:
          ocaml-compiler: 5

      - run: opam install . --deps-only --with-test

      - run: opam exec -- dune build

      - run: opam exec -- dune runtest
```

### Versioning

The actions are downloaded and run from the GitHub graph of repositories. The
workflow references an action using a ref.

> [!NOTE] Binding to a major version is the latest of that major version (e.g.
> `v3` = `3.*`) Major versions should guarantee compatibility. A major version
> can add net new capabilities but should not break existing input compatibility
> or break existing workflows.

```yml
- name: Set-up OCaml ${{ matrix.ocaml-compiler }}
  uses: ocaml/setup-ocaml@v3
  #                      ^^^
  with:
    ocaml-compiler: ${{ matrix.ocaml-compiler }}
```

> [!WARNING] Do not reference `master` since that is the latest code and can be
> carrying breaking changes of the next major version.

Major version binding allows you to take advantage of bug fixes, critical
functionality and security fixes. The `master` branch has the latest code and is
unstable to bind to since changes get committed to the `master` and released by
creating a tag.

```yml
steps:
  # Reference the major version of a release (most recommended)
  - uses: ocaml/setup-ocaml@v3
  # Reference a specific commit (most strict)
  - uses: ocaml/setup-ocaml@<SHA>
  # Reference a semver version of a release (not recommended)
  - uses: ocaml/setup-ocaml@v3.0.0
  # Reference a branch (most dangerous - do not do this)
  - uses: ocaml/setup-ocaml@master
```

## Inputs

| Name                      | Required | Description                                                                                                                                                                          | Type   | Default                                                 |
| ------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------ | ------------------------------------------------------- |
| `ocaml-compiler`          | Yes      | The OCaml compiler packages to initialise. Consult the [supported version syntax](#supported-version-syntax) section.                                                                | string |                                                         |
| `opam-repositories`       | No       | The name and URL pair of the repository to fetch the packages from.                                                                                                                  | string | `default: https://github.com/ocaml/opam-repository.git` |
| `opam-pin`                | No       | Enable the automation feature for opam pin.                                                                                                                                          | bool   | `true`                                                  |
| `opam-local-packages`     | No       | The local packages to be used by `opam-pin`. Consult the [`@actions/glob` documentation](https://github.com/actions/toolkit/tree/main/packages/glob) package for supported patterns. | string | `*.opam`                                                |
| `opam-disable-sandboxing` | No       | Disable the opam sandboxing feature.                                                                                                                                                 | bool   | `false`                                                 |
| `dune-cache`              | No       | Enable the dune cache feature. This feature **_requires_** dune 2.8.5 or later on the Windows runners.                                                                               | bool   | `false`                                                 |
| `cache-prefix`            | No       | The prefix of the cache keys.                                                                                                                                                        | string | `v1`                                                    |
| `allow-prerelease-opam`   | No       | Allow to use a pre-release version of opam.                                                                                                                                          | bool   | `false`                                                 |

### Supported version syntax

The `ocaml-compiler` input supports the Semantic Versioning Specification, for
more detailed examples please refer to the
[documentation](https://github.com/npm/node-semver#ranges).

> [!NOTE] With the naughty exception of `4.02.2`, point releases are meant to be
> strictly compatible, so once we (OCaml dev team) release a new point release,
> upgrading should be a no-brainer.

Examples:

- Exact package name: `ocaml-base-compiler.5.2.0`
- Combine multiple packages:
  `ocaml-variants.5.2.0+options,ocaml-option-flambda,ocaml-option-musl,ocaml-option-static`
- Major versions: `4`, `5`
- Minor versions: `4.08`, `4.14`, `5.2`, `5.2.x`
- More specific versions: `~4.02.2`, `5.1.0`

## Advanced Configurations

Consult the [examples](EXAMPLES.md) page for more complex patterns.

## Extends

**STATUS: EXPERIMENTAL**

> [!NOTE] All extends are recommended to be used in separate jobs run on
> `ubuntu-latest`.

- [analysis](analysis)
- [lint-doc](lint-doc)
- [lint-fmt](lint-fmt)
- [lint-opam](lint-opam)

## Automatically updating the actions with Dependabot

Consult the
[Configuring Dependabot version updates](https://docs.github.com/en/code-security/dependabot/dependabot-version-updates/configuring-dependabot-version-updates)
page and set `.github/dependabot.yml` as described below to allow Dependabot to
update the actions automatically.

```yml
version: 2
updates:
  - package-ecosystem: github-actions
    directory: /
    schedule:
      interval: weekly
```

> [!NOTE] [Renovate](https://github.com/marketplace/renovate) is also available
> for free as a third-party tool, which is much more flexible than Dependabot -
> depending on the project and your preferences. If you just want to automate
> GitHub Actions updates, Dependabot is good enough.

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
