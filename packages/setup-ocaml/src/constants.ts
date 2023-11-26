import * as os from "node:os";
import * as path from "node:path";

import * as core from "@actions/core";
import * as yaml from "yaml";

export const ARCHITECTURE = (() => {
  switch (os.arch()) {
    case "x64": {
      return "x86_64";
    }
    case "arm64": {
      return "arm64";
    }
    default: {
      throw new Error("The architecture is not supported.");
    }
  }
})();

export const PLATFORM = (() => {
  switch (os.platform()) {
    case "linux": {
      return "linux";
    }
    case "darwin": {
      return "macos";
    }
    case "win32": {
      return "win32";
    }
    default: {
      throw new Error("The platform is not supported.");
    }
  }
})();

export const CYGWIN_ROOT = path.join("D:", "cygwin");

export const CYGWIN_ROOT_BIN = path.join(CYGWIN_ROOT, "bin");

export const CYGWIN_ROOT_WRAPPERBIN = path.join(CYGWIN_ROOT, "wrapperbin");

// [todo] remove the branch for Windows once opam 2.2 is released as stable.
export const ALLOW_PRELEASE_OPAM =
  PLATFORM !== "win32" &&
  core.getBooleanInput("allow-prelease-opam", {
    required: false,
    trimWhitespace: true,
  });

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

// [todo] remove this once opam 2.2 is released as stable.
export const OPAM_DEPEXT =
  !ALLOW_PRELEASE_OPAM &&
  core.getBooleanInput("opam-depext", {
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
  { required: false, trimWhitespace: true },
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
  core.getInput("opam-repositories", { required: false, trimWhitespace: true }),
) as Record<string, string> | null;

const defaultRepository =
  PLATFORM === "win32"
    ? "https://github.com/ocaml-opam/opam-repository-mingw.git#sunset"
    : "https://github.com/ocaml/opam-repository.git";

export const OPAM_REPOSITORIES: [string, string][] = repositories_yaml
  ? Object.entries(repositories_yaml).reverse()
  : [["default", defaultRepository]];
