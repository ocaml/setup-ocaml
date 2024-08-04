import * as process from "node:process";
import * as core from "@actions/core";
import { checkFmt } from "./lint.js";
import { getOcamlformatVersion } from "./ocamlformat.js";
import { installDune, installOcamlformat } from "./opam.js";

async function run() {
  try {
    const version = await getOcamlformatVersion();
    if (version) {
      await installOcamlformat(version);
    }
    await installDune();
    await checkFmt();
    process.exit(0);
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    }
    process.exit(1);
  }
}

void run();
