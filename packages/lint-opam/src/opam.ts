import * as core from "@actions/core";
import { exec } from "@actions/exec";

export async function installOpamPackages() {
  core.startGroup("Install opam packages");
  await exec("opam", [
    "install",
    ".",
    "--deps-only",
    "--with-test",
    "--with-doc",
  ]);
  core.endGroup();
}

export async function installOpamDuneLint() {
  core.startGroup("Install opam-dune-lint");
  await exec("opam", ["depext", "--install", "opam-dune-lint"]);
  core.endGroup();
}
