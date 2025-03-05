import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as process from "node:process";
import * as core from "@actions/core";
import { exec } from "@actions/exec";
import {
  restoreDuneCache,
  restoreOpamCaches,
  saveCygwinCache,
  saveOpamCache,
} from "./cache.js";
import {
  CYGWIN_BASH_ENV,
  CYGWIN_ROOT_BIN,
  DUNE_CACHE,
  DUNE_CACHE_ROOT,
  OPAM_PIN,
  OPAM_REPOSITORIES,
  OPAM_ROOT,
  PLATFORM,
  RESOLVED_COMPILER,
  SAVE_OPAM_POST_RUN,
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
import { retrieveOpamLocalPackages } from "./packages.js";
import { setupCygwin } from "./windows.js";

export async function installer() {
  if (core.isDebug()) {
    core.exportVariable("OPAMVERBOSE", 1);
  }
  core.exportVariable("OPAMCOLOR", "always");
  core.exportVariable("OPAMCONFIRMLEVEL", "unsafe-yes");
  core.exportVariable("OPAMDOWNLOADJOBS", os.availableParallelism());
  core.exportVariable("OPAMERRLOGLEN", 0);
  core.exportVariable("OPAMPRECISETRACKING", 1);
  core.exportVariable("OPAMROOT", OPAM_ROOT);
  core.exportVariable("OPAMSOLVERTIMEOUT", 600);
  core.exportVariable("OPAMYES", 1);
  if (PLATFORM === "windows") {
    core.exportVariable("CYGWIN", "winsymlinks:native");
    core.exportVariable("HOME", process.env.USERPROFILE);
    core.exportVariable("MSYS", "winsymlinks:native");
    await core.group("Configuring Windows symlink settings", async () => {
      await exec("fsutil", ["behavior", "query", "SymlinkEvaluation"]);
      // [INFO] https://docs.microsoft.com/en-us/windows-server/administration/windows-commands/fsutil-behavior
      await exec("fsutil", [
        "behavior",
        "set",
        "symlinkEvaluation",
        "R2L:1",
        "R2R:1",
      ]);
      await exec("fsutil", ["behavior", "query", "SymlinkEvaluation"]);
    });
  }
  const { opamCacheHit, cygwinCacheHit } = await restoreOpamCaches();
  if (PLATFORM === "windows") {
    await setupCygwin();
    if (!cygwinCacheHit) {
      await saveCygwinCache();
    }
    await fs.writeFile(CYGWIN_BASH_ENV, "set -o igncr");
    core.exportVariable("BASH_ENV", CYGWIN_BASH_ENV);
    core.addPath(CYGWIN_ROOT_BIN);
  }
  await setupOpam();
  await repositoryRemoveAll();
  await repositoryAddAll(OPAM_REPOSITORIES);
  if (!opamCacheHit) {
    const ocamlCompiler = await RESOLVED_COMPILER;
    await installOcaml(ocamlCompiler);
    if (!SAVE_OPAM_POST_RUN) {
        await saveOpamCache();
    }
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
    const fnames = await retrieveOpamLocalPackages();
    await pin(fnames);
  }
  await exec("opam", ["--version"]);
  await exec("opam", ["exec", "--", "ocaml", "-version"]);
}
