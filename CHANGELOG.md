# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [unreleased]

## [2.1.4]

### Fixed

- Fix a typo in the key of `allow-prerelease-opam` input.

## [2.1.3]

### Changed

- Adopt native ESM for runtime environment.
- Reduce system-related internal calls as much as possible.

## [2.1.2]

### Fixed

- Force post-process exit with `process.exit`.

## [2.1.1]

### Changed

- Do not install `opam-depext` if using opam 2.2 or later.

### Fixed

- Do not set `OPAMCLI` if pre-release opam is allowed.

## [2.1.0]

### Added

- Add `allow-prelease-opam` input.

## [2.0.21]

### Fixed

- Prevent opam bug by leaving verbose mode undefined.

## [2.0.20]

### Changed

- Update default runtime to node20.

## [2.0.19]

### Changed

- Workaround dune cache hardlink failures by using copy mode always.

## [2.0.18]

### Fixed

- Cygwin pin to v3.4.6 workaround removed.

## [2.0.17]

### Fixed

- Temporarily hold Cygwin at 3.4.6 to workaround upstream tar packaging issue.

## [2.0.16]

### Changed

- Make logs around system packages more polite.

## [2.0.15]

### Changed

- Remove the action version from the cache key.
- Update npm deps.

## [2.0.14]

### Added

- Add support for nektos/act.

## [2.0.13]

### Fixed

- Ensure cache key creation works with local opam repositories.

## [2.0.12]

### Changed

- Use ocaml-opam/opam-repository-mingw instead of fdopen/opam-repository-mingw.

### Fixed

- Fix in 2.0.11 for hashing caused an invalid git configuration to be written.

## [2.0.11]

### Changed

- Don't install Cygwin's git or mercurial packages (reduces cache by ~90MB).

### Fixed

- Ensure ocaml/opam-repository can be added without getting hash errors.

## [2.0.10]

### Fixed

- Speed up caching and get rid of bugs and hacks on Windows.

## [2.0.9]

### Fixed

- Take the sandbox option value into account when computing the cache key.

## [2.0.8]

### Changed

- Make the retry handling around unix package installation simple back.

### Fixed

- Make the retry handling around depext package installation more robust.

## [2.0.7]

### Added

- Define `CLICOLOR_FORCE=1` in CI runs.

### Fixed

- Make the retry handling around unix system package installation more
  stringent.

## [2.0.6]

### Added

- Add support for arm64.

### Changed

- Fail on missing required input instead of warning.

## [2.0.5]

### Changed

- Unset the secondary repository on Windows.

## [2.0.4]

### Changed

- Set the upstream git url as a secondary repository on Windows.

## [2.0.3]

### Added

- Expose the `enable-jekyll` alias to the `enable_jekyll` input for deploy-doc
  action.

### Fixed

- Turn off git directory ownership check.

## [2.0.2]

### Changed

- Relax the restore keys for the opam cache.

## [2.0.1]

### Changed

- Update the package index if the system package installation fails.

## [2.0.0]

### Changed

- Update default runtime to node16.

## [2.0.0-beta13]

### Changed

- Do not install opam-depext if it's not enabled.

### Fixed

- Print a proper error if the version not found in the `.ocamlformat` file.

## [2.0.0-beta12]

### Fixed

- Fallback to the version in which the assets exist if no assets exist in the
  latest opam release.
- Instruct Cygwin setup to use "sys" symlinks during setup (partial workaround
  for bug with native symlinks in Cygwin setup - some depexts may still be
  affected)

## [2.0.0-beta11]

### Fixed

- Add support for more styles for the ocamlformat configuration in lint-fmt
  action.

## [2.0.0-beta10]

### Added

- Added "extends" experimentally.

### Changed

- Remove some hacks as `--no-depexts` is now used in CLI 2.0 mode from opam
  2.1.2.

## [2.0.0-beta9]

### Changed

- Increase the allowed artifact cache size from 5GB to 10GB.

## [2.0.0-beta8]

### Changed

- Use 2.1 mode instead of 2.0 mode on the Ubuntu and macOS runners.

## [2.0.0-beta7]

### Fixed

- Return an empty array to avoid depext failure when depext flags are not
  passed.

## [2.0.0-beta6]

### Changed

- Unlock opam 2.1 on the Ubuntu and macOS runners.

## [2.0.0-beta5]

### Changed

- Reduce GitHub API calls to avoid issues that can easily hit rate-limiting.

### Fixed

- If no user-input version is found in the opam-repository, explicitly raise an
  error instead of implicitly breaking the workflow.
- Retrieve the base compiler version from opam-repository to use the live
  released compiler version.

## [2.0.0-beta4]

### Changed

- Set `OPAMSOLVERTIMEOUT` to `1000` to avoid a timeout even if the opam solver
  is slow.
- Increase cache hit ratio by loosening restore keys of opam cache.

## [2.0.0-beta3]

### Changed

- Use the week number to manage Cygwin cache.

### Fixed

- Set repository priorities correctly for multiple repositories feature.
- Lock the version of opam to be installed only to < 2.1 releases until opam 2.2
  is released.

## [2.0.0-beta2]

### Changed

- Changed to force an update of the opam cache if the week number is changed.

### Removed

- Removed the profiling functionality added in `2.0.0-alpha`.

## [2.0.0-beta]

### Added

- Added `opam-repositories` input to support multiple opam repositories.

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
  <https://github.com/ocaml/dune/issues/4166>,
  <https://github.com/ocaml/dune/issues/4167>), and share the dune cache
  directory for each run.
- If `opam-pin` is enabled, pin the local packages specified by
  `opam-local-packages`.
- If `opam-depext` is enabled, install the system dependencies specified by
  `opam-local-packages` via depext
- If `opam-disable-sandboxing` is enabled, sandboxing is disabled for all
  platforms except Windows. (Sandboxing is always disabled on the Windows
  runners due to limitations of opam.)
- The profiling functionality allows us to check the duration of each group if
  debug mode is enabled.
  (<https://docs.github.com/en/actions/managing-workflow-runs/enabling-debug-logging>)

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
  (<https://docs.github.com/en/actions/managing-workflow-runs/enabling-debug-logging>)
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

[unreleased]: https://github.com/ocaml/setup-ocaml/compare/v2.1.4...HEAD
[2.1.4]: https://github.com/ocaml/setup-ocaml/compare/v2.1.3...v2.1.4
[2.1.3]: https://github.com/ocaml/setup-ocaml/compare/v2.1.2...v2.1.3
[2.1.2]: https://github.com/ocaml/setup-ocaml/compare/v2.1.1...v2.1.2
[2.1.1]: https://github.com/ocaml/setup-ocaml/compare/v2.1.0...v2.1.1
[2.1.0]: https://github.com/ocaml/setup-ocaml/compare/v2.0.21...v2.1.0
[2.0.21]: https://github.com/ocaml/setup-ocaml/compare/v2.0.20...v2.0.21
[2.0.20]: https://github.com/ocaml/setup-ocaml/compare/v2.0.19...v2.0.20
[2.0.19]: https://github.com/ocaml/setup-ocaml/compare/v2.0.18...v2.0.19
[2.0.18]: https://github.com/ocaml/setup-ocaml/compare/v2.0.17...v2.0.18
[2.0.17]: https://github.com/ocaml/setup-ocaml/compare/v2.0.16...v2.0.17
[2.0.16]: https://github.com/ocaml/setup-ocaml/compare/v2.0.15...v2.0.16
[2.0.15]: https://github.com/ocaml/setup-ocaml/compare/v2.0.14...v2.0.15
[2.0.14]: https://github.com/ocaml/setup-ocaml/compare/v2.0.13...v2.0.14
[2.0.13]: https://github.com/ocaml/setup-ocaml/compare/v2.0.12...v2.0.13
[2.0.12]: https://github.com/ocaml/setup-ocaml/compare/v2.0.11...v2.0.12
[2.0.11]: https://github.com/ocaml/setup-ocaml/compare/v2.0.10...v2.0.11
[2.0.10]: https://github.com/ocaml/setup-ocaml/compare/v2.0.9...v2.0.10
[2.0.9]: https://github.com/ocaml/setup-ocaml/compare/v2.0.8...v2.0.9
[2.0.8]: https://github.com/ocaml/setup-ocaml/compare/v2.0.7...v2.0.8
[2.0.7]: https://github.com/ocaml/setup-ocaml/compare/v2.0.6...v2.0.7
[2.0.6]: https://github.com/ocaml/setup-ocaml/compare/v2.0.5...v2.0.6
[2.0.5]: https://github.com/ocaml/setup-ocaml/compare/v2.0.4...v2.0.5
[2.0.4]: https://github.com/ocaml/setup-ocaml/compare/v2.0.3...v2.0.4
[2.0.3]: https://github.com/ocaml/setup-ocaml/compare/v2.0.2...v2.0.3
[2.0.2]: https://github.com/ocaml/setup-ocaml/compare/v2.0.1...v2.0.2
[2.0.1]: https://github.com/ocaml/setup-ocaml/compare/v2.0.0...v2.0.1
[2.0.0]: https://github.com/ocaml/setup-ocaml/compare/v2.0.0-beta13...v2.0.0
[2.0.0-beta13]:
  https://github.com/ocaml/setup-ocaml/compare/v2.0.0-beta12...v2.0.0-beta13
[2.0.0-beta12]:
  https://github.com/ocaml/setup-ocaml/compare/v2.0.0-beta11...v2.0.0-beta12
[2.0.0-beta11]:
  https://github.com/ocaml/setup-ocaml/compare/v2.0.0-beta10...v2.0.0-beta11
[2.0.0-beta10]:
  https://github.com/ocaml/setup-ocaml/compare/v2.0.0-beta9...v2.0.0-beta10
[2.0.0-beta9]:
  https://github.com/ocaml/setup-ocaml/compare/v2.0.0-beta8...v2.0.0-beta9
[2.0.0-beta8]:
  https://github.com/ocaml/setup-ocaml/compare/v2.0.0-beta7...v2.0.0-beta8
[2.0.0-beta7]:
  https://github.com/ocaml/setup-ocaml/compare/v2.0.0-beta6...v2.0.0-beta7
[2.0.0-beta6]:
  https://github.com/ocaml/setup-ocaml/compare/v2.0.0-beta5...v2.0.0-beta6
[2.0.0-beta5]:
  https://github.com/ocaml/setup-ocaml/compare/v2.0.0-beta4...v2.0.0-beta5
[2.0.0-beta4]:
  https://github.com/ocaml/setup-ocaml/compare/v2.0.0-beta3...v2.0.0-beta4
[2.0.0-beta3]:
  https://github.com/ocaml/setup-ocaml/compare/v2.0.0-beta2...v2.0.0-beta3
[2.0.0-beta2]:
  https://github.com/ocaml/setup-ocaml/compare/v2.0.0-beta...v2.0.0-beta2
[2.0.0-beta]:
  https://github.com/ocaml/setup-ocaml/compare/v2.0.0-alpha...v2.0.0-beta
[2.0.0-alpha]:
  https://github.com/ocaml/setup-ocaml/compare/v1.1.11...v2.0.0-alpha
[1.1.11]: https://github.com/ocaml/setup-ocaml/compare/v1.1.10...v1.1.11
[1.1.10]: https://github.com/ocaml/setup-ocaml/compare/v1.1.9...v1.1.10
[1.1.9]: https://github.com/ocaml/setup-ocaml/compare/v1.1.8...v1.1.9
[1.1.8]: https://github.com/ocaml/setup-ocaml/compare/v1.1.7...v1.1.8
[1.1.7]: https://github.com/ocaml/setup-ocaml/compare/v1.1.6...v1.1.7
[1.1.6]: https://github.com/ocaml/setup-ocaml/compare/v1.1.5...v1.1.6
[1.1.5]: https://github.com/ocaml/setup-ocaml/compare/v1.1.4...v1.1.5
[1.1.4]: https://github.com/ocaml/setup-ocaml/compare/v1.1.3...v1.1.4
[1.1.3]: https://github.com/ocaml/setup-ocaml/compare/v1.1.2...v1.1.3
[1.1.2]: https://github.com/ocaml/setup-ocaml/compare/v1.1.1...v1.1.2
[1.1.1]: https://github.com/ocaml/setup-ocaml/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/ocaml/setup-ocaml/compare/v1.0.1...v1.1.0
[1.0.1]: https://github.com/ocaml/setup-ocaml/compare/v1.0...v1.0.1
[1.0]: https://github.com/ocaml/setup-ocaml/releases/tag/v0.0.1
