import * as os from "node:os";
import * as path from "node:path";
import * as process from "node:process";
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
