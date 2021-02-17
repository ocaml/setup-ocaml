import * as core from "@actions/core";
import { exec } from "@actions/exec";
import * as tc from "@actions/tool-cache";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as util from "util";

import { CYGWIN_ROOT } from "./constants";

const osPlat = os.platform();
const osArch = os.arch();

function getOpamFileName(version: string) {
  const platform = osPlat === "darwin" ? "macos" : osPlat;
  const arch = osArch === "x64" ? "x86_64" : "i686";
  const filename = util.format("opam-%s-%s-%s", version, arch, platform);
  return filename;
}

function getOpamDownloadUrl(version: string, filename: string) {
  return util.format(
    "https://github.com/ocaml/opam/releases/download/%s/%s",
    version,
    filename
  );
}

async function acquireOpamWindows(customRepository: string) {
  const repository =
    customRepository ||
    "https://github.com/fdopen/opam-repository-mingw.git#opam2";

  let downloadPath;
  try {
    downloadPath = await tc.downloadTool("https://cygwin.com/setup-x86_64.exe");
  } catch (error) {
    core.debug(error);
    throw `Failed to download cygwin: ${error}`;
  }
  const toolPath = await tc.cacheFile(
    downloadPath,
    "setup-x86_64.exe",
    "cygwin",
    "1.0"
  );
  core.exportVariable("CYGWIN_ROOT", CYGWIN_ROOT);
  await exec(path.join(__dirname, "install-ocaml-windows.cmd"), [
    __dirname,
    toolPath,
    repository,
  ]);
  core.addPath(path.join(CYGWIN_ROOT, "wrapperbin"));
}

async function acquireOpamLinux(customRepository: string) {
  const opamVersion = "2.0.8";
  const fileName = getOpamFileName(opamVersion);
  const downloadUrl = getOpamDownloadUrl(opamVersion, fileName);
  const repository =
    customRepository || "https://github.com/ocaml/opam-repository.git";

  let downloadPath;
  try {
    downloadPath = await tc.downloadTool(downloadUrl);
  } catch (error) {
    core.debug(error);
    throw `Failed to download version ${opamVersion}: ${error}`;
  }
  fs.chmodSync(downloadPath, 0o755);
  const toolPath: string = await tc.cacheFile(
    downloadPath,
    "opam",
    "opam",
    opamVersion
  );
  core.addPath(toolPath);
  await exec("sudo apt-get -y install bubblewrap musl-tools");
  await exec(path.join(__dirname, "install-ocaml-unix.sh"), [repository]);
}

async function acquireOpamDarwin(customRepository: string) {
  const repository =
    customRepository || "https://github.com/ocaml/opam-repository.git";

  await exec("brew", ["install", "opam"]);
  await exec(path.join(__dirname, "install-ocaml-unix.sh"), [repository]);
}

export async function getOpam(repository: string): Promise<void> {
  core.exportVariable("OPAMYES", "1");
  if (osPlat === "win32") return acquireOpamWindows(repository);
  else if (osPlat === "darwin") return acquireOpamDarwin(repository);
  /*if (osPlat === "linux")*/ else return acquireOpamLinux(repository);
}
