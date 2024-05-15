import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import * as process from "node:process";
import { exec } from "@actions/exec";
import * as glob from "@actions/glob";
import {
  Snapshot,
  submitSnapshot,
} from "@github/dependency-submission-toolkit";
import type { Output } from "./opam-detector";
import { createBuildTarget } from "./opam-detector";

async function getOpamLocalPackages() {
  const globber = await glob.create("*.opam");
  const fpaths = await globber.glob();
  return fpaths;
}

export async function analysis() {
  const snapshot = new Snapshot({
    name: "ocaml/setup-ocaml/analysis",
    url: "https://github.com/ocaml/setup-ocaml/tree/master/analysis",
    version: "0.0.0",
  });
  const fpaths = await getOpamLocalPackages();
  for (const fpath of fpaths) {
    const temp = await fs.mkdtemp(
      path.join(os.tmpdir(), "setup-ocaml-opam-tree-"),
    );
    const tempJson = path.join(temp, "tmp.json");
    const { name } = path.parse(fpath);
    await exec(
      "opam",
      [
        "tree",
        `--json=${tempJson}`,
        "--with-dev-setup",
        // [NOTE] https://github.com/ocaml/opam/issues/4541
        // "--with-doc",
        "--with-test",
        name,
      ],
      {
        env: {
          ...process.env,
          PATH: process.env.PATH ?? "",
        },
        silent: true,
      },
    );
    const output = JSON.parse(
      await fs.readFile(tempJson, "utf8"),
    ) as unknown as Output;
    const githubWorkspace = process.env.GITHUB_WORKSPACE ?? process.cwd();
    const opamPackagePath = path.normalize(
      path.relative(githubWorkspace, fpath),
    );
    const buildTarget = createBuildTarget(output, opamPackagePath);
    snapshot.addManifest(buildTarget);
  }
  await submitSnapshot(snapshot);
}
