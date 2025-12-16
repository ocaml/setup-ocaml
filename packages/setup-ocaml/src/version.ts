import * as path from "node:path";
import * as github from "@actions/github";
import { retry } from "@octokit/plugin-retry";
import * as semver from "semver";
import { GITHUB_TOKEN, OCAML_COMPILER } from "./constants.js";

function isSemverValidRange(semverVersion: string) {
  return semver.validRange(semverVersion, { loose: true }) !== null;
}

async function retrieveAllCompilerVersions() {
  const octokit = github.getOctokit(GITHUB_TOKEN, undefined, retry);
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
            : // ocaml-base-compiler.5.3.0, ocaml-base-compiler.4.14.2
              _minor;
        const version = `${major}.${minor}.${patch}`;
        versions.add(version);
      }
    }
  }
  return [...versions];
}

async function resolveVersion(semverVersion: string) {
  const compilerVersions = await retrieveAllCompilerVersions();
  const matchedFullCompilerVersion = semver.maxSatisfying(
    compilerVersions,
    semverVersion,
    { loose: true },
  );
  if (matchedFullCompilerVersion === null) {
    throw new Error(
      `Could not find any OCaml compiler version matching '${semverVersion}' in the opam-repository. Please check if you specified a valid version number or version range.`,
    );
  }
  return matchedFullCompilerVersion;
}

export const resolvedCompiler = (async () => {
  if (OCAML_COMPILER === "") {
    return "";
  }
  const resolvedCompiler = isSemverValidRange(OCAML_COMPILER)
    ? `ocaml-base-compiler.${await resolveVersion(OCAML_COMPILER)}`
    : OCAML_COMPILER;
  return resolvedCompiler;
})();
