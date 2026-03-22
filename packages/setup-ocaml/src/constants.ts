import * as os from "node:os";
import * as path from "node:path";
import * as process from "node:process";
import * as core from "@actions/core";
import * as yaml from "yaml";

// ── Platform & Architecture ──

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

export const RUNNER_ENVIRONMENT = ((): "github-hosted" | "self-hosted" => {
  const ImageOS = process.env.ImageOS;
  const RUNNER_ENVIRONMENT = process.env.RUNNER_ENVIRONMENT as
    | "github-hosted"
    | "self-hosted"
    | undefined;
  if (ImageOS) {
    return "github-hosted";
  }
  if (!RUNNER_ENVIRONMENT) {
    return "self-hosted";
  }
  return RUNNER_ENVIRONMENT;
})();

// ── Paths ──

export const GITHUB_WORKSPACE = process.env.GITHUB_WORKSPACE ?? process.cwd();

export const MSYS2_ROOT = path.join("C:", "msys64");

export const OPAM_ROOT = (() => {
  if (PLATFORM === "windows") {
    return path.join("C:", ".opam");
  }
  return path.join(os.homedir(), ".opam");
})();

export const DUNE_CACHE_ROOT = (() => {
  const xdgCacheHome = process.env.XDG_CACHE_HOME;
  if (xdgCacheHome) {
    return path.join(xdgCacheHome, "dune");
  }
  if (PLATFORM === "windows") {
    return path.join("C:", "dune");
  }
  return path.join(os.homedir(), ".cache", "dune");
})();

// ── Action Inputs ──

export const OCAML_COMPILER = core.getInput("ocaml-compiler", {
  required: true,
});

export const OPAM_REPOSITORIES: [string, string][] = (() => {
  // The failsafe schema treats every scalar as a string, preventing
  // implicit type coercion (e.g. `true` → boolean, `1.0` → number).
  const parsed: unknown = yaml.parse(core.getInput("opam-repositories"), {
    schema: "failsafe",
  });
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error("opam-repositories input must be a YAML mapping of name: URL pairs");
  }
  const entries = Object.entries(parsed as Record<string, string>);
  if (entries.length === 0) {
    throw new Error("opam-repositories input must not be empty");
  }
  return entries.reverse();
})();

export const OPAM_PIN = core.getBooleanInput("opam-pin");

export const OPAM_LOCAL_PACKAGES = core.getInput("opam-local-packages");

export const OPAM_DISABLE_SANDBOXING =
  // [TODO] unlock this once sandboxing is supported on Windows
  PLATFORM !== "windows" && core.getBooleanInput("opam-disable-sandboxing");

export const DUNE_CACHE = core.getBooleanInput("dune-cache");

export const CACHE_PREFIX = core.getInput("cache-prefix");

type WindowsEnvironment = "cygwin" | "msys2";

export const WINDOWS_ENVIRONMENT: WindowsEnvironment = (() => {
  const value = core.getInput("windows-environment").toLowerCase();
  if (value !== "cygwin" && value !== "msys2") {
    throw new Error(
      `Invalid windows-environment value '${value}'. Supported values: cygwin, msys2`,
    );
  }
  return value;
})();

type WindowsCompiler = "mingw" | "msvc";

export const WINDOWS_COMPILER: WindowsCompiler = (() => {
  const value = core.getInput("windows-compiler").toLowerCase();
  if (value !== "mingw" && value !== "msvc") {
    throw new Error(`Invalid windows-compiler value '${value}'. Supported values: mingw, msvc`);
  }
  return value;
})();

export const ALLOW_PRERELEASE_OPAM = core.getBooleanInput("allow-prerelease-opam");

export const GITHUB_TOKEN = core.getInput("github-token");
