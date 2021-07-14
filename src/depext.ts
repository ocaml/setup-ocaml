import * as core from "@actions/core";
import { exec } from "@actions/exec";
import * as path from "path";

import { OPAM_DEPEXT_FLAGS, Platform } from "./constants";
import { getPlatform } from "./system";

export async function installDepext(ocamlVersion: string): Promise<void> {
  core.startGroup("Install depext");
  const platform = getPlatform();
  const depextCygwinports =
    platform === Platform.Win32 ? ["depext-cygwinports"] : [];
  await exec("opam", ["install", "opam-depext", ...depextCygwinports]);
  if (platform === Platform.Win32) {
    let base = "";
    if (ocamlVersion.includes("mingw64")) {
      base = "x86_64-w64-mingw32";
    } else if (ocamlVersion.includes("mingw32")) {
      base = "i686-w64-mingw32";
    }
    core.addPath(path.posix.join("/", "usr", base, "sys-root", "mingw", "bin"));
  }
  core.endGroup();
}

export async function installSystemPackages(fpaths: string[]): Promise<void> {
  core.startGroup("Install system packages required by opam packages");
  const fnames = fpaths.map((fpath) => path.basename(fpath, ".opam"));
  await exec("opam", ["depext", ...fnames, ...OPAM_DEPEXT_FLAGS, "--update"]);
  core.endGroup();
}
