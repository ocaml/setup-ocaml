async function restoreCache(
  key: string,
  restoreKeys: string[],
  paths: string[],
  options?: DownloadOptions,
) {
  if (!cache.isFeatureAvailable()) {
    core.info("Actions cache service feature is unavailable");
    return;
  }
  try {
    const cacheKey = await cache.restoreCache(paths, key, restoreKeys, options);
    if (cacheKey) {
      core.info(`Cache restored from key: ${cacheKey}`);
    } else {
      core.info(
        `Cache is not found for input keys: ${[key, ...restoreKeys].join(", ")}`,
      );
    }
    return cacheKey;
  } catch (error) {
    if (error instanceof Error) {
      core.info(`Cache restore error: ${error.message}`);
    } else if (error instanceof AggregateError) {
      core.info(
        `Cache restore network error: ${error.code || "unknown error"}`,
      );
    } else {
      core.info(`Cache restore unknown error: ${String(error)}`);
    }
    core.notice(
      "An internal error has occurred in cache backend. Please check https://www.githubstatus.com for any ongoing issue in actions.",
    );
    return;
  }
}

async function saveCache(key: string, paths: string[]) {
  if (!cache.isFeatureAvailable()) {
    core.info("Actions cache service feature is unavailable");
    return;
  }
  try {
    await cache.saveCache(paths, key);
  } catch (error) {
    if (error instanceof Error) {
      core.info(`Cache save error: ${error.message}`);
    } else if (error instanceof AggregateError) {
      core.info(`Cache save network error: ${error.code || "unknown error"}`);
    } else {
      core.info(`Cache save unknown error: ${String(error)}`);
    }
    core.notice(
      "An internal error has occurred in cache backend. Please check https://www.githubstatus.com for any ongoing issue in actions.",
    );
  }
}
