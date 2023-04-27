import * as core from "@actions/core";

import { saveDuneCache, saveOpamDownloadCache } from "./cache";
import { DUNE_CACHE } from "./constants";
import { trimDuneCache } from "./dune";

async function run() {
  try {
    if (DUNE_CACHE) {
      await trimDuneCache();
      await saveDuneCache();
    }
    await saveOpamDownloadCache();
  } catch (error) {
    if (error instanceof Error) {
      core.error(error.message);
    }
  }
}

void run();
