import * as process from "node:process";
import { exec } from "@actions/exec";

export async function lintOdoc() {
  const exitCode = await exec("opam", ["exec", "--", "dune", "build", "@doc"], {
    // @ts-expect-error: process.env may contain undefined values
    env: {
      ...process.env,
      PATH: process.env.PATH ?? "",
      ODOC_WARN_ERROR: "true",
    },
  });
  if (exitCode !== 0) {
    throw new Error(
      "Odoc build failed. The 'dune build @doc' command exited with a non-zero status. Please check your odoc comments for errors.",
    );
  }
}
