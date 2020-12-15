import * as core from "@actions/core";
import * as os from "os";

import * as installer from "./installer";

async function run() {
  try {
    const numberOfProcessors = os.cpus().length;
    const jobs = numberOfProcessors + 2;
    core.exportVariable("OPAMJOBS", jobs);
    const ocamlVersion = core.getInput("ocaml-version");
    const opamRepository = core.getInput("opam-repository");
    await installer.getOpam(ocamlVersion, opamRepository);
  } catch (error) {
    core.setFailed(error.toString());
  }
}

run();
