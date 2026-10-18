import { exec } from "@actions/exec";

export const opamLint = async () => {
  await exec("opam", ["lint"]);
};

export const opamDuneLint = async () => {
  await exec("opam", ["exec", "--", "opam-dune-lint"]);
};
