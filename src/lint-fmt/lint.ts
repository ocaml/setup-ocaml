import * as core from "@actions/core";
import { exec } from "@actions/exec";

export async function checkFmt() {
  core.startGroup("Check formatting");
  await exec("opam", ["exec", "--", "dune", "build", "@fmt"]);
  core.endGroup();
}
