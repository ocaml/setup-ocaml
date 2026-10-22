import { promises as fs } from "node:fs";
import * as os from "node:os";
import path from "node:path";

import * as core from "@actions/core";
import { exec, getExecOutput } from "@actions/exec";
import * as toolCache from "@actions/tool-cache";
import * as semver from "semver";

import { ARCHITECTURE, MSYS2_ROOT, PLATFORM } from "./constants.js";
import type { Octokit } from "./github-client.js";
import type { Inputs, OpamRepository, WindowsCompiler } from "./inputs.js";
import { toMsysPath } from "./paths.js";
import {
  installMsys2Packages,
  installUnixSystemPackages,
  updateUnixPackageIndexFiles,
} from "./system-packages.js";

const OPAM_STABLE_VERSION_RANGE = "<2.7.0";

const EXECUTABLE_PERMISSION = 0o755;

const OPAM_DEV_PUBLIC_KEY_URL = "https://opam.ocaml.org/opam-dev-pubkey.pgp";
const OPAM_DEV_PUBLIC_KEY_FINGERPRINT =
  "92C526AE50DF39470EB2911BED4CF1CA67CBAA92";

const toGpgPath = (filePath: string) =>
  PLATFORM === "windows" ? toMsysPath(filePath) : filePath;

const verifyOpamSignature = async (
  binaryPath: string,
  signaturePath: string,
  publicKeyPath: string
) => {
  const gpgHome = await fs.mkdtemp(path.join(os.tmpdir(), "setup-ocaml-gpg-"));
  const gpg =
    PLATFORM === "windows"
      ? path.join(MSYS2_ROOT, "usr", "bin", "gpg.exe")
      : "gpg";
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
      { silent: true }
    );
    const validSignature = verification.stdout
      .split("\n")
      .find((line) => line.startsWith("[GNUPG:] VALIDSIG "));
    const primaryKeyFingerprint = validSignature?.split(" ").at(-1);
    if (primaryKeyFingerprint !== OPAM_DEV_PUBLIC_KEY_FINGERPRINT) {
      throw new Error(
        `The opam binary was not signed by the expected key '${OPAM_DEV_PUBLIC_KEY_FINGERPRINT}'.`
      );
    }
    core.info(
      `Verified opam signature with key ${OPAM_DEV_PUBLIC_KEY_FINGERPRINT}`
    );
  } finally {
    await fs.rm(gpgHome, { force: true, recursive: true });
  }
};

interface OpamRelease {
  readonly version: string;
  readonly browserDownloadUrl: string;
  readonly signatureBrowserDownloadUrl: string;
}

export const findLatestOpamRelease = async (
  octokit: Octokit,
  allowPrerelease: boolean
): Promise<OpamRelease> => {
  const semverRange = allowPrerelease ? "*" : OPAM_STABLE_VERSION_RANGE;
  const data = await octokit.paginate(octokit.rest.repos.listReleases, {
    owner: "ocaml",
    per_page: 100,
    repo: "opam",
  });
  if (data.length === 0) {
    throw new Error(
      "The GitHub API returned no releases for ocaml/opam. Retry the workflow and check GitHub's status if the problem persists."
    );
  }
  const releases = data
    .filter((release) =>
      semver.satisfies(release.tag_name, semverRange, {
        includePrerelease: allowPrerelease,
        loose: true,
      })
    )
    .toSorted(({ tag_name: v1 }, { tag_name: v2 }) =>
      semver.rcompare(v1, v2, { loose: true })
    );
  if (releases.length === 0) {
    throw new Error(
      `No opam release matched the built-in range '${semverRange}' (allow-prerelease-opam: ${allowPrerelease}, releases received: ${data.length}). Check opam releases and your setup-ocaml version.`
    );
  }
  const binarySuffix =
    PLATFORM === "windows"
      ? `${ARCHITECTURE}-${PLATFORM}.exe`
      : `${ARCHITECTURE}-${PLATFORM}`;
  for (const release of releases) {
    const asset = release.assets.find((a) => a.name.endsWith(binarySuffix));
    if (asset) {
      const signature = release.assets.find(
        (candidate) => candidate.name === `${asset.name}.sig`
      );
      if (!signature) {
        throw new Error(
          `Failed to find the signature '${asset.name}.sig' in the opam ${release.tag_name} release. Refusing to install an unsigned opam binary.`
        );
      }
      return {
        browserDownloadUrl: asset.browser_download_url,
        signatureBrowserDownloadUrl: signature.browser_download_url,
        version: release.tag_name,
      };
    }
  }
  throw new Error(
    `Failed to find opam binary for '${PLATFORM}' and '${ARCHITECTURE}'. Please check if this combination is supported by opam.`
  );
};

const acquireOpam = async ({
  version,
  browserDownloadUrl,
  signatureBrowserDownloadUrl,
}: OpamRelease) => {
  await core.group("Installing opam", async () => {
    const cachedPath = toolCache.find("opam", version, ARCHITECTURE);
    const opam = PLATFORM === "windows" ? "opam.exe" : "opam";
    if (cachedPath === "") {
      const [downloadedPath, signaturePath, publicKeyPath] = await Promise.all([
        toolCache.downloadTool(browserDownloadUrl),
        toolCache.downloadTool(signatureBrowserDownloadUrl),
        toolCache.downloadTool(OPAM_DEV_PUBLIC_KEY_URL),
      ]);
      core.info(`Downloaded opam ${version} from ${browserDownloadUrl}`);
      await verifyOpamSignature(downloadedPath, signaturePath, publicKeyPath);
      const newlyCachedPath = await toolCache.cacheFile(
        downloadedPath,
        opam,
        "opam",
        version,
        ARCHITECTURE
      );
      core.info(`Successfully cached opam to ${newlyCachedPath}`);
      await fs.chmod(path.join(newlyCachedPath, opam), EXECUTABLE_PERMISSION);
      core.addPath(newlyCachedPath);
      core.info("Added opam to the path");
    } else {
      core.addPath(cachedPath);
      core.info("Added cached opam to the path");
    }
  });
};

const initializeOpam = async (
  inputs: Inputs,
  initialRepository?: OpamRepository
) => {
  await core.group("Initialising opam state", async () => {
    if (PLATFORM === "windows" && inputs.windowsEnvironment === "msys2") {
      await installMsys2Packages(inputs.windowsCompiler);
    }
    if (PLATFORM !== "windows") {
      try {
        await installUnixSystemPackages(PLATFORM);
      } catch (error) {
        if (error instanceof Error) {
          core.notice(
            `System package installation failed. Re-synchronizing package index files and retrying installation. Error details: ${error.message.toLocaleLowerCase()}`
          );
        }
        await updateUnixPackageIndexFiles(PLATFORM);
        await installUnixSystemPackages(PLATFORM);
      }
    }
    const extraOptions = [];
    if (PLATFORM === "windows") {
      if (inputs.windowsEnvironment === "msys2") {
        extraOptions.push(`--cygwin-location=${MSYS2_ROOT}`);
      }
      if (inputs.windowsEnvironment === "cygwin") {
        extraOptions.push("--cygwin-internal-install");
      }
    }
    if (inputs.opamDisableSandboxing) {
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
};

export const setupOpam = async (
  inputs: Inputs,
  release: OpamRelease,
  initialRepository?: OpamRepository
) => {
  await acquireOpam(release);
  await initializeOpam(inputs, initialRepository);
};

export const installOcaml = async (
  ocamlCompiler: string,
  windowsCompiler: WindowsCompiler
) => {
  await core.group("Installing OCaml compiler", async () => {
    const packages = [ocamlCompiler];
    if (PLATFORM === "windows" && windowsCompiler === "msvc") {
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
};

export const pin = async (fpaths: string[]) => {
  if (fpaths.length === 0) {
    return;
  }
  await core.group("Pinning local packages", async () => {
    for (const fpath of fpaths) {
      const fname = path.basename(fpath, ".opam");
      const dname = path.dirname(fpath);
      // Keep the target as a local path so opam can detect the VCS backend.
      // Normalised pins parse file:// URLs directly and therefore use rsync.
      // oxlint-disable-next-line no-await-in-loop -- opam pins one package at a time
      await exec("opam", ["pin", "--no-action", "add", `${fname}.dev`, "."], {
        cwd: dname,
      });
    }
  });
};

const repositoryAdd = async (name: string, address: string) => {
  await exec("opam", [
    "repository",
    "--all-switches",
    "--set-default",
    "add",
    name,
    address,
  ]);
};

export const repositoryAddAll = async (
  repositories: readonly OpamRepository[]
) => {
  if (repositories.length === 0) {
    return;
  }
  await core.group("Initialising opam repositories", async () => {
    for (const [name, address] of repositories) {
      // oxlint-disable-next-line no-await-in-loop -- the order of addition sets the priority
      await repositoryAdd(name, address);
    }
  });
};

const repositoryList = async () => {
  const { exitCode, stdout } = await getExecOutput(
    "opam",
    ["repository", "--all-switches", "--short", "list"],
    { ignoreReturnCode: true, silent: true }
  );
  if (exitCode === 0) {
    return stdout
      .split("\n")
      .map((repository) => repository.trim())
      .filter((repository) => repository.length > 0);
  }
  return [];
};

export const repositoryRemoveAll = async () => {
  await core.group("Removing opam repositories", async () => {
    const repositories = await repositoryList();
    if (repositories.length > 0) {
      await exec("opam", [
        "repository",
        "--all-switches",
        "remove",
        ...repositories,
      ]);
    }
  });
};

export const update = async () => {
  await core.group("Updating opam repositories", async () => {
    await exec("opam", ["update"]);
  });
};
