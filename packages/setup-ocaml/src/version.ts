import * as path from "node:path";

import * as github from "@actions/github";
import * as semver from "semver";

import { GITHUB_TOKEN, Platform } from "./constants";
import { getPlatform } from "./system";

function isSemverValidRange(semverVersion: string) {
  const isValidSemver =
    semver.validRange(semverVersion, { loose: true }) !== null;
  // [NOTE] explicitly deny compilers like "4.14.0+mingw64c" as invalid semver
  // syntax even though it's valid...
  const plus = !semverVersion.includes("+");
  return isValidSemver && plus;
}

function unique(array: string[]) {
  return [...new Set(array)];
}

async function getAllCompilerVersions() {
  const octokit = github.getOctokit(GITHUB_TOKEN);
  const platform = getPlatform();
  const owner = platform === Platform.Win32 ? "ocaml-opam" : "ocaml";
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
    // eslint-disable-next-line unicorn/prefer-type-error
    throw new Error("Failed to get compiler list from opam-repository.");
  }
}

async function resolveVersion(semverVersion: string) {
  const compilerVersions = await getAllCompilerVersions();
  const matchedFullCompilerVersion = semver.maxSatisfying(
    compilerVersions,
    semverVersion,
    { loose: true }
  );
  if (matchedFullCompilerVersion === null) {
    throw new Error(
      `No OCaml base compiler packages matched the version ${semverVersion} in the opam-repository.`
    );
  } else {
    return matchedFullCompilerVersion;
  }
}

export async function resolveCompiler(compiler: string) {
  const platform = getPlatform();
  const resolvedCompiler = isSemverValidRange(compiler)
    ? platform === Platform.Win32
      ? `ocaml-variants.${await resolveVersion(compiler)}+mingw64c`
      : `ocaml-base-compiler.${await resolveVersion(compiler)}`
    : compiler;
  return resolvedCompiler;
}
