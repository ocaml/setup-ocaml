import * as github from "@actions/github";
import { retry } from "@octokit/plugin-retry";
import { GITHUB_TOKEN } from "./constants.js";

export const octokit = github.getOctokit(GITHUB_TOKEN, undefined, retry);
