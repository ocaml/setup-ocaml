import * as core from "@actions/core";

import { lintOdoc } from "./odoc.js";
import { installOdoc, installOpamPackages } from "./opam.js";

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

void run();
