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
