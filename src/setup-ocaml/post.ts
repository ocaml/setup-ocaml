import * as path from "node:path";

import * as core from "@actions/core";

import { saveDuneCache, saveOpamCache, saveOpamDownloadCache } from "./cache";
import { DUNE_CACHE, Platform } from "./constants";
import { trimDuneCache } from "./dune";
import { getPlatform } from "./system";

async function run() {
  try {
    const platform = getPlatform();
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const originalPath = process.env["PATH"]!.split(path.delimiter);
    if (platform === Platform.Win32) {
      const msys64Path = path.join("C:", "msys64", "usr", "bin");
      const patchedPath = [msys64Path, ...originalPath];
      process.env["PATH"] = patchedPath.join(path.delimiter);
    }
    if (DUNE_CACHE) {
      await trimDuneCache();
      await saveDuneCache();
    }
    await saveOpamDownloadCache();
    await saveOpamCache();
    if (platform === Platform.Win32) {
      process.env["PATH"] = originalPath.join(path.delimiter);
    }
  } catch (error) {
    if (error instanceof Error) {
      core.error(error.message);
    }
  }
}

void run();
