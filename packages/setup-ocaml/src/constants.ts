import * as os from "node:os";
import path from "node:path";
import * as process from "node:process";

import { z } from "zod";

// ── Platform & Architecture ──

const RunnerEnvironmentSchema = z.enum(["github-hosted", "self-hosted"]);
type RunnerEnvironment = z.infer<typeof RunnerEnvironmentSchema>;

const ARCHITECTURES = new Map<NodeJS.Architecture, string>([
  ["arm", "armhf"],
  ["arm64", "arm64"],
  ["riscv64", "riscv64"],
  ["s390x", "s390x"],
  ["x64", "x86_64"],
]);

export const ARCHITECTURE = (() => {
  const architecture = ARCHITECTURES.get(process.arch);
  if (architecture === undefined) {
    throw new Error(
      `'${process.arch}' is not supported. Supported architectures: ${[...ARCHITECTURES.keys()].join(", ")}`
    );
  }
  return architecture;
})();

const PLATFORMS = new Map<NodeJS.Platform, "linux" | "macos" | "windows">([
  ["darwin", "macos"],
  ["linux", "linux"],
  ["win32", "windows"],
]);

export const PLATFORM = (() => {
  const platform = PLATFORMS.get(process.platform);
  if (platform === undefined) {
    throw new Error(
      `'${process.platform}' is not supported. Supported platforms: ${[...PLATFORMS.keys()].join(", ")}`
    );
  }
  return platform;
})();

export const RUNNER_ENVIRONMENT = ((): RunnerEnvironment => {
  const { ImageOS } = process.env;
  const runnerEnvironment = RunnerEnvironmentSchema.optional().parse(
    process.env.RUNNER_ENVIRONMENT
  );
  if (ImageOS !== undefined && ImageOS !== "") {
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
  if (xdgCacheHome !== undefined && xdgCacheHome !== "") {
    return path.join(xdgCacheHome, "dune");
  }
  if (PLATFORM === "windows") {
    return path.join("C:", "dune");
  }
  return path.join(os.homedir(), ".cache", "dune");
})();
