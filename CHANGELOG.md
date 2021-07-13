# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [unreleased]

### Changed

- Use the week number to manage Cygwin cache.
- If the default repository structure is used, do not attempt to perform
  additional repository-related operations to save set up time.

## [v2.0.0-beta2]

### Changed

- Changed to force an update of the opam cache if the week number is changed.

### Removed

- Removed the profiling functionality added in `2.0.0-alpha`.

## [2.0.0-beta]

### Added

- ​Added `opam-repositories` input to support multiple opam repositories.

### Removed

- The `opam-repository` input has been removed in order to add the
  `opam-repositories` input.

## [2.0.0-alpha]

### Added

- Added support for 32 bits compiler variants.
- Added semver-style version matching support.
- Cache opam root (`~/.opam` on Unix, `D:\.opam` on Windows), opam
  download-cache (`~/.opam/download-cache` on Unix, `D:\.opam\download-cache` on
  Windows), and opam local switch (`_opam`).
- If `dune-cache` enabled, install dune, automatically configure the dune cache
  for the most efficient use in CI (exports `DUNE_CACHE=enabled`,
  `DUNE_CACHE_TRANSPORT=direct`. TRANSPORT must be `direct`, not `daemon`, to
  speed up the opam install process and to support Windows:
  https://github.com/ocaml/dune/issues/4166,
  https://github.com/ocaml/dune/issues/4167), and share the dune cache directory
  for each run.
- If `opam-pin` is enabled, pin the local packages specified by
  `opam-local-packages`.
- If `opam-depext` is enabled, install the system dependencies specified by
  `opam-local-packages` via depext
- If `opam-disable-sandboxing` is enabled, sandboxing is disabled for all
  platforms except Windows. (Sandboxing is always disabled on the Windows
  runners due to limitations of opam.)
- The profiling functionality allows us to check the duration of each group if
  debug mode is enabled.
  (https://docs.github.com/en/actions/managing-workflow-runs/enabling-debug-logging)

### Changed

- The Windows runners install `mingw64-i686-gcc-core` and `mingw64-i686-gcc-g++`
  for 32 bit compiler variant support.
- Clean the log output by grouping some operations.
- The compiler will be initialised in all platforms with an opam local switch to
  eliminate differences between platforms and prepare for full dependency
  caching in the future.
- The macOS and Ubuntu runners install and cache opam from the GitHub release
  directly without the system package manager.
- The macOS and Ubuntu runners install `darcs` and `mercurial`.
- The Windows runners install `mercurial`.
- Export `OPAMCOLOR=always`.
- Export `OPAMERRLOGLEN=0`.
- Export `OPAMPRECISETRACKING=1`.
- Export `OPAMSOLVERTIMEOUT=500`.
- Export `OPAMROOT=D:\.opam` on the Windows runners.
- Export `OPAMVERBOSE=true` if the actions debug mode is enabled.
  (https://docs.github.com/en/actions/managing-workflow-runs/enabling-debug-logging)
- Export `MSYS=winsymlinks:native` for `@actions/cache` on the Windows runners.
- Export `HOME=%USERPROFILE%` for opam on the Windows runners.

### Removed

- The `ocaml-version` input has been removed. Use the `ocaml-compiler` instead.
- The simplified version specifying scheme (e.g. `4.12.0`) support has been
  removed.

### Fixed

- Use the appropriate file system behavior parameters on the Windows runners.
  (`R2L:1`, `R2R:1`)
- Add `ppa: avsm/musl` on 18.04 and older Ubuntu runners.
- Pass `--enable-shell-hook` to `opam init` fixes a bug that must be run via
  opam exec in subsequent steps.
- The Ubuntu runners install `gcc-multilib`, `g++-multilib` for
  `ocaml-option-32bit`.

## [1.1.11]

### Changed

- Stop setting switch jobs variable on Windows (`OPAMJOBS` is sufficient).

## [1.1.10]

### Changed

- Run `brew update` before set up to avoid an issue with Bintray transition
  period.

## [1.1.9]

### Fixed

- Further fix to switch initialisation.

## [1.1.8]

### Changed

- The Windows opam wrapper is fractionally less-archaically named opam.cmd, with
  no loss in arcaneness.
- Export `CYGWIN_ROOT` on the Windows runners, allowing bash to be invoked as
  `%CYGWIN_ROOT%\bin\bash`/`$env:CYGWIN_ROOT\bin\bash` (and similarly for Cygwin
  `setup-x86_64.exe`).
- The Windows runner no longer prepends `%CYGWIN_ROOT%\bin` to `PATH`.

### Fixed

- Switches in Unix are now properly initialized before running depext.

## [1.1.7]

### Changed

- Ubuntu and macOS runners no longer display "No switch is currently installed."
  before building the compiler.
- Ubuntu no longer installs the system ocaml packages.
- macOS no longer builds two compilers on every run.
- Upgrade opam to 2.0.8 for Linux VMs.

## [1.1.6]

### Changed

- Windows installs Cygwin to `D:\cygwin`, using faster Azure temporary storage.

## [1.1.5] - 2020-12-15

### Changed

Reduce build time by exporting modified `OPAMJOBS` environment variable.

## [1.1.4] - 2020-12-07

### Changed

Windows installs `mingw64-x86_64-gcc-g++` so GitHub Action can build libraries
that require it.

## [1.1.3] - 2020-10-23 [YANKED]

### Security

- Update the `@actions/core` package to address
  [CVE-2020-15228](https://github.com/advisories/GHSA-mfwh-5m23-j46w).

## [1.1.2] - 2020-09-10

### Changed

- Add the Cygwin setup to a known location for later steps.

### Fixed

- Check if the switch exists before creating the switch.

## [1.1.1] - 2020-08-20

### Fixed

- OCaml installation errors on Windows are now properly propagated.

## [1.1.0] - 2020-07-04

### Added

- The default opam repository can now be set via input.

### Changed

- Linux VMs now use opam 2.0.7.

## [1.0.1] - 2020-04-21

### Changed

- `node_modules` are not exported anymore which reduces the size of the action

- The repository is initialised directly from the opam-repository git source, so
  that there is no lag in packages being available for CI

- Ubuntu installs `musl-tools` so that the GitHub Action can generate statically
  linked Linux binaries in conjunction with the
  `ocaml-variants.4.x.y+musl+flambda` switch

## [1.0] - 2019-11-21

- Initial release.

[unreleased]: https://github.com/avsm/setup-ocaml/compare/v2.0.0-beta2...HEAD
[v2.0.0-beta2]:
  https://github.com/avsm/setup-ocaml/compare/v2.0.0-beta...v2.0.0-beta2
[2.0.0-beta]:
  https://github.com/avsm/setup-ocaml/compare/v2.0.0-alpha...v2.0.0-beta
[2.0.0-alpha]:
  https://github.com/avsm/setup-ocaml/compare/v1.1.11...v2.0.0-alpha
[1.1.11]: https://github.com/avsm/setup-ocaml/compare/v1.1.9...v1.1.11
[1.1.10]: https://github.com/avsm/setup-ocaml/compare/v1.1.9...v1.1.10
[1.1.9]: https://github.com/avsm/setup-ocaml/compare/v1.1.8...v1.1.9
[1.1.8]: https://github.com/avsm/setup-ocaml/compare/v1.1.7...v1.1.8
[1.1.7]: https://github.com/avsm/setup-ocaml/compare/v1.1.6...v1.1.7
[1.1.6]: https://github.com/avsm/setup-ocaml/compare/v1.1.5...v1.1.6
[1.1.5]: https://github.com/avsm/setup-ocaml/compare/v1.1.4...v1.1.5
[1.1.4]: https://github.com/avsm/setup-ocaml/compare/v1.1.3...v1.1.4
[1.1.3]: https://github.com/avsm/setup-ocaml/compare/v1.1.2...v1.1.3
[1.1.2]: https://github.com/avsm/setup-ocaml/compare/v1.1.1...v1.1.2
[1.1.1]: https://github.com/avsm/setup-ocaml/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/avsm/setup-ocaml/compare/v1.0.1...v1.1.0
[1.0.1]: https://github.com/avsm/setup-ocaml/compare/v1.0...v1.0.1
[1.0]: https://github.com/avsm/setup-ocaml/releases/tag/v0.0.1
