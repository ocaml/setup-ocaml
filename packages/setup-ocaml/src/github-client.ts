import * as github from "@actions/github";
import { retry } from "@octokit/plugin-retry";

export function createOctokit(token: string) {
  return github.getOctokit(token, undefined, retry);
}

export type Octokit = ReturnType<typeof createOctokit>;
