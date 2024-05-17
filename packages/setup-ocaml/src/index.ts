import * as process from "node:process";

import * as core from "@actions/core";

import { installer } from "./installer.js";

async function run() {
  try {
    await installer();
    process.exit(0);
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    }
    process.exit(1);
  }
}

void run();
