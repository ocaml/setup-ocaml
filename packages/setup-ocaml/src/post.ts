import * as process from "node:process";
import * as core from "@actions/core";
import { DUNE_CACHE_KEY_STATE, saveDuneCache } from "./cache.js";
import { trimDuneCache } from "./dune.js";
import { createOctokit } from "./github-client.js";

async function run() {
  try {
    const duneCacheKey = core.getState(DUNE_CACHE_KEY_STATE);
    if (duneCacheKey) {
      const octokit = createOctokit(core.getInput("github-token"));
      await trimDuneCache(octokit);
      await saveDuneCache(duneCacheKey);
    }
    process.exit(0);
  } catch (error) {
    if (error instanceof Error) {
      core.error(error.message);
    }
    // The post step should not fail if there is an error...
    process.exit(0);
  }
}

void run();
