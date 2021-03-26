import * as core from "@actions/core";

import { installer } from "./installer";

async function run() {
  try {
    await installer();
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
