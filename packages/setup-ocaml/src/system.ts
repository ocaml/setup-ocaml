import { promises as fs } from "node:fs";
import * as os from "node:os";

import { exec, getExecOutput } from "@actions/exec";

import { Architecture, Platform } from "./constants";

export function getArchitecture() {
  switch (os.arch()) {
    case "x64": {
      return Architecture.X86_64;
    }
    case "arm64": {
      return Architecture.ARM;
    }
    default: {
      throw new Error("The architecture is not supported.");
    }
  }
}

export function getPlatform() {
  switch (os.platform()) {
    case "linux": {
      return Platform.Linux;
    }
    case "darwin": {
      return Platform.MacOS;
    }
    case "win32": {
      return Platform.Win32;
    }
    default: {
      throw new Error("The platform is not supported.");
    }
  }
}

export async function getSystemIdentificationInfo() {
  const platform = getPlatform();
  if (platform === Platform.Linux) {
    const osRelease = await fs.readFile("/etc/os-release", "utf8");
    const lines = osRelease.split(os.EOL);
    let id = "";
    let version = "";
    for (const line of lines) {
      const [key, value] = line.split("=").map((kv) => kv.trim());
      if (key === "ID" && value !== undefined) {
        id = value.toLowerCase();
      } else if (key === "VERSION_ID" && value !== undefined) {
        version = value.toLowerCase().replaceAll('"', "");
      }
    }
    return { id, version };
  } else if (platform === Platform.MacOS) {
    const swVers = await getExecOutput("sw_vers");
    const lines = swVers.stdout.split(os.EOL);
    let version = "";
    for (const line of lines) {
      const [key, value] = line.split(":").map((kv) => kv.trim());
      if (key === "ProductVersion" && value !== undefined) {
        version = value;
      }
    }
    return { id: "macos", version };
  } else {
    throw new Error("The system is not supported.");
  }
}

export async function updateUnixPackageIndexFiles() {
  const isGitHubRunner = process.env["ImageOS"] !== undefined;
  const platform = getPlatform();
  if (isGitHubRunner) {
    if (platform === Platform.Linux) {
      await exec("sudo", ["apt-get", "update"]);
    } else if (platform === Platform.MacOS) {
      await exec("brew", ["update"]);
    }
  }
}
