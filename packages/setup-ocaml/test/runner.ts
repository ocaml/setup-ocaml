import * as fs from "node:fs";
import * as http from "node:http";
import type { AddressInfo } from "node:net";
import * as os from "node:os";
import * as path from "node:path";
import * as process from "node:process";

import { vi } from "vite-plus/test";
import * as yaml from "yaml";
import { z } from "zod";

export const runnerRoot = fs.mkdtempSync(
  path.join(os.tmpdir(), "setup-ocaml-test-")
);

const ActionManifest = z.object({
  inputs: z.record(z.string(), z.object({ default: z.string().optional() })),
});

const actionInputDefaults = Object.entries(
  ActionManifest.parse(
    yaml.parse(
      fs.readFileSync(new URL("../../../action.yml", import.meta.url), "utf-8")
    )
  ).inputs
).map(([name, input]) => [name, input.default ?? ""] as const);

export const setInputs = (overrides: Record<string, string> = {}) => {
  const inputs = {
    ...Object.fromEntries(actionInputDefaults),
    "github-token": "token",
    "ocaml-compiler": "5.5",
    ...overrides,
  };
  for (const [name, value] of Object.entries(inputs)) {
    vi.stubEnv(`INPUT_${name.toUpperCase()}`, value);
  }
};

const asset = (name: string) => ({
  browser_download_url: `http://127.0.0.1:1/${name}`,
  name,
});
const opamRelease = (version: string) => ({
  assets: [
    "x86_64-linux",
    "arm64-linux",
    "x86_64-macos",
    "arm64-macos",
  ].flatMap((suffix) => [
    asset(`opam-${version}-${suffix}`),
    asset(`opam-${version}-${suffix}.sig`),
  ]),
  tag_name: version,
});
const compilerPackages = (versions: string[]) =>
  versions.map((version) => ({
    path: `packages/ocaml-base-compiler/ocaml-base-compiler.${version}`,
    type: "dir",
  }));
const githubApi = new Map<string, unknown>([
  [
    "/repos/ocaml/opam/releases",
    [opamRelease("2.7.0-alpha1"), opamRelease("2.6.1")],
  ],
  [
    "/repos/ocaml/opam-repository/contents/packages/ocaml-base-compiler",
    compilerPackages([
      "4.08.1",
      "4.14.1",
      "4.14.2",
      "5.4.0",
      "5.5.0",
      "5.6.0~alpha1",
    ]),
  ],
  [
    "/repos/ocaml/opam-repository-archive/contents/packages/ocaml-base-compiler",
    compilerPackages(["3.12.1", "4.02.3"]),
  ],
  ["/repos/ocaml/example/actions/runs/123/jobs", { jobs: [], total_count: 2 }],
]);

export const githubRequests: string[] = [];

const githubServer = http.createServer((request, response) => {
  const route = decodeURIComponent(
    new URL(request.url ?? "/", "http://127.0.0.1").pathname
  );
  githubRequests.push(`${request.method} ${route}`);
  const body = githubApi.get(route);
  response.writeHead(body === undefined ? 404 : 200, {
    "content-type": "application/json",
  });
  response.end(JSON.stringify(body ?? { message: "Not Found" }));
});
await new Promise<void>((resolve) =>
  githubServer.listen(0, "127.0.0.1", resolve)
);
githubServer.unref();

for (const name of [
  "ImageOS",
  "RUNNER_DEBUG",
  "XDG_CACHE_HOME",
  "GITHUB_EVENT_PATH",
]) {
  delete process.env[name];
}

Object.assign(process.env, {
  GITHUB_API_URL: `http://127.0.0.1:${(githubServer.address() as AddressInfo).port}`,
  GITHUB_ENV: path.join(runnerRoot, "github-env"),
  GITHUB_JOB: "job",
  GITHUB_OUTPUT: path.join(runnerRoot, "github-output"),
  GITHUB_PATH: path.join(runnerRoot, "github-path"),
  GITHUB_REPOSITORY: "ocaml/example",
  GITHUB_RUN_ID: "123",
  GITHUB_STATE: path.join(runnerRoot, "github-state"),
  GITHUB_WORKFLOW: "workflow",
  GITHUB_WORKSPACE: path.join(runnerRoot, "workspace"),
  HOME: path.join(runnerRoot, "home"),
  RUNNER_ENVIRONMENT: "self-hosted",
  RUNNER_TEMP: path.join(runnerRoot, "temp"),
  RUNNER_TOOL_CACHE: path.join(runnerRoot, "tool-cache"),
});
