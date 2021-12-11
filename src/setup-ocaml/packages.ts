import * as glob from "@actions/glob";

import { OPAM_LOCAL_PACKAGES } from "./constants";

export async function getOpamLocalPackages(): Promise<string[]> {
  const globber = await glob.create(OPAM_LOCAL_PACKAGES);
  const fpaths = await globber.glob();
  return fpaths;
}
