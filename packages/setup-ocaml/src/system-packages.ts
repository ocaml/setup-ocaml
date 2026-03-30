import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as core from "@actions/core";
import { exec, getExecOutput } from "@actions/exec";
import { MSYS2_ROOT, PLATFORM, RUNNER_ENVIRONMENT, WINDOWS_COMPILER } from "./constants.js";

async function checkAptInstallability(packageName: string) {
  const output = await getExecOutput("sudo", [
    "apt-cache",
    "search",
    "--names-only",
    `'^${packageName}$'`,
  ]);
  return output.stdout.length > 0;
}

async function retrieveInstallableOptionalDependencies(optionalDependencies: string[]) {
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
      break;
    }
    case "macos": {
      await exec("brew", ["install", "darcs", "mercurial"]);
      break;
    }
  }
}

export async function installMsys2Packages() {
  // Install the same base packages that opam's --cygwin-internal-install
  // provides for Cygwin (see opamInitDefaults.ml required_packages_for_cygwin).
  // MSYS2 packages are installed to C:\msys64 which is outside the opam cache,
  // so they must be pre-installed. MSVC builds use cl.exe instead of GCC.
  const packages = ["make", "tar", "unzip", "rsync"];
  if (WINDOWS_COMPILER === "mingw") {
    packages.push("mingw-w64-x86_64-gcc");
  }
  await exec(path.join(MSYS2_ROOT, "usr", "bin", "pacman.exe"), [
    "-S",
    "--noconfirm",
    "--needed",
    ...packages,
  ]);
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
      break;
    }
  }
}
