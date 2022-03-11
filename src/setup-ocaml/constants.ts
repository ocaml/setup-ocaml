import * as core from "@actions/core";
import * as path from "path";
import * as yaml from "yaml";

import { getPlatform } from "./system";

export enum Architecture {
  X86_64 = "x86_64",
}

export enum Platform {
  Linux = "linux",
  MacOS = "macos",
  Win32 = "win32",
}

export const CYGWIN_ROOT = path.join("D:", "cygwin");

export const CYGWIN_ROOT_BIN = path.join(CYGWIN_ROOT, "bin");

export const CYGWIN_ROOT_WRAPPERBIN = path.join(CYGWIN_ROOT, "wrapperbin");

export const CACHE_PREFIX = core.getInput("cache-prefix");

export const GITHUB_TOKEN = core.getInput("github-token");

export const DUNE_CACHE = core.getBooleanInput("dune-cache");

export const OCAML_COMPILER = core.getInput("ocaml-compiler");

export const OPAM_DEPEXT = core.getBooleanInput("opam-depext");

export const OPAM_DEPEXT_FLAGS = core
  .getInput("opam-depext-flags")
  .split(",")
  .map((f) => f.trim())
  .filter((f) => f.length > 0);

export const OPAM_DISABLE_SANDBOXING = core.getBooleanInput(
  "opam-disable-sandboxing"
);

export const OPAM_LOCAL_PACKAGES = core.getInput("opam-local-packages");

export const OPAM_PIN = core.getBooleanInput("opam-pin");

const repositories_yaml: { [key: string]: string } = yaml.parse(
  core.getInput("opam-repositories")
);

const platform = getPlatform();

const defaultRepository =
  platform !== Platform.Win32
    ? "https://github.com/ocaml/opam-repository.git"
    : "https://github.com/fdopen/opam-repository-mingw.git#opam2";

export const OPAM_REPOSITORIES: [string, string][] = repositories_yaml
  ? Object.entries(repositories_yaml).reverse()
  : [["default", defaultRepository]];
