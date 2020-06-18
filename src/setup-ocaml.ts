import * as core from "@actions/core";

import * as installer from "./installer";

async function run() {
  try {
    const ocamlVersion = core.getInput("ocaml-version");
    const opamRepository = core.getInput("opam-repository");
    await installer.getOpam(ocamlVersion, opamRepository);
  } catch (error) {
    core.setFailed(error.toString());
  }
}

run();
