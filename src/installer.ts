import * as core from '@actions/core';
import * as tc from '@actions/tool-cache';
import * as os from 'os';
import * as fs from 'fs';
import * as exec from '@actions/exec';
import * as path from 'path';
import * as util from 'util';

let osPlat: string = os.platform();
let osArch: string = os.arch();

export async function getOpam(version: string): Promise <void> {
  core.exportVariable('OPAMYES', '1');
  if (osPlat == "win32")
    return acquireOpamWindows(version);
  else if (osPlat == "darwin")
    return acquireOpamDarwin(version);
  else if (osPlat == "linux")
    return acquireOpamLinux(version);
}

async function acquireOpamWindows(version: string): Promise<void> {
  let downloadPath: string | null = null;
  let toolPath : string | null = null;
  try {
    downloadPath = await tc.downloadTool("https://cygwin.com/setup-x86_64.exe");
  } catch (error) {
    core.debug(error);
    throw `Failed to download cygwin: ${error}`;
  }
  toolPath = await tc.cacheFile(downloadPath, 'setup-x86_64.exe', 'cygwin', "1.0");
  await exec.exec(path.join(__dirname, 'install-ocaml-windows.cmd'),[__dirname, toolPath, version]);
  core.addPath("c:\\cygwin\\bin");
  core.addPath("c:\\cygwin\\wrapperbin");
}

async function acquireOpamLinux(version: string): Promise<void> {
  let opamVersion: string = "2.0.5"
  let fileName: string = getOpamFileName(opamVersion);
  let downloadUrl: string = getOpamDownloadUrl(opamVersion, fileName);
  let downloadPath: string | null = null;
  try {
    downloadPath = await tc.downloadTool(downloadUrl);
  } catch (error) {
    core.debug(error);
    throw `Failed to download version ${opamVersion}: ${error}`;
  }
  fs.chmodSync(downloadPath, '755');
  let toolPath : string = await tc.cacheFile(downloadPath, 'opam', 'opam', opamVersion);
  core.addPath(toolPath);
  await exec.exec("sudo apt-get -y install bubblewrap ocaml-native-compilers ocaml-compiler-libs musl-tools");
  await exec.exec(`"${toolPath}/opam"`, ["init", "-yav", "https://github.com/ocaml/opam-repository.git"]);
  await exec.exec(path.join(__dirname, 'install-ocaml-unix.sh'),[version]);
  await exec.exec(`"${toolPath}/opam"`, ["install", "-y", "depext"]);
}

async function acquireOpamDarwin(version: string): Promise<void> {
  await exec.exec ("brew install ocaml opam");
  await exec.exec("opam", ["init", "-yav", "https://github.com/ocaml/opam-repository.git"]);
  await exec.exec(path.join(__dirname, 'install-ocaml-unix.sh'),[version]);
  await exec.exec("opam", ["install", "-y", "depext"]);
}

function getOpamFileName(version: string): string {
  const platform: string = osPlat == 'darwin' ? 'macos' : osPlat;
  const arch: string = osArch == 'x64' ? 'x86_64' : 'i686';
  const filename: string = util.format(
    'opam-%s-%s-%s',
    version,
    arch,
    platform
  );
  return filename;
}

function getOpamDownloadUrl(version: string, filename: string): string {
  return util.format('https://github.com/ocaml/opam/releases/download/%s/%s', version, filename);
}
