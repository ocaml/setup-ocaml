import * as path from "node:path";
import * as process from "node:process";
import * as core from "@actions/core";
import { lintOdoc } from "./odoc.js";
import { installOdoc, installOpamPackages } from "./opam.js";

async function run() {
  try {
    const workingDirectory = core.getInput("working-directory");
    const githubWorkspace = process.env.GITHUB_WORKSPACE ?? process.cwd();
    process.chdir(path.resolve(githubWorkspace, workingDirectory));
    await installOpamPackages();
    await installOdoc();
    await lintOdoc();
    process.exit(0);
  } catch (error) {
    if (error instanceof Error) {
      core.error(error.message);
    }
    process.exit(1);
  }
}

void run();
