import * as os from "node:os";
import * as process from "node:process";
import * as core from "@actions/core";
import { exec } from "@actions/exec";
import * as glob from "@actions/glob";
import { restoreDuneCache, restoreOpamCache, saveOpamCache } from "./cache.js";
import {
  DUNE_CACHE,
  DUNE_CACHE_ROOT,
  OPAM_LOCAL_PACKAGES,
  OPAM_PIN,
  OPAM_REPOSITORIES,
  OPAM_ROOT,
  PLATFORM,
} from "./constants.js";
import { installDune } from "./dune.js";
import {
  installOcaml,
  pin,
  repositoryAddAll,
  repositoryRemoveAll,
  setupOpam,
  update,
} from "./opam.js";
import { resolvedCompiler } from "./version.js";

// 10 minutes — the 0install solver can be slow on large dependency trees.
const OPAM_SOLVER_TIMEOUT = 600;

export async function installer() {
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
    core.exportVariable("CYGWIN", "winsymlinks:native");
    core.exportVariable("HOME", process.env.USERPROFILE);
    core.exportVariable("MSYS", "winsymlinks:native");
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
  const opamCacheHit = await restoreOpamCache();
  await setupOpam();
  if (!opamCacheHit) {
    await repositoryRemoveAll();
    await repositoryAddAll(OPAM_REPOSITORIES);
    const ocamlCompiler = await resolvedCompiler;
    await installOcaml(ocamlCompiler);
    await saveOpamCache();
  } else {
    await update();
  }
  if (DUNE_CACHE) {
    await restoreDuneCache();
    await installDune();
    core.exportVariable("DUNE_CACHE_ROOT", DUNE_CACHE_ROOT);
  }
  core.exportVariable("CLICOLOR_FORCE", "1");
  if (OPAM_PIN) {
    const globber = await glob.create(OPAM_LOCAL_PACKAGES);
    const fnames = await globber.glob();
    await pin(fnames);
  }
  await exec("opam", ["config", "report"]);
}
