import * as core from "@actions/core";
import * as yaml from "yaml";
import { z } from "zod";

import { PLATFORM } from "./constants.js";

const OpamRepositories = z.record(z.string(), z.string());

const SANDBOXING_SUPPORTED = PLATFORM !== "windows";

export type OpamRepository = readonly [name: string, url: string];

export type WindowsEnvironment = "cygwin" | "msys2";

export type WindowsCompiler = "mingw" | "msvc";

export interface Inputs {
  readonly ocamlCompiler: string;
  readonly opamRepositoriesLowestPriorityFirst: readonly OpamRepository[];
  readonly opamPin: boolean;
  readonly opamLocalPackages: string;
  readonly opamDisableSandboxing: boolean;
  readonly cache: boolean;
  readonly duneCache: boolean;
  readonly cachePrefix: string;
  readonly windowsEnvironment: WindowsEnvironment;
  readonly windowsCompiler: WindowsCompiler;
  readonly allowPrereleaseOpam: boolean;
  readonly githubToken: string;
}

function parseOpamRepositories(input: string): OpamRepository[] {
  const parsed = OpamRepositories.safeParse(
    yaml.parse(input, { schema: "failsafe" })
  );
  if (!parsed.success) {
    throw new Error(
      "opam-repositories input must be a YAML mapping of name: URL pairs",
      {
        cause: parsed.error,
      }
    );
  }
  const entries = Object.entries(parsed.data);
  if (entries.length === 0) {
    throw new Error("opam-repositories input must not be empty");
  }
  return entries.reverse();
}

function parseWindowsEnvironment(input: string): WindowsEnvironment {
  const value = input.toLowerCase();
  if (value !== "cygwin" && value !== "msys2") {
    throw new Error(
      `Invalid windows-environment value '${value}'. Supported values: cygwin, msys2`
    );
  }
  return value;
}

function parseWindowsCompiler(input: string): WindowsCompiler {
  const value = input.toLowerCase();
  if (value !== "mingw" && value !== "msvc") {
    throw new Error(
      `Invalid windows-compiler value '${value}'. Supported values: mingw, msvc`
    );
  }
  return value;
}

export function readInputs(): Inputs {
  const ocamlCompiler = core.getInput("ocaml-compiler", { required: true });
  const opamRepositoriesLowestPriorityFirst = parseOpamRepositories(
    core.getInput("opam-repositories")
  );
  const opamPin = core.getBooleanInput("opam-pin");
  const opamLocalPackages = core.getInput("opam-local-packages");
  const opamDisableSandboxing =
    SANDBOXING_SUPPORTED && core.getBooleanInput("opam-disable-sandboxing");
  const cache = core.getBooleanInput("cache");
  const duneCache = cache && core.getBooleanInput("dune-cache");
  const cachePrefix = core.getInput("cache-prefix");
  const windowsEnvironment = parseWindowsEnvironment(
    core.getInput("windows-environment")
  );
  const windowsCompiler = parseWindowsCompiler(
    core.getInput("windows-compiler")
  );
  const allowPrereleaseOpam = core.getBooleanInput("allow-prerelease-opam");
  const githubToken = core.getInput("github-token");
  return {
    ocamlCompiler,
    opamRepositoriesLowestPriorityFirst,
    opamPin,
    opamLocalPackages,
    opamDisableSandboxing,
    cache,
    duneCache,
    cachePrefix,
    windowsEnvironment,
    windowsCompiler,
    allowPrereleaseOpam,
    githubToken,
  };
}
