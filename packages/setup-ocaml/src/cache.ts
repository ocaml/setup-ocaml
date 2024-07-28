import * as crypto from "node:crypto";
import * as path from "node:path";
import * as process from "node:process";
import * as cache from "@actions/cache";
import * as core from "@actions/core";
import { exec } from "@actions/exec";
import * as github from "@actions/github";
import {
  ARCHITECTURE,
  CACHE_PREFIX,
  CYGWIN_MIRROR,
  CYGWIN_ROOT,
  DUNE_CACHE_ROOT,
  OCAML_COMPILER,
  OPAM_DISABLE_SANDBOXING,
  OPAM_REPOSITORIES,
  OPAM_ROOT,
  PLATFORM,
} from "./constants.js";
import { getLatestOpamRelease } from "./opam.js";
import { resolveCompiler } from "./version.js";
import { getCygwinVersion } from "./windows.js";

async function composeCygwinCacheKeys() {
  const cygwinVersion = await getCygwinVersion();
  const key = `${CACHE_PREFIX}-setup-ocaml-cygwin-${cygwinVersion}`;
  const restoreKeys = [key];
  return { key, restoreKeys };
}

async function composeDuneCacheKeys() {
  const platform = PLATFORM.replaceAll(/\W/g, "_");
  const architecture = ARCHITECTURE.replaceAll(/\W/g, "_");
  const { workflow, job } = github.context;
  const ocamlCompiler = await resolveCompiler(OCAML_COMPILER);
  const sha256 = crypto.createHash("sha256");
  const hash = sha256
    .update([architecture, job, ocamlCompiler, platform, workflow].join(""))
    .digest("hex");
  const key = `${CACHE_PREFIX}-setup-ocaml-dune-${hash}`;
  const restoreKeys = [key];
  return { key, restoreKeys };
}

async function composeOpamCacheKeys() {
  const { version: opamVersion } = await getLatestOpamRelease();
  const sandbox = OPAM_DISABLE_SANDBOXING ? "nosandbox" : "sandbox";
  const ocamlCompiler = await resolveCompiler(OCAML_COMPILER);
  const repositories = OPAM_REPOSITORIES.map(([_, value]) => value).join("");
  const sha256 = crypto.createHash("sha256");
  const hash = sha256
    .update(
      [
        ARCHITECTURE,
        ocamlCompiler,
        opamVersion,
        PLATFORM,
        repositories,
        sandbox,
      ].join(""),
    )
    .digest("hex");
  const key = `${CACHE_PREFIX}-setup-ocaml-opam-${hash}`;
  const restoreKeys = [key];
  return { key, restoreKeys };
}

function composeCygwinCachePaths() {
  const paths = [];
  const githubWorkspace = process.env.GITHUB_WORKSPACE ?? process.cwd();
  paths.push(CYGWIN_ROOT);
  const cygwinRootSymlinkPath = path.posix.join("/cygdrive", "d", "cygwin");
  paths.push(cygwinRootSymlinkPath);
  const cygwinEncodedUri = encodeURIComponent(CYGWIN_MIRROR).toLowerCase();
  const cygwinPackageRoot = path.join(githubWorkspace, cygwinEncodedUri);
  paths.push(cygwinPackageRoot);
  return paths;
}

function composeDuneCachePaths() {
  const paths = [DUNE_CACHE_ROOT];
  return paths;
}

function composeOpamCachePaths() {
  const paths = [OPAM_ROOT];
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
  const githubWorkspace = process.env.GITHUB_WORKSPACE ?? process.cwd();
  const opamLocalCachePath = path.join(githubWorkspace, "_opam");
  paths.push(opamLocalCachePath);
  return paths;
}

async function restoreCache(
  key: string,
  restoreKeys: string[],
  paths: string[],
) {
  if (!cache.isFeatureAvailable()) {
    core.info("Actions cache service feature is unavailable");
    return;
  }
  try {
    const cacheKey = await cache.restoreCache(paths, key, restoreKeys);
    if (cacheKey) {
      core.info(`Cache restored from key: ${cacheKey}`);
    } else {
      core.info(
        `Cache not found for input keys: ${[key, ...restoreKeys].join(", ")}`,
      );
    }
    return cacheKey;
  } catch (error) {
    if (error instanceof Error) {
      core.info(error.message);
    }
    core.warning(
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
    core.warning(
      "An internal error has occurred in cache backend. Please check https://www.githubstatus.com for any ongoing issue in actions.",
    );
  }
}

export async function restoreDuneCache() {
  return await core.group("Retrieve the dune cache", async () => {
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
  return await core.group("Retrieve the opam cache", async () => {
    const [opamCacheHit, cygwinCacheHit] = await Promise.all(
      PLATFORM === "windows"
        ? [restoreOpamCache(), restoreCygwinCache()]
        : [restoreOpamCache()],
    );
    return { opamCacheHit, cygwinCacheHit };
  });
}

export async function saveCygwinCache() {
  await core.group("Save the Cygwin cache", async () => {
    const { key } = await composeCygwinCacheKeys();
    const paths = composeCygwinCachePaths();
    await saveCache(key, paths);
  });
}

export async function saveDuneCache() {
  await core.group("Save the dune cache", async () => {
    const { key } = await composeDuneCacheKeys();
    const paths = composeDuneCachePaths();
    await saveCache(key, paths);
  });
}

export async function saveOpamCache() {
  await core.group("Save the opam cache", async () => {
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
  });
}
