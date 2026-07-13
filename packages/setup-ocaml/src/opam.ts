import { promises as fs } from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import * as core from "@actions/core";
import { exec, getExecOutput } from "@actions/exec";
import * as toolCache from "@actions/tool-cache";
import * as semver from "semver";
import {
  ALLOW_PRERELEASE_OPAM,
  ARCHITECTURE,
  MSYS2_ROOT,
  OPAM_DISABLE_SANDBOXING,
  PLATFORM,
  WINDOWS_COMPILER,
  WINDOWS_ENVIRONMENT,
} from "./constants.js";
import { octokit } from "./github-client.js";
import {
  installMsys2Packages,
  installUnixSystemPackages,
  updateUnixPackageIndexFiles,
} from "./system-packages.js";

// Stable opam version range — excludes 2.6.x pre-releases which may
// contain breaking changes to the CLI or repository format.
const OPAM_STABLE_VERSION_RANGE = "<2.6.0";

const EXECUTABLE_PERMISSION = 0o755;

const OPAM_DEV_PUBLIC_KEY_URL = "https://opam.ocaml.org/opam-dev-pubkey.pgp";
const OPAM_DEV_PUBLIC_KEY_FINGERPRINT = "92C526AE50DF39470EB2911BED4CF1CA67CBAA92";

function toGpgPath(filePath: string) {
  if (PLATFORM !== "windows") {
    return filePath;
  }
  const { root } = path.parse(filePath);
  return `/${root.charAt(0).toLowerCase()}/${filePath.slice(root.length).replaceAll("\\", "/")}`;
}

async function verifyOpamSignature(
  binaryPath: string,
  signaturePath: string,
  publicKeyPath: string,
) {
  const gpgHome = await fs.mkdtemp(path.join(os.tmpdir(), "setup-ocaml-gpg-"));
  const gpg = PLATFORM === "windows" ? path.join(MSYS2_ROOT, "usr", "bin", "gpg.exe") : "gpg";
  try {
    await exec(gpg, [
      "--batch",
      "--homedir",
      toGpgPath(gpgHome),
      "--import",
      toGpgPath(publicKeyPath),
    ]);
    const verification = await getExecOutput(
      gpg,
      [
        "--batch",
        "--homedir",
        toGpgPath(gpgHome),
        "--status-fd",
        "1",
        "--verify",
        toGpgPath(signaturePath),
        toGpgPath(binaryPath),
      ],
      { silent: true },
    );
    const validSignature = verification.stdout
      .split("\n")
      .find((line) => line.startsWith("[GNUPG:] VALIDSIG "));
    const primaryKeyFingerprint = validSignature?.split(" ").at(-1);
    if (primaryKeyFingerprint !== OPAM_DEV_PUBLIC_KEY_FINGERPRINT) {
      throw new Error(
        `The opam binary was not signed by the expected key '${OPAM_DEV_PUBLIC_KEY_FINGERPRINT}'.`,
      );
    }
    core.info(`Verified opam signature with key ${OPAM_DEV_PUBLIC_KEY_FINGERPRINT}`);
  } finally {
    await fs.rm(gpgHome, { recursive: true, force: true });
  }
}

export const latestOpamRelease = (async () => {
  const semverRange = ALLOW_PRERELEASE_OPAM ? "*" : OPAM_STABLE_VERSION_RANGE;
  const { data } = await octokit.rest.repos.listReleases({
    owner: "ocaml",
    repo: "opam",
  });
  const releases = data
    .filter((release) =>
      semver.satisfies(release.tag_name, semverRange, {
        includePrerelease: ALLOW_PRERELEASE_OPAM,
        loose: true,
      }),
    )
    .sort(({ tag_name: v1 }, { tag_name: v2 }) => semver.rcompare(v1, v2, { loose: true }));
  if (releases.length === 0) {
    throw new Error(
      "Failed to find any opam release that matches the specified version constraint. Please check your version requirements or consider allowing pre-releases.",
    );
  }
  const binarySuffix =
    PLATFORM === "windows" ? `${ARCHITECTURE}-${PLATFORM}.exe` : `${ARCHITECTURE}-${PLATFORM}`;
  for (const release of releases) {
    const asset = release.assets.find((a) => a.name.endsWith(binarySuffix));
    if (asset) {
      const signature = release.assets.find((candidate) => candidate.name === `${asset.name}.sig`);
      if (!signature) {
        throw new Error(
          `Failed to find the signature '${asset.name}.sig' in the opam ${release.tag_name} release. Refusing to install an unsigned opam binary.`,
        );
      }
      return {
        version: release.tag_name,
        browserDownloadUrl: asset.browser_download_url,
        signatureBrowserDownloadUrl: signature.browser_download_url,
      };
    }
  }
  throw new Error(
    `Failed to find opam binary for '${PLATFORM}' and '${ARCHITECTURE}'. Please check if this combination is supported by opam.`,
  );
})();

async function acquireOpam() {
  await core.group("Installing opam", async () => {
    const { version, browserDownloadUrl, signatureBrowserDownloadUrl } = await latestOpamRelease;
    const cachedPath = toolCache.find("opam", version, ARCHITECTURE);
    const opam = PLATFORM !== "windows" ? "opam" : "opam.exe";
    if (cachedPath === "") {
      const [downloadedPath, signaturePath, publicKeyPath] = await Promise.all([
        toolCache.downloadTool(browserDownloadUrl),
        toolCache.downloadTool(signatureBrowserDownloadUrl),
        toolCache.downloadTool(OPAM_DEV_PUBLIC_KEY_URL),
      ]);
      core.info(`Downloaded opam ${version} from ${browserDownloadUrl}`);
      await verifyOpamSignature(downloadedPath, signaturePath, publicKeyPath);
      const cachedPath = await toolCache.cacheFile(
        downloadedPath,
        opam,
        "opam",
        version,
        ARCHITECTURE,
      );
      core.info(`Successfully cached opam to ${cachedPath}`);
      await fs.chmod(path.join(cachedPath, opam), EXECUTABLE_PERMISSION);
      core.addPath(cachedPath);
      core.info("Added opam to the path");
    } else {
      core.addPath(cachedPath);
      core.info("Added cached opam to the path");
    }
  });
}

async function initializeOpam(initialRepository?: [string, string]) {
  await core.group("Initialising opam state", async () => {
    if (PLATFORM === "windows" && WINDOWS_ENVIRONMENT === "msys2") {
      await installMsys2Packages();
    }
    if (PLATFORM !== "windows") {
      try {
        await installUnixSystemPackages();
      } catch (error) {
        if (error instanceof Error) {
          core.notice(
            `System package installation failed. Re-synchronizing package index files and retrying installation. Error details: ${error.message.toLocaleLowerCase()}`,
          );
        }
        await updateUnixPackageIndexFiles();
        await installUnixSystemPackages();
      }
    }
    const extraOptions = [];
    if (PLATFORM === "windows") {
      if (WINDOWS_ENVIRONMENT === "msys2") {
        extraOptions.push(`--cygwin-location=${MSYS2_ROOT}`);
      }
      if (WINDOWS_ENVIRONMENT === "cygwin") {
        extraOptions.push("--cygwin-internal-install");
      }
    }
    if (OPAM_DISABLE_SANDBOXING) {
      extraOptions.push("--disable-sandboxing");
    }
    await exec("opam", [
      "init",
      "--auto-setup",
      "--bare",
      ...extraOptions,
      "--enable-shell-hook",
      ...(initialRepository ?? []),
    ]);
  });
}

export async function setupOpam(initialRepository?: [string, string]) {
  await acquireOpam();
  await initializeOpam(initialRepository);
}

export async function installOcaml(ocamlCompiler: string) {
  await core.group("Installing OCaml compiler", async () => {
    const packages = [ocamlCompiler];
    if (PLATFORM === "windows" && WINDOWS_COMPILER === "msvc") {
      packages.push("system-msvc");
    }
    await exec("opam", [
      "switch",
      "--no-install",
      `--packages=${packages.join(",")}`,
      "create",
      ".",
    ]);
  });
}

export async function pin(fpaths: string[]) {
  if (fpaths.length === 0) {
    return;
  }
  await core.group("Pinning local packages", async () => {
    for (const fpath of fpaths) {
      const fname = path.basename(fpath, ".opam");
      const dname = path.dirname(fpath);
      await exec("opam", ["pin", "--no-action", "add", `${fname}.dev`, "."], {
        cwd: dname,
      });
    }
  });
}

async function repositoryAdd(name: string, address: string) {
  await exec("opam", ["repository", "--all-switches", "--set-default", "add", name, address]);
}

export async function repositoryAddAll(repositories: [string, string][]) {
  if (repositories.length === 0) {
    return;
  }
  await core.group("Initialising opam repositories", async () => {
    for (const [name, address] of repositories) {
      await repositoryAdd(name, address);
    }
  });
}

async function repositoryList() {
  const repositoryList = await getExecOutput(
    "opam",
    ["repository", "--all-switches", "--short", "list"],
    { ignoreReturnCode: true, silent: true },
  );
  if (repositoryList.exitCode === 0) {
    return repositoryList.stdout
      .split("\n")
      .map((repository) => repository.trim())
      .filter((repository) => repository.length > 0);
  }
  return [];
}

export async function repositoryRemoveAll() {
  await core.group("Removing opam repositories", async () => {
    const repositories = await repositoryList();
    if (repositories.length > 0) {
      await exec("opam", ["repository", "--all-switches", "remove", ...repositories]);
    }
  });
}

export async function update() {
  await core.group("Updating opam repositories", async () => {
    await exec("opam", ["update"]);
  });
}
