import * as core from "@actions/core";
import { exec } from "@actions/exec";
import * as github from "@actions/github";
import * as io from "@actions/io";
import * as tc from "@actions/tool-cache";
import { promises as fs } from "fs";
import * as os from "os";
import * as path from "path";
import * as process from "process";
import * as semver from "semver";

import { saveCygwinCache } from "./cache";
import {
  CYGWIN_ROOT,
  CYGWIN_ROOT_BIN,
  CYGWIN_ROOT_WRAPPERBIN,
  GITHUB_TOKEN,
  OPAM_DISABLE_SANDBOXING,
  Platform,
} from "./constants";
import {
  getArchitecture,
  getPlatform,
  getSystemIdentificationInfo,
} from "./system";
import { getCygwinVersion } from "./win32";

async function getLatestOpamRelease(): Promise<{
  version: string;
  browserDownloadUrl: string;
}> {
  const semverRange = "<2.2.0";
  const octokit = github.getOctokit(GITHUB_TOKEN);
  const { data: releases } = await octokit.rest.repos.listReleases({
    owner: "ocaml",
    repo: "opam",
    per_page: 100,
  });
  const matchedReleases = releases
    .filter((release) => release.assets !== null)
    .filter((release) =>
      semver.satisfies(release.tag_name, semverRange, { loose: true })
    )
    .sort(({ tag_name: v1 }, { tag_name: v2 }) =>
      semver.rcompare(v1, v2, { loose: true })
    );
  const { assets, tag_name: version } = matchedReleases[0];
  const architecture = getArchitecture();
  const platform = getPlatform();
  const [{ browser_download_url: browserDownloadUrl }] = assets.filter(
    ({ browser_download_url }) =>
      browser_download_url.includes(`${architecture}-${platform}`)
  );
  return { version, browserDownloadUrl };
}

async function findOpam() {
  const platform = getPlatform();
  if (platform === Platform.Win32) {
    const opamPath = path.join(CYGWIN_ROOT, "bin", "opam.exe");
    return opamPath;
  } else {
    const opamPath = await io.which("opam");
    return opamPath;
  }
}

async function acquireOpamUnix() {
  const { version, browserDownloadUrl } = await getLatestOpamRelease();
  const architecture = getArchitecture();
  const cachedPath = tc.find("opam", version, architecture);
  if (cachedPath === "") {
    const downloadedPath = await tc.downloadTool(browserDownloadUrl);
    core.info(`Acquired ${version} from ${browserDownloadUrl}`);
    const cachedPath = await tc.cacheFile(
      downloadedPath,
      "opam",
      "opam",
      version,
      architecture
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
  const isGitHubRunner = process.env.ImageOS !== undefined;
  const platform = getPlatform();
  if (isGitHubRunner) {
    if (platform === Platform.Linux) {
      const { version: systemVersion } = await getSystemIdentificationInfo();
      if (systemVersion === "18.04") {
        // [info]: musl-tools bug in ubuntu 18.04;
        // <https://github.com/ocaml/ocaml/issues/9131#issuecomment-599765888>
        await exec("sudo", ["add-apt-repository", "ppa:avsm/musl"]);
      }
      await exec("sudo", [
        "apt-get",
        "install",
        "bubblewrap",
        "darcs",
        "g++-multilib",
        "gcc-multilib",
        "mercurial",
        "musl-tools",
      ]);
    } else if (platform === Platform.MacOS) {
      await exec("brew", ["install", "darcs", "gpatch", "mercurial"]);
    }
  }
}

async function updateUnixPackageIndexFiles() {
  const isGitHubRunner = process.env.ImageOS !== undefined;
  const platform = getPlatform();
  if (isGitHubRunner) {
    if (platform === Platform.Linux) {
      await exec("sudo", ["apt-get", "update"]);
    } else if (platform === Platform.MacOS) {
      await exec("brew", ["update"]);
    }
  }
}

async function initializeOpamUnix() {
  try {
    await installUnixSystemPackages();
  } catch (error) {
    if (error instanceof Error) {
      core.info(error.message);
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
  core.startGroup("Install opam");
  await acquireOpamUnix();
  core.endGroup();
  core.startGroup("Initialise the opam state");
  await initializeOpamUnix();
  core.endGroup();
}

async function setupCygwin() {
  const version = await getCygwinVersion();
  const cachedPath = tc.find("cygwin", version, "x86_64");
  if (cachedPath === "") {
    const downloadedPath = await tc.downloadTool(
      "https://cygwin.com/setup-x86_64.exe"
    );
    const cachedPath = await tc.cacheFile(
      downloadedPath,
      "setup-x86_64.exe",
      "cygwin",
      version,
      "x86_64"
    );
    core.addPath(cachedPath);
  } else {
    core.addPath(cachedPath);
  }
  const site = "http://cygwin.mirror.constant.com";
  const packages = [
    "curl",
    "diffutils",
    "git",
    "m4",
    "make",
    "mercurial",
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
  const cachedPath = tc.find("opam", opamVersion);
  if (cachedPath === "") {
    const downloadedPath = await tc.downloadTool(
      `https://github.com/fdopen/opam-repository-mingw/releases/download/${opamVersion}/opam64.tar.xz`
    );
    const extractedPath = await tc.extractTar(downloadedPath, undefined, [
      "xv",
    ]);
    const cachedPath = await tc.cacheDir(extractedPath, "opam", opamVersion);
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
  core.startGroup("Prepare the Cygwin environment");
  core.exportVariable("CYGWIN", "winsymlinks:native");
  core.exportVariable("CYGWIN_ROOT", CYGWIN_ROOT);
  core.exportVariable("CYGWIN_ROOT_BIN", CYGWIN_ROOT_BIN);
  core.exportVariable("CYGWIN_ROOT_WRAPPERBIN", CYGWIN_ROOT_WRAPPERBIN);
  core.addPath(CYGWIN_ROOT_WRAPPERBIN);
  await setupCygwin();
  core.endGroup();
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const originalPath = process.env.PATH!.split(path.delimiter);
  const patchedPath = [CYGWIN_ROOT_BIN, ...originalPath];
  process.env.PATH = patchedPath.join(path.delimiter);
  await saveCygwinCache();
  core.startGroup("Install opam");
  await acquireOpamWindows();
  core.endGroup();
  core.startGroup("Initialise the opam state");
  await initializeOpamWindows();
  core.endGroup();
  process.env.PATH = originalPath.join(path.delimiter);
}

export async function setupOpam(): Promise<void> {
  const platform = getPlatform();
  if (platform === Platform.Win32) {
    await setupOpamWindows();
  } else {
    await setupOpamUnix();
  }
}

export async function installOcaml(ocamlCompiler: string): Promise<void> {
  core.startGroup("Install OCaml");
  const platform = getPlatform();
  if (platform === Platform.Win32) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const originalPath = process.env.PATH!.split(path.delimiter);
    const patchedPath = [CYGWIN_ROOT_BIN, ...originalPath];
    process.env.PATH = patchedPath.join(path.delimiter);
    await exec("opam", [
      "switch",
      "create",
      ".",
      "--no-install",
      "--packages",
      ocamlCompiler,
    ]);
    process.env.PATH = originalPath.join(path.delimiter);
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
  core.endGroup();
}

export async function pin(fpaths: string[]): Promise<void> {
  core.startGroup("Pin local packages");
  const opam = await findOpam();
  for (const fpath of fpaths) {
    const fname = path.basename(fpath, ".opam");
    const dname = path.dirname(fpath);
    await exec(opam, ["pin", "add", `${fname}.dev`, ".", "--no-action"], {
      cwd: dname,
    });
  }
  core.endGroup();
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

export async function repositoryAddAll(
  repositories: [string, string][]
): Promise<void> {
  core.startGroup("Initialise the opam repositories");
  for (const [name, address] of repositories) {
    await repositoryAdd(name, address);
  }
  core.endGroup();
}

async function repositoryRemove(name: string): Promise<void> {
  const opam = await findOpam();
  await exec(opam, ["repository", "remove", name, "--all-switches"]);
}

async function repositoryList(): Promise<string[]> {
  let output = "";
  const opam = await findOpam();
  await exec(opam, ["repository", "list", "--all-switches", "--short"], {
    silent: true,
    listeners: { stdout: (data) => (output += data.toString()) },
  });
  const result = output
    .split("\n")
    .map((repository) => repository.trim())
    .filter((repository) => repository.length > 0);
  return result;
}

export async function repositoryRemoveAll(): Promise<void> {
  core.startGroup("Remove the opam repositories");
  const repositories = await repositoryList();
  for (const repository of repositories) {
    await repositoryRemove(repository);
  }
  core.endGroup();
}
