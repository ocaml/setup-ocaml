import * as core from "@actions/core";
import { exec } from "@actions/exec";
import * as github from "@actions/github";
import * as tc from "@actions/tool-cache";
import { promises as fs } from "fs";
import * as path from "path";
import * as semver from "semver";

import { GITHUB_TOKEN, Platform } from "./constants";
import { getArchitecture, getPlatform } from "./system";

async function getLatestOpamRelease() {
  const semverRange = "<2.1.0";
  const octokit = github.getOctokit(GITHUB_TOKEN);
  const { data: releases } = await octokit.rest.repos.listReleases({
    owner: "ocaml",
    repo: "opam",
    per_page: 100,
  });
  const matchedReleases = releases
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

async function acquireOpamWindows(version: string, customRepository: string) {
  const cygwinRoot = "D:\\cygwin";
  const repository =
    customRepository ||
    "https://github.com/fdopen/opam-repository-mingw.git#opam2";

  let downloadPath;
  try {
    downloadPath = await tc.downloadTool("https://cygwin.com/setup-x86_64.exe");
  } catch (error) {
    core.debug(error);
    throw `Failed to download cygwin: ${error}`;
  }
  const toolPath = await tc.cacheFile(
    downloadPath,
    "setup-x86_64.exe",
    "cygwin",
    "1.0"
  );
  core.exportVariable("CYGWIN_ROOT", cygwinRoot);
  await exec(path.join(__dirname, "install-ocaml-windows.cmd"), [
    __dirname,
    toolPath,
    version,
    repository,
  ]);
  core.addPath(path.join(cygwinRoot, "wrapperbin"));
}

async function acquireOpamUnix(version: string, customRepository: string) {
  const { version: opamVersion, browserDownloadUrl } =
    await getLatestOpamRelease();
  const platform = getPlatform();
  const architecture = getArchitecture();
  const cachedPath = tc.find("opam", version, architecture);
  if (cachedPath === "") {
    const downloadedPath = await tc.downloadTool(browserDownloadUrl);
    core.info(`Acquired ${opamVersion} from ${browserDownloadUrl}`);
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
  if (platform === Platform.Linux) {
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
  const repository =
    customRepository || "https://github.com/ocaml/opam-repository.git";
  await exec("opam", ["init", "--bare", "-yav", repository]);
  await exec(path.join(__dirname, "install-ocaml-unix.sh"), [version]);
  await exec("opam", ["install", "-y", "depext"]);
}

export async function getOpam(
  version: string,
  repository: string
): Promise<void> {
  core.exportVariable("OPAMYES", "1");
  const platform = getPlatform();
  if (platform === Platform.Win32)
    return acquireOpamWindows(version, repository);
  else if (platform === Platform.MacOS || platform === Platform.Linux)
    return acquireOpamUnix(version, repository);
}
