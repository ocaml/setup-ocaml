import * as core from "@actions/core";
import { exec } from "@actions/exec";
import * as os from "os";
import * as path from "path";

import { CYGWIN_ROOT } from "./constants";
import * as installer from "./installer";

async function run() {
  try {
    const numberOfProcessors = os.cpus().length;
    const jobs = numberOfProcessors + 2;
    core.exportVariable("OPAMJOBS", jobs);
    const ocamlVersion = core.getInput("ocaml-version");
    const opamRepository = core.getInput("opam-repository");
    const installScript = path.join(__dirname, "install-ocaml.sh");
    const updateScript = path.join(__dirname, "update-build-cache.sh");
    await installer.getOpam(opamRepository);
    if (os.platform() === "win32") {
      await exec(path.join(CYGWIN_ROOT, "bin", "bash"), [
        "-l",
        installScript,
        ocamlVersion,
      ]);
    } else {
      await exec(installScript, [ocamlVersion]);
    }
    await exec(
      "opam",
      ["install", "-y"].concat(
        os.platform() === "win32"
          ? ["depext-cygwinports", "depext"]
          : ["depext"]
      )
    );
    /* XXX Platform-independent function for invoking a shell script */
    if (os.platform() === "win32") {
      await exec(path.join(CYGWIN_ROOT, "bin", "bash"), [
        "-l",
        updateScript,
        "compiler",
      ]);
    } else {
      await exec(updateScript, ["compiler"]);
    }
  } catch (error) {
    core.setFailed(error.toString());
  }
}

run();
