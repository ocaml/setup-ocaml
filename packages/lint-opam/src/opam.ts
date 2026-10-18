import * as core from "@actions/core";
import { exec } from "@actions/exec";

export const installOpamPackages = async () => {
  await core.group("Installing opam dependencies", async () => {
    await exec("opam", [
      "install",
      "--deps-only",
      "--with-doc",
      "--with-test",
      ".",
    ]);
  });
};

export const installOpamDuneLint = async () => {
  await core.group("Installing opam-dune-lint", async () => {
    await exec("opam", ["install", "opam-dune-lint"]);
  });
};
