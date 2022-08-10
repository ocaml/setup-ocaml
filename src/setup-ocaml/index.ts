import * as core from "@actions/core";

import { installer } from "./installer";

async function run() {
  try {
    await installer();
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    }
  }
}

void run();
