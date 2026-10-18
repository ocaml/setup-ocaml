import * as core from "@actions/core";
import { exec } from "@actions/exec";

export const installFormattingDependencies = async (
  ocamlformatVersion?: string
) => {
  await core.group("Installing formatting dependencies", async () => {
    const packages = ["dune"];
    if (ocamlformatVersion) {
      packages.push(`ocamlformat=${ocamlformatVersion}`);
    }
    await exec("opam", ["install", ...packages]);
  });
};
