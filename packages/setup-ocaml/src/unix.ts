import * as process from "node:process";
import { exec, getExecOutput } from "@actions/exec";
import { PLATFORM } from "./constants.js";

async function checkAptInstallability(packageName: string) {
  const output = await getExecOutput("sudo", [
    "apt-cache",
    "search",
    "--names-only",
    `'^${packageName}$'`,
  ]);
  return output.stdout.length > 0;
}

async function retrieveInstallableOptionalDependencies(
  optionalDependencies: string[],
) {
  switch (PLATFORM) {
    case "linux": {
      const installableOptionalDependencies: string[] = [];
      for (const optionalDependency of optionalDependencies) {
        const isInstallable = await checkAptInstallability(optionalDependency);
        if (isInstallable) {
          installableOptionalDependencies.push(optionalDependency);
        }
      }
      return installableOptionalDependencies;
    }
    default: {
      return [];
    }
  }
}

export async function installUnixSystemPackages() {
  const isGitHubRunner = process.env.GITHUB_ACTIONS === "true";
  const optionalDependencies = await retrieveInstallableOptionalDependencies([
    "darcs",
    "mercurial",
  ]);
  if (isGitHubRunner) {
    if (PLATFORM === "linux") {
      await exec("sudo", [
        "apt-get",
        "--yes",
        "install",
        "bubblewrap",
        "g++-multilib",
        "gcc-multilib",
        "musl-tools",
        "rsync",
        ...optionalDependencies,
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
