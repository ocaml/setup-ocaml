import * as core from "@actions/core";
import { exec } from "@actions/exec";

export async function installOpamPackages() {
  core.startGroup("Install opam packages");
  await exec("opam", ["install", ".", "--deps-only", "--with-doc"]);
  core.endGroup();
}

export async function installOdoc() {
  core.startGroup("Install odoc");
  await exec("opam", ["depext", "--install", "conf-m4", "dune", "odoc>=1.5.0"]);
  core.endGroup();
}
