import { D as getInput, O as getState, i as DUNE_CACHE_KEY_STATE, r as trimDuneCache, s as saveDuneCache, t as createOctokit, w as error } from "../github-client.mjs";
import * as process$1 from "node:process";

//#region src/post.ts
async function run() {
	try {
		const duneCacheKey = getState(DUNE_CACHE_KEY_STATE);
		if (duneCacheKey) {
			const octokit = createOctokit(getInput("github-token"));
			await trimDuneCache(octokit);
			await saveDuneCache(duneCacheKey);
		}
		process$1.exit(0);
	} catch (error$1) {
		if (error$1 instanceof Error) error(error$1.message);
		process$1.exit(0);
	}
}
run();

//#endregion
export {  };