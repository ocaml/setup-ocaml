import * as path from "node:path";

import * as semver from "semver";

import type { Octokit } from "./github-client.js";

const isSemverValidRange = (semverVersion: string) => {
  return semver.validRange(semverVersion, { loose: true }) !== null;
};

const parseCompilerVersion = (
  packagePath: string
): readonly [string, string] | undefined => {
  const opamVersion = path
    .basename(packagePath)
    .replace("ocaml-base-compiler.", "");
  const parsed = semver.parse(opamVersion.replace("~", "-"), { loose: true });
  if (parsed === null) {
    return undefined;
  }
  const minor =
    parsed.major < 5 && parsed.minor < 10
      ? // ocaml-base-compiler.4.00.0, ocaml-base-compiler.4.01.0
        `0${parsed.minor}`
      : // ocaml-base-compiler.5.5.0, ocaml-base-compiler.4.14.2
        parsed.minor;
  const prerelease =
    parsed.prerelease.length > 0 ? `-${parsed.prerelease.join(".")}` : "";
  const semverVersion = `${parsed.major}.${minor}.${parsed.patch}${prerelease}`;
  return [semverVersion, opamVersion] as const;
};

const retrieveCompilerVersions = async (octokit: Octokit, repo: string) => {
  const { data: packages } = await octokit.rest.repos.getContent({
    owner: "ocaml",
    path: "packages/ocaml-base-compiler",
    repo,
  });
  if (!Array.isArray(packages)) {
    return new Map<string, string>();
  }
  return new Map(
    packages
      .values()
      .map(({ path }) => parseCompilerVersion(path))
      .filter((entry) => entry !== undefined)
  );
};

const matchVersion = (versions: Map<string, string>, semverVersion: string) => {
  const semverVersions = versions.keys().toArray();
  const stableMatch = semver.maxSatisfying(semverVersions, semverVersion, {
    loose: true,
  });
  if (stableMatch !== null) {
    const opamVersion = versions.get(stableMatch);
    if (opamVersion !== undefined) {
      return opamVersion;
    }
  }
  const prereleaseMatch = semver.maxSatisfying(semverVersions, semverVersion, {
    includePrerelease: true,
    loose: true,
  });
  if (prereleaseMatch !== null) {
    const opamVersion = versions.get(prereleaseMatch);
    if (opamVersion !== undefined) {
      return opamVersion;
    }
  }
  return;
};

const resolveVersion = async (octokit: Octokit, semverVersion: string) => {
  const versions = await retrieveCompilerVersions(octokit, "opam-repository");
  const match = matchVersion(versions, semverVersion);
  if (match !== undefined) {
    return match;
  }
  // Old compiler releases are no longer in opam-repository itself.
  const archivedVersions = await retrieveCompilerVersions(
    octokit,
    "opam-repository-archive"
  );
  for (const [key, opamVersion] of archivedVersions) {
    if (!versions.has(key)) {
      versions.set(key, opamVersion);
    }
  }
  const archivedMatch = matchVersion(versions, semverVersion);
  if (archivedMatch !== undefined) {
    return archivedMatch;
  }
  throw new Error(
    `Could not find any OCaml compiler version matching '${semverVersion}' in the opam-repository or opam-repository-archive. Please check if you specified a valid version number or version range.`
  );
};

export const resolveCompiler = async (
  octokit: Octokit,
  ocamlCompiler: string
) => {
  const semverInput = ocamlCompiler.replace("~", "-");
  if (isSemverValidRange(semverInput)) {
    const opamVersion = await resolveVersion(octokit, semverInput);
    return `ocaml-base-compiler.${opamVersion}`;
  }
  return ocamlCompiler;
};
