import * as core from "@actions/core";
import { exec } from "@actions/exec";

export async function installOcamlformat(version: string) {
  await core.group("Install ocamlformat", async () => {
    await exec("opam", ["install", `ocamlformat=${version}`]);
  });
}
