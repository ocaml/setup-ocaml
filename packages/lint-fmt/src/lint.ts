import { exec } from "@actions/exec";

export const checkFmt = async () => {
  await exec("opam", ["exec", "--", "dune", "build", "@fmt"]);
};
