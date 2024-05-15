import * as process from "node:process";
import { exec } from "@actions/exec";
import { PLATFORM } from "./constants.js";

export async function installUnixSystemPackages() {
  const isGitHubRunner = process.env.GITHUB_ACTIONS === "true";
  if (isGitHubRunner) {
    if (PLATFORM === "linux") {
      await exec("sudo", [
        "apt-get",
        "--yes",
        "install",
        "bubblewrap",
        "darcs",
        "g++-multilib",
        "gcc-multilib",
        "mercurial",
        "musl-tools",
        "rsync",
      ]);
    } else if (PLATFORM === "macos") {
      await exec("brew", ["install", "darcs", "gpatch", "mercurial"]);
    }
  }
}

export async function updateUnixPackageIndexFiles() {
  const isGitHubRunner = process.env.GITHUB_ACTIONS === "true";
  if (isGitHubRunner) {
    if (PLATFORM === "linux") {
      await exec("sudo", ["apt-get", "update"]);
    } else if (PLATFORM === "macos") {
      await exec("brew", ["update"]);
    }
  }
}
