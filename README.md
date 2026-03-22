# Set up OCaml

**STATUS: STABLE**

Set up an OCaml and opam environment in [GitHub Actions](https://github.com/features/actions) and add to PATH.

## Usage

### Example workflow

Consult the [Hello World OCaml Action](https://github.com/avsm/hello-world-action-ocaml) that uses Dune and opam to build a simple library.

It's possible to feed different values to the input depending on the platform of the runner. The syntax of GitHub's workflows is flexible enough to offer several methods to do this.

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
        uses: actions/checkout@v6

      - name: Set-up OCaml
        uses: ocaml/setup-ocaml@v3
        with:
          ocaml-compiler: 5

      - run: opam install . --deps-only --with-test

      - run: opam exec -- dune build

      - run: opam exec -- dune runtest

  lint-doc:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout tree
        uses: actions/checkout@v6
      - name: Set-up OCaml
        uses: ocaml/setup-ocaml@v3
        with:
          ocaml-compiler: 5
      - uses: ocaml/setup-ocaml/lint-doc@v3

  lint-fmt:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout tree
        uses: actions/checkout@v6
      - name: Set-up OCaml
        uses: ocaml/setup-ocaml@v3
        with:
          ocaml-compiler: 5
      - uses: ocaml/setup-ocaml/lint-fmt@v3

  lint-opam:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout tree
        uses: actions/checkout@v6
      - name: Set-up OCaml
        uses: ocaml/setup-ocaml@v3
        with:
          ocaml-compiler: 5
      - uses: ocaml/setup-ocaml/lint-opam@v3
```

### OCaml Compiler Support Matrix

When using GitHub-hosted runners, specifying compiler version `4` or `5` should work across all platforms and architectures. However, there are exceptions, as shown below. If you need to test with specific versions, please choose the appropriate version for your runtime environment.

#### x86 64 bits

| Version           | Ubuntu             | macOS              | Windows (MinGW-w64) | Windows (MSVC)     |
| ----------------- | ------------------ | ------------------ | ------------------- | ------------------ |
| >= 5.3            | :white_check_mark: | :white_check_mark: | :white_check_mark:  | :white_check_mark: |
| >= 5.0 & <= 5.2   | :white_check_mark: | :white_check_mark: | :white_check_mark:  | :x:                |
| >= 4.13 & <= 4.14 | :white_check_mark: | :white_check_mark: | :white_check_mark:  | :white_check_mark: |
| >= 4.02 & <= 4.12 | :white_check_mark: | :white_check_mark: | :x:                 | :x:                |
| <= 4.01           | :white_check_mark: | :white_check_mark: | :x:                 | :x:                |

#### ARM 64 bits

| Version           | Ubuntu             | macOS              | Windows |
| ----------------- | ------------------ | ------------------ | ------- |
| >= 4.12           | :white_check_mark: | :white_check_mark: | :x:     |
| = 4.11            | :white_check_mark: | :x:                | :x:     |
| = 4.10            | :white_check_mark: | :white_check_mark: | :x:     |
| >= 4.02 & <= 4.09 | :white_check_mark: | :x:                | :x:     |
| <= 4.01           | :x:                | :x:                | :x:     |

### Versioning

The actions are downloaded and run from the GitHub graph of repositories. The workflow references an action using a ref.

> [!NOTE]
> Binding to a major version is the latest of that major version (e.g. `v3` = `3.*`) Major versions should guarantee compatibility. A major version can add net new capabilities but should not break existing input compatibility or break existing workflows.

```yml
- name: Set-up OCaml ${{ matrix.ocaml-compiler }}
  uses: ocaml/setup-ocaml@v3
  #                      ^^^
  with:
    ocaml-compiler: ${{ matrix.ocaml-compiler }}
```

> [!WARNING]
> Do not reference `master` since that is the latest code and can be carrying breaking changes of the next major version.

Major version binding allows you to take advantage of bug fixes, critical functionality and security fixes. The `master` branch has the latest code and is unstable to bind to since changes get committed to the `master` and released by creating a tag.

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

| Name                      | Required | Description                                                                                                                                                                                                              | Type   | Default                                                     |
| ------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------ | ----------------------------------------------------------- |
| `ocaml-compiler`          | Yes      | The OCaml compiler packages to initialise. Consult the [supported version syntax](#supported-version-syntax) section.                                                                                                    | string |                                                             |
| `opam-repositories`       | No       | A YAML mapping of opam repository name/URL pairs to use. Repositories listed first take priority over later ones.                                                                                                        | string | `default: git+https://github.com/ocaml/opam-repository.git` |
| `opam-pin`                | No       | Automatically pin local opam packages (matched by `opam-local-packages`) in the opam switch. Set to `false` to skip pinning.                                                                                             | bool   | `true`                                                      |
| `opam-local-packages`     | No       | A glob pattern matching the local `.opam` files to be pinned when `opam-pin` is enabled. Consult the [`@actions/glob` documentation](https://github.com/actions/toolkit/tree/main/packages/glob) for supported patterns. | string | `*.opam`                                                    |
| `opam-disable-sandboxing` | No       | Disable the opam sandboxing feature. opam uses Bubblewrap on Linux and sandbox-exec on macOS. Useful for self-hosted runners where the sandbox tool is not available. On Windows, sandboxing is always disabled.         | bool   | `false`                                                     |
| `dune-cache`              | No       | Enable Dune build caching via GitHub Actions cache. When enabled, the Dune cache directory is saved and restored between workflow runs to speed up incremental builds.                                                   | bool   | `false`                                                     |
| `cache-prefix`            | No       | The prefix used for all cache keys. Change this value to force a cache invalidation when the cache becomes corrupted or stale.                                                                                           | string | `v3`                                                        |
| `windows-environment`     | No       | The Unix environment used for building on Windows. Use `cygwin` (default) for opam's internal Cygwin, or `msys2` to use the pre-installed MSYS2 on GitHub-hosted runners.                                                | string | `cygwin`                                                    |
| `windows-compiler`        | No       | The C compiler toolchain used for building on Windows. Use `mingw` (default) for mingw-w64 (GCC), or `msvc` for the Microsoft Visual C compiler. MSVC requires Visual Studio (pre-installed on GitHub-hosted runners).   | string | `mingw`                                                     |
| `allow-prerelease-opam`   | No       | Allow the use of a pre-release version of opam. Has no effect when no pre-release version is available.                                                                                                                  | bool   | `false`                                                     |

### Supported version syntax

The `ocaml-compiler` input supports the Semantic Versioning Specification, for more detailed examples please refer to the [documentation](https://github.com/npm/node-semver#ranges).

When a version range is used (e.g., `5`, `5.4.x`), the highest matching version from the opam-repository is always selected.

> [!WARNING]
> Version numbers containing a dot **must be quoted** in YAML to avoid being parsed as floats. For example, an unquoted `5.10` is parsed as the float `5.1`, which would silently resolve to the latest `5.1.x` compiler instead of `5.10.x`. To be safe, always quote version values:
>
> ```yml
> ocaml-compiler: "5.4"
> ```

> [!NOTE]
> With the naughty exception of `4.02.2`, point releases are meant to be strictly compatible, so once we (OCaml dev team) release a new point release, upgrading should be a no-brainer.

Examples:

- Exact package name: `ocaml-base-compiler.5.4.0`
- Combine multiple packages: `ocaml-variants.5.4.0+options,ocaml-option-flambda,ocaml-option-musl,ocaml-option-static`
- Major versions: `"4"`, `"5"`
- Minor versions: `"4.08"`, `"4.14"`, `"5.4"`, `"5.4.x"`
- More specific versions: `"~4.02.2"`, `"5.4.0"`

## Advanced Configurations

Consult the [examples](EXAMPLES.md) page for more complex patterns.

## Extensions

**STATUS: STABLE**

> [!NOTE]
> All extensions are recommended to be used in separate jobs run on `ubuntu-latest`.

- [analysis](analysis)
- [lint-doc](lint-doc)
- [lint-fmt](lint-fmt)
- [lint-opam](lint-opam)

## Automatically updating the actions with Dependabot

Consult the [Configuring Dependabot version updates](https://docs.github.com/en/code-security/dependabot/dependabot-version-updates/configuring-dependabot-version-updates) page and set `.github/dependabot.yml` as described below to allow Dependabot to update the actions automatically.

```yml
version: 2
updates:
  - package-ecosystem: github-actions
    directory: /
    schedule:
      interval: weekly
```

> [!NOTE]
> [Renovate](https://github.com/marketplace/renovate) is also available for free as a third-party tool, which is much more flexible than Dependabot - depending on the project and your preferences. If you just want to automate GitHub Actions updates, Dependabot is good enough.

## Roadmap

This action aims to provide an OS-neutral interface to `opam`, and so will not add features that only work on one operating system. It will also track the latest stable release of opam.

## Support

Please feel free to post to the discuss.ocaml.org forum with any questions you have about this action.

Previous discussions include:

- <https://discuss.ocaml.org/t/github-actions-for-ocaml-now-stable-and-on-the-ocaml-org/7889>
- <https://discuss.ocaml.org/t/github-actions-for-ocaml-opam-now-available/4745>
