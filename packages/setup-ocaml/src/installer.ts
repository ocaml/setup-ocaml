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
} from "./cache";
import {
  DUNE_CACHE,
  OCAML_COMPILER,
  OPAM_DEPEXT,
  OPAM_PIN,
  OPAM_REPOSITORIES,
  Platform,
} from "./constants";
import { installDepext, installDepextPackages } from "./depext";
import { installDune } from "./dune";
import {
  installOcaml,
  pin,
  repositoryAddAll,
  repositoryRemoveAll,
  setupOpam,
} from "./opam";
import { getOpamLocalPackages } from "./packages";
import { getPlatform, updateUnixPackageIndexFiles } from "./system";
import { resolveCompiler } from "./version";

export async function installer() {
  const platform = getPlatform();
  core.exportVariable("OPAMCLI", "2.0");
  core.exportVariable("OPAMCOLOR", "always");
  core.exportVariable("OPAMERRLOGLEN", 0);
  core.exportVariable("OPAMJOBS", os.cpus().length);
  core.exportVariable("OPAMPRECISETRACKING", 1);
  // [todo] remove this once opam 2.2 is released as stable.
  // https://github.com/ocaml/opam/issues/3447
  core.exportVariable("OPAMSOLVERTIMEOUT", 1000);
  core.exportVariable("OPAMYES", 1);
  if (platform === Platform.Win32) {
    const opamRoot = path.join("D:", ".opam");
    core.exportVariable("OPAMROOT", opamRoot);
  }
  if (platform === Platform.Win32) {
    core.startGroup("Change the file system behavior parameters");
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
    core.endGroup();
  }
  if (platform === Platform.Win32) {
    core.exportVariable("HOME", process.env["USERPROFILE"]);
    core.exportVariable("MSYS", "winsymlinks:native");
  }
  if (platform === Platform.Win32) {
    await restoreCygwinCache();
  }
  const opamCacheHit = await restoreOpamCache();
  await setupOpam();
  await repositoryRemoveAll();
  await repositoryAddAll(OPAM_REPOSITORIES);
  if (!opamCacheHit) {
    const ocamlCompiler = await resolveCompiler(OCAML_COMPILER);
    await installOcaml(ocamlCompiler);
    await saveOpamCache();
  }
  await restoreOpamDownloadCache();
  if (OPAM_DEPEXT) {
    await installDepext(platform);
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
