import * as core from "@actions/core";
import { exec } from "@actions/exec";

export async function installOpamPackages() {
  await core.group("Installing opam dependencies", async () => {
    await exec("opam", ["install", "--deps-only", "--with-doc", "."]);
  });
}

export async function installOdoc() {
  await core.group("Installing odoc", async () => {
    await exec("opam", ["install", "dune", "odoc>=1.5.0"]);
  });
}
