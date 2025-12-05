import * as fs from "node:fs/promises";
import * as core from "@actions/core";
import { exec, getExecOutput } from "@actions/exec";
import { DISTRO, PLATFORM, RUNNER_ENVIRONMENT } from "./constants.js";

async function checkInstallability(packageName: string) {
  let output;
  if (DISTRO === "alpine") {
    output = await getExecOutput("apk", ["search", "--exact", packageName]);
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

async function skipPackageManagement() {
  // Skip package management if running in a self-hosted environment or in a
  // github-hosted Docker container.
  let isContainerRunner = false;
  try {
    await fs.access("/.dockerenv", fs.constants.R_OK);
    isContainerRunner = true;
  } catch {
    isContainerRunner = false;
  }
  return RUNNER_ENVIRONMENT === "self-hosted" || isContainerRunner;
}

async function disableManDbAutoUpdate() {
  try {
    await exec("sudo", ["debconf-communicate"], {
      input: Buffer.from("set man-db/auto-update false"),
    });
  } catch (error) {
    if (error instanceof Error) {
      core.info(error.message);
    }
  }
  try {
    await exec("sudo", ["dpkg-reconfigure", "man-db"]);
  } catch (error) {
    if (error instanceof Error) {
      core.info(error.message);
    }
  }
}

export async function installUnixSystemPackages() {
  if (await skipPackageManagement()) {
    return;
  }
  switch (PLATFORM) {
    case "linux": {
      await disableManDbAutoUpdate();
      const optionalDependencies =
        await retrieveInstallableOptionalDependencies([
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
      break;
    }
    case "macos": {
      await exec("brew", ["install", "darcs", "mercurial"]);
      break;
    }
  }
}

export async function updateUnixPackageIndexFiles() {
  if (await skipPackageManagement()) {
    return;
  }
  switch (PLATFORM) {
    case "linux": {
      await exec("sudo", ["apt-get", "update"]);
      break;
    }
    case "macos": {
      await exec("brew", ["update"]);
    }
  }
}
