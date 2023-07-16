import { promises as fs } from "node:fs";
import * as path from "node:path";

import { convertToUnix } from "./compat";

async function parse() {
  const githubWorkspace = process.env["GITHUB_WORKSPACE"] ?? process.cwd();
  const fpath = path.join(githubWorkspace, ".ocamlformat");
  const buf = await fs.readFile(fpath);
  const str = buf.toString();
  const normalisedStr = convertToUnix(str);
  const config = normalisedStr
    .split("\n")
    .map((line) => line.split("=").map((str) => str.trim()));
  return config;
}

export async function getOcamlformatVersion() {
  const config = await parse();
  const version = config.filter((line) => line[0] === "version").flat()[1];
  if (version) {
    return version;
  } else {
    throw new Error(
      "Field version not found in .ocamlformat file: setting up your project to use the default profile and the OCamlFormat version you installed in .ocamlformat file is considered good practice",
    );
  }
}
