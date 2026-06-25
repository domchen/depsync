//////////////////////////////////////////////////////////////////////////////////////
//
//  The MIT License (MIT)
//
//  Copyright (c) 2017-present, Dom Chen
//  All rights reserved.
//
//  Permission is hereby granted, free of charge, to any person obtaining a copy of
//  this software and associated documentation files (the "Software"), to deal in the
//  Software without restriction, including without limitation the rights to use, copy,
//  modify, merge, publish, distribute, sublicense, and/or sell copies of the Software,
//  and to permit persons to whom the Software is furnished to do so, subject to the
//  following conditions:
//
//      The above copyright notice and this permission notice shall be included in all
//      copies or substantial portions of the Software.
//
//  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
//  INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
//  PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
//  HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
//  OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
//  SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
//
//////////////////////////////////////////////////////////////////////////////////////

const fs = require("fs");
const path = require("path");
const Utils = require("../Utils");

let LFSInited = false;

function SubRepoTask(item) {
    this.item = item;
}

SubRepoTask.prototype.run = function (callback) {
    let repoPath = this.item.dir;
    let gitPath = path.resolve(repoPath, ".git");
    if (!fs.existsSync(gitPath)) {
        callback && callback();
        return;
    }
    let modulesConfig = path.resolve(repoPath, ".gitmodules");
    if (fs.existsSync(modulesConfig)) {
        updateSubmodules(repoPath, modulesConfig);
    }
    let lfsConfig = path.resolve(repoPath, ".gitattributes");
    if (fs.existsSync(lfsConfig)) {
        let prePushFile = path.resolve(repoPath, ".git", "hooks", "pre-push");
        if (!LFSInited && !fs.existsSync(prePushFile)) {
            Utils.exec("git lfs install --force", repoPath, true);
            LFSInited = true;
        }
        let result = Utils.execSafe("git lfs fsck", repoPath);
        if (result.indexOf("Git LFS fsck OK") === -1) {
            Utils.log("【depsync】downloading git lfs objects to: " + repoPath);
            let lfsDir = path.join(repoPath, ".git", "lfs");
            let lfsBakDir = path.join(repoPath, ".git", "lfs.bak");
            if (fs.existsSync(lfsBakDir)) {
                Utils.deletePath(lfsDir);
                Utils.movePath(lfsBakDir, lfsDir);
            }
            Utils.exec("git lfs pull && git lfs prune", repoPath, false);
        }
    }
    callback && callback();
};

function updateSubmodules(repoPath, modulesConfig) {
    let cmd = "git submodule update --init --recursive --depth=1";
    if (Utils.execStatus(cmd, repoPath) === 0) {
        return;
    }
    Utils.log("【depsync】submodule update failed, cleaning stale submodules...");
    let subPaths = parseSubmodulePaths(modulesConfig);
    for (let subPath of subPaths) {
        let quoted = process.platform === "win32" ? '"' + subPath.replace(/"/g, '\\"') + '"' : "'" + subPath.replace(/'/g, "'\\''") + "'";
        Utils.execStatus("git submodule deinit -f -- " + quoted, repoPath);
        let moduleCacheDir = path.resolve(repoPath, ".git", "modules", subPath);
        if (fs.existsSync(moduleCacheDir)) {
            Utils.deletePath(moduleCacheDir);
        }
        let subDir = path.resolve(repoPath, subPath);
        if (fs.existsSync(subDir)) {
            Utils.deletePath(subDir);
        }
    }
    Utils.exec(cmd, repoPath, false);
}

function parseSubmodulePaths(modulesConfig) {
    let paths = [];
    try {
        let content = fs.readFileSync(modulesConfig, "utf-8");
        let pathRegex = /^\s*path\s*=\s*(.+)/gm;
        let match;
        while ((match = pathRegex.exec(content)) !== null) {
            paths.push(match[1].trim());
        }
    } catch (e) {
        Utils.error("【depsync】failed to parse .gitmodules: " + e.message);
    }
    return paths;
}

module.exports = SubRepoTask;

