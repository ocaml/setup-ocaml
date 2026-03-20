import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as core from "@actions/core";
import { CYGWIN_ROOT } from "./constants.js";

export async function fixFstab() {
  await core.group("Fixing Cygwin fstab configuration", async () => {
    try {
      const fstabPath = path.join(CYGWIN_ROOT, "etc", "fstab");
      await fs.access(fstabPath, fs.constants.W_OK);
      const contents = await fs.readFile(fstabPath, { encoding: "utf8" });
      core.info(contents);
      const patchedContents = contents.replace(
        /(?<=\s)binary(?=,posix)/,
        "noacl,binary",
      );
      if (contents === patchedContents) {
        core.warning(
          "The fstab file did not contain the expected 'binary,posix' pattern. The noacl fix was not applied.",
        );
      }
      core.info(patchedContents);
      await fs.writeFile(fstabPath, patchedContents, { encoding: "utf8" });
    } catch (error) {
      if (error instanceof Error) {
        core.warning(error);
      }
    }
  });
}
