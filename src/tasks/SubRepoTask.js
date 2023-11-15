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
    let shallowFile = path.join(repoPath, ".git", "shallow");
    let isShallow = fs.existsSync(shallowFile);
    let modulesConfig = path.resolve(repoPath, ".gitmodules");
    if (fs.existsSync(modulesConfig)) {
        if (isShallow) {
            Utils.exec("git submodule update --init --recursive --depth=1", repoPath, false);
        } else {
            Utils.exec("git submodule update --init --recursive", repoPath, false);
        }
    }
    let glfConfig = path.resolve(repoPath, ".gitattributes");
    if (fs.existsSync(glfConfig)) {
        Utils.exec("git lfs install", repoPath, true);
        let result = Utils.execSafe("git lfs fsck", repoPath);
        if (result.indexOf("Git LFS fsck OK") === -1) {
            Utils.log("【depsync】downloading git lfs objects for: " + repoPath);
            Utils.exec("git lfs pull", repoPath, false);
        }
    }
    callback && callback();
};

module.exports = SubRepoTask;