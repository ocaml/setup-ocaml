import * as github from "@actions/github";
import { describe, expect, it } from "vite-plus/test";

import { ARCHITECTURE, PLATFORM } from "./constants.js";
import type { Octokit } from "./github-client.js";
import { findLatestOpamRelease } from "./opam.js";

type Release = Awaited<
  ReturnType<Octokit["rest"]["repos"]["listReleases"]>
>["data"][number];
type ReleaseFixture = Pick<Release, "tag_name"> & {
  assets: Pick<Release["assets"][number], "name" | "browser_download_url">[];
};

const binarySuffix = `${ARCHITECTURE}-${PLATFORM}${PLATFORM === "windows" ? ".exe" : ""}`;
const asset = (name: string) => ({
  browser_download_url: `https://example.com/${name}`,
  name,
});
const release = (
  version: string,
  assets = [
    asset(`opam-${version}-${binarySuffix}`),
    asset(`opam-${version}-${binarySuffix}.sig`),
  ]
): ReleaseFixture => ({ assets, tag_name: version });

const client = (pages: ReleaseFixture[][]) =>
  github.getOctokit("token", {
    baseUrl: "https://api.github.test",
    request: {
      // oxlint-disable-next-line require-await -- fetch requires a promise even for in-memory responses
      fetch: async (input: string | URL | Request) => {
        const url = new URL(input instanceof Request ? input.url : input);
        const page = Number(url.searchParams.get("page") ?? "1");
        const data = pages[page - 1];
        if (url.pathname !== "/repos/ocaml/opam/releases" || !data) {
          return Response.json({ message: "Not Found" }, { status: 404 });
        }
        const headers = new Headers();
        if (page < pages.length) {
          url.searchParams.set("page", String(page + 1));
          headers.set("link", `<${url.href}>; rel="next"`);
        }
        return Response.json(data, { headers });
      },
    },
  });

describe(findLatestOpamRelease, () => {
  it("finds a stable release after a page containing only prereleases", async () => {
    const octokit = client([[release("2.7.0-alpha1")], [release("2.6.1")]]);

    await expect(findLatestOpamRelease(octokit, false)).resolves.toStrictEqual({
      browserDownloadUrl: `https://example.com/opam-2.6.1-${binarySuffix}`,
      signatureBrowserDownloadUrl: `https://example.com/opam-2.6.1-${binarySuffix}.sig`,
      version: "2.6.1",
    });
  });

  it("selects the highest semantic version across all pages", async () => {
    const octokit = client([
      [release("2.6.9")],
      [release("2.6.10")],
      [release("2.6.2")],
    ]);

    await expect(findLatestOpamRelease(octokit, false)).resolves.toHaveProperty(
      "version",
      "2.6.10"
    );
  });

  it.each([
    { allowPrerelease: false, version: "2.6.1" },
    { allowPrerelease: true, version: "2.7.0-alpha1" },
  ])(
    "selects $version when allowPrerelease is $allowPrerelease",
    async ({ allowPrerelease, version }) => {
      const octokit = client([
        [release("2.7.0-alpha1"), release("invalid"), release("2.6.1")],
      ]);

      await expect(
        findLatestOpamRelease(octokit, allowPrerelease)
      ).resolves.toHaveProperty("version", version);
    }
  );

  it("preserves the built-in stable version bound", async () => {
    const octokit = client([[release("2.7.0"), release("2.6.1")]]);

    await expect(findLatestOpamRelease(octokit, false)).resolves.toHaveProperty(
      "version",
      "2.6.1"
    );
  });

  it("falls back from a source-only release to a binary on a later page", async () => {
    const octokit = client([
      [release("2.6.2", [asset("opam-2.6.2.tar.gz")])],
      [release("2.6.1")],
    ]);

    await expect(findLatestOpamRelease(octokit, false)).resolves.toHaveProperty(
      "version",
      "2.6.1"
    );
  });

  it("rejects an unsigned binary even if an older signed binary exists", async () => {
    const octokit = client([
      [release("2.6.2", [asset(`opam-2.6.2-${binarySuffix}`)])],
      [release("2.6.1")],
    ]);

    await expect(findLatestOpamRelease(octokit, false)).rejects.toThrow(
      `Failed to find the signature 'opam-2.6.2-${binarySuffix}.sig' in the opam 2.6.2 release. Refusing to install an unsigned opam binary.`
    );
  });

  it("reports when GitHub returns no releases", async () => {
    const octokit = client([[]]);

    await expect(findLatestOpamRelease(octokit, false)).rejects.toThrow(
      "The GitHub API returned no releases for ocaml/opam. Retry the workflow and check GitHub's status if the problem persists."
    );
  });

  it("reports the built-in range and release count when no stable release matches", async () => {
    const octokit = client([
      [release("2.7.0"), release("2.7.0-alpha1")],
      [release("invalid")],
    ]);

    await expect(findLatestOpamRelease(octokit, false)).rejects.toThrow(
      "No opam release matched the built-in range '<2.7.0' (allow-prerelease-opam: false, releases received: 3). Check opam releases and your setup-ocaml version."
    );
  });

  it("reports the prerelease setting when no version tag matches", async () => {
    const octokit = client([[release("invalid")]]);

    await expect(findLatestOpamRelease(octokit, true)).rejects.toThrow(
      "No opam release matched the built-in range '*' (allow-prerelease-opam: true, releases received: 1). Check opam releases and your setup-ocaml version."
    );
  });

  it("preserves GitHub API errors", async () => {
    const octokit = client([]);

    await expect(findLatestOpamRelease(octokit, false)).rejects.toMatchObject({
      message: "Not Found",
      status: 404,
    });
  });
});
