import * as path from "node:path";
import * as github from "@actions/github";
import * as semver from "semver";
import { GITHUB_TOKEN } from "./constants.js";

function isSemverValidRange(semverVersion: string) {
  return semver.validRange(semverVersion, { loose: true }) !== null;
}

async function getAllCompilerVersions() {
  const octokit = github.getOctokit(GITHUB_TOKEN);
  const { data: packages } = await octokit.rest.repos.getContent({
    owner: "ocaml",
    repo: "opam-repository",
    path: "packages/ocaml-base-compiler",
  });
  const versions = new Set<string>();
  if (Array.isArray(packages)) {
    for (const { path: p } of packages) {
      const basename = path.basename(p);
      const version = basename.replace("ocaml-base-compiler.", "");
      const parsed = semver.parse(version, { loose: true });
      if (parsed !== null) {
        const { major, minor: _minor, patch } = parsed;
        const minor =
          major < 5 && _minor < 10
            ? // ocaml-base-compiler.4.00.0, ocaml-base-compiler.4.01.0
              `0${_minor}`
            : // ocaml-base-compiler.5.2.0, ocaml-base-compiler.4.14.0
              _minor;
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
  }
  return matchedFullCompilerVersion;
}

export async function resolveCompiler(compiler: string) {
  const resolvedCompiler = isSemverValidRange(compiler)
    ? `ocaml-base-compiler.${await resolveVersion(compiler)}`
    : compiler;
  return resolvedCompiler;
}
