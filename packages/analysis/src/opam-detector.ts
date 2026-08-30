import type { Package } from "@github/dependency-submission-toolkit";
import { BuildTarget, PackageCache } from "@github/dependency-submission-toolkit";
import { PackageURL } from "packageurl-js";
import { z } from "zod";

const OpamDependency = z.object({
  name: z.string(),
  version: z.string(),
  get dependencies() {
    return z.array(OpamDependency);
  },
});
type OpamDependency = z.infer<typeof OpamDependency>;

export const OpamOutput = z.object({
  tree: z.array(OpamDependency),
});
type OpamOutput = z.infer<typeof OpamOutput>;

function parseDependencies(cache: PackageCache, dependencies: OpamDependency[]): Package[] {
  const packages = dependencies.map((dependency) => {
    const purl = new PackageURL(
      "opam",
      undefined,
      encodeURIComponent(dependency.name),
      dependency.version,
      undefined,
      undefined,
    );
    if (cache.hasPackage(purl)) {
      return cache.package(purl);
    }
    const pkgs = new Set(parseDependencies(cache, dependency.dependencies));
    return cache.package(purl).dependsOnPackages(pkgs.values().toArray());
  });
  return packages;
}

export function createBuildTarget(output: OpamOutput, filePath: string) {
  const opamPackage = output.tree.at(0);
  if (!opamPackage) {
    throw new Error(
      "No opam dependencies were found. Please ensure the opam file is valid and contains dependencies.",
    );
  }
  const cache = new PackageCache();
  const topLevelDependencies = parseDependencies(cache, opamPackage.dependencies);
  const buildTarget = new BuildTarget(opamPackage.name, filePath);
  for (const topLevelDependency of topLevelDependencies) {
    buildTarget.addBuildDependency(topLevelDependency);
  }
  return buildTarget;
}
