import { promises as fs } from "node:fs";
import path from "node:path";
import * as process from "node:process";

import * as core from "@actions/core";

const parseKeyValue = (line: string): [string, string] => {
  const [key = "", value = ""] = line.split("=").map((s) => s.trim());
  return [key, value];
};

const parse = async () => {
  const fpath = path.join(process.cwd(), ".ocamlformat");
  try {
    await fs.access(fpath, fs.constants.R_OK);
  } catch {
    return null;
  }
  const str = await fs.readFile(fpath, "utf-8");
  return new Map(
    str
      .split(/\r?\n|\r/u)
      .values()
      .map(parseKeyValue)
  );
};

export const retrieveOcamlformatVersion = async () => {
  const config = await parse();
  if (config === null) {
    core.warning(".ocamlformat file not found");
    return null;
  }
  const version = config.get("version");
  if (version === undefined || version === "") {
    core.warning(
      "No ocamlformat version found in .ocamlformat file. It's recommended to specify the version in your .ocamlformat file for better consistency."
    );
    return null;
  }
  return version;
};
