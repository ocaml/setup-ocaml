import * as core from "@actions/core";
import { exec } from "@actions/exec";
import * as os from "os";
import * as path from "path";
import * as process from "process";

import {
  restoreCygwinCache,
  restoreDuneCache,
  restoreOpamCache,
  restoreOpamDownloadCache,
  saveOpamCache,
} from "./cache";
import {
  DEFAULT_REPOSITORY,
  DUNE_CACHE,
  OCAML_COMPILER,
  OPAM_DEPEXT,
  OPAM_PIN,
  OPAM_REPOSITORIES,
  Platform,
} from "./constants";
import { installDepext, installSystemPackages } from "./depext";
import { installDune } from "./dune";
import {
  installOcaml,
  pin,
  repositoryAddAll,
  repositoryRemoveAll,
  setupOpam,
} from "./opam";
import { getOpamLocalPackages } from "./packages";
import { getPlatform } from "./system";
import { isSemverStyle, resolveVersion } from "./version";

export async function installer(): Promise<void> {
  const platform = getPlatform();
  const numberOfProcessors = os.cpus().length;
  const isDebug = core.isDebug();
  core.exportVariable("OPAMCOLOR", "always");
  core.exportVariable("OPAMERRLOGLEN", 0);
  core.exportVariable("OPAMJOBS", numberOfProcessors);
  core.exportVariable("OPAMPRECISETRACKING", 1);
  core.exportVariable("OPAMSOLVERTIMEOUT", 500);
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
    core.exportVariable("HOME", process.env.USERPROFILE);
    core.exportVariable("MSYS", "winsymlinks:native");
  }
  if (platform === Platform.Win32) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const originalPath = process.env.PATH!.split(path.delimiter);
    const msys64Path = path.join("C:", "msys64", "usr", "bin");
    const patchedPath = [msys64Path, ...originalPath];
    process.env.PATH = patchedPath.join(path.delimiter);
    await restoreCygwinCache();
    process.env.PATH = originalPath.join(path.delimiter);
  }
  let opamCacheHit;
  if (platform === Platform.Win32) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const originalPath = process.env.PATH!.split(path.delimiter);
    const msys64Path = path.join("C:", "msys64", "usr", "bin");
    const patchedPath = [msys64Path, ...originalPath];
    process.env.PATH = patchedPath.join(path.delimiter);
    opamCacheHit = await restoreOpamCache();
    process.env.PATH = originalPath.join(path.delimiter);
  } else {
    opamCacheHit = await restoreOpamCache();
  }
  await setupOpam();
  if (
    JSON.stringify(OPAM_REPOSITORIES) !==
    JSON.stringify([["default", DEFAULT_REPOSITORY]])
  ) {
    await repositoryRemoveAll();
    await repositoryAddAll(OPAM_REPOSITORIES);
  }
  if (!opamCacheHit) {
    const ocamlCompiler = isSemverStyle(OCAML_COMPILER)
      ? platform === Platform.Win32
        ? `ocaml-variants.${await resolveVersion(OCAML_COMPILER)}+mingw64c`
        : `ocaml-base-compiler.${await resolveVersion(OCAML_COMPILER)}`
      : OCAML_COMPILER;
    await installOcaml(ocamlCompiler);
    if (platform === Platform.Win32) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const originalPath = process.env.PATH!.split(path.delimiter);
      const msys64Path = path.join("C:", "msys64", "usr", "bin");
      const patchedPath = [msys64Path, ...originalPath];
      process.env.PATH = patchedPath.join(path.delimiter);
      await saveOpamCache();
      process.env.PATH = originalPath.join(path.delimiter);
    } else {
      await saveOpamCache();
    }
  }
  if (platform === Platform.Win32) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const originalPath = process.env.PATH!.split(path.delimiter);
    const msys64Path = path.join("C:", "msys64", "usr", "bin");
    const patchedPath = [msys64Path, ...originalPath];
    process.env.PATH = patchedPath.join(path.delimiter);
    await restoreOpamDownloadCache();
    process.env.PATH = originalPath.join(path.delimiter);
  } else {
    await restoreOpamDownloadCache();
  }
  await installDepext(platform);
  if (DUNE_CACHE) {
    if (platform === Platform.Win32) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const originalPath = process.env.PATH!.split(path.delimiter);
      const msys64Path = path.join("C:", "msys64", "usr", "bin");
      const patchedPath = [msys64Path, ...originalPath];
      process.env.PATH = patchedPath.join(path.delimiter);
      await restoreDuneCache();
      process.env.PATH = originalPath.join(path.delimiter);
    } else {
      await restoreDuneCache();
    }
    await installDune();
    core.exportVariable("DUNE_CACHE", "enabled");
    core.exportVariable("DUNE_CACHE_TRANSPORT", "direct");
  }
  const fnames = await getOpamLocalPackages();
  if (fnames.length > 0) {
    if (OPAM_PIN) {
      await pin(fnames);
    }
    if (OPAM_DEPEXT) {
      await installSystemPackages(fnames);
    }
  }
  await exec("opam", ["--version"]);
  await exec("opam", ["depext", "--version"]);
  await exec("opam", ["exec", "--", "ocaml", "-version"]);
}
