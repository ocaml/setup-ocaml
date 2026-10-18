import * as crypto from "node:crypto";
import * as path from "node:path";

import type { DownloadOptions } from "@actions/cache";
import * as cache from "@actions/cache";
import * as core from "@actions/core";
import { exec, getExecOutput } from "@actions/exec";
import * as github from "@actions/github";
import * as system from "systeminformation";

import {
  ARCHITECTURE,
  DUNE_CACHE_ROOT,
  GITHUB_WORKSPACE,
  OPAM_ROOT,
  PLATFORM,
} from "./constants.js";
import type { Inputs, WindowsEnvironment } from "./inputs.js";
import { toCygwinPath, toMsysPath } from "./paths.js";

export const DUNE_CACHE_KEY_STATE = "dune-cache-key";

function composeDuneCacheKeys(cachePrefix: string, ocamlCompiler: string) {
  const { workflow, job, runId } = github.context;
  const plainKey = [ocamlCompiler, workflow, job].join(",");
  const hash = crypto.createHash("sha256").update(plainKey).digest("hex");
  const key = `${cachePrefix}-setup-ocaml-dune-${PLATFORM}-${ARCHITECTURE}-${hash}-${runId}`;
  const restoreKeys = [
    key,
    `${cachePrefix}-setup-ocaml-dune-${PLATFORM}-${ARCHITECTURE}-${hash}-`,
    `${cachePrefix}-setup-ocaml-dune-${PLATFORM}-${ARCHITECTURE}-`,
  ];
  core.debug(`dune cache key: ${plainKey}`);
  return { key, restoreKeys };
}

async function getMsvcVersion() {
  const { stdout } = await getExecOutput(
    "vswhere",
    ["-latest", "-property", "installationVersion"],
    { silent: true }
  );
  return stdout.trim();
}

async function composeOpamCacheKeys(
  inputs: Inputs,
  opamVersion: string,
  ocamlCompiler: string
) {
  const sandbox = inputs.opamDisableSandboxing ? "nosandbox" : "sandbox";
  const repositoryUrls = inputs.opamRepositoriesLowestPriorityFirst
    .map(([, value]) => value)
    .join(",");
  const osInfo = await system.osInfo();
  const components = [
    PLATFORM,
    osInfo.release,
    ARCHITECTURE,
    opamVersion,
    ocamlCompiler,
    repositoryUrls,
    sandbox,
  ];
  if (PLATFORM === "windows") {
    components.push(inputs.windowsEnvironment, inputs.windowsCompiler);
    if (inputs.windowsCompiler === "msvc") {
      const msvcVersion = await getMsvcVersion();
      components.push(msvcVersion);
    }
  }
  const plainKey = components.join(",");
  const hash = crypto.createHash("sha256").update(plainKey).digest("hex");
  const key = `${inputs.cachePrefix}-setup-ocaml-opam-${hash}`;
  const restoreKeys = [key];
  core.debug(`opam cache key: ${plainKey}`);
  return { key, restoreKeys };
}

function composeDuneCachePaths() {
  return [DUNE_CACHE_ROOT];
}

function composeOpamCachePaths(windowsEnvironment: WindowsEnvironment) {
  const opamLocalCachePath = path.join(GITHUB_WORKSPACE, "_opam");
  const paths = [OPAM_ROOT, opamLocalCachePath];
  if (PLATFORM === "windows") {
    if (windowsEnvironment === "msys2") {
      paths.push(toMsysPath(opamLocalCachePath));
    }
    if (windowsEnvironment === "cygwin") {
      paths.push(toCygwinPath(opamLocalCachePath));
    }
  }
  return paths;
}

async function restoreCache(
  key: string,
  restoreKeys: string[],
  paths: string[],
  options?: DownloadOptions
) {
  if (!cache.isFeatureAvailable()) {
    core.info("Actions cache service feature is unavailable");
    return;
  }
  try {
    const cacheKey = await cache.restoreCache(paths, key, restoreKeys, {
      useAzureSdk: true,
      ...options,
    });
    if (cacheKey) {
      core.info(`Cache restored from key: ${cacheKey}`);
    } else {
      core.info(
        `Cache is not found for input keys: ${[key, ...restoreKeys].join(", ")}`
      );
    }
    return cacheKey;
  } catch (error) {
    core.warning(
      `Failed to restore cache: ${error instanceof Error ? error.message : String(error)}`
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
    await cache.saveCache(paths, key, {
      useAzureSdk: true,
    });
  } catch (error) {
    core.warning(
      `Failed to save cache: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export async function restoreDuneCache(
  cachePrefix: string,
  ocamlCompiler: string
) {
  await core.group("Restoring dune cache", async () => {
    const { key, restoreKeys } = composeDuneCacheKeys(
      cachePrefix,
      ocamlCompiler
    );
    core.saveState(DUNE_CACHE_KEY_STATE, key);
    const paths = composeDuneCachePaths();
    await restoreCache(key, restoreKeys, paths);
  });
}

export async function restoreOpamCache(
  inputs: Inputs,
  opamVersion: string,
  ocamlCompiler: string
) {
  return await core.group("Restoring opam cache", async () => {
    const { key, restoreKeys } = await composeOpamCacheKeys(
      inputs,
      opamVersion,
      ocamlCompiler
    );
    const paths = composeOpamCachePaths(inputs.windowsEnvironment);
    return await restoreCache(key, restoreKeys, paths);
  });
}

export async function saveDuneCache(key: string) {
  await core.group("Saving dune cache", async () => {
    const paths = composeDuneCachePaths();
    await saveCache(key, paths);
  });
}

export async function saveOpamCache(
  inputs: Inputs,
  opamVersion: string,
  ocamlCompiler: string
) {
  await core.group("Saving opam cache", async () => {
    const { key, restoreKeys } = await composeOpamCacheKeys(
      inputs,
      opamVersion,
      ocamlCompiler
    );
    const paths = composeOpamCachePaths(inputs.windowsEnvironment);
    const cacheHit = await restoreCache(key, restoreKeys, paths, {
      lookupOnly: true,
    });
    if (cacheHit) {
      core.info(
        "Cache entry with the same key, version, and scope already exists"
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
