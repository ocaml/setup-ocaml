import { promises as fs } from "node:fs";
import * as path from "node:path";
import * as core from "@actions/core";
import { exec, getExecOutput } from "@actions/exec";
import * as github from "@actions/github";
import * as toolCache from "@actions/tool-cache";
import { retry } from "@octokit/plugin-retry";
import * as semver from "semver";
import {
  ALLOW_PRERELEASE_OPAM,
  ARCHITECTURE,
  CYGWIN_ROOT,
  GITHUB_TOKEN,
  OPAM_DISABLE_SANDBOXING,
  PLATFORM,
} from "./constants.js";
import {
  installUnixSystemPackages,
  updateUnixPackageIndexFiles,
} from "./unix.js";

export async function retrieveLatestOpamRelease() {
  const semverRange = ALLOW_PRERELEASE_OPAM ? "*" : "<2.4.0";
  const octokit = github.getOctokit(GITHUB_TOKEN, undefined, retry);
  const { data: releases } = await octokit.rest.repos.listReleases({
    owner: "ocaml",
    repo: "opam",
  });
  const matchedReleases = releases
    .filter((release) =>
      semver.satisfies(release.tag_name, semverRange, {
        includePrerelease: ALLOW_PRERELEASE_OPAM,
        loose: true,
      }),
    )
    .sort(({ tag_name: v1 }, { tag_name: v2 }) =>
      semver.rcompare(v1, v2, { loose: true }),
    );
  const latestRelease = matchedReleases.at(0);
  if (!latestRelease) {
    throw new Error(
      "Failed to find any opam release that matches the specified version constraint. Please check your version requirements or consider allowing pre-releases.",
    );
  }
  const matchedAssets = latestRelease.assets.find((asset) => {
    if (PLATFORM === "windows") {
      return asset.browser_download_url.endsWith(
        `${ARCHITECTURE}-${PLATFORM}.exe`,
      );
    }
    return asset.browser_download_url.endsWith(`${ARCHITECTURE}-${PLATFORM}`);
  });
  if (!matchedAssets) {
    throw new Error(
      `Failed to find opam binary for '${PLATFORM}' and '${ARCHITECTURE}'. Please check if this combination is supported by opam.`,
    );
  }
  return {
    version: latestRelease.tag_name,
    browserDownloadUrl: matchedAssets.browser_download_url,
  };
}

async function acquireOpam() {
  await core.group("Installing opam", async () => {
    const { version, browserDownloadUrl } = await retrieveLatestOpamRelease();
    const cachedPath = toolCache.find("opam", version, ARCHITECTURE);
    const opam = PLATFORM !== "windows" ? "opam" : "opam.exe";
    if (cachedPath === "") {
      const downloadedPath = await toolCache.downloadTool(browserDownloadUrl);
      core.info(`Downloaded opam ${version} from ${browserDownloadUrl}`);
      const cachedPath = await toolCache.cacheFile(
        downloadedPath,
        opam,
        "opam",
        version,
        ARCHITECTURE,
      );
      core.info(`Successfully cached opam to ${cachedPath}`);
      await fs.chmod(path.join(cachedPath, opam), 0o755);
      core.addPath(cachedPath);
      core.info("Added opam to the path");
    } else {
      core.addPath(cachedPath);
      core.info("Added cached opam to the path");
    }
  });
}

async function initializeOpam() {
  await core.group("Initialising opam state", async () => {
    if (PLATFORM !== "windows") {
      try {
        await installUnixSystemPackages();
      } catch (error) {
        if (error instanceof Error) {
          core.notice(
            `System package installation failed. Re-synchronizing package index files and retrying installation. Error details: ${error.message.toLocaleLowerCase()}`,
          );
        }
        await updateUnixPackageIndexFiles();
        await installUnixSystemPackages();
      }
    }
    const extraOptions = [];
    if (PLATFORM === "windows") {
      extraOptions.push("--cygwin-local-install");
      extraOptions.push(`--cygwin-location=${CYGWIN_ROOT}`);
    }
    if (OPAM_DISABLE_SANDBOXING) {
      extraOptions.push("--disable-sandboxing");
    }
    await exec("opam", [
      "init",
      "--auto-setup",
      "--bare",
      ...extraOptions,
      "--enable-shell-hook",
    ]);
  });
}

export async function setupOpam() {
  await acquireOpam();
  await initializeOpam();
}

export async function installOcaml(ocamlCompiler: string) {
  await core.group("Installing OCaml compiler", async () => {
    await exec("opam", [
      "switch",
      "--no-install",
      `--packages=${ocamlCompiler}`,
      "create",
      ".",
    ]);
  });
}

export async function pin(fpaths: string[]) {
  if (fpaths.length === 0) {
    return;
  }
  await core.group("Pinning local packages", async () => {
    for (const fpath of fpaths) {
      const fname = path.basename(fpath, ".opam");
      const dname = path.dirname(fpath);
      await exec("opam", ["pin", "--no-action", "add", `${fname}.dev`, "."], {
        cwd: dname,
      });
    }
  });
}

async function repositoryAdd(name: string, address: string) {
  await exec("opam", [
    "repository",
    "--all-switches",
    "--set-default",
    "add",
    name,
    address,
  ]);
}

export async function repositoryAddAll(repositories: [string, string][]) {
  await core.group("Initialising opam repositories", async () => {
    for (const [name, address] of repositories) {
      await repositoryAdd(name, address);
    }
  });
}

async function repositoryRemove(name: string) {
  await exec("opam", ["repository", "--all-switches", "remove", name]);
}

async function repositoryList() {
  const repositoryList = await getExecOutput(
    "opam",
    ["repository", "--all-switches", "--short", "list"],
    { ignoreReturnCode: true, silent: true },
  );
  if (repositoryList.exitCode === 0) {
    return repositoryList.stdout
      .split("\n")
      .map((repository) => repository.trim())
      .filter((repository) => repository.length > 0);
  }
  return [];
}

export async function repositoryRemoveAll() {
  await core.group("Removing opam repositories", async () => {
    const repositories = await repositoryList();
    for (const repository of repositories) {
      await repositoryRemove(repository);
    }
  });
}

export async function update() {
  await core.group("Updating opam repositories", async () => {
    await exec("opam", ["update"]);
  });
}
