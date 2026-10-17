import { A as group, C as OPAM_ROOT, D as addPath, E as create, M as exec, O as error, S as OPAM_REPOSITORIES, T as WINDOWS_ENVIRONMENT, _ as DUNE_CACHE_ROOT, b as OPAM_LOCAL_PACKAGES, c as installOcaml, d as repositoryRemoveAll, f as setupOpam, g as DUNE_CACHE, h as CYGWIN_ROOT_BIN, i as restoreOpamCache, j as isDebug, k as exportVariable, l as pin, m as CYGWIN_BASH_ENV, o as saveOpamCache, p as update, r as restoreDuneCache, s as resolvedCompiler, t as installDune, u as repositoryAddAll, v as GITHUB_WORKSPACE, w as PLATFORM, x as OPAM_PIN, y as OPAM_CACHE } from "./dune.mjs";
import * as process$1 from "node:process";
import { promises } from "node:fs";
import * as os$1 from "node:os";
import * as path from "node:path";

//#region src/installer.ts
const OPAM_SOLVER_TIMEOUT = 600;
async function pathExists(filePath) {
	return await promises.access(filePath).then(() => true, () => false);
}
async function installer() {
	if (isDebug()) exportVariable("OPAMVERBOSE", 1);
	exportVariable("OPAMCOLOR", "always");
	exportVariable("OPAMCONFIRMLEVEL", "unsafe-yes");
	exportVariable("OPAMDOWNLOADJOBS", os$1.availableParallelism());
	exportVariable("OPAMERRLOGLEN", 0);
	exportVariable("OPAMEXTERNALSOLVER", "builtin-0install");
	exportVariable("OPAMPRECISETRACKING", 1);
	exportVariable("OPAMRETRIES", 10);
	exportVariable("OPAMROOT", OPAM_ROOT);
	exportVariable("OPAMSOLVERTIMEOUT", OPAM_SOLVER_TIMEOUT);
	exportVariable("OPAMYES", 1);
	if (PLATFORM === "windows") {
		exportVariable("HOME", process$1.env.USERPROFILE);
		exportVariable("MSYS", "winsymlinks:native");
		if (WINDOWS_ENVIRONMENT === "cygwin") exportVariable("CYGWIN", "winsymlinks:native");
		await group("Configuring Windows symlink settings", async () => {
			await exec("fsutil", [
				"behavior",
				"query",
				"SymlinkEvaluation"
			]);
			await exec("fsutil", [
				"behavior",
				"set",
				"symlinkEvaluation",
				"R2L:1",
				"R2R:1"
			]);
			await exec("fsutil", [
				"behavior",
				"query",
				"SymlinkEvaluation"
			]);
		});
	}
	const opamCacheHit = OPAM_CACHE ? await restoreOpamCache() : void 0;
	const [opamRootInitialized, localSwitchInitialized] = await Promise.all([pathExists(path.join(OPAM_ROOT, "config")), pathExists(path.join(GITHUB_WORKSPACE, "_opam", ".opam-switch", "switch-config"))]);
	const useInitialRepository = !opamCacheHit && !opamRootInitialized;
	await setupOpam(useInitialRepository ? OPAM_REPOSITORIES[0] : void 0);
	if (PLATFORM === "windows" && WINDOWS_ENVIRONMENT === "cygwin") {
		await promises.writeFile(CYGWIN_BASH_ENV, "set -o igncr");
		exportVariable("BASH_ENV", CYGWIN_BASH_ENV);
		addPath(CYGWIN_ROOT_BIN);
	}
	if (!opamCacheHit) {
		if (useInitialRepository && !localSwitchInitialized) await repositoryAddAll(OPAM_REPOSITORIES.slice(1));
		else {
			await repositoryRemoveAll();
			await repositoryAddAll(OPAM_REPOSITORIES);
		}
		if (!localSwitchInitialized) {
			const ocamlCompiler = await resolvedCompiler;
			await installOcaml(ocamlCompiler);
			if (OPAM_CACHE) await saveOpamCache();
		}
	} else await update();
	if (DUNE_CACHE) {
		await restoreDuneCache();
		await installDune();
		exportVariable("DUNE_CACHE_ROOT", DUNE_CACHE_ROOT);
	}
	exportVariable("CLICOLOR_FORCE", "1");
	if (OPAM_PIN) {
		const fnames = await (await create(OPAM_LOCAL_PACKAGES)).glob();
		await pin(fnames);
	}
	await exec("opam", ["config", "report"]);
}

//#endregion
//#region src/index.ts
async function run() {
	try {
		await installer();
		process$1.exit(0);
	} catch (error$1) {
		if (error$1 instanceof Error) error(error$1.message);
		process$1.exit(1);
	}
}
run();

//#endregion
export {  };