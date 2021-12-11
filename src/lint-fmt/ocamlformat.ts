import { promises as fs } from "fs";
import * as path from "path";

import { convertToUnix } from "./compat";

async function parse() {
  const githubWorkspace = process.env.GITHUB_WORKSPACE ?? process.cwd();
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
  return version;
}
