import * as path from "node:path";
import * as semver from "semver";
import { OCAML_COMPILER } from "./constants.js";
import { octokit } from "./github-client.js";

function isSemverValidRange(semverVersion: string) {
  return semver.validRange(semverVersion, { loose: true }) !== null;
}

function parseCompilerVersion(packagePath: string): readonly [string, string] | undefined {
  const opamVersion = path.basename(packagePath).replace("ocaml-base-compiler.", "");
  const parsed = semver.parse(opamVersion.replace("~", "-"), { loose: true });
  if (parsed === null) {
    return undefined;
  }
  const minor =
    parsed.major < 5 && parsed.minor < 10
      ? // ocaml-base-compiler.4.00.0, ocaml-base-compiler.4.01.0
        `0${parsed.minor}`
      : // ocaml-base-compiler.5.4.0, ocaml-base-compiler.4.14.2
        parsed.minor;
  const prerelease = parsed.prerelease.length > 0 ? `-${parsed.prerelease.join(".")}` : "";
  const semverVersion = `${parsed.major}.${minor}.${parsed.patch}${prerelease}`;
  return [semverVersion, opamVersion] as const;
}

async function retrieveAllCompilerVersions() {
  const { data: packages } = await octokit.rest.repos.getContent({
    owner: "ocaml",
    repo: "opam-repository",
    path: "packages/ocaml-base-compiler",
  });
  if (!Array.isArray(packages)) {
    return new Map<string, string>();
  }
  return new Map(
    packages
      .values()
      .map(({ path }) => parseCompilerVersion(path))
      .filter((entry) => entry !== undefined),
  );
}

async function resolveVersion(semverVersion: string) {
  const versions = await retrieveAllCompilerVersions();
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
    loose: true,
    includePrerelease: true,
  });
  if (prereleaseMatch !== null) {
    const opamVersion = versions.get(prereleaseMatch);
    if (opamVersion !== undefined) {
      return opamVersion;
    }
  }
  throw new Error(
    `Could not find any OCaml compiler version matching '${semverVersion}' in the opam-repository. Please check if you specified a valid version number or version range.`,
  );
}

export const resolvedCompiler = (async () => {
  const semverInput = OCAML_COMPILER.replace("~", "-");
  if (isSemverValidRange(semverInput)) {
    const opamVersion = await resolveVersion(semverInput);
    return `ocaml-base-compiler.${opamVersion}`;
  }
  return OCAML_COMPILER;
})();
