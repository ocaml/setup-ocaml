import { promises as fs } from "node:fs";
import * as path from "node:path";
import * as process from "node:process";
import * as core from "@actions/core";
import { convertToUnix } from "./compat.js";

function parseKeyValue(line: string): [string, string] {
  const [key = "", value = ""] = line.split("=").map((s) => s.trim());
  return [key, value];
}

async function parse() {
  const githubWorkspace = process.env.GITHUB_WORKSPACE ?? process.cwd();
  const fpath = path.join(githubWorkspace, ".ocamlformat");
  try {
    await fs.access(fpath, fs.constants.R_OK);
    const buf = await fs.readFile(fpath);
    const str = buf.toString();
    const normalisedStr = convertToUnix(str);
    return new Map(normalisedStr.split("\n").values().map(parseKeyValue));
  } catch {
    return;
  }
}

export async function retrieveOcamlformatVersion() {
  const config = await parse();
  if (config === undefined) {
    core.warning(".ocamlformat file not found");
    return;
  }
  const version = config.get("version");
  if (version) {
    return version;
  }
  core.warning(
    "No ocamlformat version found in .ocamlformat file. It's recommended to specify the version in your .ocamlformat file for better consistency.",
  );
  return;
}
