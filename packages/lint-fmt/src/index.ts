import * as process from "node:process";
import * as core from "@actions/core";
import { checkFmt } from "./lint.js";
import { retrieveOcamlformatVersion } from "./ocamlformat.js";
import { installDune, installOcamlformat } from "./opam.js";

async function run() {
  try {
    const version = await retrieveOcamlformatVersion();
    if (version) {
      await installOcamlformat(version);
    }
    await installDune();
    await checkFmt();
    process.exit(0);
  } catch (error) {
    if (error instanceof Error) {
      core.error(error.message);
    }
    process.exit(1);
  }
}

void run();
