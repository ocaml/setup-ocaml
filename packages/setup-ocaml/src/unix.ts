import * as process from "node:process";
import { exec, getExecOutput } from "@actions/exec";
import { PLATFORM } from "./constants.js";

async function checkInstallability(packageName: string) {
  const output = await getExecOutput("sudo", [
    "apt-cache",
    "search",
    "--names-only",
    `'^${packageName}$'`,
  ]);
  return output.stdout.length !== 0;
}

export async function installUnixSystemPackages() {
  const isGitHubRunner = process.env.GITHUB_ACTIONS === "true";
  if (isGitHubRunner) {
    if (PLATFORM === "linux") {
      const darcs = await (async () => {
        const installability = await checkInstallability("darcs");
        if (installability) {
          return ["darcs"];
        }
        return [];
      })();
      await exec("sudo", [
        "apt-get",
        "--yes",
        "install",
        "bubblewrap",
        "g++-multilib",
        "gcc-multilib",
        "mercurial",
        "musl-tools",
        "rsync",
        ...darcs,
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
