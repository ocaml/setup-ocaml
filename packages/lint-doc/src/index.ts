import * as process from "node:process";

import * as core from "@actions/core";

import { lintOdoc } from "./odoc.js";
import { installOdoc, installOpamPackages } from "./opam.js";

async function run() {
  try {
    await installOpamPackages();
    await installOdoc();
    await lintOdoc();
    process.exit(0);
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    }
    process.exit(1);
  }
}

void run();
