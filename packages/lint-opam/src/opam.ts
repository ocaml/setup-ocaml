import * as core from "@actions/core";
import { exec } from "@actions/exec";

export async function installOpamPackages() {
  await core.group("Installing opam dependencies", async () => {
    await exec("opam", [
      "install",
      "--deps-only",
      "--with-doc",
      "--with-test",
      ".",
    ]);
  });
}

export async function installOpamDuneLint() {
  await core.group("Installing opam-dune-lint", async () => {
    await exec("opam", ["install", "opam-dune-lint"]);
  });
}
