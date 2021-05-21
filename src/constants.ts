import * as core from "@actions/core";

export enum Architecture {
  X86_64 = "x86_64",
}

export enum Platform {
  Linux = "linux",
  MacOS = "macos",
  Win32 = "win32",
}

export const CACHE_PREFIX = core.getInput("cache-prefix");

export const GITHUB_TOKEN = core.getInput("github-token");

export const DUNE_CACHE = core.getBooleanInput("dune-cache");

export const OCAML_COMPILER = core.getInput("ocaml-compiler");

export const OPAM_DEPEXT = core.getBooleanInput("opam-depext");

export const OPAM_DEPEXT_FLAGS = core
  .getInput("opam-depext-flags")
  .split(",")
  .map((f) => f.trim());

export const OPAM_DISABLE_SANDBOXING = core.getBooleanInput(
  "opam-disable-sandboxing"
);

export const OPAM_LOCAL_PACKAGES = core.getInput("opam-local-packages");

export const OPAM_PIN = core.getBooleanInput("opam-pin");

export const OPAM_REPOSITORY = core.getInput("opam-repository");
