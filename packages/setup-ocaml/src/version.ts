import * as path from "node:path";

import * as github from "@actions/github";
import * as semver from "semver";

import { GITHUB_TOKEN, PLATFORM } from "./constants.js";

function isSemverValidRange(semverVersion: string) {
  const isValidSemver =
    semver.validRange(semverVersion, { loose: true }) !== null;
  // [NOTE] explicitly deny compilers like "4.14.0+mingw64c" as invalid semver
  // syntax even though it's valid...
  const plus = !semverVersion.includes("+");
  return isValidSemver && plus;
}

async function getAllCompilerVersions() {
  const octokit = github.getOctokit(GITHUB_TOKEN);

  const owner = PLATFORM === "win32" ? "ocaml-opam" : "ocaml";
  const repo =
    PLATFORM === "win32" ? "opam-repository-mingw" : "opam-repository";
  const prefix =
    PLATFORM === "win32" ? "ocaml-variants" : "ocaml-base-compiler";
  const { data: packages } = await octokit.rest.repos.getContent({
    owner,
    repo,
    path: `packages/${prefix}`,
  });
  const versions = new Set<string>();
  if (Array.isArray(packages)) {
    for (const { path: p } of packages) {
      const basename = path.basename(p);
      const version = basename.replace(`${prefix}.`, "");
      const parsed = semver.parse(version, { loose: true });
      if (parsed !== null) {
        const { major, minor: _minor, patch } = parsed;
        const minor = _minor.toString().length > 1 ? _minor : `0${_minor}`;
        const version = `${major}.${minor}.${patch}`;
        versions.add(version);
      }
    }
  }
  return [...versions];
}

async function resolveVersion(semverVersion: string) {
  const compilerVersions = await getAllCompilerVersions();
  const matchedFullCompilerVersion = semver.maxSatisfying(
    compilerVersions,
    semverVersion,
    { loose: true },
  );
  if (matchedFullCompilerVersion === null) {
    throw new Error(
      `No OCaml base compiler packages matched the version ${semverVersion} in the opam-repository.`,
    );
  } else {
    return matchedFullCompilerVersion;
  }
}

export async function resolveCompiler(compiler: string) {
  const resolvedCompiler = isSemverValidRange(compiler)
    ? PLATFORM === "win32"
      ? `ocaml-variants.${await resolveVersion(compiler)}+mingw64c`
      : `ocaml-base-compiler.${await resolveVersion(compiler)}`
    : compiler;
  return resolvedCompiler;
}
