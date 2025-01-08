import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import * as core from "@actions/core";
import { exec } from "@actions/exec";
import { HttpClient } from "@actions/http-client";
import * as io from "@actions/io";
import * as toolCache from "@actions/tool-cache";
import * as cheerio from "cheerio";
import * as semver from "semver";
import {
  CYGWIN_MIRROR,
  CYGWIN_MIRROR_ENCODED_URI,
  CYGWIN_ROOT,
} from "./constants.js";

function createHttpClient() {
  return new HttpClient(
    "OCamlBot (+https://github.com/ocaml/setup-ocaml)",
    [],
    { allowRetries: true, maxRetries: 5 },
  );
}

export async function retrieveCygwinVersion() {
  const httpClient = createHttpClient();
  const response = await httpClient.get("https://www.cygwin.com");
  const body = await response.readBody();
  const $ = cheerio.load(body);
  let version = "";
  $("a").each((_index, element) => {
    const text = $(element).text();
    if (semver.valid(text) === text) {
      version = text;
    }
  });
  return version;
}

async function setGitToIgnoreCygwinLocalPackageDirectory() {
  const xdgConfigHome = process.env.XDG_CONFIG_HOME;
  const homeDir = os.homedir();
  const globalGitConfigDir = xdgConfigHome
    ? path.join(xdgConfigHome, "git")
    : path.join(homeDir, ".config", "git");
  await fs.mkdir(globalGitConfigDir, { recursive: true });
  const globalGitIgnorePath = path.join(globalGitConfigDir, "ignore");
  try {
    await fs.access(globalGitIgnorePath, fs.constants.R_OK);
    const contents = await fs.readFile(globalGitIgnorePath, {
      encoding: "utf8",
    });
    if (!contents.includes(CYGWIN_MIRROR_ENCODED_URI)) {
      await fs.appendFile(globalGitIgnorePath, CYGWIN_MIRROR_ENCODED_URI, {
        encoding: "utf8",
      });
    }
  } catch {
    await fs.writeFile(globalGitIgnorePath, CYGWIN_MIRROR_ENCODED_URI, {
      encoding: "utf8",
    });
  } finally {
    await exec(
      "git",
      ["config", "--add", "--global", "core.excludesfile", globalGitIgnorePath],
      { windowsVerbatimArguments: true },
    );
  }
}

export async function setupCygwin() {
  await core.group("Prepare the Cygwin environment", async () => {
    await setGitToIgnoreCygwinLocalPackageDirectory();
    const version = await retrieveCygwinVersion();
    const cachedPath = toolCache.find("cygwin", version, "x86_64");
    if (cachedPath === "") {
      const downloadedPath = await toolCache.downloadTool(
        "https://cygwin.com/setup-x86_64.exe",
      );
      const cachedPath = await toolCache.cacheFile(
        downloadedPath,
        "setup-x86_64.exe",
        "cygwin",
        version,
        "x86_64",
      );
      core.addPath(cachedPath);
    } else {
      core.addPath(cachedPath);
    }
    const packages = [
      "curl",
      "diffutils",
      "m4",
      "make",
      "mingw64-i686-gcc-core",
      "mingw64-i686-gcc-g++",
      "mingw64-i686-openssl=1.1.1w-0.1",
      "mingw64-x86_64-gcc-core",
      "mingw64-x86_64-gcc-g++",
      "mingw64-x86_64-openssl=1.1.1w-0.1",
      "patch",
      "perl",
      "rsync",
      "unzip",
    ].join(",");
    await exec("setup-x86_64", [
      `--packages=${packages}`,
      "--quiet-mode",
      `--root=${CYGWIN_ROOT}`,
      `--site=${CYGWIN_MIRROR}`,
      "--symlink-type=sys",
    ]);
    const setup = await io.which("setup-x86_64");
    await io.cp(setup, CYGWIN_ROOT);
  });
}

function getPacmanPath(msys2Root: string): string {
  return path.join(msys2Root, "usr", "bin", "pacman");
}

async function testMsys2Installation(path: string): Promise<void> {
  try {
    await fs.access(path);
  } catch {
    throw new Error(`No msys2 installation found at: ${path}.`);
  }
}

async function getMsys2Install(): Promise<[root: string, pacmanPath: string]> {
  const msys2Root = process.env.MSYS2_ROOT;

  // MSYS2_ROOT takes priority
  if (msys2Root) {
    await testMsys2Installation(msys2Root);
    return [msys2Root, getPacmanPath(msys2Root)];
  }
  try {
    // check for pacman from PATH
    const pacmanPath = await io.which("pacman", true);
    return [path.dirname(path.dirname(path.dirname(pacmanPath))), pacmanPath];
  } catch {
    // finally check the default msys directory
    const defaultRoot = "C:\\msys64";
    await testMsys2Installation(defaultRoot);
    return [defaultRoot, getPacmanPath(defaultRoot)];
  }
}

export async function prepareMsys2(): Promise<string> {
  return await core.group("Install needed Msys2 packages", async () => {
    const [root, pacmanPath] = await getMsys2Install();
    // core update
    await exec(pacmanPath, ["-Syu", "--noconfirm"]);
    // packages needed for opam
    const packages = [
      "curl",
      "diffutils",
      "m4",
      "make",
      "mingw-w64-i686-gcc",
      "mingw-w64-x86_64-gcc",
      "patch",
      "perl",
      "rsync",
      "unzip",
    ];
    await exec(pacmanPath, ["-Syu", "--noconfirm", ...packages]);
    return root;
  });
}
