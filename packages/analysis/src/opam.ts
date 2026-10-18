import * as core from "@actions/core";
import { exec } from "@actions/exec";

export const installOpamPackages = async () => {
  await core.group("Installing opam dependencies", async () => {
    await exec("opam", [
      "install",
      "--deps-only",
      "--with-dev-setup",
      "--with-doc",
      "--with-test",
      ".",
    ]);
  });
};

export const installDune = async () => {
  await core.group("Installing dune", async () => {
    await exec("opam", ["install", "dune"]);
  });
};
