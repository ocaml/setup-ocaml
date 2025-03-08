import * as crypto from "node:crypto";
import * as path from "node:path";
import * as cache from "@actions/cache";
import type { DownloadOptions } from "@actions/cache/lib/options.js";
import * as core from "@actions/core";
import { exec } from "@actions/exec";
import * as github from "@actions/github";
import * as system from "systeminformation";
import {
  ARCHITECTURE,
  CACHE_PREFIX,
  CYGWIN_MIRROR_ENCODED_URI,
  CYGWIN_ROOT,
  DUNE_CACHE_ROOT,
  GITHUB_WORKSPACE,
  OPAM_DISABLE_SANDBOXING,
  OPAM_REPOSITORIES,
  OPAM_ROOT,
  PLATFORM,
} from "./constants.js";
import { latestOpamRelease } from "./opam.js";
import { resolvedCompiler } from "./version.js";
import { cygwinVersion } from "./windows.js";

async function composeCygwinCacheKeys() {
  const version = await cygwinVersion;
  const key = `${CACHE_PREFIX}-setup-ocaml-cygwin-${CYGWIN_MIRROR_ENCODED_URI}-${version}`;
  const restoreKeys = [key];
  return { key, restoreKeys };
}

async function composeDuneCacheKeys() {
  const { workflow, job, runId } = github.context;
  const ocamlCompiler = await resolvedCompiler;
  const plainKey = [ocamlCompiler, workflow, job].join();
  const hash = crypto.createHash("sha256").update(plainKey).digest("hex");
  const key = `${CACHE_PREFIX}-setup-ocaml-dune-${PLATFORM}-${ARCHITECTURE}-${hash}-${runId}`;
  const restoreKeys = [
    key,
    `${CACHE_PREFIX}-setup-ocaml-dune-${PLATFORM}-${ARCHITECTURE}-${hash}-`,
    `${CACHE_PREFIX}-setup-ocaml-dune-${PLATFORM}-${ARCHITECTURE}-`,
  ];
  core.debug(`dune cache key: ${plainKey}`);
  return { key, restoreKeys };
}

async function composeOpamCacheKeys() {
  const { version: opamVersion } = await latestOpamRelease;
  const sandbox = OPAM_DISABLE_SANDBOXING ? "nosandbox" : "sandbox";
  const ocamlCompiler = await resolvedCompiler;
  const repositoryUrls = OPAM_REPOSITORIES.map(([_, value]) => value).join();
  const osInfo = await system.osInfo();
  const plainKey = [
    PLATFORM,
    osInfo.release,
    ARCHITECTURE,
    opamVersion,
    ocamlCompiler,
    repositoryUrls,
    sandbox,
  ].join();
  const hash = crypto.createHash("sha256").update(plainKey).digest("hex");
  const key = `${CACHE_PREFIX}-setup-ocaml-opam-${hash}`;
  const restoreKeys = [key];
  core.debug(`opam cache key: ${plainKey}`);
  return { key, restoreKeys };
}

function composeCygwinCachePaths() {
  const cygwinRootSymlinkPath = path.posix.join("/cygdrive", "d", "cygwin");
  const cygwinLocalPackageDirectory = path.join(
    GITHUB_WORKSPACE,
    CYGWIN_MIRROR_ENCODED_URI,
  );
  const paths = [
    CYGWIN_ROOT,
    cygwinLocalPackageDirectory,
    cygwinRootSymlinkPath,
  ];
  return paths;
}

function composeDuneCachePaths() {
  const paths = [DUNE_CACHE_ROOT];
  return paths;
}

function composeOpamCachePaths() {
  const opamLocalCachePath = path.join(GITHUB_WORKSPACE, "_opam");
  const paths = [OPAM_ROOT, opamLocalCachePath];
  if (PLATFORM === "windows") {
    const {
      repo: { repo },
    } = github.context;
    const opamCygwinLocalCachePath = path.posix.join(
      "/cygdrive",
      "d",
      "a",
      repo,
      repo,
      "_opam",
    );
    paths.push(opamCygwinLocalCachePath);
  }
  return paths;
}

async function restoreCache(
  key: string,
  restoreKeys: string[],
  paths: string[],
  options?: DownloadOptions,
) {
  if (!cache.isFeatureAvailable()) {
    core.info("Actions cache service feature is unavailable");
    return;
  }
  try {
    const cacheKey = await cache.restoreCache(paths, key, restoreKeys, options);
    if (cacheKey) {
      core.info(`Cache restored from key: ${cacheKey}`);
    } else {
      core.info(
        `Cache is not found for input keys: ${[key, ...restoreKeys].join(", ")}`,
      );
    }
    return cacheKey;
  } catch (error) {
    if (error instanceof Error) {
      core.info(error.message);
    }
    core.notice(
      "An internal error has occurred in cache backend. Please check https://www.githubstatus.com for any ongoing issue in actions.",
    );
    return;
  }
}

async function saveCache(key: string, paths: string[]) {
  if (!cache.isFeatureAvailable()) {
    core.info("Actions cache service feature is unavailable");
    return;
  }
  try {
    await cache.saveCache(paths, key);
  } catch (error) {
    if (error instanceof Error) {
      core.info(error.message);
    }
    core.notice(
      "An internal error has occurred in cache backend. Please check https://www.githubstatus.com for any ongoing issue in actions.",
    );
  }
}

export async function restoreDuneCache() {
  return await core.group("Restoring dune cache", async () => {
    const { key, restoreKeys } = await composeDuneCacheKeys();
    const paths = composeDuneCachePaths();
    const cacheKey = await restoreCache(key, restoreKeys, paths);
    return cacheKey;
  });
}

async function restoreCygwinCache() {
  const { key, restoreKeys } = await composeCygwinCacheKeys();
  const paths = composeCygwinCachePaths();
  const cacheKey = await restoreCache(key, restoreKeys, paths);
  return cacheKey;
}

async function restoreOpamCache() {
  const { key, restoreKeys } = await composeOpamCacheKeys();
  const paths = composeOpamCachePaths();
  const cacheKey = await restoreCache(key, restoreKeys, paths);
  return cacheKey;
}

export async function restoreOpamCaches() {
  return await core.group("Restoring opam cache", async () => {
    const [opamCacheHit, cygwinCacheHit] = await Promise.all(
      PLATFORM === "windows"
        ? [restoreOpamCache(), restoreCygwinCache()]
        : [restoreOpamCache()],
    );
    return { opamCacheHit, cygwinCacheHit };
  });
}

export async function saveCygwinCache() {
  await core.group("Saving Cygwin cache", async () => {
    const { key } = await composeCygwinCacheKeys();
    const paths = composeCygwinCachePaths();
    await saveCache(key, paths);
  });
}

export async function saveDuneCache() {
  await core.group("Saving dune cache", async () => {
    const { key } = await composeDuneCacheKeys();
    const paths = composeDuneCachePaths();
    await saveCache(key, paths);
  });
}

export async function saveOpamCache() {
  await core.group("Saving opam cache", async () => {
    const { key, restoreKeys } = await composeOpamCacheKeys();
    const paths = composeOpamCachePaths();
    const cacheHit = await restoreCache(key, restoreKeys, paths, {
      lookupOnly: true,
    });
    if (cacheHit) {
      core.info(
        "Cache entry with the same key, version, and scope already exists",
      );
    } else {
      await exec("opam", [
        "clean",
        "--all-switches",
        "--download-cache",
        "--logs",
        "--repo-cache",
        "--untracked",
        "--unused-repositories",
      ]);
      await saveCache(key, paths);
    }
  });
}
