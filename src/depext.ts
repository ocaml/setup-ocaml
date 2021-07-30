import * as core from "@actions/core";
import { exec } from "@actions/exec";
import * as path from "path";

export async function installDepextWindows(
  ocamlVersion: string
): Promise<void> {
  core.startGroup("Install depext");
  await exec("opam", ["install", "opam-depext", "depext-cygwinports"]);
  let base = "";
  if (ocamlVersion.includes("mingw64")) {
    base = "x86_64-w64-mingw32";
  } else if (ocamlVersion.includes("mingw32")) {
    base = "i686-w64-mingw32";
  }
  core.addPath(path.posix.join("/", "usr", base, "sys-root", "mingw", "bin"));
  core.endGroup();
}
