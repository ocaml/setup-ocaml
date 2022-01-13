import * as core from "@actions/core";
import { exec } from "@actions/exec";

export async function installOcamlformat(version: string | undefined) {
  core.startGroup("Install ocamlformat");
  const dep = `ocamlformat${version ? `=${version}` : ""}`;
  await exec("opam", ["depext", "--install", dep]);
  core.endGroup();
}
