import * as path from "node:path";

import * as core from "@actions/core";
import * as yaml from "yaml";

import { getPlatform } from "./system";

export const enum Architecture {
  X86_64 = "x86_64",
  ARM = "arm64",
}

export const enum Platform {
  Linux = "linux",
  MacOS = "macos",
  Win32 = "win32",
}

export const CYGWIN_ROOT = path.join("D:", "cygwin");

export const CYGWIN_ROOT_BIN = path.join(CYGWIN_ROOT, "bin");

export const CYGWIN_ROOT_WRAPPERBIN = path.join(CYGWIN_ROOT, "wrapperbin");

export const CACHE_PREFIX = core.getInput("cache-prefix", {
  required: false,
  trimWhitespace: true,
});

export const GITHUB_TOKEN = core.getInput("github-token", {
  required: false,
  trimWhitespace: true,
});

export const DUNE_CACHE = core.getBooleanInput("dune-cache", {
  required: false,
  trimWhitespace: true,
});

export const OCAML_COMPILER = core.getInput("ocaml-compiler", {
  required: true,
  trimWhitespace: true,
});

export const OPAM_DEPEXT = core.getBooleanInput("opam-depext", {
  required: false,
  trimWhitespace: true,
});

export const OPAM_DEPEXT_FLAGS = core
  .getInput("opam-depext-flags", { required: false, trimWhitespace: true })
  .split(",")
  .map((f) => f.trim())
  .filter((f) => f.length > 0);

export const OPAM_DISABLE_SANDBOXING = core.getBooleanInput(
  "opam-disable-sandboxing",
  { required: false, trimWhitespace: true }
);

export const OPAM_LOCAL_PACKAGES = core.getInput("opam-local-packages", {
  required: false,
  trimWhitespace: true,
});

export const OPAM_PIN = core.getBooleanInput("opam-pin", {
  required: false,
  trimWhitespace: true,
});

const repositories_yaml = yaml.parse(
  core.getInput("opam-repositories", { required: false, trimWhitespace: true })
) as Record<string, string> | null;

const platform = getPlatform();

const defaultRepository =
  platform === Platform.Win32
    ? "https://github.com/ocaml-opam/opam-repository-mingw.git#sunset"
    : "https://github.com/ocaml/opam-repository.git";

export const OPAM_REPOSITORIES: [string, string][] = repositories_yaml
  ? Object.entries(repositories_yaml).reverse()
  : [["default", defaultRepository]];
