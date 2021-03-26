import * as core from "@actions/core";
import { exec } from "@actions/exec";
import * as github from "@actions/github";
import { HttpClient } from "@actions/http-client";
import * as io from "@actions/io";
import * as tc from "@actions/tool-cache";
import * as cheerio from "cheerio";
import { promises as fs } from "fs";
import * as os from "os";
import * as path from "path";
import * as process from "process";
import * as semver from "semver";

import { saveCygwinCache } from "./cache";
import {
  GITHUB_TOKEN,
  OPAM_DISABLE_SANDBOXING,
  OPAM_REPOSITORY,
  Platform,
} from "./constants";
import { startProfiler, stopProfiler } from "./profiler";
import {
  getArchitecture,
  getPlatform,
  getSystemIdentificationInfo,
} from "./system";

function createHttpClient(): HttpClient {
  return new HttpClient(`avsm/setup-ocaml`, [], {
    allowRetries: true,
    maxRetries: 5,
  });
}

async function getLatestOpamRelease(): Promise<{
  version: string;
  browserDownloadUrl: string;
}> {
  const octokit = github.getOctokit(GITHUB_TOKEN);
  const {
    data: { assets, tag_name: version },
  } = await octokit.rest.repos.getLatestRelease({
    owner: "ocaml",
    repo: "opam",
  });
  const architecture = getArchitecture();
  const platform = getPlatform();
  const [{ browser_download_url: browserDownloadUrl }] = assets.filter(
    ({ browser_download_url }) =>
      browser_download_url.includes(`${architecture}-${platform}`)
  );
  return { version, browserDownloadUrl };
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

async function initializeOpamUnix() {
  const isGitHubRunner = process.env.ImageOS !== undefined;
  const platform = getPlatform();
  if (isGitHubRunner) {
    if (platform === Platform.Linux) {
      const { version: systemVersion } = await getSystemIdentificationInfo();
      if (systemVersion === "16.04" || systemVersion === "18.04") {
        // [info]: musl-tools bug in ubuntu 18.04;
        // <https://github.com/ocaml/ocaml/issues/9131#issuecomment-599765888>
        await exec("sudo", ["add-apt-repository", "ppa:avsm/musl"]);
      }
      const packages = [];
      if (systemVersion !== "16.04") {
        // [info]: <https://github.com/ocaml/opam/issues/3424>
        packages.push("bubblewrap");
      }
      await exec("sudo", [
        "apt-get",
        "install",
        "darcs",
        "g++-multilib",
        "gcc-multilib",
        "mercurial",
        "musl-tools",
        ...packages,
      ]);
    } else if (platform === Platform.MacOS) {
      await exec("brew", ["install", "darcs", "gpatch", "mercurial"]);
    }
  }
  const repository =
    OPAM_REPOSITORY || "https://github.com/ocaml/opam-repository.git";
  const disableSandboxing = [];
  if (OPAM_DISABLE_SANDBOXING) {
    disableSandboxing.push("--disable-sandboxing");
  }
  await exec("opam", [
    "init",
    "default",
    repository,
    "--auto-setup",
    "--bare",
    ...disableSandboxing,
    "--enable-shell-hook",
  ]);
}

async function setupOpamUnix() {
  const installOpam = "Install opam";
  startProfiler(installOpam);
  await acquireOpamUnix();
  stopProfiler(installOpam);
  const initialiseTheOpamState = "Initialise the opam state";
  startProfiler(initialiseTheOpamState);
  await initializeOpamUnix();
  stopProfiler(initialiseTheOpamState);
}

export async function getCygwinVersion(): Promise<string> {
  const httpClient = createHttpClient();
  const response = await httpClient.get("https://www.cygwin.com");
  const body = await response.readBody();
  const $ = cheerio.load(body);
  let version = "";
  $("a").each((_index, element) => {
    const text = $(element).text();
    if (semver.valid(text) === text) {
      version = text;
    }
  });
  return version;
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
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const CYGWIN_ROOT = process.env.CYGWIN_ROOT!;
  const site = "http://cygwin.mirror.constant.com";
  const packages = [
    "curl",
    "diff",
    "diffutils",
    "git",
    "m4",
    "make",
    "mercurial",
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
  const repository =
    OPAM_REPOSITORY ||
    "https://github.com/fdopen/opam-repository-mingw.git#opam2";
  await exec("opam", [
    "init",
    "default",
    repository,
    "--auto-setup",
    "--bare",
    "--disable-sandboxing",
    "--enable-shell-hook",
  ]);
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const CYGWIN_ROOT_WRAPPERBIN = process.env.CYGWIN_ROOT_WRAPPERBIN!;
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
  const prepareTheCygwinEnvironment = "Prepare the Cygwin environment";
  startProfiler(prepareTheCygwinEnvironment);
  const CYGWIN_ROOT = path.join("D:", "cygwin");
  const CYGWIN_ROOT_BIN = path.join(CYGWIN_ROOT, "bin");
  const CYGWIN_ROOT_WRAPPERBIN = path.join(CYGWIN_ROOT, "wrapperbin");
  core.exportVariable("CYGWIN", "winsymlinks:native");
  core.exportVariable("CYGWIN_ROOT", CYGWIN_ROOT);
  core.exportVariable("CYGWIN_ROOT_BIN", CYGWIN_ROOT_BIN);
  core.exportVariable("CYGWIN_ROOT_WRAPPERBIN", CYGWIN_ROOT_WRAPPERBIN);
  core.addPath(CYGWIN_ROOT_WRAPPERBIN);
  await setupCygwin();
  stopProfiler(prepareTheCygwinEnvironment);
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const originalPath = process.env.PATH!.split(path.delimiter);
  const patchedPath = [CYGWIN_ROOT_BIN, ...originalPath];
  process.env.PATH = patchedPath.join(path.delimiter);
  await saveCygwinCache();
  const installOpam = "Install opam";
  startProfiler(installOpam);
  await acquireOpamWindows();
  stopProfiler(installOpam);
  const initialiseTheOpamState = "Initialise the opam state";
  startProfiler(initialiseTheOpamState);
  await initializeOpamWindows();
  stopProfiler(initialiseTheOpamState);
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
  const groupName = "Install OCaml";
  startProfiler(groupName);
  const platform = getPlatform();
  if (platform === Platform.Win32) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const CYGWIN_ROOT_BIN = process.env.CYGWIN_ROOT_BIN!;
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
  stopProfiler(groupName);
}

export async function pin(fpaths: string[]): Promise<void> {
  const groupName = "Pin local packages";
  startProfiler(groupName);
  for (const fpath of fpaths) {
    const fname = path.basename(fpath, ".opam");
    const dname = path.dirname(fpath);
    await exec("opam", ["pin", "add", `${fname}.dev`, ".", "--no-action"], {
      cwd: dname,
    });
  }
  stopProfiler(groupName);
}

export async function update(): Promise<void> {
  const groupName = "Update the list of available packages";
  startProfiler(groupName);
  await exec("opam", ["update", "--all"]);
  stopProfiler(groupName);
}
