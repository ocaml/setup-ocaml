import * as core from "@actions/core";

export enum Architecture {
  X86_64 = "x86_64",
}

export enum Platform {
  Linux = "linux",
  MacOS = "macos",
  Win32 = "win32",
}

export const OCAML_VERSION = core.getInput("ocaml-version");

export const OPAM_REPOSITORY = core.getInput("opam-repository");

export const GITHUB_TOKEN = core.getInput("github-token");
