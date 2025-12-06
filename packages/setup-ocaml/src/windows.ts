import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as core from "@actions/core";
import { exec } from "@actions/exec";
import { HttpClient } from "@actions/http-client";
import * as io from "@actions/io";
import * as toolCache from "@actions/tool-cache";
import * as cheerio from "cheerio";
import * as semver from "semver";
import {
  CYGWIN_LOCAL_PACKAGE_DIR,
  CYGWIN_MIRROR,
  CYGWIN_ROOT,
} from "./constants.js";

function createHttpClient() {
  return new HttpClient(
    "OCamlBot (+https://github.com/ocaml/setup-ocaml)",
    [],
    { allowRetries: true, maxRetries: 5 },
  );
}

export async function getCygwinVersion() {
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

export async function setupCygwin() {
  await core.group("Setting up Cygwin environment", async () => {
    const version = await getCygwinVersion();
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
      "mingw64-x86_64-gcc-core",
      "mingw64-x86_64-gcc-g++",
      "patch",
      "perl",
      "rsync",
      "unzip",
    ].join(",");
    await exec("setup-x86_64", [
      "--quiet-mode",
      "--symlink-type=sys",
      "--upgrade-also",
      `--local-package-dir=${CYGWIN_LOCAL_PACKAGE_DIR}`,
      `--packages=${packages}`,
      `--root=${CYGWIN_ROOT}`,
      `--site=${CYGWIN_MIRROR}`,
    ]);
    const setup = await io.which("setup-x86_64");
    await io.cp(setup, CYGWIN_ROOT);
  });
}

export async function fixFstab() {
  await core.group("Fixing Cygwin fstab configuration", async () => {
    try {
      const fstabPath = path.join(CYGWIN_ROOT, "etc", "fstab");
      await fs.access(fstabPath, fs.constants.W_OK);
      const contents = await fs.readFile(fstabPath, { encoding: "utf8" });
      core.info(contents);
      const patchedContents = contents.replace(
        /(?<=\s)binary(?=,posix)/,
        "noacl,binary",
      );
      core.info(patchedContents);
      await fs.writeFile(fstabPath, patchedContents, { encoding: "utf8" });
    } catch (error) {
      if (error instanceof Error) {
        core.warning(error);
      }
    }
  });
}
