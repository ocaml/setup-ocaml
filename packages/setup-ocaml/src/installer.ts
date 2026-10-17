import { promises as fs } from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import * as process from "node:process";
import * as core from "@actions/core";
import { exec } from "@actions/exec";
import * as glob from "@actions/glob";
import { restoreDuneCache, restoreOpamCache, saveOpamCache } from "./cache.js";
import {
  CYGWIN_BASH_ENV,
  CYGWIN_ROOT_BIN,
  DUNE_CACHE_ROOT,
  GITHUB_WORKSPACE,
  OPAM_ROOT,
  PLATFORM,
} from "./constants.js";
import { installDune } from "./dune.js";
import { createOctokit } from "./github-client.js";
import type { Inputs } from "./inputs.js";
import {
  findLatestOpamRelease,
  installOcaml,
  pin,
  repositoryAddAll,
  repositoryRemoveAll,
  setupOpam,
  update,
} from "./opam.js";
import { resolveCompiler } from "./version.js";

// 10 minutes — the 0install solver can be slow on large dependency trees.
const OPAM_SOLVER_TIMEOUT = 600;

async function pathExists(filePath: string) {
  return await fs.access(filePath).then(
    () => true,
    () => false,
  );
}

export async function installer(inputs: Inputs) {
  const octokit = createOctokit(inputs.githubToken);
  const [opamRelease, ocamlCompiler] = await Promise.all([
    findLatestOpamRelease(octokit, inputs.allowPrereleaseOpam),
    resolveCompiler(octokit, inputs.ocamlCompiler),
  ]);
  if (core.isDebug()) {
    core.exportVariable("OPAMVERBOSE", 1);
  }
  core.exportVariable("OPAMCOLOR", "always");
  core.exportVariable("OPAMCONFIRMLEVEL", "unsafe-yes");
  core.exportVariable("OPAMDOWNLOADJOBS", os.availableParallelism());
  core.exportVariable("OPAMERRLOGLEN", 0);
  core.exportVariable("OPAMEXTERNALSOLVER", "builtin-0install");
  core.exportVariable("OPAMPRECISETRACKING", 1);
  core.exportVariable("OPAMRETRIES", 10);
  core.exportVariable("OPAMROOT", OPAM_ROOT);
  core.exportVariable("OPAMSOLVERTIMEOUT", OPAM_SOLVER_TIMEOUT);
  core.exportVariable("OPAMYES", 1);
  if (PLATFORM === "windows") {
    core.exportVariable("HOME", process.env.USERPROFILE);
    core.exportVariable("MSYS", "winsymlinks:native");
    if (inputs.windowsEnvironment === "cygwin") {
      core.exportVariable("CYGWIN", "winsymlinks:native");
    }
    await core.group("Configuring Windows symlink settings", async () => {
      await exec("fsutil", ["behavior", "query", "SymlinkEvaluation"]);
      // Enable Remote-to-Local and Remote-to-Remote symlink evaluation.
      // https://docs.microsoft.com/en-us/windows-server/administration/windows-commands/fsutil-behavior
      await exec("fsutil", [
        "behavior",
        "set",
        "symlinkEvaluation",
        "R2L:1", // Remote-to-Local
        "R2R:1", // Remote-to-Remote
      ]);
      await exec("fsutil", ["behavior", "query", "SymlinkEvaluation"]);
    });
  }
  const opamCacheHit = inputs.cache
    ? await restoreOpamCache(inputs, opamRelease.version, ocamlCompiler)
    : undefined;
  const [opamRootInitialized, localSwitchInitialized] = await Promise.all([
    pathExists(path.join(OPAM_ROOT, "config")),
    pathExists(path.join(GITHUB_WORKSPACE, "_opam", ".opam-switch", "switch-config")),
  ]);
  const useInitialRepository = !opamCacheHit && !opamRootInitialized;
  await setupOpam(
    inputs,
    opamRelease,
    useInitialRepository ? inputs.opamRepositoriesLowestPriorityFirst[0] : undefined,
  );
  if (PLATFORM === "windows" && inputs.windowsEnvironment === "cygwin") {
    await fs.writeFile(CYGWIN_BASH_ENV, "set -o igncr");
    core.exportVariable("BASH_ENV", CYGWIN_BASH_ENV);
    core.addPath(CYGWIN_ROOT_BIN);
  }
  if (!opamCacheHit) {
    if (useInitialRepository && !localSwitchInitialized) {
      await repositoryAddAll(inputs.opamRepositoriesLowestPriorityFirst.slice(1));
    } else {
      await repositoryRemoveAll();
      await repositoryAddAll(inputs.opamRepositoriesLowestPriorityFirst);
    }
    if (!localSwitchInitialized) {
      await installOcaml(ocamlCompiler, inputs.windowsCompiler);
      if (inputs.cache) {
        await saveOpamCache(inputs, opamRelease.version, ocamlCompiler);
      }
    }
  } else {
    await update();
  }
  if (inputs.duneCache) {
    await restoreDuneCache(inputs.cachePrefix, ocamlCompiler);
    await installDune();
    core.exportVariable("DUNE_CACHE_ROOT", DUNE_CACHE_ROOT);
  }
  core.exportVariable("CLICOLOR_FORCE", "1");
  if (inputs.opamPin) {
    const globber = await glob.create(inputs.opamLocalPackages);
    const fnames = await globber.glob();
    await pin(fnames);
  }
  await exec("opam", ["config", "report"]);
}
