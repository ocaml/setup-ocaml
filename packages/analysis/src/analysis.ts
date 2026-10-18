import * as fs from "node:fs/promises";
import * as os from "node:os";
import path from "node:path";
import * as process from "node:process";

import { exec } from "@actions/exec";
import * as glob from "@actions/glob";
import {
  Snapshot,
  submitSnapshot,
} from "@github/dependency-submission-toolkit";

import { createBuildTarget, OpamOutputSchema } from "./opam-detector.js";

const retrieveOpamLocalPackages = async () => {
  const globber = await glob.create("*.opam");
  const fpaths = await globber.glob();
  return fpaths;
};

const createManifest = async (fpath: string) => {
  const temp = await fs.mkdtemp(
    path.join(os.tmpdir(), "setup-ocaml-opam-tree-")
  );
  const tempJson = path.join(temp, "tmp.json");
  const { name } = path.parse(fpath);
  await exec(
    "opam",
    [
      "tree",
      "--with-dev-setup",
      "--with-doc",
      "--with-test",
      `--json=${tempJson}`,
      name,
    ],
    { silent: true }
  );
  const output = OpamOutputSchema.parse(
    JSON.parse(await fs.readFile(tempJson, "utf-8"))
  );
  const githubWorkspace = process.env.GITHUB_WORKSPACE ?? process.cwd();
  const opamPackagePath = path.normalize(path.relative(githubWorkspace, fpath));
  return createBuildTarget(output, opamPackagePath);
};

export const analysis = async () => {
  const snapshot = new Snapshot({
    name: "ocaml/setup-ocaml/analysis",
    url: "https://github.com/ocaml/setup-ocaml/tree/master/analysis",
    version: "0.0.0",
  });
  const fpaths = await retrieveOpamLocalPackages();
  for (const fpath of fpaths) {
    // oxlint-disable-next-line no-await-in-loop -- run opam for one package at a time
    snapshot.addManifest(await createManifest(fpath));
  }
  await submitSnapshot(snapshot);
};
