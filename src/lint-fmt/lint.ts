import { exec } from "@actions/exec";

export async function checkFmt() {
  await exec("opam", ["exec", "--", "dune", "build", "@fmt"]);
}
