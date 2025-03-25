import * as os from "node:os";
import * as path from "node:path";
import * as process from "node:process";
import * as core from "@actions/core";
import * as yaml from "yaml";

export const ARCHITECTURE = (() => {
  switch (process.arch) {
    case "arm": {
      return "armhf";
    }
    case "arm64": {
      return "arm64";
    }
    case "riscv64": {
      return "riscv64";
    }
    case "s390x": {
      return "s390x";
    }
    case "x64": {
      return "x86_64";
    }
    default: {
      throw new Error(
        `'${process.arch}' is not supported. Supported architectures: arm, arm64, riscv64, s390x, x64`,
      );
    }
  }
})();

export const PLATFORM = (() => {
  switch (process.platform) {
    case "darwin": {
      return "macos";
    }
    case "freebsd": {
      return "freebsd";
    }
    case "linux": {
      return "linux";
    }
    case "openbsd": {
      return "openbsd";
    }
    case "win32": {
      return "windows";
    }
    default: {
      throw new Error(
        `'${process.platform}' is not supported. Supported platforms: darwin, freebsd, linux, openbsd, win32`,
      );
    }
  }
})();

export const CYGWIN_MIRROR = "https://mirrors.kernel.org/sourceware/cygwin/";

export const GITHUB_WORKSPACE = process.env.GITHUB_WORKSPACE ?? process.cwd();

// [HACK] https://github.com/ocaml/setup-ocaml/pull/55
export const CYGWIN_ROOT = path.join("D:", "cygwin");

export const CYGWIN_ROOT_BIN = path.join(CYGWIN_ROOT, "bin");

export const CYGWIN_LOCAL_PACKAGE_DIR = path.join(CYGWIN_ROOT, "packages");

export const CYGWIN_BASH_ENV = path.join(CYGWIN_ROOT, "bash_env");

export const DUNE_CACHE_ROOT = (() => {
  const xdgCacheHome = process.env.XDG_CACHE_HOME;
  if (xdgCacheHome) {
    return path.join(xdgCacheHome, "dune");
  }
  if (PLATFORM === "windows") {
    // [HACK] https://github.com/ocaml/setup-ocaml/pull/55
    return path.join("D:", "dune");
  }
  return path.join(os.homedir(), ".cache", "dune");
})();

export const OPAM_ROOT = (() => {
  if (PLATFORM === "windows") {
    // [HACK] https://github.com/ocaml/setup-ocaml/pull/55
    return path.join("D:", ".opam");
  }
  return path.join(os.homedir(), ".opam");
})();

export const RUNNER_ENVIRONMENT = process.env.RUNNER_ENVIRONMENT as
  | "github-hosted"
  | "self-hosted";

export const ALLOW_PRERELEASE_OPAM = core.getBooleanInput(
  "allow-prerelease-opam",
);

export const CACHE_PREFIX = core.getInput("cache-prefix");

export const GITHUB_TOKEN = core.getInput("github-token");

export const DUNE_CACHE = core.getBooleanInput("dune-cache");

export const OCAML_COMPILER = core.getInput("ocaml-compiler", {
  required: true,
});

export const OPAM_DISABLE_SANDBOXING =
  // [TODO] unlock this once sandboxing is supported on Windows
  PLATFORM !== "windows" && core.getBooleanInput("opam-disable-sandboxing");

export const OPAM_LOCAL_PACKAGES = core.getInput("opam-local-packages");

export const OPAM_PIN = core.getBooleanInput("opam-pin");

export const OPAM_REPOSITORIES: [string, string][] = (() => {
  const repositoriesYaml = yaml.parse(
    core.getInput("opam-repositories"),
  ) as Record<string, string>;
  return Object.entries(repositoriesYaml).reverse();
})();
