import * as os from "node:os";
import * as process from "node:process";
import * as core from "@actions/core";
import { exec } from "@actions/exec";
import {
  restoreDuneCache,
  restoreOpamCaches,
  restoreOpamDownloadCache,
  saveCygwinCache,
  saveOpamCache,
} from "./cache.js";
import {
  CYGWIN_ROOT,
  CYGWIN_ROOT_BIN,
  DUNE_CACHE,
  DUNE_CACHE_ROOT,
  OPAM_PIN,
  OPAM_REPOSITORIES,
  OPAM_ROOT,
  PLATFORM,
  RESOLVED_COMPILER,
  WINDOWS_ENVIRONMENT,
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
import { prepareMsys2, setupCygwin } from "./windows.js";

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
    core.exportVariable("SHELLOPTS", "igncr");
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
    switch (WINDOWS_ENVIRONMENT) {
      case "msys2": {
        const msys2Root = await prepareMsys2();
        await setupOpam(msys2Root);
        break;
      }
      case "cygwin":
        await setupCygwin();
        if (!cygwinCacheHit) {
          await saveCygwinCache();
        }
        core.addPath(CYGWIN_ROOT_BIN);
        await setupOpam(CYGWIN_ROOT);
        break;
    }
  } else {
    await setupOpam();
  }
  if (!opamCacheHit) {
    await repositoryRemoveAll();
    await repositoryAddAll(OPAM_REPOSITORIES);
    const ocamlCompiler = await RESOLVED_COMPILER;
    await installOcaml(ocamlCompiler);
    await saveOpamCache();
  } else {
    await update();
  }
  await restoreOpamDownloadCache();
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
