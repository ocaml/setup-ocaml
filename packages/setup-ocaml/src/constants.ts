import * as os from "node:os";
import * as path from "node:path";
import * as process from "node:process";
import * as core from "@actions/core";
import * as yaml from "yaml";
import { z } from "zod";

// ── Platform & Architecture ──

const RunnerEnvironment = z.enum(["github-hosted", "self-hosted"]);
type RunnerEnvironment = z.infer<typeof RunnerEnvironment>;

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
    case "linux": {
      return "linux";
    }
    case "win32": {
      return "windows";
    }
    default: {
      throw new Error(
        `'${process.platform}' is not supported. Supported platforms: darwin, linux, win32`,
      );
    }
  }
})();

export const RUNNER_ENVIRONMENT = ((): RunnerEnvironment => {
  const ImageOS = process.env.ImageOS;
  const runnerEnvironment = RunnerEnvironment.optional().parse(process.env.RUNNER_ENVIRONMENT);
  if (ImageOS) {
    return "github-hosted";
  }
  if (!runnerEnvironment) {
    return "self-hosted";
  }
  return runnerEnvironment;
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

const CYGWIN_ROOT = path.join(OPAM_ROOT, ".cygwin", "root");

export const CYGWIN_ROOT_BIN = path.join(CYGWIN_ROOT, "bin");

export const CYGWIN_BASH_ENV = path.join(CYGWIN_ROOT, "bash_env");

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

const OpamRepositories = z.record(z.string(), z.string());
type OpamRepositories = z.infer<typeof OpamRepositories>;

function parseOpamRepositories(input: string): OpamRepositories {
  const parsed = OpamRepositories.safeParse(yaml.parse(input, { schema: "failsafe" }));
  if (!parsed.success) {
    throw new Error("opam-repositories input must be a YAML mapping of name: URL pairs", {
      cause: parsed.error,
    });
  }
  return parsed.data;
}

export const OCAML_COMPILER = core.getInput("ocaml-compiler", {
  required: true,
});

export const OPAM_REPOSITORIES = (() => {
  const entries = Object.entries(parseOpamRepositories(core.getInput("opam-repositories")));
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

export const OPAM_CACHE = core.getBooleanInput("cache");

export const DUNE_CACHE = OPAM_CACHE && core.getBooleanInput("dune-cache");

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
