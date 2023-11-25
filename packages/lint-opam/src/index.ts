import * as core from "@actions/core";

import { opamDuneLint, opamLint } from "./lint.js";
import { installOpamDuneLint, installOpamPackages } from "./opam.js";

async function run() {
  try {
    await installOpamPackages();
    await installOpamDuneLint();
    await opamLint();
    await opamDuneLint();
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    }
  }
}

void run();
