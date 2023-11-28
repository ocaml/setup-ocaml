import * as os from "node:os";
import * as path from "node:path";
import * as process from "node:process";

import * as core from "@actions/core";
import { exec } from "@actions/exec";

import {
  restoreCygwinCache,
  restoreDuneCache,
  restoreOpamCache,
  restoreOpamDownloadCache,
  saveOpamCache,
} from "./cache.js";
import {
  ALLOW_PRERELEASE_OPAM,
  DUNE_CACHE,
  OCAML_COMPILER,
  OPAM_DEPEXT,
  OPAM_PIN,
  OPAM_REPOSITORIES,
  PLATFORM,
} from "./constants.js";
import { installDepext, installDepextPackages } from "./depext.js";
import { installDune } from "./dune.js";
import {
  installOcaml,
  pin,
  repositoryAddAll,
  repositoryRemoveAll,
  setupOpam,
} from "./opam.js";
import { getOpamLocalPackages } from "./packages.js";
import { updateUnixPackageIndexFiles } from "./system.js";
import { resolveCompiler } from "./version.js";

export async function installer() {
  if (ALLOW_PRERELEASE_OPAM) {
    core.exportVariable("OPAMCONFIRMLEVEL", "unsafe-yes");
  } else {
    // [todo] remove this once opam 2.2 is released as stable.
    // https://github.com/ocaml/setup-ocaml/issues/299
    core.exportVariable("OPAMCLI", "2.0");
  }
  core.exportVariable("OPAMCOLOR", "always");
  core.exportVariable("OPAMERRLOGLEN", 0);
  core.exportVariable("OPAMJOBS", os.cpus().length);
  core.exportVariable("OPAMPRECISETRACKING", 1);
  // [todo] remove this once opam 2.2 is released as stable.
  // https://github.com/ocaml/opam/issues/3447
  core.exportVariable("OPAMSOLVERTIMEOUT", 1000);
  core.exportVariable("OPAMYES", 1);
  if (PLATFORM === "win32") {
    const opamRoot = path.join("D:", ".opam");
    core.exportVariable("OPAMROOT", opamRoot);
  }
  if (PLATFORM === "win32") {
    await core.group("Change the file system behavior parameters", async () => {
      await exec("fsutil", ["behavior", "query", "SymlinkEvaluation"]);
      // https://docs.microsoft.com/en-us/windows-server/administration/windows-commands/fsutil-behavior
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
  if (PLATFORM === "win32") {
    core.exportVariable("HOME", process.env["USERPROFILE"]);
    core.exportVariable("MSYS", "winsymlinks:native");
  }
  if (PLATFORM === "win32") {
    await restoreCygwinCache();
  }
  const opamCacheHit = await restoreOpamCache();
  await setupOpam();
  await repositoryRemoveAll();
  await repositoryAddAll(OPAM_REPOSITORIES);
  const ocamlCompiler = await resolveCompiler(OCAML_COMPILER);
  if (!opamCacheHit) {
    await installOcaml(ocamlCompiler);
    await saveOpamCache();
  }
  await restoreOpamDownloadCache();
  if (OPAM_DEPEXT) {
    await installDepext(ocamlCompiler);
  }
  if (DUNE_CACHE) {
    await restoreDuneCache();
    await installDune();
    core.exportVariable("DUNE_CACHE", "enabled");
    core.exportVariable("DUNE_CACHE_TRANSPORT", "direct");
    core.exportVariable("DUNE_CACHE_STORAGE_MODE", "copy");
  }
  core.exportVariable("CLICOLOR_FORCE", "1");
  const fnames = await getOpamLocalPackages();
  if (fnames.length > 0) {
    if (OPAM_PIN) {
      await pin(fnames);
    }
    if (OPAM_DEPEXT) {
      try {
        await installDepextPackages(fnames);
      } catch (error) {
        if (error instanceof Error) {
          core.notice(
            `An error has been caught in some system package index files, so the system package index files have been re-synchronised, and the system package installation has been retried: ${error.message.toLocaleLowerCase()}`,
          );
        }
        await updateUnixPackageIndexFiles();
        await installDepextPackages(fnames);
      }
    }
  }
  await exec("opam", ["--version"]);
  if (OPAM_DEPEXT) {
    await exec("opam", ["depext", "--version"]);
  }
  await exec("opam", ["exec", "--", "ocaml", "-version"]);
}
