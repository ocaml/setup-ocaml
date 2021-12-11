import * as core from "@actions/core";

import { opamDuneLint, opamLint } from "./lint";
import { installOpamDuneLint, installOpamPackages } from "./opam";

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

run();
