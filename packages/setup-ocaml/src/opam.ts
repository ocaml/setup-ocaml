import { promises as fs } from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import * as process from "node:process";

import * as core from "@actions/core";
import { exec, getExecOutput } from "@actions/exec";
import * as github from "@actions/github";
import * as io from "@actions/io";
import * as toolCache from "@actions/tool-cache";
import * as semver from "semver";

import { saveCygwinCache } from "./cache.js";
import {
  ALLOW_PRERELEASE_OPAM,
  ARCHITECTURE,
  CYGWIN_ROOT,
  CYGWIN_ROOT_BIN,
  CYGWIN_ROOT_WRAPPERBIN,
  GITHUB_TOKEN,
  OPAM_DISABLE_SANDBOXING,
  PLATFORM,
} from "./constants.js";
import {
  getSystemIdentificationInfo,
  updateUnixPackageIndexFiles,
} from "./system.js";
import { getCygwinVersion } from "./win32.js";

export async function getLatestOpamRelease() {
  const semverRange = ALLOW_PRERELEASE_OPAM ? "*" : "<2.2.0";
  const octokit = github.getOctokit(GITHUB_TOKEN);
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
      "Could not retrieve the opam release matching the version constraint",
    );
  }
  const matchedAssets = latestRelease.assets.find((asset) =>
    asset.browser_download_url.includes(`${ARCHITECTURE}-${PLATFORM}`),
  );
  if (!matchedAssets) {
    throw new Error(
      "Could not find any assets matching the current platform or architecture",
    );
  }
  return {
    version: latestRelease.tag_name,
    browserDownloadUrl: matchedAssets.browser_download_url,
  };
}

async function findOpam() {
  if (PLATFORM === "win32") {
    const opamPath = path.join(CYGWIN_ROOT, "bin", "opam.exe");
    return opamPath;
  } else {
    const opamPath = await io.which("opam");
    return opamPath;
  }
}

async function acquireOpamUnix() {
  const { version, browserDownloadUrl } = await getLatestOpamRelease();
  const cachedPath = toolCache.find("opam", version, ARCHITECTURE);
  if (cachedPath === "") {
    const downloadedPath = await toolCache.downloadTool(browserDownloadUrl);
    core.info(`Acquired ${version} from ${browserDownloadUrl}`);
    const cachedPath = await toolCache.cacheFile(
      downloadedPath,
      "opam",
      "opam",
      version,
      ARCHITECTURE,
    );
    core.info(`Successfully cached opam to ${cachedPath}`);
    await fs.chmod(`${cachedPath}/opam`, 0o755);
    core.addPath(cachedPath);
    core.info("Added opam to the path");
  } else {
    core.addPath(cachedPath);
    core.info("Added cached opam to the path");
  }
}

async function installUnixSystemPackages() {
  const isGitHubRunner = process.env["GITHUB_ACTIONS"] === "true";
  if (isGitHubRunner) {
    if (PLATFORM === "linux") {
      const { version: systemVersion } = await getSystemIdentificationInfo();
      if (systemVersion === "18.04") {
        // [info]: musl-tools bug in ubuntu 18.04;
        // <https://github.com/ocaml/ocaml/issues/9131#issuecomment-599765888>
        await exec("sudo", ["add-apt-repository", "ppa:avsm/musl"]);
      }
      await exec("sudo", [
        "apt-get",
        "--yes",
        "install",
        "bubblewrap",
        "darcs",
        "g++-multilib",
        "gcc-multilib",
        "mercurial",
        "musl-tools",
        "rsync",
      ]);
    } else if (PLATFORM === "macos") {
      await exec("brew", ["install", "darcs", "gpatch", "mercurial"]);
    }
  }
}

async function initializeOpamUnix() {
  try {
    await installUnixSystemPackages();
  } catch (error) {
    if (error instanceof Error) {
      core.notice(
        `An error has been caught in some system package index files, so the system package index files have been re-synchronised, and the system package installation has been retried: ${error.message.toLocaleLowerCase()}`,
      );
    }
    await updateUnixPackageIndexFiles();
    await installUnixSystemPackages();
  }
  const disableSandboxing = [];
  if (OPAM_DISABLE_SANDBOXING) {
    disableSandboxing.push("--disable-sandboxing");
  }
  await exec("opam", [
    "init",
    "--auto-setup",
    "--bare",
    ...disableSandboxing,
    "--enable-shell-hook",
  ]);
}

async function setupOpamUnix() {
  await core.group("Install opam", async () => {
    await acquireOpamUnix();
  });
  await core.group("Initialise the opam state", async () => {
    await initializeOpamUnix();
  });
}

async function setupCygwin() {
  const version = await getCygwinVersion();
  const cachedPath = toolCache.find("cygwin", version, "x86_64");
  if (cachedPath === "") {
    const downloadedPath = await toolCache.downloadTool(
      "https://cygwin.com/setup-x86_64.exe",
    );
    const cachedPath = await toolCache.cacheFile(
      downloadedPath,
      "setup-x86_64.exe",
      "cygwin",
      version,
      "x86_64",
    );
    core.addPath(cachedPath);
  } else {
    core.addPath(cachedPath);
  }
  const site = "https://mirrors.kernel.org/sourceware/cygwin";
  const packages = [
    "curl",
    "libgpg-error0=1.37-1",
    "diffutils",
    "m4",
    "make",
    "mingw64-i686-gcc-core",
    "mingw64-i686-gcc-g++",
    "mingw64-x86_64-gcc-core",
    "mingw64-x86_64-gcc-g++",
    "patch",
    "perl",
    "rsync",
    "unzip",
  ].join(",");
  await exec("setup-x86_64.exe", [
    "--quiet-mode",
    "--root",
    CYGWIN_ROOT,
    "--site",
    site,
    "--packages",
    packages,
    "--symlink-type=sys",
  ]);
  const setupExePath = await io.which("setup-x86_64.exe");
  await io.cp(setupExePath, CYGWIN_ROOT);
}

async function acquireOpamWindows() {
  const opamVersion = "0.0.0.2";
  const cachedPath = toolCache.find("opam", opamVersion);
  if (cachedPath === "") {
    const downloadedPath = await toolCache.downloadTool(
      `https://github.com/fdopen/opam-repository-mingw/releases/download/${opamVersion}/opam64.zip`,
    );
    const extractedPath = await toolCache.extractZip(downloadedPath);
    const cachedPath = await toolCache.cacheDir(
      extractedPath,
      "opam",
      opamVersion,
    );
    const installSh = path.join(cachedPath, "opam64", "install.sh");
    await fs.chmod(installSh, 0o755);
    await exec("bash", [installSh, "--prefix", "/usr"]);
  } else {
    const installSh = path.join(cachedPath, "opam64", "install.sh");
    await fs.chmod(installSh, 0o755);
    await exec("bash", [installSh, "--prefix", "/usr"]);
  }
}

async function initializeOpamWindows() {
  await exec("git", ["config", "--global", "--add", "safe.directory", "'*'"]);
  await exec("opam", [
    "init",
    "--auto-setup",
    "--bare",
    "--disable-sandboxing",
    "--enable-shell-hook",
  ]);
  await io.mkdirP(CYGWIN_ROOT_WRAPPERBIN);
  const opamCmd = path.join(CYGWIN_ROOT_WRAPPERBIN, "opam.cmd");
  const data = [
    "@setlocal",
    "@echo off",
    "set PATH=%CYGWIN_ROOT_BIN%;%PATH%",
    "ocaml-env exec -- opam.exe %*",
  ].join(os.EOL);
  await fs.writeFile(opamCmd, data, { mode: 0o755 });
}

async function setupOpamWindows() {
  await core.group("Prepare the Cygwin environment", async () => {
    core.exportVariable("CYGWIN", "winsymlinks:native");
    core.exportVariable("CYGWIN_ROOT", CYGWIN_ROOT);
    core.exportVariable("CYGWIN_ROOT_BIN", CYGWIN_ROOT_BIN);
    core.exportVariable("CYGWIN_ROOT_WRAPPERBIN", CYGWIN_ROOT_WRAPPERBIN);
    core.addPath(CYGWIN_ROOT_WRAPPERBIN);
    await setupCygwin();
  });
  await saveCygwinCache();
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const originalPath = process.env["PATH"]!.split(path.delimiter);
  const patchedPath = [CYGWIN_ROOT_BIN, ...originalPath];
  process.env["PATH"] = patchedPath.join(path.delimiter);
  await core.group("Install opam", async () => {
    await acquireOpamWindows();
  });
  await core.group("Initialise the opam state", async () => {
    await initializeOpamWindows();
  });
  process.env["PATH"] = originalPath.join(path.delimiter);
}

export async function setupOpam() {
  if (PLATFORM === "win32") {
    await setupOpamWindows();
  } else {
    await setupOpamUnix();
  }
}

export async function installOcaml(ocamlCompiler: string) {
  await core.group("Install OCaml", async () => {
    if (PLATFORM === "win32") {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const originalPath = process.env["PATH"]!.split(path.delimiter);
      const patchedPath = [CYGWIN_ROOT_BIN, ...originalPath];
      process.env["PATH"] = patchedPath.join(path.delimiter);
      await exec("opam", [
        "switch",
        "create",
        ".",
        "--no-install",
        "--packages",
        ocamlCompiler,
      ]);
      process.env["PATH"] = originalPath.join(path.delimiter);
    } else {
      await exec("opam", [
        "switch",
        "create",
        ".",
        "--no-install",
        "--packages",
        ocamlCompiler,
      ]);
    }
  });
}

export async function pin(fpaths: string[]) {
  await core.group("Pin local packages", async () => {
    const opam = await findOpam();
    for (const fpath of fpaths) {
      const fname = path.basename(fpath, ".opam");
      const dname = path.dirname(fpath);
      await exec(opam, ["pin", "add", `${fname}.dev`, ".", "--no-action"], {
        cwd: dname,
      });
    }
  });
}

async function repositoryAdd(name: string, address: string) {
  const opam = await findOpam();
  await exec(opam, [
    "repository",
    "add",
    name,
    address,
    "--all-switches",
    "--set-default",
  ]);
}

export async function repositoryAddAll(repositories: [string, string][]) {
  await core.group("Initialise the opam repositories", async () => {
    let restore_autocrlf;
    // Works around the lack of https://github.com/ocaml/opam/pull/3882 when
    // adding ocaml/opam-repository on Windows. Can be removed when the action
    // switches to opam 2.2
    if (PLATFORM === "win32") {
      const autocrlf = await getExecOutput(
        "git",
        ["config", "--global", "core.autocrlf"],
        { ignoreReturnCode: true },
      );
      if (autocrlf.stdout.trim() !== "input") {
        if (autocrlf.exitCode === 0) {
          restore_autocrlf = autocrlf.stdout.trim();
        } else {
          // eslint-disable-next-line unicorn/no-null
          restore_autocrlf = null; // Unset the value at the end
        }
      }
      await exec("git", ["config", "--global", "core.autocrlf", "input"]);
    }
    for (const [name, address] of repositories) {
      await repositoryAdd(name, address);
    }
    if (restore_autocrlf === null) {
      await exec("git", ["config", "--global", "--unset", "core.autocrlf"]);
    } else if (restore_autocrlf !== undefined) {
      await exec("git", [
        "config",
        "--global",
        "core.autocrlf",
        restore_autocrlf,
      ]);
    }
  });
}

async function repositoryRemove(name: string) {
  const opam = await findOpam();
  await exec(opam, ["repository", "remove", name, "--all-switches"]);
}

async function repositoryList() {
  const opam = await findOpam();
  const repositoryList = await getExecOutput(
    opam,
    ["repository", "list", "--all-switches", "--short"],
    { ignoreReturnCode: true },
  );
  if (repositoryList.exitCode === 0) {
    return repositoryList.stdout
      .split("\n")
      .map((repository) => repository.trim())
      .filter((repository) => repository.length > 0);
  } else {
    return [];
  }
}

export async function repositoryRemoveAll() {
  await core.group("Remove the opam repositories", async () => {
    const repositories = await repositoryList();
    for (const repository of repositories) {
      await repositoryRemove(repository);
    }
  });
}
