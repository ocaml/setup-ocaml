import * as cache from "@actions/cache";
import * as core from "@actions/core";
import { exec } from "@actions/exec";
import * as github from "@actions/github";
import * as datefns from "date-fns";
import * as os from "os";
import * as path from "path";
import * as process from "process";

import { version as actionVersion } from "../../package.json";
import {
  CACHE_PREFIX,
  GITHUB_TOKEN,
  OCAML_COMPILER,
  OPAM_REPOSITORIES,
  Platform,
} from "./constants";
import {
  getArchitecture,
  getPlatform,
  getSystemIdentificationInfo,
} from "./system";
import { isSemverStyle, resolveVersion } from "./version";
import { getCygwinVersion } from "./win32";

function composeDate() {
  const d = new Date();
  const year = datefns.getYear(d);
  const month = datefns.getMonth(d);
  const date = datefns.getDate(d);
  const week = datefns.getWeek(d);
  return { year, month, date, week };
}

async function composeCygwinCacheKeys() {
  const cygwinVersion = await getCygwinVersion();
  const { year, week } = composeDate();
  const key = `${CACHE_PREFIX}-setup-ocaml-${actionVersion}-cygwin-${cygwinVersion}-${year}-${week}`;
  const restoreKeys = [
    `${CACHE_PREFIX}-setup-ocaml-${actionVersion}-cygwin-${cygwinVersion}-${year}-${week}`,
    `${CACHE_PREFIX}-setup-ocaml-${actionVersion}-cygwin-${cygwinVersion}-${year}-`,
  ];
  return { key, restoreKeys };
}

function composeDuneCacheKeys() {
  const platform = getPlatform().replace(/\W/g, "_");
  const architecture = getArchitecture().replace(/\W/g, "_");
  const { workflow: _workflow, job: _job, runId, runNumber } = github.context;
  const workflow = _workflow.toLowerCase().replace(/\W/g, "_");
  const job = _job.replace(/\W/g, "_");
  const ocamlVersion = OCAML_COMPILER.toLowerCase().replace(/\W/g, "_");
  const key = `${CACHE_PREFIX}-setup-ocaml-${actionVersion}-dune-${platform}-${architecture}-${ocamlVersion}-${workflow}-${job}-${runId}-${runNumber}`;
  const restoreKeys = [
    `${CACHE_PREFIX}-setup-ocaml-${actionVersion}-dune-${platform}-${architecture}-${ocamlVersion}-${workflow}-${job}-${runId}-${runNumber}`,
    `${CACHE_PREFIX}-setup-ocaml-${actionVersion}-dune-${platform}-${architecture}-${ocamlVersion}-${workflow}-${job}-${runId}-`,
    `${CACHE_PREFIX}-setup-ocaml-${actionVersion}-dune-${platform}-${architecture}-${ocamlVersion}-${workflow}-${job}-`,
  ];
  return { key, restoreKeys };
}

async function composeOpamCacheKeys() {
  const platform = getPlatform();
  const fullPlatform =
    platform === Platform.Win32
      ? platform
      : `${platform}-${(await getSystemIdentificationInfo()).version}`;
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
  const ocamlVersion = ocamlCompiler.toLowerCase().replace(/\W/g, "_");
  const { year, week } = composeDate();
  const key = `${CACHE_PREFIX}-setup-ocaml-${actionVersion}-opam-${opamVersion}-${fullPlatform}-${architecture}-${ocamlVersion}-${year}-${week}`;
  const restoreKeys = [
    `${CACHE_PREFIX}-setup-ocaml-${actionVersion}-opam-${opamVersion}-${fullPlatform}-${architecture}-${ocamlVersion}-${year}-${week}`,
    `${CACHE_PREFIX}-setup-ocaml-${actionVersion}-opam-${opamVersion}-${fullPlatform}-${architecture}-${ocamlVersion}-${year}-`,
    `${CACHE_PREFIX}-setup-ocaml-${actionVersion}-opam-${opamVersion}-${fullPlatform}-${architecture}-${ocamlVersion}-`,
  ];
  return { key, restoreKeys };
}

function composeOpamDownloadCacheKeys() {
  const repositories = OPAM_REPOSITORIES.map(([, u]) => {
    const url = new URL(u);
    const urn = path.join(url.hostname, url.pathname);
    return urn;
  }).join("_");
  const ocamlVersion = OCAML_COMPILER.toLowerCase().replace(/\W/g, "_");
  const { year, month, date } = composeDate();
  const { runId, runNumber } = github.context;
  const key = `${CACHE_PREFIX}-setup-ocaml-${actionVersion}-opam-download-${repositories}-${ocamlVersion}-${year}-${month}-${date}-${runId}-${runNumber}`;
  const restoreKeys = [
    `${CACHE_PREFIX}-setup-ocaml-${actionVersion}-opam-download-${repositories}-${ocamlVersion}-${year}-${month}-${date}-${runId}-${runNumber}`,
    `${CACHE_PREFIX}-setup-ocaml-${actionVersion}-opam-download-${repositories}-${ocamlVersion}-${year}-${month}-${date}-${runId}-`,
    `${CACHE_PREFIX}-setup-ocaml-${actionVersion}-opam-download-${repositories}-${ocamlVersion}-${year}-${month}-${date}-`,
    `${CACHE_PREFIX}-setup-ocaml-${actionVersion}-opam-download-${repositories}-${ocamlVersion}-${year}-${month}-`,
  ];
  return { key, restoreKeys };
}

function composeCygwinCachePaths() {
  const paths = [];
  const githubWorkspace = process.env.GITHUB_WORKSPACE ?? process.cwd();
  const cygwinRoot = path.join("D:", "cygwin");
  paths.push(cygwinRoot);
  const cygwinRootSymlinkPath = path.posix.join("/cygdrive", "d", "cygwin");
  paths.push(cygwinRootSymlinkPath);
  const cygwinEncodedUri = encodeURIComponent(
    "http://cygwin.mirror.constant.com/"
  ).toLowerCase();
  const cygwinPackageRoot = path.join(githubWorkspace, cygwinEncodedUri);
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
  const githubWorkspace = process.env.GITHUB_WORKSPACE ?? process.cwd();
  const opamLocalCachePath = path.join(githubWorkspace, "_opam");
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
    if (error instanceof Error) {
      if (error.name === cache.ValidationError.name) {
        throw error;
      } else if (error.name === cache.ReserveCacheError.name) {
        core.info(error.message);
      } else {
        core.warning(error.message);
      }
    }
  }
}

export async function restoreCygwinCache(): Promise<void> {
  core.startGroup("Retrieve the Cygwin cache");
  const { key, restoreKeys } = await composeCygwinCacheKeys();
  const paths = composeCygwinCachePaths();
  await restoreCache(key, restoreKeys, paths);
  core.endGroup();
}

export async function saveCygwinCache(): Promise<void> {
  core.startGroup("Save the Cygwin cache");
  const { key } = await composeCygwinCacheKeys();
  const paths = composeCygwinCachePaths();
  await saveCache(key, paths);
  core.endGroup();
}

export async function restoreDuneCache(): Promise<void> {
  core.startGroup("Retrieve the dune cache");
  const { key, restoreKeys } = composeDuneCacheKeys();
  const paths = composeDuneCachePaths();
  await restoreCache(key, restoreKeys, paths);
  core.endGroup();
}

export async function saveDuneCache(): Promise<void> {
  core.startGroup("Save the dune cache");
  const { key } = composeDuneCacheKeys();
  const paths = composeDuneCachePaths();
  await saveCache(key, paths);
  core.endGroup();
}

export async function restoreOpamCache(): Promise<string | undefined> {
  core.startGroup("Retrieve the opam cache");
  const { key, restoreKeys } = await composeOpamCacheKeys();
  const paths = composeOpamCachePaths();
  const cacheKey = await restoreCache(key, restoreKeys, paths);
  core.endGroup();
  return cacheKey;
}

export async function saveOpamCache(): Promise<void> {
  core.startGroup("Save the opam cache");
  await exec("opam", [
    "clean",
    "--all-switches",
    "--download-cache",
    "--logs",
    "--repo-cache",
    "--unused-repositories",
  ]);
  const { key } = await composeOpamCacheKeys();
  const paths = composeOpamCachePaths();
  await saveCache(key, paths);
  core.endGroup();
}

export async function restoreOpamDownloadCache(): Promise<string | undefined> {
  core.startGroup("Retrieve the opam download cache");
  const { key, restoreKeys } = composeOpamDownloadCacheKeys();
  const paths = composeOpamDownloadCachePaths();
  const cacheKey = await restoreCache(key, restoreKeys, paths);
  core.endGroup();
  return cacheKey;
}

export async function saveOpamDownloadCache(): Promise<void> {
  core.startGroup("Save the opam download cache");
  const { key } = composeOpamDownloadCacheKeys();
  const paths = composeOpamDownloadCachePaths();
  await saveCache(key, paths);
  core.endGroup();
}
