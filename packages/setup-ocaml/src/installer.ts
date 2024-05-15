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
  CYGWIN_ROOT_BIN,
  DUNE_CACHE,
  DUNE_CACHE_ROOT,
  OCAML_COMPILER,
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
} from "./opam.js";
import { getOpamLocalPackages } from "./packages.js";
import { resolveCompiler } from "./version.js";
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
  core.exportVariable("OPAMYES", 1);
  if (PLATFORM === "windows") {
    core.exportVariable("CYGWIN", "winsymlinks:native");
    core.exportVariable("HOME", process.env.USERPROFILE);
    core.exportVariable("MSYS", "winsymlinks:native");
    await core.group(
      "Change the file system behaviour parameters",
      async () => {
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
      },
    );
  }
  const { opamCacheHit, cygwinCacheHit } = await restoreOpamCaches();
  if (PLATFORM === "windows") {
    if (!cygwinCacheHit) {
      await setupCygwin();
      await saveCygwinCache();
    }
    core.addPath(CYGWIN_ROOT_BIN);
  }
  await setupOpam();
  await repositoryRemoveAll();
  await repositoryAddAll(OPAM_REPOSITORIES);
  const ocamlCompiler = await resolveCompiler(OCAML_COMPILER);
  if (!opamCacheHit) {
    await installOcaml(ocamlCompiler);
    await saveOpamCache();
  }
  if (DUNE_CACHE) {
    await restoreDuneCache();
    await installDune();
    core.exportVariable("DUNE_CACHE", "enabled");
    core.exportVariable("DUNE_CACHE_ROOT", DUNE_CACHE_ROOT);
    core.exportVariable("DUNE_CACHE_STORAGE_MODE", "hardlink");
    core.exportVariable("DUNE_CACHE_TRANSPORT", "direct");
  }
  core.exportVariable("CLICOLOR_FORCE", "1");
  const fnames = await getOpamLocalPackages();
  if (fnames.length > 0) {
    if (OPAM_PIN) {
      await pin(fnames);
    }
  }
  await exec("opam", ["--version"]);
  await exec("opam", ["exec", "--", "ocaml", "-version"]);
}
