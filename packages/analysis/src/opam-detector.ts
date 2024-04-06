import type { Package } from "@github/dependency-submission-toolkit";
import {
  BuildTarget,
  PackageCache,
} from "@github/dependency-submission-toolkit";
import { PackageURL } from "packageurl-js";

export interface Output {
  "opam-version": string;
  "command-line": string[];
  switch: string;
  tree: Forest;
}

interface OpamPackage {
  name: string;
  version: string;
}

interface OpamDepsTree extends OpamPackage {
  dependencies: Dependencies;
}

interface OpamDepsNode extends OpamDepsTree {
  satisfies: string | null;
  is_duplicate: boolean;
}

type Forest = OpamDepsTree[];
type Dependencies = OpamDepsNode[];

function parseDependencies(
  cache: PackageCache,
  dependencies: Dependencies,
): Package[] {
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
    const pkgs = new Set<Package>();
    if (dependency.dependencies.length > 0) {
      for (const pkg of parseDependencies(cache, dependency.dependencies))
        pkgs.add(pkg);
    }
    return cache.package(purl).dependsOnPackages([...pkgs]);
  });
  return packages;
}

export function createBuildTarget(output: Output, filePath: string) {
  const opamPackage = output.tree.at(0);
  if (!opamPackage) {
    throw new Error("No dependencies found");
  }
  const cache = new PackageCache();
  const topLevelDependencies = parseDependencies(
    cache,
    opamPackage.dependencies,
  );
  const buildTarget = new BuildTarget(opamPackage.name, filePath);
  for (const topLevelDependency of topLevelDependencies) {
    buildTarget.addBuildDependency(topLevelDependency);
  }
  return buildTarget;
}
