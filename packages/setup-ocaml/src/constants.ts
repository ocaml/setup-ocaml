import * as os from "node:os";
import * as path from "node:path";
import * as fs from "node:fs";
import * as process from "node:process";
import * as core from "@actions/core";
import * as yaml from "yaml";
import { resolveCompiler } from "./version.js";

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

export const DISTRO = (() => {
  try {
    const osRelease = fs.readFileSync("/etc/os-release")
    const match = osRelease.toString().match(/^ID=(.*)$/m)
    return match ? match[1] : "(unknown)"
  } catch (e) {
    return "(unknown)"
  }
})();
export const CYGWIN_MIRROR = "https://mirrors.kernel.org/sourceware/cygwin/";

export const GITHUB_WORKSPACE = process.env.GITHUB_WORKSPACE ?? process.cwd();

export const CYGWIN_MIRROR_ENCODED_URI =
  encodeURIComponent(CYGWIN_MIRROR).toLowerCase();

// [HACK] https://github.com/ocaml/setup-ocaml/pull/55
export const CYGWIN_ROOT = path.join("D:", "cygwin");

export const CYGWIN_ROOT_BIN = path.join(CYGWIN_ROOT, "bin");

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

export const ALLOW_PRERELEASE_OPAM = core.getBooleanInput(
  "allow-prerelease-opam",
);

export const CACHE_PREFIX = core.getInput("cache-prefix");

export const GITHUB_TOKEN = core.getInput("github-token");

export const DUNE_CACHE = core.getBooleanInput("dune-cache");

const OCAML_COMPILER = core.getInput("ocaml-compiler", { required: true });

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

export const RESOLVED_COMPILER = (async () => {
  return await resolveCompiler(OCAML_COMPILER);
})();
