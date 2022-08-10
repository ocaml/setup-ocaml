import * as core from "@actions/core";

import { checkFmt } from "./lint";
import { getOcamlformatVersion } from "./ocamlformat";
import { installOcamlformat } from "./opam";

async function run() {
  try {
    const version = await getOcamlformatVersion();
    await installOcamlformat(version);
    await checkFmt();
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    }
  }
}

void run();
