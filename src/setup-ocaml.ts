import * as core from "@actions/core";

import * as installer from "./installer";

async function run() {
  try {
    const ocamlVersion = core.getInput("ocaml-version");
    await installer.getOpam(ocamlVersion);
  } catch (error) {
    core.setFailed(error.toString());
  }
}

run();
