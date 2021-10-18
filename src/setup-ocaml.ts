import * as core from "@actions/core";
import * as os from "os";

import { OCAML_VERSION, OPAM_REPOSITORY } from "./constants";
import * as installer from "./installer";

async function run() {
  try {
    const numberOfProcessors = os.cpus().length;
    const jobs = numberOfProcessors + 2;
    core.exportVariable("OPAMJOBS", jobs);
    await installer.getOpam(OCAML_VERSION, OPAM_REPOSITORY);
  } catch (error) {
    core.setFailed(error.toString());
  }
}

run();
