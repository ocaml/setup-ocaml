import * as cache from "@actions/cache";
import * as core from "@actions/core";
import { exec } from "@actions/exec";
import * as github from "@actions/github";
import * as os from "os";
import * as path from "path";
import * as process from "process";

import {
  CACHE_PREFIX,
  GITHUB_TOKEN,
  OCAML_COMPILER,
  OPAM_REPOSITORY,
  Platform,
} from "./constants";
import { getCygwinVersion } from "./opam";
import { startProfiler, stopProfiler } from "./profiler";
import { getArchitecture, getPlatform } from "./system";
import { isSemverStyle, resolveVersion } from "./version";

function composeDate() {
  const _date = new Date();
  const year = _date.getFullYear();
  const month = _date.getMonth();
  const date = _date.getDate();
  return { year, month, date };
}

async function composeCygwinCacheKeys() {
  const cygwinVersion = await getCygwinVersion();
  const { year, month, date } = composeDate();
  const key = `${CACHE_PREFIX}-setup-ocaml-cygwin-${cygwinVersion}-${year}-${month}-${date}`;
  const restoreKeys = [
    `${CACHE_PREFIX}-setup-ocaml-cygwin-${cygwinVersion}-${year}-${month}-${date}`,
    `${CACHE_PREFIX}-setup-ocaml-cygwin-${cygwinVersion}-${year}-${month}-`,
    `${CACHE_PREFIX}-setup-ocaml-cygwin-${cygwinVersion}-${year}-`,
  ];
  return { key, restoreKeys };
}

function composeDuneCacheKeys() {
  const platform = getPlatform();
  const architecture = getArchitecture();
  const { workflow: _workflow, job, runId, runNumber } = github.context;
  const workflow = _workflow.toLowerCase().replace(/\W/g, "_");
  const ocamlVersion = OCAML_COMPILER.toLowerCase().replace(/,/g, "_");
  const key = `${CACHE_PREFIX}-setup-ocaml-dune-${platform}-${architecture}-${ocamlVersion}-${workflow}-${job}-${runId}-${runNumber}`;
  const restoreKeys = [
    `${CACHE_PREFIX}-setup-ocaml-dune-${platform}-${architecture}-${ocamlVersion}-${workflow}-${job}-${runId}-${runNumber}`,
    `${CACHE_PREFIX}-setup-ocaml-dune-${platform}-${architecture}-${ocamlVersion}-${workflow}-${job}-${runId}-`,
    `${CACHE_PREFIX}-setup-ocaml-dune-${platform}-${architecture}-${ocamlVersion}-${workflow}-${job}-`,
  ];
  return { key, restoreKeys };
}

async function composeOpamCacheKeys() {
  const platform = getPlatform();
  const architecture = getArchitecture();
  const octokit = github.getOctokit(GITHUB_TOKEN);
  const {
    data: { tag_name: opamVersion },
  } = await octokit.rest.repos.getLatestRelease({
    owner: "ocaml",
    repo: "opam",
  });
  const ocamlCompiler = isSemverStyle(OCAML_COMPILER)
    ? platform === Platform.Win32
      ? `ocaml-variants.${await resolveVersion(OCAML_COMPILER)}+mingw64c`
      : `ocaml-base-compiler.${await resolveVersion(OCAML_COMPILER)}`
    : OCAML_COMPILER;
  const ocamlVersion = ocamlCompiler.toLowerCase().replace(/,/g, "_");
  const { year, month, date } = composeDate();
  const key = `${CACHE_PREFIX}-setup-ocaml-opam-${opamVersion}-${platform}-${architecture}-${ocamlVersion}-${year}-${month}-${date}`;
  const restoreKeys = [
    `${CACHE_PREFIX}-setup-ocaml-opam-${opamVersion}-${platform}-${architecture}-${ocamlVersion}-${year}-${month}-${date}`,
    `${CACHE_PREFIX}-setup-ocaml-opam-${opamVersion}-${platform}-${architecture}-${ocamlVersion}-${year}-${month}-`,
  ];
  return { key, restoreKeys };
}

function composeOpamDownloadCacheKeys() {
  const platform = getPlatform();
  const repository_windows =
    OPAM_REPOSITORY ||
    "https://github.com/fdopen/opam-repository-mingw.git#opam2";
  const repository_unix =
    OPAM_REPOSITORY || "https://github.com/ocaml/opam-repository.git";
  const _repository =
    platform === Platform.Win32 ? repository_windows : repository_unix;
  const uri = new URL(_repository);
  const basename = path.basename(uri.pathname);
  const repository = basename.replace(/\W/g, "_");
  const ocamlVersion = OCAML_COMPILER.toLowerCase().replace(/,/g, "_");
  const { year, month, date } = composeDate();
  const { runId, runNumber } = github.context;
  const key = `${CACHE_PREFIX}-setup-ocaml-opam-download-${repository}-${ocamlVersion}-${year}-${month}-${date}-${runId}-${runNumber}`;
  const restoreKeys = [
    `${CACHE_PREFIX}-setup-ocaml-opam-download-${repository}-${ocamlVersion}-${year}-${month}-${date}-${runId}-${runNumber}`,
    `${CACHE_PREFIX}-setup-ocaml-opam-download-${repository}-${ocamlVersion}-${year}-${month}-${date}-${runId}-`,
    `${CACHE_PREFIX}-setup-ocaml-opam-download-${repository}-${ocamlVersion}-${year}-${month}-${date}-`,
    `${CACHE_PREFIX}-setup-ocaml-opam-download-${repository}-${ocamlVersion}-${year}-${month}-`,
  ];
  return { key, restoreKeys };
}

function composeCygwinCachePaths() {
  const paths = [];
  const cwd = process.cwd();
  const cygwinRoot = path.join("D:", "cygwin");
  paths.push(cygwinRoot);
  const cygwinRootSymlinkPath = path.posix.join("/cygdrive", "d", "cygwin");
  paths.push(cygwinRootSymlinkPath);
  const cygwinEncodedUri = encodeURIComponent(
    "http://cygwin.mirror.constant.com/"
  ).toLowerCase();
  const cygwinPackageRoot = path.join(cwd, cygwinEncodedUri);
  paths.push(cygwinPackageRoot);
  return paths;
}

function composeDuneCachePaths() {
  const paths = [];
  const homeDir = os.homedir();
  const platform = getPlatform();
  if (platform === Platform.Win32) {
    const duneCacheDir = path.join(homeDir, "Local Settings", "Cache", "dune");
    paths.push(duneCacheDir);
  } else {
    const xdgCacheHome = process.env.XDG_CACHE_HOME;
    const duneCacheDir = xdgCacheHome
      ? path.join(xdgCacheHome, "dune")
      : path.join(homeDir, ".cache", "dune");
    paths.push(duneCacheDir);
  }
  return paths;
}

function composeOpamCachePaths() {
  const paths = [];
  const platform = getPlatform();
  if (platform === Platform.Win32) {
    const opamRootCachePath = path.join("D:", ".opam");
    paths.push(opamRootCachePath);
    const {
      repo: { repo },
    } = github.context;
    const opamCygwinLocalCachePath = path.posix.join(
      "/cygdrive",
      "d",
      "a",
      repo,
      repo,
      "_opam"
    );
    paths.push(opamCygwinLocalCachePath);
  } else {
    const homeDir = os.homedir();
    const opamRootCachePath = path.join(homeDir, ".opam");
    paths.push(opamRootCachePath);
  }
  const cwd = process.cwd();
  const opamLocalCachePath = path.join(cwd, "_opam");
  paths.push(opamLocalCachePath);
  return paths;
}

function composeOpamDownloadCachePaths() {
  const paths = [];
  const platform = getPlatform();
  if (platform === Platform.Win32) {
    const opamDownloadCachePath = path.join("D:", ".opam", "download-cache");
    paths.push(opamDownloadCachePath);
  } else {
    const homeDir = os.homedir();
    const opamDownloadCachePath = path.join(homeDir, ".opam", "download-cache");
    paths.push(opamDownloadCachePath);
  }
  return paths;
}

async function restoreCache(
  key: string,
  restoreKeys: string[],
  paths: string[]
) {
  const cacheKey = await cache.restoreCache(paths, key, restoreKeys);
  if (cacheKey) {
    core.info(`Cache restored from key: ${cacheKey}`);
  } else {
    core.info(
      `Cache not found for input keys: ${[key, ...restoreKeys].join(", ")}`
    );
  }
  return cacheKey;
}

async function saveCache(key: string, paths: string[]) {
  try {
    await cache.saveCache(paths, key);
  } catch (error) {
    core.info(error.message);
  }
}

export async function restoreCygwinCache(): Promise<void> {
  const groupName = "Retrieve the Cygwin cache";
  startProfiler(groupName);
  const { key, restoreKeys } = await composeCygwinCacheKeys();
  const paths = composeCygwinCachePaths();
  await restoreCache(key, restoreKeys, paths);
  stopProfiler(groupName);
}

export async function saveCygwinCache(): Promise<void> {
  const groupName = "Save the Cygwin cache";
  startProfiler(groupName);
  const { key } = await composeCygwinCacheKeys();
  const paths = composeCygwinCachePaths();
  await saveCache(key, paths);
  stopProfiler(groupName);
}

export async function restoreDuneCache(): Promise<void> {
  const groupName = "Retrieve the dune cache";
  startProfiler(groupName);
  const { key, restoreKeys } = composeDuneCacheKeys();
  const paths = composeDuneCachePaths();
  await restoreCache(key, restoreKeys, paths);
  stopProfiler(groupName);
}

export async function saveDuneCache(): Promise<void> {
  const groupName = "Save the dune cache";
  startProfiler(groupName);
  const { key } = composeDuneCacheKeys();
  const paths = composeDuneCachePaths();
  await saveCache(key, paths);
  stopProfiler(groupName);
}

export async function restoreOpamCache(): Promise<string | undefined> {
  const groupName = "Retrieve the opam cache";
  startProfiler(groupName);
  const { key, restoreKeys } = await composeOpamCacheKeys();
  const paths = composeOpamCachePaths();
  const cacheKey = await restoreCache(key, restoreKeys, paths);
  stopProfiler(groupName);
  return cacheKey;
}

export async function saveOpamCache(): Promise<void> {
  const groupName = "Save the opam cache";
  startProfiler(groupName);
  await exec("opam", ["clean", "--download-cache", "--logs"]);
  const { key } = await composeOpamCacheKeys();
  const paths = composeOpamCachePaths();
  await saveCache(key, paths);
  stopProfiler(groupName);
}

export async function restoreOpamDownloadCache(): Promise<string | undefined> {
  const groupName = "Retrieve the opam download cache";
  startProfiler(groupName);
  const { key, restoreKeys } = composeOpamDownloadCacheKeys();
  const paths = composeOpamDownloadCachePaths();
  const cacheKey = await restoreCache(key, restoreKeys, paths);
  stopProfiler(groupName);
  return cacheKey;
}

export async function saveOpamDownloadCache(): Promise<void> {
  const groupName = "Save the opam download cache";
  startProfiler(groupName);
  const { key } = composeOpamDownloadCacheKeys();
  const paths = composeOpamDownloadCachePaths();
  await saveCache(key, paths);
  stopProfiler(groupName);
}
