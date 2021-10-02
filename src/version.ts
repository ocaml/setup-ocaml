import * as core from "@actions/core";
import * as github from "@actions/github";
import * as semver from "semver";

import { GITHUB_TOKEN } from "./constants";

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

// Get all the OCaml releases on GitHub
async function getAllCompilerVersions(): Promise<string[]> {
  const octokit = github.getOctokit(GITHUB_TOKEN);
  const releases = [];
  const state = { continue: true, count: 0 };
  while (state.continue) {
    const response = await octokit.rest.repos.listReleases({
      owner: "ocaml",
      repo: "ocaml",
      per_page: 100,
      page: state.count,
    });
    if (response.data.length > 0) {
      releases.push(...response.data);
      state.count++;
    } else {
      state.continue = false;
    }
  }
  const versions = unique(releases.map(({ tag_name }) => tag_name));
  return versions;
}

export async function resolveVersion(
  semverVersionRange: string
): Promise<string> {
  const compilerVersions = await getAllCompilerVersions();
  const latestFullCompilerVersion = semver.maxSatisfying(
    compilerVersions,
    semverVersionRange,
    { loose: true }
  );
  if (latestFullCompilerVersion !== null) {
    return latestFullCompilerVersion;
  } else {
    core.warning(
      `Could not find an OCaml release on GitHub that matches the range ${semverVersionRange}.`
    );
    const cleanedFullCompilerVersion = semver.clean(semverVersionRange, {
      loose: true,
    });
    if (cleanedFullCompilerVersion === null) {
      throw new Error(`Failed to resolve version range ${semverVersionRange}.`);
    } else {
      core.warning(
        `Proceed with the OCaml version ${cleanedFullCompilerVersion}.`
      );
      return cleanedFullCompilerVersion;
    }
  }
}
