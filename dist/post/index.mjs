import { O as error, a as saveDuneCache, g as DUNE_CACHE, n as trimDuneCache } from "../dune.mjs";
import * as process$1 from "node:process";

//#region src/post.ts
async function run() {
	try {
		if (DUNE_CACHE) {
			await trimDuneCache();
			await saveDuneCache();
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