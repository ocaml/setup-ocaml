import * as core from "@actions/core";
import { exec } from "@actions/exec";
import * as github from "@actions/github";
import { octokit } from "./github-client.js";

const DUNE_CACHE_TOTAL_SIZE_MB = 5000;

export async function installDune() {
  await core.group("Installing dune", async () => {
    await exec("opam", ["install", "dune"]);
  });
}

export async function trimDuneCache() {
  await core.group("Clearing old dune cache files to save space", async () => {
    const {
      repo: { owner, repo },
      runId: run_id,
    } = github.context;
    const {
      data: { total_count: totalCount },
    } = await octokit.rest.actions.listJobsForWorkflowRun({
      owner,
      repo,
      run_id,
    });
    const cacheSize = Math.floor(DUNE_CACHE_TOTAL_SIZE_MB / totalCount);
    await exec("opam", [
      "exec",
      "--",
      "dune",
      "cache",
      "trim",
      `--size=${cacheSize}MB`,
    ]);
  });
}
