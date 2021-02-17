import * as core from "@actions/core";
import { exec } from "@actions/exec";
import * as os from "os";
import * as path from "path";

import { CYGWIN_ROOT } from "./constants";

async function run() {
  try {
    const updateScript = path.join(__dirname, "update-build-cache.sh");
    if (os.platform() === "win32") {
      await exec(path.join(CYGWIN_ROOT, "bin", "bash"), [
        "-l",
        updateScript,
        "build",
      ]);
    } else {
      await exec(updateScript, ["build"]);
    }
  } catch (error) {
    core.setFailed(error.toString());
  }
}

run();
