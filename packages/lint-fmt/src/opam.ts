import * as core from "@actions/core";
import { exec } from "@actions/exec";

export async function installOcamlformat(version: string) {
  core.startGroup("Install ocamlformat");
  await exec("opam", ["depext", "--install", `ocamlformat=${version}`]);
  core.endGroup();
}
