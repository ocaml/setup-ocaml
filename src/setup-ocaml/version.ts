import * as path from "node:path";

import * as github from "@actions/github";
import * as semver from "semver";

import { GITHUB_TOKEN, Platform } from "./constants";
import { getPlatform } from "./system";

export function isSemverStyle(semverVersion: string): boolean {
  const result = semver.validRange(semverVersion, { loose: true });
  if (
    result === null ||
    semverVersion.includes("+") ||
    semverVersion.includes("~")
  ) {
    return false;
  } else {
    return true;
  }
}

function unique(array: string[]) {
  return Array.from(new Set(array));
}

async function getAllCompilerVersions(): Promise<string[]> {
  const octokit = github.getOctokit(GITHUB_TOKEN);
  const platform = getPlatform();
  const owner = platform === Platform.Win32 ? "fdopen" : "ocaml";
  const repo =
    platform === Platform.Win32 ? "opam-repository-mingw" : "opam-repository";
  const prefix =
    platform === Platform.Win32 ? "ocaml-variants" : "ocaml-base-compiler";
  const { data: packages } = await octokit.rest.repos.getContent({
    owner,
    repo,
    path: `packages/${prefix}`,
  });
  if (Array.isArray(packages)) {
    const versions = [];
    for (const { path: p } of packages) {
      const basename = path.basename(p);
      const version = basename.replace(`${prefix}.`, "");
      const parsed = semver.parse(version, { loose: true });
      if (parsed !== null) {
        const { major, minor: _minor, patch } = parsed;
        const minor = _minor.toString().length > 1 ? _minor : `0${_minor}`;
        const version = `${major}.${minor}.${patch}`;
        versions.push(version);
      }
    }
    return unique(versions);
  } else {
    throw new Error("Failed to get compiler list from opam-repository.");
  }
}

export async function resolveVersion(semverVersion: string): Promise<string> {
  const compilerVersions = await getAllCompilerVersions();
  const matchedFullCompilerVersion = semver.maxSatisfying(
    compilerVersions,
    semverVersion,
    { loose: true }
  );
  if (matchedFullCompilerVersion !== null) {
    return matchedFullCompilerVersion;
  } else {
    throw new Error(
      `No OCaml base compiler packages matched the version ${semverVersion} in the opam-repository.`
    );
  }
}
