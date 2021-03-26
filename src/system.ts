import type { ExecOptions } from "@actions/exec";
import { exec } from "@actions/exec";
import { promises as fs } from "fs";
import * as os from "os";

import { Architecture, Platform } from "./constants";

export function getArchitecture(): Architecture {
  switch (os.arch()) {
    case "x64":
      return Architecture.X86_64;
    default:
      throw new Error("The architecture is not supported.");
  }
}

export function getPlatform(): Platform {
  switch (os.platform()) {
    case "linux":
      return Platform.Linux;
    case "darwin":
      return Platform.MacOS;
    case "win32":
      return Platform.Win32;
    default:
      throw new Error("The platform is not supported.");
  }
}

export async function getSystemIdentificationInfo(): Promise<{
  id: string;
  version: string;
}> {
  const platform = getPlatform();
  if (platform === Platform.Linux) {
    const osRelease = (await fs.readFile("/etc/os-release")).toString();
    const lines = osRelease.split(os.EOL);
    let id = "";
    let version = "";
    for (const line of lines) {
      const [key, value] = line.split("=").map((kv) => kv.trim());
      if (key === "ID") {
        id = value.toLowerCase();
      } else if (key === "VERSION_ID") {
        version = value.toLowerCase().replace(/["]/g, "");
      }
    }
    return { id, version };
  } else if (platform === Platform.MacOS) {
    let output = "";
    const options: ExecOptions = { silent: true };
    options.listeners = {
      stdout: (data) => {
        output += data.toString();
      },
    };
    await exec("sw_vers", undefined, options);
    const lines = output.split(os.EOL);
    let version = "";
    for (const line of lines) {
      const [key, value] = line.split(":").map((kv) => kv.trim());
      if (key === "ProductVersion") {
        version = value;
      }
    }
    return { id: "macos", version };
  } else {
    throw new Error("The system is not supported.");
  }
}
