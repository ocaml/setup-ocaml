import * as core from "@actions/core";
import { exec } from "@actions/exec";

export const installOpamPackages = async () => {
  await core.group("Installing opam dependencies", async () => {
    await exec("opam", ["install", "--deps-only", "--with-doc", "."]);
  });
};

export const installOdoc = async () => {
  await core.group("Installing odoc", async () => {
    await exec("opam", ["install", "dune", "odoc>=1.5.0"]);
  });
};
