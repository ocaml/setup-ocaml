import { A as exec, C as WINDOWS_ENVIRONMENT, D as exportVariable, E as error, O as group, S as PLATFORM, T as debug, _ as DUNE_CACHE_ROOT, b as OPAM_REPOSITORIES, c as installOcaml, d as repositoryRemoveAll, f as setupOpam, g as DUNE_CACHE, h as CYGWIN_ROOT_BIN, i as restoreOpamCache, k as isDebug, l as pin, m as CYGWIN_BASH_ENV, o as saveOpamCache, p as update, r as restoreDuneCache, s as resolvedCompiler, t as installDune, u as repositoryAddAll, v as OPAM_LOCAL_PACKAGES, w as addPath, x as OPAM_ROOT, y as OPAM_PIN } from "./dune.mjs";
import * as process$2 from "node:process";
import * as os$3 from "os";
import * as fs$1 from "fs";
import * as path$2 from "path";
import assert from "assert";
import { promises as promises$1 } from "node:fs";
import * as os$2 from "node:os";
import * as path from "node:path";

//#region node_modules/@actions/glob/lib/internal-glob-options-helper.js
/**
* Returns a copy with defaults filled in.
*/
function getOptions(copy) {
	const result = {
		followSymbolicLinks: true,
		implicitDescendants: true,
		matchDirectories: true,
		omitBrokenSymbolicLinks: true,
		excludeHiddenFiles: false
	};
	if (copy) {
		if (typeof copy.followSymbolicLinks === "boolean") {
			result.followSymbolicLinks = copy.followSymbolicLinks;
			debug(`followSymbolicLinks '${result.followSymbolicLinks}'`);
		}
		if (typeof copy.implicitDescendants === "boolean") {
			result.implicitDescendants = copy.implicitDescendants;
			debug(`implicitDescendants '${result.implicitDescendants}'`);
		}
		if (typeof copy.matchDirectories === "boolean") {
			result.matchDirectories = copy.matchDirectories;
			debug(`matchDirectories '${result.matchDirectories}'`);
		}
		if (typeof copy.omitBrokenSymbolicLinks === "boolean") {
			result.omitBrokenSymbolicLinks = copy.omitBrokenSymbolicLinks;
			debug(`omitBrokenSymbolicLinks '${result.omitBrokenSymbolicLinks}'`);
		}
		if (typeof copy.excludeHiddenFiles === "boolean") {
			result.excludeHiddenFiles = copy.excludeHiddenFiles;
			debug(`excludeHiddenFiles '${result.excludeHiddenFiles}'`);
		}
	}
	return result;
}

//#endregion
//#region node_modules/@actions/glob/lib/internal-path-helper.js
const IS_WINDOWS$4 = process.platform === "win32";
/**
* Similar to path.dirname except normalizes the path separators and slightly better handling for Windows UNC paths.
*
* For example, on Linux/macOS:
* - `/               => /`
* - `/hello          => /`
*
* For example, on Windows:
* - `C:\             => C:\`
* - `C:\hello        => C:\`
* - `C:              => C:`
* - `C:hello         => C:`
* - `\               => \`
* - `\hello          => \`
* - `\\hello         => \\hello`
* - `\\hello\world   => \\hello\world`
*/
function dirname(p) {
	p = safeTrimTrailingSeparator(p);
	if (IS_WINDOWS$4 && /^\\\\[^\\]+(\\[^\\]+)?$/.test(p)) return p;
	let result = path$2.dirname(p);
	if (IS_WINDOWS$4 && /^\\\\[^\\]+\\[^\\]+\\$/.test(result)) result = safeTrimTrailingSeparator(result);
	return result;
}
/**
* Roots the path if not already rooted. On Windows, relative roots like `\`
* or `C:` are expanded based on the current working directory.
*/
function ensureAbsoluteRoot(root, itemPath) {
	assert(root, `ensureAbsoluteRoot parameter 'root' must not be empty`);
	assert(itemPath, `ensureAbsoluteRoot parameter 'itemPath' must not be empty`);
	if (hasAbsoluteRoot(itemPath)) return itemPath;
	if (IS_WINDOWS$4) {
		if (itemPath.match(/^[A-Z]:[^\\/]|^[A-Z]:$/i)) {
			let cwd = process.cwd();
			assert(cwd.match(/^[A-Z]:\\/i), `Expected current directory to start with an absolute drive root. Actual '${cwd}'`);
			if (itemPath[0].toUpperCase() === cwd[0].toUpperCase()) {
				if (itemPath.length === 2) return `${itemPath[0]}:\\${cwd.substr(3)}`;
				else {
					if (!cwd.endsWith("\\")) cwd += "\\";
					return `${itemPath[0]}:\\${cwd.substr(3)}${itemPath.substr(2)}`;
				}
			} else return `${itemPath[0]}:\\${itemPath.substr(2)}`;
		} else if (normalizeSeparators(itemPath).match(/^\\$|^\\[^\\]/)) {
			const cwd = process.cwd();
			assert(cwd.match(/^[A-Z]:\\/i), `Expected current directory to start with an absolute drive root. Actual '${cwd}'`);
			return `${cwd[0]}:\\${itemPath.substr(1)}`;
		}
	}
	assert(hasAbsoluteRoot(root), `ensureAbsoluteRoot parameter 'root' must have an absolute root`);
	if (root.endsWith("/") || IS_WINDOWS$4 && root.endsWith("\\")) {} else root += path$2.sep;
	return root + itemPath;
}
/**
* On Linux/macOS, true if path starts with `/`. On Windows, true for paths like:
* `\\hello\share` and `C:\hello` (and using alternate separator).
*/
function hasAbsoluteRoot(itemPath) {
	assert(itemPath, `hasAbsoluteRoot parameter 'itemPath' must not be empty`);
	itemPath = normalizeSeparators(itemPath);
	if (IS_WINDOWS$4) return itemPath.startsWith("\\\\") || /^[A-Z]:\\/i.test(itemPath);
	return itemPath.startsWith("/");
}
/**
* On Linux/macOS, true if path starts with `/`. On Windows, true for paths like:
* `\`, `\hello`, `\\hello\share`, `C:`, and `C:\hello` (and using alternate separator).
*/
function hasRoot(itemPath) {
	assert(itemPath, `isRooted parameter 'itemPath' must not be empty`);
	itemPath = normalizeSeparators(itemPath);
	if (IS_WINDOWS$4) return itemPath.startsWith("\\") || /^[A-Z]:/i.test(itemPath);
	return itemPath.startsWith("/");
}
/**
* Removes redundant slashes and converts `/` to `\` on Windows
*/
function normalizeSeparators(p) {
	p = p || "";
	if (IS_WINDOWS$4) {
		p = p.replace(/\//g, "\\");
		return (/^\\\\+[^\\]/.test(p) ? "\\" : "") + p.replace(/\\\\+/g, "\\");
	}
	return p.replace(/\/\/+/g, "/");
}
/**
* Normalizes the path separators and trims the trailing separator (when safe).
* For example, `/foo/ => /foo` but `/ => /`
*/
function safeTrimTrailingSeparator(p) {
	if (!p) return "";
	p = normalizeSeparators(p);
	if (!p.endsWith(path$2.sep)) return p;
	if (p === path$2.sep) return p;
	if (IS_WINDOWS$4 && /^[A-Z]:\\$/i.test(p)) return p;
	return p.substr(0, p.length - 1);
}

//#endregion
//#region node_modules/@actions/glob/lib/internal-match-kind.js
/**
* Indicates whether a pattern matches a path
*/
var MatchKind;
(function(MatchKind) {
	/** Not matched */
	MatchKind[MatchKind["None"] = 0] = "None";
	/** Matched if the path is a directory */
	MatchKind[MatchKind["Directory"] = 1] = "Directory";
	/** Matched if the path is a regular file */
	MatchKind[MatchKind["File"] = 2] = "File";
	/** Matched */
	MatchKind[MatchKind["All"] = 3] = "All";
})(MatchKind || (MatchKind = {}));

//#endregion
//#region node_modules/@actions/glob/lib/internal-pattern-helper.js
const IS_WINDOWS$3 = process.platform === "win32";
/**
* Given an array of patterns, returns an array of paths to search.
* Duplicates and paths under other included paths are filtered out.
*/
function getSearchPaths(patterns) {
	patterns = patterns.filter((x) => !x.negate);
	const searchPathMap = {};
	for (const pattern of patterns) {
		const key = IS_WINDOWS$3 ? pattern.searchPath.toUpperCase() : pattern.searchPath;
		searchPathMap[key] = "candidate";
	}
	const result = [];
	for (const pattern of patterns) {
		const key = IS_WINDOWS$3 ? pattern.searchPath.toUpperCase() : pattern.searchPath;
		if (searchPathMap[key] === "included") continue;
		let foundAncestor = false;
		let tempKey = key;
		let parent = dirname(tempKey);
		while (parent !== tempKey) {
			if (searchPathMap[parent]) {
				foundAncestor = true;
				break;
			}
			tempKey = parent;
			parent = dirname(tempKey);
		}
		if (!foundAncestor) {
			result.push(pattern.searchPath);
			searchPathMap[key] = "included";
		}
	}
	return result;
}
/**
* Matches the patterns against the path
*/
function match$1(patterns, itemPath) {
	let result = MatchKind.None;
	for (const pattern of patterns) if (pattern.negate) result &= ~pattern.match(itemPath);
	else result |= pattern.match(itemPath);
	return result;
}
/**
* Checks whether to descend further into the directory
*/
function partialMatch(patterns, itemPath) {
	return patterns.some((x) => !x.negate && x.partialMatch(itemPath));
}

//#endregion
//#region node_modules/@actions/glob/node_modules/balanced-match/dist/esm/index.js
const balanced = (a, b, str) => {
	const ma = a instanceof RegExp ? maybeMatch(a, str) : a;
	const mb = b instanceof RegExp ? maybeMatch(b, str) : b;
	const r = ma !== null && mb != null && range(ma, mb, str);
	return r && {
		start: r[0],
		end: r[1],
		pre: str.slice(0, r[0]),
		body: str.slice(r[0] + ma.length, r[1]),
		post: str.slice(r[1] + mb.length)
	};
};
const maybeMatch = (reg, str) => {
	const m = str.match(reg);
	return m ? m[0] : null;
};
const range = (a, b, str) => {
	let begs, beg, left, right = void 0, result;
	let ai = str.indexOf(a);
	let bi = str.indexOf(b, ai + 1);
	let i = ai;
	if (ai >= 0 && bi > 0) {
		if (a === b) return [ai, bi];
		begs = [];
		left = str.length;
		while (i >= 0 && !result) {
			if (i === ai) {
				begs.push(i);
				ai = str.indexOf(a, i + 1);
			} else if (begs.length === 1) {
				const r = begs.pop();
				if (r !== void 0) result = [r, bi];
			} else {
				beg = begs.pop();
				if (beg !== void 0 && beg < left) {
					left = beg;
					right = bi;
				}
				bi = str.indexOf(b, i + 1);
			}
			i = ai < bi && ai >= 0 ? ai : bi;
		}
		if (begs.length && right !== void 0) result = [left, right];
	}
	return result;
};

//#endregion
//#region node_modules/@actions/glob/node_modules/brace-expansion/dist/esm/index.js
const escSlash = "\0SLASH" + Math.random() + "\0";
const escOpen = "\0OPEN" + Math.random() + "\0";
const escClose = "\0CLOSE" + Math.random() + "\0";
const escComma = "\0COMMA" + Math.random() + "\0";
const escPeriod = "\0PERIOD" + Math.random() + "\0";
const escSlashPattern = new RegExp(escSlash, "g");
const escOpenPattern = new RegExp(escOpen, "g");
const escClosePattern = new RegExp(escClose, "g");
const escCommaPattern = new RegExp(escComma, "g");
const escPeriodPattern = new RegExp(escPeriod, "g");
const slashPattern = /\\\\/g;
const openPattern = /\\{/g;
const closePattern = /\\}/g;
const commaPattern = /\\,/g;
const periodPattern = /\\\./g;
const EXPANSION_MAX = 1e5;
const EXPANSION_MAX_LENGTH = 4e6;
function numeric(str) {
	return !isNaN(str) ? parseInt(str, 10) : str.charCodeAt(0);
}
function escapeBraces(str) {
	return str.replace(slashPattern, escSlash).replace(openPattern, escOpen).replace(closePattern, escClose).replace(commaPattern, escComma).replace(periodPattern, escPeriod);
}
function unescapeBraces(str) {
	return str.replace(escSlashPattern, "\\").replace(escOpenPattern, "{").replace(escClosePattern, "}").replace(escCommaPattern, ",").replace(escPeriodPattern, ".");
}
/**
* Basically just str.split(","), but handling cases
* where we have nested braced sections, which should be
* treated as individual members, like {a,{b,c},d}
*/
function parseCommaParts(str) {
	if (!str) return [""];
	const parts = [];
	const m = balanced("{", "}", str);
	if (!m) return str.split(",");
	const { pre, body, post } = m;
	const p = pre.split(",");
	p[p.length - 1] += "{" + body + "}";
	const postParts = parseCommaParts(post);
	if (post.length) {
		p[p.length - 1] += postParts.shift();
		p.push.apply(p, postParts);
	}
	parts.push.apply(parts, p);
	return parts;
}
function expand(str, options = {}) {
	if (!str) return [];
	const { max = EXPANSION_MAX, maxLength = EXPANSION_MAX_LENGTH } = options;
	if (str.slice(0, 2) === "{}") str = "\\{\\}" + str.slice(2);
	return expand_(escapeBraces(str), max, maxLength, true).map(unescapeBraces);
}
function embrace(str) {
	return "{" + str + "}";
}
function isPadded(el) {
	return /^-?0\d/.test(el);
}
function lte(i, y) {
	return i <= y;
}
function gte(i, y) {
	return i >= y;
}
function combine(acc, pre, values, max, maxLength, dropEmpties) {
	const out = [];
	let length = 0;
	for (let a = 0; a < acc.length; a++) for (let v = 0; v < values.length; v++) {
		if (out.length >= max) return out;
		const expansion = acc[a] + pre + values[v];
		if (dropEmpties && !expansion) continue;
		if (length + expansion.length > maxLength) return out;
		out.push(expansion);
		length += expansion.length;
	}
	return out;
}
function expandSequence(body, isAlphaSequence, max, maxLength) {
	const n = body.split(/\.\./);
	const N = [];
	/* c8 ignore start */
	if (n[0] === void 0 || n[1] === void 0) return N;
	/* c8 ignore stop */
	const x = numeric(n[0]);
	const y = numeric(n[1]);
	const width = Math.max(n[0].length, n[1].length);
	let incr = n.length === 3 && n[2] !== void 0 ? Math.max(Math.abs(numeric(n[2])), 1) : 1;
	let test = lte;
	if (y < x) {
		incr *= -1;
		test = gte;
	}
	const pad = n.some(isPadded);
	let length = 0;
	for (let i = x; test(i, y) && N.length < max; i += incr) {
		let c;
		if (isAlphaSequence) {
			c = String.fromCharCode(i);
			if (c === "\\") c = "";
		} else {
			c = String(i);
			if (pad) {
				const need = width - c.length;
				if (need > 0) {
					const z = new Array(need + 1).join("0");
					if (i < 0) c = "-" + z + c.slice(1);
					else c = z + c;
				}
			}
		}
		if (length + c.length > maxLength) break;
		N.push(c);
		length += c.length;
	}
	return N;
}
function expand_(str, max, maxLength, isTop) {
	let acc = [""];
	let dropEmpties = false;
	let firstGroup = true;
	for (;;) {
		const m = balanced("{", "}", str);
		if (!m) return combine(acc, str, [""], max, maxLength, dropEmpties);
		const pre = m.pre;
		if (/\$$/.test(pre)) {
			acc = combine(acc, pre + "{" + m.body + "}", [""], max, maxLength, dropEmpties && !m.post.length);
			firstGroup = false;
			if (!m.post.length) break;
			str = m.post;
			continue;
		}
		const isNumericSequence = /^-?\d+\.\.-?\d+(?:\.\.-?\d+)?$/.test(m.body);
		const isAlphaSequence = /^[a-zA-Z]\.\.[a-zA-Z](?:\.\.-?\d+)?$/.test(m.body);
		const isSequence = isNumericSequence || isAlphaSequence;
		const isOptions = m.body.indexOf(",") >= 0;
		if (!isSequence && !isOptions) {
			if (m.post.match(/,(?!,).*\}/)) {
				str = m.pre + "{" + m.body + escClose + m.post;
				isTop = true;
				continue;
			}
			return combine(acc, pre + "{" + m.body + "}" + m.post, [""], max, maxLength, dropEmpties);
		}
		if (firstGroup) {
			dropEmpties = isTop && !isSequence;
			firstGroup = false;
		}
		let values;
		if (isSequence) values = expandSequence(m.body, isAlphaSequence, max, maxLength);
		else {
			let n = parseCommaParts(m.body);
			if (n.length === 1 && n[0] !== void 0) {
				n = expand_(n[0], max, maxLength, false).map(embrace);
				/* c8 ignore start */
				if (n.length === 1) {
					acc = combine(acc, pre + n[0], [""], max, maxLength, dropEmpties && !m.post.length);
					if (!m.post.length) break;
					str = m.post;
					continue;
				}
			}
			let dropsEmpties = dropEmpties && !m.post.length && !pre;
			for (let d = 0; dropsEmpties && d < acc.length; d++) if (acc[d]) dropsEmpties = false;
			values = [];
			let valuesLength = 0;
			outer: for (let j = 0; j < n.length; j++) {
				const expanded = expand_(n[j], max, maxLength, false);
				for (let k = 0; k < expanded.length; k++) {
					const v = expanded[k];
					if (dropsEmpties && !v) continue;
					if (values.length >= max || valuesLength + v.length > maxLength) break outer;
					values.push(v);
					valuesLength += v.length;
				}
			}
		}
		acc = combine(acc, pre, values, max, maxLength, dropEmpties && !m.post.length);
		if (!m.post.length) break;
		str = m.post;
	}
	return acc;
}

//#endregion
//#region node_modules/@actions/glob/node_modules/minimatch/dist/esm/assert-valid-pattern.js
const MAX_PATTERN_LENGTH = 65536;
const assertValidPattern = (pattern) => {
	if (typeof pattern !== "string") throw new TypeError("invalid pattern");
	if (pattern.length > MAX_PATTERN_LENGTH) throw new TypeError("pattern is too long");
};

//#endregion
//#region node_modules/@actions/glob/node_modules/minimatch/dist/esm/brace-expressions.js
const posixClasses = {
	"[:alnum:]": ["\\p{L}\\p{Nl}\\p{Nd}", true],
	"[:alpha:]": ["\\p{L}\\p{Nl}", true],
	"[:ascii:]": ["\\x00-\\x7f", false],
	"[:blank:]": ["\\p{Zs}\\t", true],
	"[:cntrl:]": ["\\p{Cc}", true],
	"[:digit:]": ["\\p{Nd}", true],
	"[:graph:]": [
		"\\p{Z}\\p{C}",
		true,
		true
	],
	"[:lower:]": ["\\p{Ll}", true],
	"[:print:]": ["\\p{C}", true],
	"[:punct:]": ["\\p{P}", true],
	"[:space:]": ["\\p{Z}\\t\\r\\n\\v\\f", true],
	"[:upper:]": ["\\p{Lu}", true],
	"[:word:]": ["\\p{L}\\p{Nl}\\p{Nd}\\p{Pc}", true],
	"[:xdigit:]": ["A-Fa-f0-9", false]
};
const braceEscape = (s) => s.replace(/[[\]\\-]/g, "\\$&");
const regexpEscape = (s) => s.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
const rangesToString = (ranges) => ranges.join("");
const parseClass = (glob, position) => {
	const pos = position;
	/* c8 ignore start */
	if (glob.charAt(pos) !== "[") throw new Error("not in a brace expression");
	/* c8 ignore stop */
	const ranges = [];
	const negs = [];
	let i = pos + 1;
	let sawStart = false;
	let uflag = false;
	let escaping = false;
	let negate = false;
	let endPos = pos;
	let rangeStart = "";
	WHILE: while (i < glob.length) {
		const c = glob.charAt(i);
		if ((c === "!" || c === "^") && i === pos + 1) {
			negate = true;
			i++;
			continue;
		}
		if (c === "]" && sawStart && !escaping) {
			endPos = i + 1;
			break;
		}
		sawStart = true;
		if (c === "\\") {
			if (!escaping) {
				escaping = true;
				i++;
				continue;
			}
		}
		if (c === "[" && !escaping) {
			for (const [cls, [unip, u, neg]] of Object.entries(posixClasses)) if (glob.startsWith(cls, i)) {
				if (rangeStart) return [
					"$.",
					false,
					glob.length - pos,
					true
				];
				i += cls.length;
				if (neg) negs.push(unip);
				else ranges.push(unip);
				uflag = uflag || u;
				continue WHILE;
			}
		}
		escaping = false;
		if (rangeStart) {
			if (c > rangeStart) ranges.push(braceEscape(rangeStart) + "-" + braceEscape(c));
			else if (c === rangeStart) ranges.push(braceEscape(c));
			rangeStart = "";
			i++;
			continue;
		}
		if (glob.startsWith("-]", i + 1)) {
			ranges.push(braceEscape(c + "-"));
			i += 2;
			continue;
		}
		if (glob.startsWith("-", i + 1)) {
			rangeStart = c;
			i += 2;
			continue;
		}
		ranges.push(braceEscape(c));
		i++;
	}
	if (endPos < i) return [
		"",
		false,
		0,
		false
	];
	if (!ranges.length && !negs.length) return [
		"$.",
		false,
		glob.length - pos,
		true
	];
	if (negs.length === 0 && ranges.length === 1 && /^\\?.$/.test(ranges[0]) && !negate) {
		const r = ranges[0].length === 2 ? ranges[0].slice(-1) : ranges[0];
		return [
			regexpEscape(r),
			false,
			endPos - pos,
			false
		];
	}
	const sranges = "[" + (negate ? "^" : "") + rangesToString(ranges) + "]";
	const snegs = "[" + (negate ? "" : "^") + rangesToString(negs) + "]";
	return [
		ranges.length && negs.length ? "(" + sranges + "|" + snegs + ")" : ranges.length ? sranges : snegs,
		uflag,
		endPos - pos,
		true
	];
};

//#endregion
//#region node_modules/@actions/glob/node_modules/minimatch/dist/esm/unescape.js
/**
* Un-escape a string that has been escaped with {@link escape}.
*
* If the {@link MinimatchOptions.windowsPathsNoEscape} option is used, then
* square-bracket escapes are removed, but not backslash escapes.
*
* For example, it will turn the string `'[*]'` into `*`, but it will not
* turn `'\\*'` into `'*'`, because `\` is a path separator in
* `windowsPathsNoEscape` mode.
*
* When `windowsPathsNoEscape` is not set, then both square-bracket escapes and
* backslash escapes are removed.
*
* Slashes (and backslashes in `windowsPathsNoEscape` mode) cannot be escaped
* or unescaped.
*
* When `magicalBraces` is not set, escapes of braces (`{` and `}`) will not be
* unescaped.
*/
const unescape = (s, { windowsPathsNoEscape = false, magicalBraces = true } = {}) => {
	if (magicalBraces) return windowsPathsNoEscape ? s.replace(/\[([^/\\])\]/g, "$1") : s.replace(/((?!\\).|^)\[([^/\\])\]/g, "$1$2").replace(/\\([^/])/g, "$1");
	return windowsPathsNoEscape ? s.replace(/\[([^/\\{}])\]/g, "$1") : s.replace(/((?!\\).|^)\[([^/\\{}])\]/g, "$1$2").replace(/\\([^/{}])/g, "$1");
};

//#endregion
//#region node_modules/@actions/glob/node_modules/minimatch/dist/esm/ast.js
var _a;
const types = /* @__PURE__ */ new Set([
	"!",
	"?",
	"+",
	"*",
	"@"
]);
const isExtglobType = (c) => types.has(c);
const isExtglobAST = (c) => isExtglobType(c.type);
const adoptionMap = /* @__PURE__ */ new Map([
	["!", ["@"]],
	["?", ["?", "@"]],
	["@", ["@"]],
	["*", [
		"*",
		"+",
		"?",
		"@"
	]],
	["+", ["+", "@"]]
]);
const adoptionWithSpaceMap = /* @__PURE__ */ new Map([
	["!", ["?"]],
	["@", ["?"]],
	["+", ["?", "*"]]
]);
const adoptionAnyMap = /* @__PURE__ */ new Map([
	["!", ["?", "@"]],
	["?", ["?", "@"]],
	["@", ["?", "@"]],
	["*", [
		"*",
		"+",
		"?",
		"@"
	]],
	["+", [
		"+",
		"@",
		"?",
		"*"
	]]
]);
const usurpMap = /* @__PURE__ */ new Map([
	["!", /* @__PURE__ */ new Map([["!", "@"]])],
	["?", /* @__PURE__ */ new Map([["*", "*"], ["+", "*"]])],
	["@", /* @__PURE__ */ new Map([
		["!", "!"],
		["?", "?"],
		["@", "@"],
		["*", "*"],
		["+", "+"]
	])],
	["+", /* @__PURE__ */ new Map([["?", "*"], ["*", "*"]])]
]);
const startNoTraversal = "(?!(?:^|/)\\.\\.?(?:$|/))";
const startNoDot = "(?!\\.)";
const addPatternStart = /* @__PURE__ */ new Set(["[", "."]);
const justDots = /* @__PURE__ */ new Set(["..", "."]);
const reSpecials = /* @__PURE__ */ new Set("().*{}+?[]^$\\!");
const regExpEscape$1 = (s) => s.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
const qmark = "[^/]";
const star$1 = "[^/]*?";
const starNoEmpty = "[^/]+?";
let ID = 0;
var AST = class {
	type;
	#root;
	#hasMagic;
	#uflag = false;
	#parts = [];
	#parent;
	#parentIndex;
	#negs;
	#filledNegs = false;
	#options;
	#toString;
	#emptyExt = false;
	id = ++ID;
	get depth() {
		return (this.#parent?.depth ?? -1) + 1;
	}
	[Symbol.for("nodejs.util.inspect.custom")]() {
		return {
			"@@type": "AST",
			id: this.id,
			type: this.type,
			root: this.#root.id,
			parent: this.#parent?.id,
			depth: this.depth,
			partsLength: this.#parts.length,
			parts: this.#parts
		};
	}
	constructor(type, parent, options = {}) {
		this.type = type;
		if (type) this.#hasMagic = true;
		this.#parent = parent;
		this.#root = this.#parent ? this.#parent.#root : this;
		this.#options = this.#root === this ? options : this.#root.#options;
		this.#negs = this.#root === this ? [] : this.#root.#negs;
		if (type === "!" && !this.#root.#filledNegs) this.#negs.push(this);
		this.#parentIndex = this.#parent ? this.#parent.#parts.length : 0;
	}
	get hasMagic() {
		/* c8 ignore start */
		if (this.#hasMagic !== void 0) return this.#hasMagic;
		/* c8 ignore stop */
		for (const p of this.#parts) {
			if (typeof p === "string") continue;
			if (p.type || p.hasMagic) return this.#hasMagic = true;
		}
		return this.#hasMagic;
	}
	toString() {
		return this.#toString !== void 0 ? this.#toString : !this.type ? this.#toString = this.#parts.map((p) => String(p)).join("") : this.#toString = this.type + "(" + this.#parts.map((p) => String(p)).join("|") + ")";
	}
	#fillNegs() {
		/* c8 ignore start */
		if (this !== this.#root) throw new Error("should only call on root");
		if (this.#filledNegs) return this;
		/* c8 ignore stop */
		this.toString();
		this.#filledNegs = true;
		let n;
		while (n = this.#negs.pop()) {
			if (n.type !== "!") continue;
			let p = n;
			let pp = p.#parent;
			while (pp) {
				for (let i = p.#parentIndex + 1; !pp.type && i < pp.#parts.length; i++) for (const part of n.#parts) {
					/* c8 ignore start */
					if (typeof part === "string") throw new Error("string part in extglob AST??");
					/* c8 ignore stop */
					part.copyIn(pp.#parts[i]);
				}
				p = pp;
				pp = p.#parent;
			}
		}
		return this;
	}
	push(...parts) {
		for (const p of parts) {
			if (p === "") continue;
			/* c8 ignore start */
			if (typeof p !== "string" && !(p instanceof _a && p.#parent === this)) throw new Error("invalid part: " + p);
			/* c8 ignore stop */
			this.#parts.push(p);
		}
	}
	toJSON() {
		const ret = this.type === null ? this.#parts.slice().map((p) => typeof p === "string" ? p : p.toJSON()) : [this.type, ...this.#parts.map((p) => p.toJSON())];
		if (this.isStart() && !this.type) ret.unshift([]);
		if (this.isEnd() && (this === this.#root || this.#root.#filledNegs && this.#parent?.type === "!")) ret.push({});
		return ret;
	}
	isStart() {
		if (this.#root === this) return true;
		if (!this.#parent?.isStart()) return false;
		if (this.#parentIndex === 0) return true;
		const p = this.#parent;
		for (let i = 0; i < this.#parentIndex; i++) {
			const pp = p.#parts[i];
			if (!(pp instanceof _a && pp.type === "!")) return false;
		}
		return true;
	}
	isEnd() {
		if (this.#root === this) return true;
		if (this.#parent?.type === "!") return true;
		if (!this.#parent?.isEnd()) return false;
		if (!this.type) return this.#parent?.isEnd();
		/* c8 ignore start */
		const pl = this.#parent ? this.#parent.#parts.length : 0;
		/* c8 ignore stop */
		return this.#parentIndex === pl - 1;
	}
	copyIn(part) {
		if (typeof part === "string") this.push(part);
		else this.push(part.clone(this));
	}
	clone(parent) {
		const c = new _a(this.type, parent);
		for (const p of this.#parts) c.copyIn(p);
		return c;
	}
	static #parseAST(str, ast, pos, opt, extDepth) {
		const maxDepth = opt.maxExtglobRecursion ?? 2;
		let escaping = false;
		let inBrace = false;
		let braceStart = -1;
		let braceNeg = false;
		if (ast.type === null) {
			let i = pos;
			let acc = "";
			while (i < str.length) {
				const c = str.charAt(i++);
				if (escaping || c === "\\") {
					escaping = !escaping;
					acc += c;
					continue;
				}
				if (inBrace) {
					if (i === braceStart + 1) {
						if (c === "^" || c === "!") braceNeg = true;
					} else if (c === "]" && !(i === braceStart + 2 && braceNeg)) inBrace = false;
					acc += c;
					continue;
				} else if (c === "[") {
					inBrace = true;
					braceStart = i;
					braceNeg = false;
					acc += c;
					continue;
				}
				if (!opt.noext && isExtglobType(c) && str.charAt(i) === "(" && extDepth <= maxDepth) {
					ast.push(acc);
					acc = "";
					const ext = new _a(c, ast);
					i = _a.#parseAST(str, ext, i, opt, extDepth + 1);
					ast.push(ext);
					continue;
				}
				acc += c;
			}
			ast.push(acc);
			return i;
		}
		let i = pos + 1;
		let part = new _a(null, ast);
		const parts = [];
		let acc = "";
		while (i < str.length) {
			const c = str.charAt(i++);
			if (escaping || c === "\\") {
				escaping = !escaping;
				acc += c;
				continue;
			}
			if (inBrace) {
				if (i === braceStart + 1) {
					if (c === "^" || c === "!") braceNeg = true;
				} else if (c === "]" && !(i === braceStart + 2 && braceNeg)) inBrace = false;
				acc += c;
				continue;
			} else if (c === "[") {
				inBrace = true;
				braceStart = i;
				braceNeg = false;
				acc += c;
				continue;
			}
			/* c8 ignore stop */
			if (!opt.noext && isExtglobType(c) && str.charAt(i) === "(" && (extDepth <= maxDepth || ast && ast.#canAdoptType(c))) {
				const depthAdd = ast && ast.#canAdoptType(c) ? 0 : 1;
				part.push(acc);
				acc = "";
				const ext = new _a(c, part);
				part.push(ext);
				i = _a.#parseAST(str, ext, i, opt, extDepth + depthAdd);
				continue;
			}
			if (c === "|") {
				part.push(acc);
				acc = "";
				parts.push(part);
				part = new _a(null, ast);
				continue;
			}
			if (c === ")") {
				if (acc === "" && ast.#parts.length === 0) ast.#emptyExt = true;
				part.push(acc);
				acc = "";
				ast.push(...parts, part);
				return i;
			}
			acc += c;
		}
		ast.type = null;
		ast.#hasMagic = void 0;
		ast.#parts = [str.substring(pos - 1)];
		return i;
	}
	#canAdoptWithSpace(child) {
		return this.#canAdopt(child, adoptionWithSpaceMap);
	}
	#canAdopt(child, map = adoptionMap) {
		if (!child || typeof child !== "object" || child.type !== null || child.#parts.length !== 1 || this.type === null) return false;
		const gc = child.#parts[0];
		if (!gc || typeof gc !== "object" || gc.type === null) return false;
		return this.#canAdoptType(gc.type, map);
	}
	#canAdoptType(c, map = adoptionAnyMap) {
		return !!map.get(this.type)?.includes(c);
	}
	#adoptWithSpace(child, index) {
		const gc = child.#parts[0];
		const blank = new _a(null, gc, this.options);
		blank.#parts.push("");
		gc.push(blank);
		this.#adopt(child, index);
	}
	#adopt(child, index) {
		const gc = child.#parts[0];
		this.#parts.splice(index, 1, ...gc.#parts);
		for (const p of gc.#parts) if (typeof p === "object") p.#parent = this;
		this.#toString = void 0;
	}
	#canUsurpType(c) {
		return !!usurpMap.get(this.type)?.has(c);
	}
	#canUsurp(child) {
		if (!child || typeof child !== "object" || child.type !== null || child.#parts.length !== 1 || this.type === null || this.#parts.length !== 1) return false;
		const gc = child.#parts[0];
		if (!gc || typeof gc !== "object" || gc.type === null) return false;
		return this.#canUsurpType(gc.type);
	}
	#usurp(child) {
		const m = usurpMap.get(this.type);
		const gc = child.#parts[0];
		const nt = m?.get(gc.type);
		/* c8 ignore start - impossible */
		if (!nt) return false;
		/* c8 ignore stop */
		this.#parts = gc.#parts;
		for (const p of this.#parts) if (typeof p === "object") p.#parent = this;
		this.type = nt;
		this.#toString = void 0;
		this.#emptyExt = false;
	}
	static fromGlob(pattern, options = {}) {
		const ast = new _a(null, void 0, options);
		_a.#parseAST(pattern, ast, 0, options, 0);
		return ast;
	}
	toMMPattern() {
		/* c8 ignore start */
		if (this !== this.#root) return this.#root.toMMPattern();
		/* c8 ignore stop */
		const glob = this.toString();
		const [re, body, hasMagic, uflag] = this.toRegExpSource();
		if (!(hasMagic || this.#hasMagic || this.#options.nocase && !this.#options.nocaseMagicOnly && glob.toUpperCase() !== glob.toLowerCase())) return body;
		const flags = (this.#options.nocase ? "i" : "") + (uflag ? "u" : "");
		return Object.assign(new RegExp(`^${re}$`, flags), {
			_src: re,
			_glob: glob
		});
	}
	get options() {
		return this.#options;
	}
	toRegExpSource(allowDot) {
		const dot = allowDot ?? !!this.#options.dot;
		if (this.#root === this) {
			this.#flatten();
			this.#fillNegs();
		}
		if (!isExtglobAST(this)) {
			const noEmpty = this.isStart() && this.isEnd() && !this.#parts.some((s) => typeof s !== "string");
			const src = this.#parts.map((p) => {
				const [re, _, hasMagic, uflag] = typeof p === "string" ? _a.#parseGlob(p, this.#hasMagic, noEmpty) : p.toRegExpSource(allowDot);
				this.#hasMagic = this.#hasMagic || hasMagic;
				this.#uflag = this.#uflag || uflag;
				return re;
			}).join("");
			let start = "";
			if (this.isStart()) {
				if (typeof this.#parts[0] === "string") {
					if (!(this.#parts.length === 1 && justDots.has(this.#parts[0]))) {
						const aps = addPatternStart;
						const needNoTrav = dot && aps.has(src.charAt(0)) || src.startsWith("\\.") && aps.has(src.charAt(2)) || src.startsWith("\\.\\.") && aps.has(src.charAt(4));
						const needNoDot = !dot && !allowDot && aps.has(src.charAt(0));
						start = needNoTrav ? startNoTraversal : needNoDot ? startNoDot : "";
					}
				}
			}
			let end = "";
			if (this.isEnd() && this.#root.#filledNegs && this.#parent?.type === "!") end = "(?:$|\\/)";
			return [
				start + src + end,
				unescape(src),
				this.#hasMagic = !!this.#hasMagic,
				this.#uflag
			];
		}
		const repeated = this.type === "*" || this.type === "+";
		const start = this.type === "!" ? "(?:(?!(?:" : "(?:";
		let body = this.#partsToRegExp(dot);
		if (this.isStart() && this.isEnd() && !body && this.type !== "!") {
			const s = this.toString();
			const me = this;
			me.#parts = [s];
			me.type = null;
			me.#hasMagic = void 0;
			return [
				s,
				unescape(this.toString()),
				false,
				false
			];
		}
		let bodyDotAllowed = !repeated || allowDot || dot || false ? "" : this.#partsToRegExp(true);
		if (bodyDotAllowed === body) bodyDotAllowed = "";
		if (bodyDotAllowed) body = `(?:${body})(?:${bodyDotAllowed})*?`;
		let final = "";
		if (this.type === "!" && this.#emptyExt) final = (this.isStart() && !dot ? startNoDot : "") + starNoEmpty;
		else {
			const close = this.type === "!" ? "))" + (this.isStart() && !dot && !allowDot ? startNoDot : "") + "[^/]*?)" : this.type === "@" ? ")" : this.type === "?" ? ")?" : this.type === "+" && bodyDotAllowed ? ")" : this.type === "*" && bodyDotAllowed ? `)?` : `)${this.type}`;
			final = start + body + close;
		}
		return [
			final,
			unescape(body),
			this.#hasMagic = !!this.#hasMagic,
			this.#uflag
		];
	}
	#flatten() {
		if (!isExtglobAST(this)) {
			for (const p of this.#parts) if (typeof p === "object") p.#flatten();
		} else {
			let iterations = 0;
			let done = false;
			do {
				done = true;
				for (let i = 0; i < this.#parts.length; i++) {
					const c = this.#parts[i];
					if (typeof c === "object") {
						c.#flatten();
						if (this.#canAdopt(c)) {
							done = false;
							this.#adopt(c, i);
						} else if (this.#canAdoptWithSpace(c)) {
							done = false;
							this.#adoptWithSpace(c, i);
						} else if (this.#canUsurp(c)) {
							done = false;
							this.#usurp(c);
						}
					}
				}
			} while (!done && ++iterations < 10);
		}
		this.#toString = void 0;
	}
	#partsToRegExp(dot) {
		return this.#parts.map((p) => {
			/* c8 ignore start */
			if (typeof p === "string") throw new Error("string type in extglob ast??");
			/* c8 ignore stop */
			const [re, _, _hasMagic, uflag] = p.toRegExpSource(dot);
			this.#uflag = this.#uflag || uflag;
			return re;
		}).filter((p) => !(this.isStart() && this.isEnd()) || !!p).join("|");
	}
	static #parseGlob(glob, hasMagic, noEmpty = false) {
		let escaping = false;
		let re = "";
		let uflag = false;
		let inStar = false;
		for (let i = 0; i < glob.length; i++) {
			const c = glob.charAt(i);
			if (escaping) {
				escaping = false;
				re += (reSpecials.has(c) ? "\\" : "") + c;
				continue;
			}
			if (c === "*") {
				if (inStar) continue;
				inStar = true;
				re += noEmpty && /^[*]+$/.test(glob) ? starNoEmpty : star$1;
				hasMagic = true;
				continue;
			} else inStar = false;
			if (c === "\\") {
				if (i === glob.length - 1) re += "\\\\";
				else escaping = true;
				continue;
			}
			if (c === "[") {
				const [src, needUflag, consumed, magic] = parseClass(glob, i);
				if (consumed) {
					re += src;
					uflag = uflag || needUflag;
					i += consumed - 1;
					hasMagic = hasMagic || magic;
					continue;
				}
			}
			if (c === "?") {
				re += qmark;
				hasMagic = true;
				continue;
			}
			re += regExpEscape$1(c);
		}
		return [
			re,
			unescape(glob),
			!!hasMagic,
			uflag
		];
	}
};
_a = AST;

//#endregion
//#region node_modules/@actions/glob/node_modules/minimatch/dist/esm/escape.js
/**
* Escape all magic characters in a glob pattern.
*
* If the {@link MinimatchOptions.windowsPathsNoEscape}
* option is used, then characters are escaped by wrapping in `[]`, because
* a magic character wrapped in a character class can only be satisfied by
* that exact character.  In this mode, `\` is _not_ escaped, because it is
* not interpreted as a magic character, but instead as a path separator.
*
* If the {@link MinimatchOptions.magicalBraces} option is used,
* then braces (`{` and `}`) will be escaped.
*/
const escape = (s, { windowsPathsNoEscape = false, magicalBraces = false } = {}) => {
	if (magicalBraces) return windowsPathsNoEscape ? s.replace(/[?*()[\]{}]/g, "[$&]") : s.replace(/[?*()[\]\\{}]/g, "\\$&");
	return windowsPathsNoEscape ? s.replace(/[?*()[\]]/g, "[$&]") : s.replace(/[?*()[\]\\]/g, "\\$&");
};

//#endregion
//#region node_modules/@actions/glob/node_modules/minimatch/dist/esm/index.js
const minimatch = (p, pattern, options = {}) => {
	assertValidPattern(pattern);
	if (!options.nocomment && pattern.charAt(0) === "#") return false;
	return new Minimatch(pattern, options).match(p);
};
const starDotExtRE = /^\*+([^+@!?*[(]*)$/;
const starDotExtTest = (ext) => (f) => !f.startsWith(".") && f.endsWith(ext);
const starDotExtTestDot = (ext) => (f) => f.endsWith(ext);
const starDotExtTestNocase = (ext) => {
	ext = ext.toLowerCase();
	return (f) => !f.startsWith(".") && f.toLowerCase().endsWith(ext);
};
const starDotExtTestNocaseDot = (ext) => {
	ext = ext.toLowerCase();
	return (f) => f.toLowerCase().endsWith(ext);
};
const starDotStarRE = /^\*+\.\*+$/;
const starDotStarTest = (f) => !f.startsWith(".") && f.includes(".");
const starDotStarTestDot = (f) => f !== "." && f !== ".." && f.includes(".");
const dotStarRE = /^\.\*+$/;
const dotStarTest = (f) => f !== "." && f !== ".." && f.startsWith(".");
const starRE = /^\*+$/;
const starTest = (f) => f.length !== 0 && !f.startsWith(".");
const starTestDot = (f) => f.length !== 0 && f !== "." && f !== "..";
const qmarksRE = /^\?+([^+@!?*[(]*)?$/;
const qmarksTestNocase = ([$0, ext = ""]) => {
	const noext = qmarksTestNoExt([$0]);
	if (!ext) return noext;
	ext = ext.toLowerCase();
	return (f) => noext(f) && f.toLowerCase().endsWith(ext);
};
const qmarksTestNocaseDot = ([$0, ext = ""]) => {
	const noext = qmarksTestNoExtDot([$0]);
	if (!ext) return noext;
	ext = ext.toLowerCase();
	return (f) => noext(f) && f.toLowerCase().endsWith(ext);
};
const qmarksTestDot = ([$0, ext = ""]) => {
	const noext = qmarksTestNoExtDot([$0]);
	return !ext ? noext : (f) => noext(f) && f.endsWith(ext);
};
const qmarksTest = ([$0, ext = ""]) => {
	const noext = qmarksTestNoExt([$0]);
	return !ext ? noext : (f) => noext(f) && f.endsWith(ext);
};
const qmarksTestNoExt = ([$0]) => {
	const len = $0.length;
	return (f) => f.length === len && !f.startsWith(".");
};
const qmarksTestNoExtDot = ([$0]) => {
	const len = $0.length;
	return (f) => f.length === len && f !== "." && f !== "..";
};
/* c8 ignore start */
const defaultPlatform = typeof process === "object" && process ? typeof process.env === "object" && process.env && process.env.__MINIMATCH_TESTING_PLATFORM__ || process.platform : "posix";
const path$1 = {
	win32: { sep: "\\" },
	posix: { sep: "/" }
};
/* c8 ignore stop */
const sep = defaultPlatform === "win32" ? path$1.win32.sep : path$1.posix.sep;
minimatch.sep = sep;
const GLOBSTAR = Symbol("globstar **");
minimatch.GLOBSTAR = GLOBSTAR;
const star = "[^/]*?";
const twoStarDot = "(?:(?!(?:\\/|^)(?:\\.{1,2})($|\\/)).)*?";
const twoStarNoDot = "(?:(?!(?:\\/|^)\\.).)*?";
const filter = (pattern, options = {}) => (p) => minimatch(p, pattern, options);
minimatch.filter = filter;
const ext = (a, b = {}) => Object.assign({}, a, b);
const defaults = (def) => {
	if (!def || typeof def !== "object" || !Object.keys(def).length) return minimatch;
	const orig = minimatch;
	const m = (p, pattern, options = {}) => orig(p, pattern, ext(def, options));
	return Object.assign(m, {
		Minimatch: class Minimatch extends orig.Minimatch {
			constructor(pattern, options = {}) {
				super(pattern, ext(def, options));
			}
			static defaults(options) {
				return orig.defaults(ext(def, options)).Minimatch;
			}
		},
		AST: class AST extends orig.AST {
			/* c8 ignore start */
			constructor(type, parent, options = {}) {
				super(type, parent, ext(def, options));
			}
			/* c8 ignore stop */
			static fromGlob(pattern, options = {}) {
				return orig.AST.fromGlob(pattern, ext(def, options));
			}
		},
		unescape: (s, options = {}) => orig.unescape(s, ext(def, options)),
		escape: (s, options = {}) => orig.escape(s, ext(def, options)),
		filter: (pattern, options = {}) => orig.filter(pattern, ext(def, options)),
		defaults: (options) => orig.defaults(ext(def, options)),
		makeRe: (pattern, options = {}) => orig.makeRe(pattern, ext(def, options)),
		braceExpand: (pattern, options = {}) => orig.braceExpand(pattern, ext(def, options)),
		match: (list, pattern, options = {}) => orig.match(list, pattern, ext(def, options)),
		sep: orig.sep,
		GLOBSTAR
	});
};
minimatch.defaults = defaults;
const braceExpand = (pattern, options = {}) => {
	assertValidPattern(pattern);
	if (options.nobrace || !/\{(?:(?!\{).)*\}/.test(pattern)) return [pattern];
	return expand(pattern, { max: options.braceExpandMax });
};
minimatch.braceExpand = braceExpand;
const makeRe = (pattern, options = {}) => new Minimatch(pattern, options).makeRe();
minimatch.makeRe = makeRe;
const match = (list, pattern, options = {}) => {
	const mm = new Minimatch(pattern, options);
	list = list.filter((f) => mm.match(f));
	if (mm.options.nonull && !list.length) list.push(pattern);
	return list;
};
minimatch.match = match;
const globMagic = /[?*]|[+@!]\(.*?\)|\[|\]/;
const regExpEscape = (s) => s.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
var Minimatch = class {
	options;
	set;
	pattern;
	windowsPathsNoEscape;
	nonegate;
	negate;
	comment;
	empty;
	preserveMultipleSlashes;
	partial;
	globSet;
	globParts;
	nocase;
	isWindows;
	platform;
	windowsNoMagicRoot;
	maxGlobstarRecursion;
	regexp;
	constructor(pattern, options = {}) {
		assertValidPattern(pattern);
		options = options || {};
		this.options = options;
		this.maxGlobstarRecursion = options.maxGlobstarRecursion ?? 200;
		this.pattern = pattern;
		this.platform = options.platform || defaultPlatform;
		this.isWindows = this.platform === "win32";
		const awe = "allowWindowsEscape";
		this.windowsPathsNoEscape = !!options.windowsPathsNoEscape || options[awe] === false;
		if (this.windowsPathsNoEscape) this.pattern = this.pattern.replace(/\\/g, "/");
		this.preserveMultipleSlashes = !!options.preserveMultipleSlashes;
		this.regexp = null;
		this.negate = false;
		this.nonegate = !!options.nonegate;
		this.comment = false;
		this.empty = false;
		this.partial = !!options.partial;
		this.nocase = !!this.options.nocase;
		this.windowsNoMagicRoot = options.windowsNoMagicRoot !== void 0 ? options.windowsNoMagicRoot : !!(this.isWindows && this.nocase);
		this.globSet = [];
		this.globParts = [];
		this.set = [];
		this.make();
	}
	hasMagic() {
		if (this.options.magicalBraces && this.set.length > 1) return true;
		for (const pattern of this.set) for (const part of pattern) if (typeof part !== "string") return true;
		return false;
	}
	debug(..._) {}
	make() {
		const pattern = this.pattern;
		const options = this.options;
		if (!options.nocomment && pattern.charAt(0) === "#") {
			this.comment = true;
			return;
		}
		if (!pattern) {
			this.empty = true;
			return;
		}
		this.parseNegate();
		this.globSet = [...new Set(this.braceExpand())];
		if (options.debug) this.debug = (...args) => console.error(...args);
		this.debug(this.pattern, this.globSet);
		const rawGlobParts = this.globSet.map((s) => this.slashSplit(s));
		this.globParts = this.preprocess(rawGlobParts);
		this.debug(this.pattern, this.globParts);
		let set = this.globParts.map((s, _, __) => {
			if (this.isWindows && this.windowsNoMagicRoot) {
				const isUNC = s[0] === "" && s[1] === "" && (s[2] === "?" || !globMagic.test(s[2])) && !globMagic.test(s[3]);
				const isDrive = /^[a-z]:/i.test(s[0]);
				if (isUNC) return [...s.slice(0, 4), ...s.slice(4).map((ss) => this.parse(ss))];
				else if (isDrive) return [s[0], ...s.slice(1).map((ss) => this.parse(ss))];
			}
			return s.map((ss) => this.parse(ss));
		});
		this.debug(this.pattern, set);
		this.set = set.filter((s) => s.indexOf(false) === -1);
		if (this.isWindows) for (let i = 0; i < this.set.length; i++) {
			const p = this.set[i];
			if (p[0] === "" && p[1] === "" && this.globParts[i][2] === "?" && typeof p[3] === "string" && /^[a-z]:$/i.test(p[3])) p[2] = "?";
		}
		this.debug(this.pattern, this.set);
	}
	preprocess(globParts) {
		if (this.options.noglobstar) {
			for (const partset of globParts) for (let j = 0; j < partset.length; j++) if (partset[j] === "**") partset[j] = "*";
		}
		const { optimizationLevel = 1 } = this.options;
		if (optimizationLevel >= 2) {
			globParts = this.firstPhasePreProcess(globParts);
			globParts = this.secondPhasePreProcess(globParts);
		} else if (optimizationLevel >= 1) globParts = this.levelOneOptimize(globParts);
		else globParts = this.adjascentGlobstarOptimize(globParts);
		return globParts;
	}
	adjascentGlobstarOptimize(globParts) {
		return globParts.map((parts) => {
			let gs = -1;
			while (-1 !== (gs = parts.indexOf("**", gs + 1))) {
				let i = gs;
				while (parts[i + 1] === "**") i++;
				if (i !== gs) parts.splice(gs, i - gs);
			}
			return parts;
		});
	}
	levelOneOptimize(globParts) {
		return globParts.map((parts) => {
			parts = parts.reduce((set, part) => {
				const prev = set[set.length - 1];
				if (part === "**" && prev === "**") return set;
				if (part === "..") {
					if (prev && prev !== ".." && prev !== "." && prev !== "**") {
						set.pop();
						return set;
					}
				}
				set.push(part);
				return set;
			}, []);
			return parts.length === 0 ? [""] : parts;
		});
	}
	levelTwoFileOptimize(parts) {
		if (!Array.isArray(parts)) parts = this.slashSplit(parts);
		let didSomething = false;
		do {
			didSomething = false;
			if (!this.preserveMultipleSlashes) {
				for (let i = 1; i < parts.length - 1; i++) {
					const p = parts[i];
					if (i === 1 && p === "" && parts[0] === "") continue;
					if (p === "." || p === "") {
						didSomething = true;
						parts.splice(i, 1);
						i--;
					}
				}
				if (parts[0] === "." && parts.length === 2 && (parts[1] === "." || parts[1] === "")) {
					didSomething = true;
					parts.pop();
				}
			}
			let dd = 0;
			while (-1 !== (dd = parts.indexOf("..", dd + 1))) {
				const p = parts[dd - 1];
				if (p && p !== "." && p !== ".." && p !== "**" && !(this.isWindows && /^[a-z]:$/i.test(p))) {
					didSomething = true;
					parts.splice(dd - 1, 2);
					dd -= 2;
				}
			}
		} while (didSomething);
		return parts.length === 0 ? [""] : parts;
	}
	firstPhasePreProcess(globParts) {
		let didSomething = false;
		do {
			didSomething = false;
			for (let parts of globParts) {
				let gs = -1;
				while (-1 !== (gs = parts.indexOf("**", gs + 1))) {
					let gss = gs;
					while (parts[gss + 1] === "**") gss++;
					if (gss > gs) parts.splice(gs + 1, gss - gs);
					let next = parts[gs + 1];
					const p = parts[gs + 2];
					const p2 = parts[gs + 3];
					if (next !== "..") continue;
					if (!p || p === "." || p === ".." || !p2 || p2 === "." || p2 === "..") continue;
					didSomething = true;
					parts.splice(gs, 1);
					const other = parts.slice(0);
					other[gs] = "**";
					globParts.push(other);
					gs--;
				}
				if (!this.preserveMultipleSlashes) {
					for (let i = 1; i < parts.length - 1; i++) {
						const p = parts[i];
						if (i === 1 && p === "" && parts[0] === "") continue;
						if (p === "." || p === "") {
							didSomething = true;
							parts.splice(i, 1);
							i--;
						}
					}
					if (parts[0] === "." && parts.length === 2 && (parts[1] === "." || parts[1] === "")) {
						didSomething = true;
						parts.pop();
					}
				}
				let dd = 0;
				while (-1 !== (dd = parts.indexOf("..", dd + 1))) {
					const p = parts[dd - 1];
					if (p && p !== "." && p !== ".." && p !== "**") {
						didSomething = true;
						const splin = dd === 1 && parts[dd + 1] === "**" ? ["."] : [];
						parts.splice(dd - 1, 2, ...splin);
						if (parts.length === 0) parts.push("");
						dd -= 2;
					}
				}
			}
		} while (didSomething);
		return globParts;
	}
	secondPhasePreProcess(globParts) {
		for (let i = 0; i < globParts.length - 1; i++) for (let j = i + 1; j < globParts.length; j++) {
			const matched = this.partsMatch(globParts[i], globParts[j], !this.preserveMultipleSlashes);
			if (matched) {
				globParts[i] = [];
				globParts[j] = matched;
				break;
			}
		}
		return globParts.filter((gs) => gs.length);
	}
	partsMatch(a, b, emptyGSMatch = false) {
		let ai = 0;
		let bi = 0;
		let result = [];
		let which = "";
		while (ai < a.length && bi < b.length) if (a[ai] === b[bi]) {
			result.push(which === "b" ? b[bi] : a[ai]);
			ai++;
			bi++;
		} else if (emptyGSMatch && a[ai] === "**" && b[bi] === a[ai + 1]) {
			result.push(a[ai]);
			ai++;
		} else if (emptyGSMatch && b[bi] === "**" && a[ai] === b[bi + 1]) {
			result.push(b[bi]);
			bi++;
		} else if (a[ai] === "*" && b[bi] && (this.options.dot || !b[bi].startsWith(".")) && b[bi] !== "**") {
			if (which === "b") return false;
			which = "a";
			result.push(a[ai]);
			ai++;
			bi++;
		} else if (b[bi] === "*" && a[ai] && (this.options.dot || !a[ai].startsWith(".")) && a[ai] !== "**") {
			if (which === "a") return false;
			which = "b";
			result.push(b[bi]);
			ai++;
			bi++;
		} else return false;
		return a.length === b.length && result;
	}
	parseNegate() {
		if (this.nonegate) return;
		const pattern = this.pattern;
		let negate = false;
		let negateOffset = 0;
		for (let i = 0; i < pattern.length && pattern.charAt(i) === "!"; i++) {
			negate = !negate;
			negateOffset++;
		}
		if (negateOffset) this.pattern = pattern.slice(negateOffset);
		this.negate = negate;
	}
	matchOne(file, pattern, partial = false) {
		let fileStartIndex = 0;
		let patternStartIndex = 0;
		if (this.isWindows) {
			const fileDrive = typeof file[0] === "string" && /^[a-z]:$/i.test(file[0]);
			const fileUNC = !fileDrive && file[0] === "" && file[1] === "" && file[2] === "?" && /^[a-z]:$/i.test(file[3]);
			const patternDrive = typeof pattern[0] === "string" && /^[a-z]:$/i.test(pattern[0]);
			const patternUNC = !patternDrive && pattern[0] === "" && pattern[1] === "" && pattern[2] === "?" && typeof pattern[3] === "string" && /^[a-z]:$/i.test(pattern[3]);
			const fdi = fileUNC ? 3 : fileDrive ? 0 : void 0;
			const pdi = patternUNC ? 3 : patternDrive ? 0 : void 0;
			if (typeof fdi === "number" && typeof pdi === "number") {
				const [fd, pd] = [file[fdi], pattern[pdi]];
				if (fd.toLowerCase() === pd.toLowerCase()) {
					pattern[pdi] = fd;
					patternStartIndex = pdi;
					fileStartIndex = fdi;
				}
			}
		}
		const { optimizationLevel = 1 } = this.options;
		if (optimizationLevel >= 2) file = this.levelTwoFileOptimize(file);
		if (pattern.includes(GLOBSTAR)) return this.#matchGlobstar(file, pattern, partial, fileStartIndex, patternStartIndex);
		return this.#matchOne(file, pattern, partial, fileStartIndex, patternStartIndex);
	}
	#matchGlobstar(file, pattern, partial, fileIndex, patternIndex) {
		const firstgs = pattern.indexOf(GLOBSTAR, patternIndex);
		const lastgs = pattern.lastIndexOf(GLOBSTAR);
		const [head, body, tail] = partial ? [
			pattern.slice(patternIndex, firstgs),
			pattern.slice(firstgs + 1),
			[]
		] : [
			pattern.slice(patternIndex, firstgs),
			pattern.slice(firstgs + 1, lastgs),
			pattern.slice(lastgs + 1)
		];
		if (head.length) {
			const fileHead = file.slice(fileIndex, fileIndex + head.length);
			if (!this.#matchOne(fileHead, head, partial, 0, 0)) return false;
			fileIndex += head.length;
			patternIndex += head.length;
		}
		let fileTailMatch = 0;
		if (tail.length) {
			if (tail.length + fileIndex > file.length) return false;
			let tailStart = file.length - tail.length;
			if (this.#matchOne(file, tail, partial, tailStart, 0)) fileTailMatch = tail.length;
			else {
				if (file[file.length - 1] !== "" || fileIndex + tail.length === file.length) return false;
				tailStart--;
				if (!this.#matchOne(file, tail, partial, tailStart, 0)) return false;
				fileTailMatch = tail.length + 1;
			}
		}
		if (!body.length) {
			let sawSome = !!fileTailMatch;
			for (let i = fileIndex; i < file.length - fileTailMatch; i++) {
				const f = String(file[i]);
				sawSome = true;
				if (f === "." || f === ".." || !this.options.dot && f.startsWith(".")) return false;
			}
			return partial || sawSome;
		}
		const bodySegments = [[[], 0]];
		let currentBody = bodySegments[0];
		let nonGsParts = 0;
		const nonGsPartsSums = [0];
		for (const b of body) if (b === GLOBSTAR) {
			nonGsPartsSums.push(nonGsParts);
			currentBody = [[], 0];
			bodySegments.push(currentBody);
		} else {
			currentBody[0].push(b);
			nonGsParts++;
		}
		let i = bodySegments.length - 1;
		const fileLength = file.length - fileTailMatch;
		for (const b of bodySegments) b[1] = fileLength - (nonGsPartsSums[i--] + b[0].length);
		return !!this.#matchGlobStarBodySections(file, bodySegments, fileIndex, 0, partial, 0, !!fileTailMatch);
	}
	#matchGlobStarBodySections(file, bodySegments, fileIndex, bodyIndex, partial, globStarDepth, sawTail) {
		const bs = bodySegments[bodyIndex];
		if (!bs) {
			for (let i = fileIndex; i < file.length; i++) {
				sawTail = true;
				const f = file[i];
				if (f === "." || f === ".." || !this.options.dot && f.startsWith(".")) return false;
			}
			return sawTail;
		}
		const [body, after] = bs;
		while (fileIndex <= after) {
			if (this.#matchOne(file.slice(0, fileIndex + body.length), body, partial, fileIndex, 0) && globStarDepth < this.maxGlobstarRecursion) {
				const sub = this.#matchGlobStarBodySections(file, bodySegments, fileIndex + body.length, bodyIndex + 1, partial, globStarDepth + 1, sawTail);
				if (sub !== false) return sub;
			}
			const f = file[fileIndex];
			if (f === "." || f === ".." || !this.options.dot && f.startsWith(".")) return false;
			fileIndex++;
		}
		return partial || null;
	}
	#matchOne(file, pattern, partial, fileIndex, patternIndex) {
		let fi;
		let pi;
		let pl;
		let fl;
		for (fi = fileIndex, pi = patternIndex, fl = file.length, pl = pattern.length; fi < fl && pi < pl; fi++, pi++) {
			this.debug("matchOne loop");
			let p = pattern[pi];
			let f = file[fi];
			this.debug(pattern, p, f);
			/* c8 ignore start */
			if (p === false || p === GLOBSTAR) return false;
			/* c8 ignore stop */
			let hit;
			if (typeof p === "string") {
				hit = f === p;
				this.debug("string match", p, f, hit);
			} else {
				hit = p.test(f);
				this.debug("pattern match", p, f, hit);
			}
			if (!hit) return false;
		}
		if (fi === fl && pi === pl) return true;
		else if (fi === fl) return partial;
		else if (pi === pl) return fi === fl - 1 && file[fi] === "";
		else throw new Error("wtf?");
		/* c8 ignore stop */
	}
	braceExpand() {
		return braceExpand(this.pattern, this.options);
	}
	parse(pattern) {
		assertValidPattern(pattern);
		const options = this.options;
		if (pattern === "**") return GLOBSTAR;
		if (pattern === "") return "";
		let m;
		let fastTest = null;
		if (m = pattern.match(starRE)) fastTest = options.dot ? starTestDot : starTest;
		else if (m = pattern.match(starDotExtRE)) fastTest = (options.nocase ? options.dot ? starDotExtTestNocaseDot : starDotExtTestNocase : options.dot ? starDotExtTestDot : starDotExtTest)(m[1]);
		else if (m = pattern.match(qmarksRE)) fastTest = (options.nocase ? options.dot ? qmarksTestNocaseDot : qmarksTestNocase : options.dot ? qmarksTestDot : qmarksTest)(m);
		else if (m = pattern.match(starDotStarRE)) fastTest = options.dot ? starDotStarTestDot : starDotStarTest;
		else if (m = pattern.match(dotStarRE)) fastTest = dotStarTest;
		const re = AST.fromGlob(pattern, this.options).toMMPattern();
		if (fastTest && typeof re === "object") Reflect.defineProperty(re, "test", { value: fastTest });
		return re;
	}
	makeRe() {
		if (this.regexp || this.regexp === false) return this.regexp;
		const set = this.set;
		if (!set.length) {
			this.regexp = false;
			return this.regexp;
		}
		const options = this.options;
		const twoStar = options.noglobstar ? star : options.dot ? twoStarDot : twoStarNoDot;
		const flags = new Set(options.nocase ? ["i"] : []);
		let re = set.map((pattern) => {
			const pp = pattern.map((p) => {
				if (p instanceof RegExp) for (const f of p.flags.split("")) flags.add(f);
				return typeof p === "string" ? regExpEscape(p) : p === GLOBSTAR ? GLOBSTAR : p._src;
			});
			pp.forEach((p, i) => {
				const next = pp[i + 1];
				const prev = pp[i - 1];
				if (p !== GLOBSTAR || prev === GLOBSTAR) return;
				if (prev === void 0) {
					if (next !== void 0 && next !== GLOBSTAR) pp[i + 1] = "(?:\\/|" + twoStar + "\\/)?" + next;
					else pp[i] = twoStar;
				} else if (next === void 0) pp[i - 1] = prev + "(?:\\/|\\/" + twoStar + ")?";
				else if (next !== GLOBSTAR) {
					pp[i - 1] = prev + "(?:\\/|\\/" + twoStar + "\\/)" + next;
					pp[i + 1] = GLOBSTAR;
				}
			});
			const filtered = pp.filter((p) => p !== GLOBSTAR);
			if (this.partial && filtered.length >= 1) {
				const prefixes = [];
				for (let i = 1; i <= filtered.length; i++) prefixes.push(filtered.slice(0, i).join("/"));
				return "(?:" + prefixes.join("|") + ")";
			}
			return filtered.join("/");
		}).join("|");
		const [open, close] = set.length > 1 ? ["(?:", ")"] : ["", ""];
		re = "^" + open + re + close + "$";
		if (this.partial) re = "^(?:\\/|" + open + re.slice(1, -1) + close + ")$";
		if (this.negate) re = "^(?!" + re + ").+$";
		try {
			this.regexp = new RegExp(re, [...flags].join(""));
		} catch {
			this.regexp = false;
		}
		/* c8 ignore stop */
		return this.regexp;
	}
	slashSplit(p) {
		if (this.preserveMultipleSlashes) return p.split("/");
		else if (this.isWindows && /^\/\/[^/]+/.test(p)) return ["", ...p.split(/\/+/)];
		else return p.split(/\/+/);
	}
	match(f, partial = this.partial) {
		this.debug("match", f, this.pattern);
		if (this.comment) return false;
		if (this.empty) return f === "";
		if (f === "/" && partial) return true;
		const options = this.options;
		if (this.isWindows) f = f.split("\\").join("/");
		const ff = this.slashSplit(f);
		this.debug(this.pattern, "split", ff);
		const set = this.set;
		this.debug(this.pattern, "set", set);
		let filename = ff[ff.length - 1];
		if (!filename) for (let i = ff.length - 2; !filename && i >= 0; i--) filename = ff[i];
		for (const pattern of set) {
			let file = ff;
			if (options.matchBase && pattern.length === 1) file = [filename];
			if (this.matchOne(file, pattern, partial)) {
				if (options.flipNegate) return true;
				return !this.negate;
			}
		}
		if (options.flipNegate) return false;
		return this.negate;
	}
	static defaults(def) {
		return minimatch.defaults(def).Minimatch;
	}
};
/* c8 ignore stop */
minimatch.AST = AST;
minimatch.Minimatch = Minimatch;
minimatch.escape = escape;
minimatch.unescape = unescape;

//#endregion
//#region node_modules/@actions/glob/lib/internal-path.js
const IS_WINDOWS$2 = process.platform === "win32";
/**
* Helper class for parsing paths into segments
*/
var Path = class {
	/**
	* Constructs a Path
	* @param itemPath Path or array of segments
	*/
	constructor(itemPath) {
		this.segments = [];
		if (typeof itemPath === "string") {
			assert(itemPath, `Parameter 'itemPath' must not be empty`);
			itemPath = safeTrimTrailingSeparator(itemPath);
			if (!hasRoot(itemPath)) this.segments = itemPath.split(path$2.sep);
			else {
				let remaining = itemPath;
				let dir = dirname(remaining);
				while (dir !== remaining) {
					const basename = path$2.basename(remaining);
					this.segments.unshift(basename);
					remaining = dir;
					dir = dirname(remaining);
				}
				this.segments.unshift(remaining);
			}
		} else {
			assert(itemPath.length > 0, `Parameter 'itemPath' must not be an empty array`);
			for (let i = 0; i < itemPath.length; i++) {
				let segment = itemPath[i];
				assert(segment, `Parameter 'itemPath' must not contain any empty segments`);
				segment = normalizeSeparators(itemPath[i]);
				if (i === 0 && hasRoot(segment)) {
					segment = safeTrimTrailingSeparator(segment);
					assert(segment === dirname(segment), `Parameter 'itemPath' root segment contains information for multiple segments`);
					this.segments.push(segment);
				} else {
					assert(!segment.includes(path$2.sep), `Parameter 'itemPath' contains unexpected path separators`);
					this.segments.push(segment);
				}
			}
		}
	}
	/**
	* Converts the path to it's string representation
	*/
	toString() {
		let result = this.segments[0];
		let skipSlash = result.endsWith(path$2.sep) || IS_WINDOWS$2 && /^[A-Z]:$/i.test(result);
		for (let i = 1; i < this.segments.length; i++) {
			if (skipSlash) skipSlash = false;
			else result += path$2.sep;
			result += this.segments[i];
		}
		return result;
	}
};

//#endregion
//#region node_modules/@actions/glob/lib/internal-pattern.js
const IS_WINDOWS$1 = process.platform === "win32";
var Pattern = class Pattern {
	constructor(patternOrNegate, isImplicitPattern = false, segments, homedir) {
		/**
		* Indicates whether matches should be excluded from the result set
		*/
		this.negate = false;
		let pattern;
		if (typeof patternOrNegate === "string") pattern = patternOrNegate.trim();
		else {
			segments = segments || [];
			assert(segments.length, `Parameter 'segments' must not empty`);
			const root = Pattern.getLiteral(segments[0]);
			assert(root && hasAbsoluteRoot(root), `Parameter 'segments' first element must be a root path`);
			pattern = new Path(segments).toString().trim();
			if (patternOrNegate) pattern = `!${pattern}`;
		}
		while (pattern.startsWith("!")) {
			this.negate = !this.negate;
			pattern = pattern.substr(1).trim();
		}
		pattern = Pattern.fixupPattern(pattern, homedir);
		this.segments = new Path(pattern).segments;
		this.trailingSeparator = normalizeSeparators(pattern).endsWith(path$2.sep);
		pattern = safeTrimTrailingSeparator(pattern);
		let foundGlob = false;
		const searchSegments = this.segments.map((x) => Pattern.getLiteral(x)).filter((x) => !foundGlob && !(foundGlob = x === ""));
		this.searchPath = new Path(searchSegments).toString();
		this.rootRegExp = new RegExp(Pattern.regExpEscape(searchSegments[0]), IS_WINDOWS$1 ? "i" : "");
		this.isImplicitPattern = isImplicitPattern;
		const minimatchOptions = {
			dot: true,
			nobrace: true,
			nocase: IS_WINDOWS$1,
			nocomment: true,
			noext: true,
			nonegate: true
		};
		pattern = IS_WINDOWS$1 ? pattern.replace(/\\/g, "/") : pattern;
		this.minimatch = new Minimatch(pattern, minimatchOptions);
	}
	/**
	* Matches the pattern against the specified path
	*/
	match(itemPath) {
		if (this.segments[this.segments.length - 1] === "**") {
			itemPath = normalizeSeparators(itemPath);
			if (!itemPath.endsWith(path$2.sep) && this.isImplicitPattern === false) itemPath = `${itemPath}${path$2.sep}`;
		} else itemPath = safeTrimTrailingSeparator(itemPath);
		if (this.minimatch.match(itemPath)) return this.trailingSeparator ? MatchKind.Directory : MatchKind.All;
		return MatchKind.None;
	}
	/**
	* Indicates whether the pattern may match descendants of the specified path
	*/
	partialMatch(itemPath) {
		itemPath = safeTrimTrailingSeparator(itemPath);
		if (dirname(itemPath) === itemPath) return this.rootRegExp.test(itemPath);
		return this.minimatch.matchOne(itemPath.split(IS_WINDOWS$1 ? /\\+/ : /\/+/), this.minimatch.set[0], true);
	}
	/**
	* Escapes glob patterns within a path
	*/
	static globEscape(s) {
		return (IS_WINDOWS$1 ? s : s.replace(/\\/g, "\\\\")).replace(/(\[)(?=[^/]+\])/g, "[[]").replace(/\?/g, "[?]").replace(/\*/g, "[*]");
	}
	/**
	* Normalizes slashes and ensures absolute root
	*/
	static fixupPattern(pattern, homedir) {
		assert(pattern, "pattern cannot be empty");
		const literalSegments = new Path(pattern).segments.map((x) => Pattern.getLiteral(x));
		assert(literalSegments.every((x, i) => (x !== "." || i === 0) && x !== ".."), `Invalid pattern '${pattern}'. Relative pathing '.' and '..' is not allowed.`);
		assert(!hasRoot(pattern) || literalSegments[0], `Invalid pattern '${pattern}'. Root segment must not contain globs.`);
		pattern = normalizeSeparators(pattern);
		if (pattern === "." || pattern.startsWith(`.${path$2.sep}`)) pattern = Pattern.globEscape(process.cwd()) + pattern.substr(1);
		else if (pattern === "~" || pattern.startsWith(`~${path$2.sep}`)) {
			homedir = homedir || os$3.homedir();
			assert(homedir, "Unable to determine HOME directory");
			assert(hasAbsoluteRoot(homedir), `Expected HOME directory to be a rooted path. Actual '${homedir}'`);
			pattern = Pattern.globEscape(homedir) + pattern.substr(1);
		} else if (IS_WINDOWS$1 && (pattern.match(/^[A-Z]:$/i) || pattern.match(/^[A-Z]:[^\\]/i))) {
			let root = ensureAbsoluteRoot("C:\\dummy-root", pattern.substr(0, 2));
			if (pattern.length > 2 && !root.endsWith("\\")) root += "\\";
			pattern = Pattern.globEscape(root) + pattern.substr(2);
		} else if (IS_WINDOWS$1 && (pattern === "\\" || pattern.match(/^\\[^\\]/))) {
			let root = ensureAbsoluteRoot("C:\\dummy-root", "\\");
			if (!root.endsWith("\\")) root += "\\";
			pattern = Pattern.globEscape(root) + pattern.substr(1);
		} else pattern = ensureAbsoluteRoot(Pattern.globEscape(process.cwd()), pattern);
		return normalizeSeparators(pattern);
	}
	/**
	* Attempts to unescape a pattern segment to create a literal path segment.
	* Otherwise returns empty string.
	*/
	static getLiteral(segment) {
		let literal = "";
		for (let i = 0; i < segment.length; i++) {
			const c = segment[i];
			if (c === "\\" && !IS_WINDOWS$1 && i + 1 < segment.length) {
				literal += segment[++i];
				continue;
			} else if (c === "*" || c === "?") return "";
			else if (c === "[" && i + 1 < segment.length) {
				let set = "";
				let closed = -1;
				for (let i2 = i + 1; i2 < segment.length; i2++) {
					const c2 = segment[i2];
					if (c2 === "\\" && !IS_WINDOWS$1 && i2 + 1 < segment.length) {
						set += segment[++i2];
						continue;
					} else if (c2 === "]") {
						closed = i2;
						break;
					} else set += c2;
				}
				if (closed >= 0) {
					if (set.length > 1) return "";
					if (set) {
						literal += set;
						i = closed;
						continue;
					}
				}
			}
			literal += c;
		}
		return literal;
	}
	/**
	* Escapes regexp special characters
	* https://javascript.info/regexp-escaping
	*/
	static regExpEscape(s) {
		return s.replace(/[[\\^$.|?*+()]/g, "\\$&");
	}
};

//#endregion
//#region node_modules/@actions/glob/lib/internal-search-state.js
var SearchState = class {
	constructor(path, level) {
		this.path = path;
		this.level = level;
	}
};

//#endregion
//#region node_modules/@actions/glob/lib/internal-globber.js
var __awaiter$2 = void 0 && (void 0).__awaiter || function(thisArg, _arguments, P, generator) {
	function adopt(value) {
		return value instanceof P ? value : new P(function(resolve) {
			resolve(value);
		});
	}
	return new (P || (P = Promise))(function(resolve, reject) {
		function fulfilled(value) {
			try {
				step(generator.next(value));
			} catch (e) {
				reject(e);
			}
		}
		function rejected(value) {
			try {
				step(generator["throw"](value));
			} catch (e) {
				reject(e);
			}
		}
		function step(result) {
			result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
		}
		step((generator = generator.apply(thisArg, _arguments || [])).next());
	});
};
var __asyncValues$1 = void 0 && (void 0).__asyncValues || function(o) {
	if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
	var m = o[Symbol.asyncIterator], i;
	return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function() {
		return this;
	}, i);
	function verb(n) {
		i[n] = o[n] && function(v) {
			return new Promise(function(resolve, reject) {
				v = o[n](v), settle(resolve, reject, v.done, v.value);
			});
		};
	}
	function settle(resolve, reject, d, v) {
		Promise.resolve(v).then(function(v) {
			resolve({
				value: v,
				done: d
			});
		}, reject);
	}
};
var __await = void 0 && (void 0).__await || function(v) {
	return this instanceof __await ? (this.v = v, this) : new __await(v);
};
var __asyncGenerator = void 0 && (void 0).__asyncGenerator || function(thisArg, _arguments, generator) {
	if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
	var g = generator.apply(thisArg, _arguments || []), i, q = [];
	return i = Object.create((typeof AsyncIterator === "function" ? AsyncIterator : Object).prototype), verb("next"), verb("throw"), verb("return", awaitReturn), i[Symbol.asyncIterator] = function() {
		return this;
	}, i;
	function awaitReturn(f) {
		return function(v) {
			return Promise.resolve(v).then(f, reject);
		};
	}
	function verb(n, f) {
		if (g[n]) {
			i[n] = function(v) {
				return new Promise(function(a, b) {
					q.push([
						n,
						v,
						a,
						b
					]) > 1 || resume(n, v);
				});
			};
			if (f) i[n] = f(i[n]);
		}
	}
	function resume(n, v) {
		try {
			step(g[n](v));
		} catch (e) {
			settle(q[0][3], e);
		}
	}
	function step(r) {
		r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r);
	}
	function fulfill(value) {
		resume("next", value);
	}
	function reject(value) {
		resume("throw", value);
	}
	function settle(f, v) {
		if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]);
	}
};
const IS_WINDOWS = process.platform === "win32";
var DefaultGlobber = class DefaultGlobber {
	constructor(options) {
		this.patterns = [];
		this.searchPaths = [];
		this.options = getOptions(options);
	}
	getSearchPaths() {
		return this.searchPaths.slice();
	}
	glob() {
		return __awaiter$2(this, void 0, void 0, function* () {
			var _a, e_1, _b, _c;
			const result = [];
			try {
				for (var _d = true, _e = __asyncValues$1(this.globGenerator()), _f; _f = yield _e.next(), _a = _f.done, !_a; _d = true) {
					_c = _f.value;
					_d = false;
					const itemPath = _c;
					result.push(itemPath);
				}
			} catch (e_1_1) {
				e_1 = { error: e_1_1 };
			} finally {
				try {
					if (!_d && !_a && (_b = _e.return)) yield _b.call(_e);
				} finally {
					if (e_1) throw e_1.error;
				}
			}
			return result;
		});
	}
	globGenerator() {
		return __asyncGenerator(this, arguments, function* globGenerator_1() {
			const options = getOptions(this.options);
			const patterns = [];
			for (const pattern of this.patterns) {
				patterns.push(pattern);
				if (options.implicitDescendants && (pattern.trailingSeparator || pattern.segments[pattern.segments.length - 1] !== "**")) patterns.push(new Pattern(pattern.negate, true, pattern.segments.concat("**")));
			}
			const stack = [];
			for (const searchPath of getSearchPaths(patterns)) {
				debug(`Search path '${searchPath}'`);
				try {
					yield __await(fs$1.promises.lstat(searchPath));
				} catch (err) {
					if (err.code === "ENOENT") continue;
					throw err;
				}
				stack.unshift(new SearchState(searchPath, 1));
			}
			const traversalChain = [];
			while (stack.length) {
				const item = stack.pop();
				const match = match$1(patterns, item.path);
				const partialMatch$1 = !!match || partialMatch(patterns, item.path);
				if (!match && !partialMatch$1) continue;
				const stats = yield __await(DefaultGlobber.stat(item, options, traversalChain));
				if (!stats) continue;
				if (options.excludeHiddenFiles && path$2.basename(item.path).match(/^\./)) continue;
				if (stats.isDirectory()) {
					if (match & MatchKind.Directory && options.matchDirectories) yield yield __await(item.path);
					else if (!partialMatch$1) continue;
					const childLevel = item.level + 1;
					const childItems = (yield __await(fs$1.promises.readdir(item.path))).map((x) => new SearchState(path$2.join(item.path, x), childLevel));
					stack.push(...childItems.reverse());
				} else if (match & MatchKind.File) yield yield __await(item.path);
			}
		});
	}
	/**
	* Constructs a DefaultGlobber
	*/
	static create(patterns, options) {
		return __awaiter$2(this, void 0, void 0, function* () {
			const result = new DefaultGlobber(options);
			if (IS_WINDOWS) {
				patterns = patterns.replace(/\r\n/g, "\n");
				patterns = patterns.replace(/\r/g, "\n");
			}
			const lines = patterns.split("\n").map((x) => x.trim());
			for (const line of lines) if (!line || line.startsWith("#")) continue;
			else result.patterns.push(new Pattern(line));
			result.searchPaths.push(...getSearchPaths(result.patterns));
			return result;
		});
	}
	static stat(item, options, traversalChain) {
		return __awaiter$2(this, void 0, void 0, function* () {
			let stats;
			if (options.followSymbolicLinks) try {
				stats = yield fs$1.promises.stat(item.path);
			} catch (err) {
				if (err.code === "ENOENT") {
					if (options.omitBrokenSymbolicLinks) {
						debug(`Broken symlink '${item.path}'`);
						return;
					}
					throw new Error(`No information found for the path '${item.path}'. This may indicate a broken symbolic link.`);
				}
				throw err;
			}
			else stats = yield fs$1.promises.lstat(item.path);
			if (stats.isDirectory() && options.followSymbolicLinks) {
				const realPath = yield fs$1.promises.realpath(item.path);
				while (traversalChain.length >= item.level) traversalChain.pop();
				if (traversalChain.some((x) => x === realPath)) {
					debug(`Symlink cycle detected for path '${item.path}' and realpath '${realPath}'`);
					return;
				}
				traversalChain.push(realPath);
			}
			return stats;
		});
	}
};

//#endregion
//#region node_modules/@actions/glob/lib/internal-hash-files.js
var __awaiter$1 = void 0 && (void 0).__awaiter || function(thisArg, _arguments, P, generator) {
	function adopt(value) {
		return value instanceof P ? value : new P(function(resolve) {
			resolve(value);
		});
	}
	return new (P || (P = Promise))(function(resolve, reject) {
		function fulfilled(value) {
			try {
				step(generator.next(value));
			} catch (e) {
				reject(e);
			}
		}
		function rejected(value) {
			try {
				step(generator["throw"](value));
			} catch (e) {
				reject(e);
			}
		}
		function step(result) {
			result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
		}
		step((generator = generator.apply(thisArg, _arguments || [])).next());
	});
};
var __asyncValues = void 0 && (void 0).__asyncValues || function(o) {
	if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
	var m = o[Symbol.asyncIterator], i;
	return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function() {
		return this;
	}, i);
	function verb(n) {
		i[n] = o[n] && function(v) {
			return new Promise(function(resolve, reject) {
				v = o[n](v), settle(resolve, reject, v.done, v.value);
			});
		};
	}
	function settle(resolve, reject, d, v) {
		Promise.resolve(v).then(function(v) {
			resolve({
				value: v,
				done: d
			});
		}, reject);
	}
};

//#endregion
//#region node_modules/@actions/glob/lib/glob.js
var __awaiter = void 0 && (void 0).__awaiter || function(thisArg, _arguments, P, generator) {
	function adopt(value) {
		return value instanceof P ? value : new P(function(resolve) {
			resolve(value);
		});
	}
	return new (P || (P = Promise))(function(resolve, reject) {
		function fulfilled(value) {
			try {
				step(generator.next(value));
			} catch (e) {
				reject(e);
			}
		}
		function rejected(value) {
			try {
				step(generator["throw"](value));
			} catch (e) {
				reject(e);
			}
		}
		function step(result) {
			result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
		}
		step((generator = generator.apply(thisArg, _arguments || [])).next());
	});
};
/**
* Constructs a globber
*
* @param patterns  Patterns separated by newlines
* @param options   Glob options
*/
function create(patterns, options) {
	return __awaiter(this, void 0, void 0, function* () {
		return yield DefaultGlobber.create(patterns, options);
	});
}

//#endregion
//#region src/installer.ts
const OPAM_SOLVER_TIMEOUT = 600;
async function installer() {
	if (isDebug()) exportVariable("OPAMVERBOSE", 1);
	exportVariable("OPAMCOLOR", "always");
	exportVariable("OPAMCONFIRMLEVEL", "unsafe-yes");
	exportVariable("OPAMDOWNLOADJOBS", os$2.availableParallelism());
	exportVariable("OPAMERRLOGLEN", 0);
	exportVariable("OPAMEXTERNALSOLVER", "builtin-0install");
	exportVariable("OPAMPRECISETRACKING", 1);
	exportVariable("OPAMRETRIES", 10);
	exportVariable("OPAMROOT", OPAM_ROOT);
	exportVariable("OPAMSOLVERTIMEOUT", OPAM_SOLVER_TIMEOUT);
	exportVariable("OPAMYES", 1);
	if (PLATFORM === "windows") {
		exportVariable("HOME", process$2.env.USERPROFILE);
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
	const opamCacheHit = await restoreOpamCache();
	const opamRootInitialized = await promises$1.access(path.join(OPAM_ROOT, "config")).then(() => true, () => false);
	const useInitialRepository = !opamCacheHit && !opamRootInitialized;
	await setupOpam(useInitialRepository ? OPAM_REPOSITORIES[0] : void 0);
	if (PLATFORM === "windows" && WINDOWS_ENVIRONMENT === "cygwin") {
		await promises$1.writeFile(CYGWIN_BASH_ENV, "set -o igncr");
		exportVariable("BASH_ENV", CYGWIN_BASH_ENV);
		addPath(CYGWIN_ROOT_BIN);
	}
	if (!opamCacheHit) {
		if (useInitialRepository) await repositoryAddAll(OPAM_REPOSITORIES.slice(1));
		else {
			await repositoryRemoveAll();
			await repositoryAddAll(OPAM_REPOSITORIES);
		}
		const ocamlCompiler = await resolvedCompiler;
		await installOcaml(ocamlCompiler);
		await saveOpamCache();
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
		process$2.exit(0);
	} catch (error$1) {
		if (error$1 instanceof Error) error(error$1.message);
		process$2.exit(1);
	}
}
run();

//#endregion
export {  };