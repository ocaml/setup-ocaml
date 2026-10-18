import * as fs from "node:fs";
import * as path from "node:path";
import * as process from "node:process";

import { afterEach, beforeEach, expect, vi, test } from "vite-plus/test";

import { ARCHITECTURE, PLATFORM } from "../src/constants.js";
import { readInputs } from "../src/inputs.js";
import { installer } from "../src/installer.js";
import { githubRequests, runnerRoot, setInputs } from "./runner.js";

const recorded = vi.hoisted(() => ({
  cacheEntries: new Set<string>(),
  transcript: [] as string[],
}));

vi.mock(import("@actions/cache"), () => ({
  isFeatureAvailable: () => true,
  restoreCache: (paths, key, restoreKeys = [], options = {}) => {
    const hit = [key, ...restoreKeys].find((candidate) =>
      [...recorded.cacheEntries].some((entry) => entry.startsWith(candidate))
    );
    const mode = options.lookupOnly === true ? "look up" : "restore";
    recorded.transcript.push(
      `cache ${mode} ${key}: ${hit === undefined ? "miss" : "hit"}`,
      ...paths.map((cachePath) => `  ${cachePath}`)
    );
    return Promise.resolve(hit);
  },
  saveCache: (paths, key) => {
    recorded.cacheEntries.add(key);
    recorded.transcript.push(
      `cache save ${key}`,
      ...paths.map((cachePath) => `  ${cachePath}`)
    );
    return Promise.resolve(1);
  },
}));

const workspace = path.join(runnerRoot, "workspace");
const home = path.join(runnerRoot, "home");
const toolCache = path.join(runnerRoot, "tool-cache");

let savedEnvironment: NodeJS.ProcessEnv = {};

function normalise(text: string) {
  return text
    .replaceAll(runnerRoot, "<runner>")
    .replaceAll(new RegExp(`\\b${PLATFORM}\\b`, "g"), "<platform>")
    .replaceAll(new RegExp(`\\b${ARCHITECTURE}\\b`, "g"), "<arch>")
    .replaceAll(/\b[0-9a-f]{64}\b/g, "<sha256>")
    .replaceAll(/(?<=opam cache key: <platform>,)[^,]+/g, "<os-release>");
}

function resetRunner() {
  for (const entry of fs.readdirSync(runnerRoot)) {
    fs.rmSync(path.join(runnerRoot, entry), { force: true, recursive: true });
  }
  for (const directory of [home, workspace]) {
    fs.mkdirSync(directory, { recursive: true });
  }
  for (const file of [
    "github-env",
    "github-path",
    "github-state",
    "github-output",
  ]) {
    fs.writeFileSync(path.join(runnerRoot, file), "");
  }
  for (const version of ["2.6.1", "2.7.0-alpha1"]) {
    const directory = path.join(toolCache, "opam", version, ARCHITECTURE);
    fs.mkdirSync(directory, { recursive: true });
    fs.writeFileSync(`${directory}.complete`, "");
    fs.writeFileSync(
      path.join(directory, "opam"),
      [
        "#!/bin/sh",
        'if [ "$*" = "repository --all-switches --short list" ] && [ -e "$OPAMROOT/config" ]; then',
        "  echo default",
        "fi",
      ].join("\n"),
      { mode: 0o755 }
    );
  }
}

async function runAction(inputs: Record<string, string> = {}) {
  setInputs(inputs);
  githubRequests.length = 0;
  recorded.transcript.length = 0;
  try {
    await installer(readInputs());
  } catch (error) {
    recorded.transcript.push(
      `error: ${error instanceof Error ? error.message : String(error)}`
    );
  }
  return normalise(
    [...githubRequests.toSorted(), ...recorded.transcript].join("\n")
  );
}

function readCommandFile(name: string) {
  const text = fs.readFileSync(path.join(runnerRoot, name), "utf-8");
  return normalise(
    text
      .replaceAll(/^(.+)<<(ghadelimiter_[\w-]+)\n([\s\S]*?)\n\2$/gm, "$1=$3")
      .replace(
        /^OPAMDOWNLOADJOBS=\d+$/m,
        "OPAMDOWNLOADJOBS=<available parallelism>"
      )
      .trimEnd()
  );
}

function givenOpamRoot() {
  fs.mkdirSync(path.join(home, ".opam"), { recursive: true });
  fs.writeFileSync(path.join(home, ".opam", "config"), "");
}

function givenLocalSwitch() {
  fs.mkdirSync(path.join(workspace, "_opam", ".opam-switch"), {
    recursive: true,
  });
  fs.writeFileSync(
    path.join(workspace, "_opam", ".opam-switch", "switch-config"),
    ""
  );
}

beforeEach(() => {
  savedEnvironment = { ...process.env };
  recorded.cacheEntries.clear();
  resetRunner();
  vi.spyOn(process.stdout, "write").mockImplementation((chunk) => {
    for (const line of String(chunk).split("\n")) {
      const command = /^\[command\]\S*\/(\S+)(.*)$/.exec(line);
      if (command) {
        recorded.transcript.push(`${command[1]}${command[2]}`);
      } else if (
        /^::(error|warning|notice)::|^::debug::(opam|dune) cache key/.test(line)
      ) {
        recorded.transcript.push(line);
      }
    }
    return true;
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  for (const name of Object.keys(process.env)) {
    if (!(name in savedEnvironment)) {
      delete process.env[name];
    }
  }
  Object.assign(process.env, savedEnvironment);
});

test("sets up opam and the compiler on a fresh runner", async () => {
  await expect(runAction()).resolves.toMatchInlineSnapshot(`
    GET /repos/ocaml/opam-repository/contents/packages/ocaml-base-compiler
    GET /repos/ocaml/opam/releases
    ::debug::opam cache key: <platform>,<os-release>,<arch>,2.6.1,ocaml-base-compiler.5.5.0,https://opam.ocaml.org,sandbox
    cache restore v3-setup-ocaml-opam-<sha256>: miss
      <runner>/home/.opam
      <runner>/workspace/_opam
    opam init --auto-setup --bare --enable-shell-hook default https://opam.ocaml.org
    opam switch --no-install --packages=ocaml-base-compiler.5.5.0 create .
    ::debug::opam cache key: <platform>,<os-release>,<arch>,2.6.1,ocaml-base-compiler.5.5.0,https://opam.ocaml.org,sandbox
    cache look up v3-setup-ocaml-opam-<sha256>: miss
      <runner>/home/.opam
      <runner>/workspace/_opam
    opam clean --all-switches --download-cache --logs --repo-cache --untracked --unused-repositories
    cache save v3-setup-ocaml-opam-<sha256>
      <runner>/home/.opam
      <runner>/workspace/_opam
    opam config report
  `);
  expect(readCommandFile("github-env")).toMatchInlineSnapshot(`
    OPAMCOLOR=always
    OPAMCONFIRMLEVEL=unsafe-yes
    OPAMDOWNLOADJOBS=<available parallelism>
    OPAMERRLOGLEN=0
    OPAMEXTERNALSOLVER=builtin-0install
    OPAMPRECISETRACKING=1
    OPAMRETRIES=10
    OPAMROOT=<runner>/home/.opam
    OPAMSOLVERTIMEOUT=600
    OPAMYES=1
    CLICOLOR_FORCE=1
  `);
  expect(readCommandFile("github-path")).toMatchInlineSnapshot(
    `<runner>/tool-cache/opam/2.6.1/<arch>`
  );
});

test("restores the opam cache that an earlier run saved", async () => {
  await runAction();
  resetRunner();
  await expect(runAction()).resolves.toMatchInlineSnapshot(`
    GET /repos/ocaml/opam-repository/contents/packages/ocaml-base-compiler
    GET /repos/ocaml/opam/releases
    ::debug::opam cache key: <platform>,<os-release>,<arch>,2.6.1,ocaml-base-compiler.5.5.0,https://opam.ocaml.org,sandbox
    cache restore v3-setup-ocaml-opam-<sha256>: hit
      <runner>/home/.opam
      <runner>/workspace/_opam
    opam init --auto-setup --bare --enable-shell-hook
    opam update
    opam config report
  `);
});

test("adds repositories from the lowest to the highest priority", async () => {
  const opamRepositories =
    "overlay: https://example.com/overlay\ndefault: https://opam.ocaml.org";
  await expect(
    runAction({ cache: "false", "opam-repositories": opamRepositories })
  ).resolves.toMatchInlineSnapshot(`
    GET /repos/ocaml/opam-repository/contents/packages/ocaml-base-compiler
    GET /repos/ocaml/opam/releases
    opam init --auto-setup --bare --enable-shell-hook default https://opam.ocaml.org
    opam repository --all-switches --set-default add overlay https://example.com/overlay
    opam switch --no-install --packages=ocaml-base-compiler.5.5.0 create .
    opam config report
  `);
});

test("replaces the repositories of an existing opam root", async () => {
  givenOpamRoot();
  await expect(runAction({ cache: "false" })).resolves.toMatchInlineSnapshot(`
    GET /repos/ocaml/opam-repository/contents/packages/ocaml-base-compiler
    GET /repos/ocaml/opam/releases
    opam init --auto-setup --bare --enable-shell-hook
    opam repository --all-switches remove default
    opam repository --all-switches --set-default add default https://opam.ocaml.org
    opam switch --no-install --packages=ocaml-base-compiler.5.5.0 create .
    opam config report
  `);
});

test("keeps an existing local switch", async () => {
  givenLocalSwitch();
  await expect(runAction({ cache: "false" })).resolves.toMatchInlineSnapshot(`
    GET /repos/ocaml/opam-repository/contents/packages/ocaml-base-compiler
    GET /repos/ocaml/opam/releases
    opam init --auto-setup --bare --enable-shell-hook default https://opam.ocaml.org
    opam repository --all-switches --set-default add default https://opam.ocaml.org
    opam config report
  `);
});

test("keeps an existing opam root and local switch", async () => {
  givenOpamRoot();
  givenLocalSwitch();
  await expect(runAction({ cache: "false" })).resolves.toMatchInlineSnapshot(`
    GET /repos/ocaml/opam-repository/contents/packages/ocaml-base-compiler
    GET /repos/ocaml/opam/releases
    opam init --auto-setup --bare --enable-shell-hook
    opam repository --all-switches remove default
    opam repository --all-switches --set-default add default https://opam.ocaml.org
    opam config report
  `);
});

test("disables sandboxing on request", async () => {
  await expect(runAction({ "opam-disable-sandboxing": "true" })).resolves
    .toMatchInlineSnapshot(`
    GET /repos/ocaml/opam-repository/contents/packages/ocaml-base-compiler
    GET /repos/ocaml/opam/releases
    ::debug::opam cache key: <platform>,<os-release>,<arch>,2.6.1,ocaml-base-compiler.5.5.0,https://opam.ocaml.org,nosandbox
    cache restore v3-setup-ocaml-opam-<sha256>: miss
      <runner>/home/.opam
      <runner>/workspace/_opam
    opam init --auto-setup --bare --disable-sandboxing --enable-shell-hook default https://opam.ocaml.org
    opam switch --no-install --packages=ocaml-base-compiler.5.5.0 create .
    ::debug::opam cache key: <platform>,<os-release>,<arch>,2.6.1,ocaml-base-compiler.5.5.0,https://opam.ocaml.org,nosandbox
    cache look up v3-setup-ocaml-opam-<sha256>: miss
      <runner>/home/.opam
      <runner>/workspace/_opam
    opam clean --all-switches --download-cache --logs --repo-cache --untracked --unused-repositories
    cache save v3-setup-ocaml-opam-<sha256>
      <runner>/home/.opam
      <runner>/workspace/_opam
    opam config report
  `);
});

test("installs a pre-release opam on request", async () => {
  await expect(runAction({ "allow-prerelease-opam": "true" })).resolves
    .toMatchInlineSnapshot(`
    GET /repos/ocaml/opam-repository/contents/packages/ocaml-base-compiler
    GET /repos/ocaml/opam/releases
    ::debug::opam cache key: <platform>,<os-release>,<arch>,2.7.0-alpha1,ocaml-base-compiler.5.5.0,https://opam.ocaml.org,sandbox
    cache restore v3-setup-ocaml-opam-<sha256>: miss
      <runner>/home/.opam
      <runner>/workspace/_opam
    opam init --auto-setup --bare --enable-shell-hook default https://opam.ocaml.org
    opam switch --no-install --packages=ocaml-base-compiler.5.5.0 create .
    ::debug::opam cache key: <platform>,<os-release>,<arch>,2.7.0-alpha1,ocaml-base-compiler.5.5.0,https://opam.ocaml.org,sandbox
    cache look up v3-setup-ocaml-opam-<sha256>: miss
      <runner>/home/.opam
      <runner>/workspace/_opam
    opam clean --all-switches --download-cache --logs --repo-cache --untracked --unused-repositories
    cache save v3-setup-ocaml-opam-<sha256>
      <runner>/home/.opam
      <runner>/workspace/_opam
    opam config report
  `);
});

test("resolves the ocaml-compiler input to a compiler package", async () => {
  const lines = [];
  for (const ocamlCompiler of [
    "4.08",
    "4.14.x",
    "5",
    "5.6",
    "4.02",
    "3.12",
    "ocaml-variants.5.5.0+options,ocaml-option-flambda",
    "6",
  ]) {
    const output = await runAction({
      cache: "false",
      "ocaml-compiler": ocamlCompiler,
    });
    const result =
      /--packages=(\S+)/.exec(output)?.[1] ??
      /^error: (.*)$/m.exec(output)?.[1] ??
      output;
    lines.push(ocamlCompiler, `  ${result}`);
    if (output.includes("opam-repository-archive")) {
      lines.push("  (looked up in opam-repository-archive)");
    }
  }
  expect(lines.join("\n")).toMatchInlineSnapshot(`
    4.08
      ocaml-base-compiler.4.08.1
    4.14.x
      ocaml-base-compiler.4.14.2
    5
      ocaml-base-compiler.5.5.0
    5.6
      ocaml-base-compiler.5.6.0~alpha1
    4.02
      ocaml-base-compiler.4.02.3
      (looked up in opam-repository-archive)
    3.12
      ocaml-base-compiler.3.12.1
      (looked up in opam-repository-archive)
    ocaml-variants.5.5.0+options,ocaml-option-flambda
      ocaml-variants.5.5.0+options,ocaml-option-flambda
    6
      Could not find any OCaml compiler version matching '6' in the opam-repository or opam-repository-archive. Please check if you specified a valid version number or version range.
      (looked up in opam-repository-archive)
  `);
});

test("restores the Dune cache and records its key for the post step", async () => {
  await expect(runAction({ "dune-cache": "true" })).resolves
    .toMatchInlineSnapshot(`
    GET /repos/ocaml/opam-repository/contents/packages/ocaml-base-compiler
    GET /repos/ocaml/opam/releases
    ::debug::opam cache key: <platform>,<os-release>,<arch>,2.6.1,ocaml-base-compiler.5.5.0,https://opam.ocaml.org,sandbox
    cache restore v3-setup-ocaml-opam-<sha256>: miss
      <runner>/home/.opam
      <runner>/workspace/_opam
    opam init --auto-setup --bare --enable-shell-hook default https://opam.ocaml.org
    opam switch --no-install --packages=ocaml-base-compiler.5.5.0 create .
    ::debug::opam cache key: <platform>,<os-release>,<arch>,2.6.1,ocaml-base-compiler.5.5.0,https://opam.ocaml.org,sandbox
    cache look up v3-setup-ocaml-opam-<sha256>: miss
      <runner>/home/.opam
      <runner>/workspace/_opam
    opam clean --all-switches --download-cache --logs --repo-cache --untracked --unused-repositories
    cache save v3-setup-ocaml-opam-<sha256>
      <runner>/home/.opam
      <runner>/workspace/_opam
    ::debug::dune cache key: ocaml-base-compiler.5.5.0,workflow,job
    cache restore v3-setup-ocaml-dune-<platform>-<arch>-<sha256>-123: miss
      <runner>/home/.cache/dune
    opam install dune
    opam config report
  `);
  expect(readCommandFile("github-state")).toMatchInlineSnapshot(
    `dune-cache-key=v3-setup-ocaml-dune-<platform>-<arch>-<sha256>-123`
  );
});

test("pins the local opam packages", async () => {
  for (const name of ["foo.opam", "bar.opam"]) {
    fs.writeFileSync(path.join(workspace, name), "");
  }
  await expect(
    runAction({
      cache: "false",
      "opam-local-packages": path.join(workspace, "*.opam"),
    })
  ).resolves.toMatchInlineSnapshot(`
    GET /repos/ocaml/opam-repository/contents/packages/ocaml-base-compiler
    GET /repos/ocaml/opam/releases
    opam init --auto-setup --bare --enable-shell-hook default https://opam.ocaml.org
    opam switch --no-install --packages=ocaml-base-compiler.5.5.0 create .
    opam pin --no-action add bar.dev .
    opam pin --no-action add foo.dev .
    opam config report
  `);
});
