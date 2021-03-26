import { exec } from "@actions/exec";
import * as github from "@actions/github";

import { GITHUB_TOKEN } from "./constants";
import { startProfiler, stopProfiler } from "./profiler";

const {
  repo: { owner, repo },
  runId: run_id,
} = github.context;

export async function installDune(): Promise<void> {
  const groupName = "Install dune";
  startProfiler(groupName);
  await exec("opam", ["depext", "dune", "--install"]);
  stopProfiler(groupName);
}

export async function trimDuneCache(): Promise<void> {
  const groupName = "Remove oldest files from the dune cache to free space";
  startProfiler(groupName);
  const octokit = github.getOctokit(GITHUB_TOKEN);
  const {
    data: { total_count: totalCount },
  } = await octokit.rest.actions.listJobsForWorkflowRun({
    owner,
    repo,
    run_id,
  });
  const cacheSize = Math.floor(5000 / totalCount);
  await exec("opam", [
    "exec",
    "--",
    "dune",
    "cache",
    "trim",
    "--size",
    `${cacheSize}MB`,
  ]);
  stopProfiler(groupName);
}
