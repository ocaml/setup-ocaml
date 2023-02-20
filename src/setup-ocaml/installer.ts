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
import { isSemverStyle, resolveVersion } from "./version";

export async function installer(): Promise<void> {
  const platform = getPlatform();
  const numberOfProcessors = os.cpus().length;
  const isDebug = core.isDebug();
  core.exportVariable("OPAMCLI", "2.0");
  core.exportVariable("OPAMCOLOR", "always");
  core.exportVariable("OPAMERRLOGLEN", 0);
  core.exportVariable("OPAMJOBS", numberOfProcessors);
  core.exportVariable("OPAMPRECISETRACKING", 1);
  // [todo] remove this line once we unlock opam 2.2
  // https://github.com/ocaml/opam/issues/3447
  core.exportVariable("OPAMSOLVERTIMEOUT", 1000);
  core.exportVariable("OPAMVERBOSE", isDebug);
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
    const ocamlCompiler = isSemverStyle(OCAML_COMPILER)
      ? platform === Platform.Win32
        ? `ocaml-variants.${await resolveVersion(OCAML_COMPILER)}+mingw64c`
        : `ocaml-base-compiler.${await resolveVersion(OCAML_COMPILER)}`
      : OCAML_COMPILER;
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
          core.error(error.message);
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
