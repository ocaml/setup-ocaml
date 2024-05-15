import * as os from "node:os";
import * as path from "node:path";
import * as process from "node:process";
import * as core from "@actions/core";
import * as yaml from "yaml";

export const ARCHITECTURE = (() => {
  switch (process.arch) {
    case "arm": {
      return "armhf";
    }
    case "arm64": {
      return "arm64";
    }
    case "s390x": {
      return "s390x";
    }
    case "x64": {
      return "x86_64";
    }
    default: {
      throw new Error("The architecture is not supported.");
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
      throw new Error("The platform is not supported.");
    }
  }
})();

export const CYGWIN_MIRROR = "https://cygwin.mirror.constant.com/";

// [HACK] https://github.com/ocaml/setup-ocaml/pull/55
export const CYGWIN_ROOT = path.join("D:", "cygwin");

export const CYGWIN_ROOT_BIN = path.join(CYGWIN_ROOT, "bin");

export const DUNE_CACHE_ROOT = (() => {
  const homeDir = os.homedir();
  if (PLATFORM === "windows") {
    // [HACK] https://github.com/ocaml/setup-ocaml/pull/55
    const duneCacheDir = path.join("D:", "dune");
    return duneCacheDir;
  }
  const xdgCacheHome = process.env.XDG_CACHE_HOME;
  const duneCacheDir = xdgCacheHome
    ? path.join(xdgCacheHome, "dune")
    : path.join(homeDir, ".cache", "dune");
  return duneCacheDir;
})();

export const OPAM_ROOT =
  PLATFORM === "windows"
    ? // [HACK] https://github.com/ocaml/setup-ocaml/pull/55
      path.join("D:", ".opam")
    : path.join(os.homedir(), ".opam");

export const ALLOW_PRERELEASE_OPAM = core.getBooleanInput(
  "allow-prerelease-opam",
  {
    required: false,
    trimWhitespace: true,
  },
);

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

export const OPAM_DISABLE_SANDBOXING =
  // [TODO] unlock this once sandboxing is supported on Windows
  PLATFORM === "windows"
    ? true
    : core.getBooleanInput("opam-disable-sandboxing", {
        required: false,
        trimWhitespace: true,
      });

export const OPAM_LOCAL_PACKAGES = core.getInput("opam-local-packages", {
  required: false,
  trimWhitespace: true,
});

export const OPAM_PIN = core.getBooleanInput("opam-pin", {
  required: false,
  trimWhitespace: true,
});

export const OPAM_REPOSITORIES: [string, string][] = (() => {
  const repositories_yaml = yaml.parse(
    core.getInput("opam-repositories", {
      required: false,
      trimWhitespace: true,
    }),
  ) as Record<string, string> | null;

  return repositories_yaml
    ? Object.entries(repositories_yaml).reverse()
    : [["default", "https://github.com/ocaml/opam-repository.git"]];
})();
