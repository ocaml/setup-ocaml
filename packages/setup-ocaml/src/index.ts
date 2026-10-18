import * as process from "node:process";

import * as core from "@actions/core";

import { readInputs } from "./inputs.js";
import { installer } from "./installer.js";

const run = async () => {
  try {
    const inputs = readInputs();
    await installer(inputs);
    process.exit(0);
  } catch (error) {
    if (error instanceof Error) {
      core.error(error.message);
    }
    process.exit(1);
  }
};

void run();
