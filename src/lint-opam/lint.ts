import { exec } from "@actions/exec";

export async function opamLint() {
  await exec("opam", ["lint"]);
}

export async function opamDuneLint() {
  await exec("opam", ["exec", "--", "opam-dune-lint"]);
}
