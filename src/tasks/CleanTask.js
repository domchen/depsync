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

const Utils = require("../Utils");
const fs = require("fs");
const path = require("path");
const Config = require("../Config");

function CleanTask(configFileName, version) {
    this.configFile = configFileName;
    this.version = version;
}

function doClean(filePath, repoPaths, sha1Files) {
    if (!fs.existsSync(filePath)) {
        return;
    }
    if (fs.lstatSync(filePath).isDirectory()) {
        if (fs.existsSync(path.join(filePath, ".git",))) {
            let shallowFile = path.join(filePath, ".git", "shallow");
            if (fs.existsSync(shallowFile) && repoPaths.indexOf(filePath) === -1) {
                Utils.log("【depsync】removing unused repository: " + filePath);
                Utils.deletePath(filePath);
            }
            return;
        }
        let files = fs.readdirSync(filePath);
        for (let file of files) {
            let currentFile = path.join(filePath, file);
            doClean(currentFile, repoPaths, sha1Files);
        }
    } else {
        let fileName = path.basename(filePath);
        if (path.extname(fileName) === ".sha1" && fileName.charAt(0) === "." && sha1Files.indexOf(filePath) === -1) {
            let name = fileName.substring(1, fileName.length - 5);
            let dirName = path.dirname(filePath);
            let depsFile = path.join(dirName, name);
            if (!fs.existsSync(depsFile)) {
                if (path.extname(name).toLowerCase() === ".zip") {
                    name = name.substring(0, name.length - 4);
                    depsFile = path.join(dirName, name);
                }
            }
            if (fs.existsSync(depsFile)) {
                Utils.log("【depsync】removing unused file: " + depsFile);
                Utils.deletePath(depsFile);
                Utils.deletePath(filePath);
                Utils.deleteEmptyDir(dirName);
            }
        }
    }
}

CleanTask.prototype.run = function (callback) {
    let config = Config.parse(this.configFile, this.version, "");
    if (!config) {
        callback && callback();
        return;
    }
    let depsRoot = process.cwd();
    let repoPaths = [];
    for (let item of config.repos) {
        repoPaths.push(item.dir);
    }
    let sha1Files = [];
    for (let item of config.files) {
        let fileName = item.url.split("?")[0];
        fileName = path.basename(fileName);
        let sha1File = path.join(item.dir, "." + fileName + ".sha1");
        sha1Files.push(sha1File);
    }
    let files = fs.readdirSync(depsRoot);
    for (let file of files) {
        let currentFile = path.join(depsRoot, file);
        doClean(currentFile, repoPaths, sha1Files);
    }
    callback && callback();
}

module.exports = CleanTask;