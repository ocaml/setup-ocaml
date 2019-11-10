"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const tc = __importStar(require("@actions/tool-cache"));
const os = __importStar(require("os"));
const fs = __importStar(require("fs"));
const exec = __importStar(require("@actions/exec"));
const path = __importStar(require("path"));
const util = __importStar(require("util"));
let osPlat = os.platform();
let osArch = os.arch();
function getOpam(version) {
    return __awaiter(this, void 0, void 0, function* () {
        if (osPlat == "win32")
            return acquireOpamWindows(version);
        else if (osPlat == "darwin")
            return acquireOpamDarwin(version);
        else if (osPlat == "linux")
            return acquireOpamLinux(version);
    });
}
exports.getOpam = getOpam;
function acquireOpamWindows(version) {
    return __awaiter(this, void 0, void 0, function* () {
        let downloadPath = null;
        let toolPath = null;
        try {
            downloadPath = yield tc.downloadTool("https://cygwin.com/setup-x86_64.exe");
        }
        catch (error) {
            core.debug(error);
            throw `Failed to download cygwin: ${error}`;
        }
        toolPath = yield tc.cacheFile(downloadPath, 'setup-x86_64.exe', 'cygwin', "1.0");
        yield exec.exec(path.join(__dirname, 'install-ocaml-windows.cmd'), [toolPath, version]);
        core.addPath("c:\\cygwin\\bin");
        core.addPath("c:\\cygwin\\wrapperbin");
        core.exportVariable('OPAMYES', '1');
    });
}
function acquireOpamLinux(version) {
    return __awaiter(this, void 0, void 0, function* () {
        let opamVersion = "2.0.5";
        let fileName = getOpamFileName(opamVersion);
        let downloadUrl = getOpamDownloadUrl(opamVersion, fileName);
        let downloadPath = null;
        try {
            downloadPath = yield tc.downloadTool(downloadUrl);
        }
        catch (error) {
            core.debug(error);
            throw `Failed to download version ${opamVersion}: ${error}`;
        }
        fs.chmodSync(downloadPath, '755');
        let toolPath = yield tc.cacheFile(downloadPath, 'opam', 'opam', opamVersion);
        core.addPath(toolPath);
        yield exec.exec("sudo apt-get -y install bubblewrap");
        yield exec.exec(`"${toolPath}/opam"`, ["init", "-yav", "-c", version]);
        yield exec.exec(`"${toolPath}/opam"`, ["install", "-y", "depext"]);
    });
}
function acquireOpamDarwin(version) {
    return __awaiter(this, void 0, void 0, function* () {
        yield exec.exec("brew install ocaml opam");
        yield exec.exec("opam", ["init", "-yav"]);
        yield exec.exec("opam", ["install", "-y", "depext"]);
    });
}
function getOpamFileName(version) {
    const platform = osPlat == 'darwin' ? 'macos' : osPlat;
    const arch = osArch == 'x64' ? 'x86_64' : 'i686';
    const filename = util.format('opam-%s-%s-%s', version, arch, platform);
    return filename;
}
function getOpamDownloadUrl(version, filename) {
    return util.format('https://github.com/ocaml/opam/releases/download/%s/%s', version, filename);
}
