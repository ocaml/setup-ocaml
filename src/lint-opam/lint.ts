import * as core from "@actions/core";
import { exec } from "@actions/exec";

export async function opamLint() {
  core.startGroup("Check package description of opam files");
  await exec("opam", ["lint"]);
  core.endGroup();
}

export async function opamDuneLint() {
  core.startGroup("Check dune and opam dependencies are consistent");
  await exec("opam", ["exec", "--", "opam-dune-lint"]);
  core.endGroup();
}
