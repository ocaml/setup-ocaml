import * as core from "@actions/core";
import { exec } from "@actions/exec";

export async function installOpamPackages() {
  await core.group("Install opam packages", async () => {
    await exec("opam", [
      "install",
      "--deps-only",
      "--with-dev-setup",
      "--with-doc",
      "--with-test",
      ".",
    ]);
  });
}

export async function installDune() {
  await core.group("Install dune", async () => {
    await exec("opam", ["install", "dune"]);
  });
}
