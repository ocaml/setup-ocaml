import * as core from "@actions/core";
import { exec } from "@actions/exec";

export async function installOcamlformat(version: string) {
  await core.group("Installing ocamlformat", async () => {
    await exec("opam", ["install", `ocamlformat=${version}`]);
  });
}

export async function installDune() {
  await core.group("Installing dune", async () => {
    await exec("opam", ["install", "dune"]);
  });
}
