import * as core from "@actions/core";

import { lintOdoc } from "./odoc";
import { installOdoc, installOpamPackages } from "./opam";

async function run() {
  try {
    await installOpamPackages();
    await installOdoc();
    await lintOdoc();
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    }
  }
}

run();
