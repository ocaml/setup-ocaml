import * as core from "@actions/core";
import type { ExecOptions } from "@actions/exec";
import { exec } from "@actions/exec";

export async function lintOdoc() {
  core.startGroup("Lint odoc");
  const options: ExecOptions = {
    env: {
      ...process.env,
      PATH: process.env.PATH || "",
      ODOC_WARN_ERROR: "true",
    },
  };
  const exitCode = await exec(
    "opam",
    ["exec", "--", "dune", "build", "@doc"],
    options
  );
  if (exitCode !== 0) {
    throw new Error("dune build @doc failed");
  }
  core.endGroup();
}
