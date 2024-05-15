import * as process from "node:process";
import { exec } from "@actions/exec";

export async function lintOdoc() {
  const exitCode = await exec("opam", ["exec", "--", "dune", "build", "@doc"], {
    env: {
      ...process.env,
      PATH: process.env.PATH ?? "",
      ODOC_WARN_ERROR: "true",
    },
  });
  if (exitCode !== 0) {
    throw new Error("dune build @doc failed");
  }
}
