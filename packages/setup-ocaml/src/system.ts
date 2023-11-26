import { promises as fs } from "node:fs";
import * as os from "node:os";

import { exec, getExecOutput } from "@actions/exec";

import { PLATFORM } from "./constants.js";

export async function getSystemIdentificationInfo() {
  if (PLATFORM === "linux") {
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
  } else if (PLATFORM === "macos") {
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
  if (isGitHubRunner) {
    if (PLATFORM === "linux") {
      await exec("sudo", ["apt-get", "update"]);
    } else if (PLATFORM === "macos") {
      await exec("brew", ["update"]);
    }
  }
}
