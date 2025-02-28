import * as process from "node:process";
import { exec, getExecOutput } from "@actions/exec";
import { PLATFORM, DISTRO } from "./constants.js";

async function checkInstallability(packageName: string) {
    let output;
    if (DISTRO === "alpine") {
        output = await getExecOutput("apk", [
            "search",
            "--exact",
            packageName,
        ]);
    } else {
     output = await getExecOutput("sudo", [
        "apt-cache",
        "search",
        "--names-only",
        `'^${packageName}$'`,
    ]);
}
  return output.stdout.length > 0;
}

async function retrieveInstallableOptionalDependencies(
  optionalDependencies: string[],
) {
  switch (PLATFORM) {
    case "linux": {
      const installableOptionalDependencies: string[] = [];
      for (const optionalDependency of optionalDependencies) {
        const isInstallable = await checkInstallability(optionalDependency);
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
  
  if (isGitHubRunner) {
    if (PLATFORM === "linux") {
        if (DISTRO === "alpine") {
            const optionalDependencies = await retrieveInstallableOptionalDependencies([
                //"darcs", does not exist on alpine?
                "mercurial",
            ]);
            await exec("apk", [
                "add",
                "make",
                "build-base",
                "bubblewrap",
                "rsync",
                ...optionalDependencies,
            ]); 
        } else {
            const optionalDependencies = await retrieveInstallableOptionalDependencies([
                "darcs",
                "g++-multilib",
                "gcc-multilib",
                "mercurial",
            ]);
            await exec("sudo", [
                "apt-get",
                "--yes",
                "install",
                "bubblewrap",
                "musl-tools",
                "rsync",
                ...optionalDependencies,
            ]);
        }
    } else if (PLATFORM === "macos") {
      await exec("brew", ["install", "darcs", "gpatch", "mercurial"]);
    }
  }
}

export async function updateUnixPackageIndexFiles() {
  const isGitHubRunner = process.env.GITHUB_ACTIONS === "true";
  if (isGitHubRunner) {
    if (PLATFORM === "linux") {
        if (DISTRO === "alpine") {
            await exec("apk", ["update"]);
        } else {
            await exec("sudo", ["apt-get", "update"]);
        }
    } else if (PLATFORM === "macos") {
      await exec("brew", ["update"]);
    }
  }
}
