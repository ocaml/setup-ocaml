import * as core from "@actions/core";

export function startProfiler(name: string): void {
  core.startGroup(name);
  if (core.isDebug()) {
    console.time(name);
  }
}

export function stopProfiler(name: string): void {
  if (core.isDebug()) {
    console.timeEnd(name);
  }
  core.endGroup();
}
