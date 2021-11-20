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

const fs = require('fs');
const Utils = require('../Utils');
const Config = require("../Config");
const RepoTask = require("./RepoTask");
const FileTask = require("./FileTask");
const ActionTask = require("./ActionTask");
const TaskRunner = require("./TaskRunner");
const path = require("path");

function compareVersion(versionA, versionB) {
    if (versionA === versionB) {
        return 0;
    }
    let listA = versionA.split(".");
    let listB = versionB.split(".");
    let length = Math.max(listA.length, listB.length);
    for (let i = 0; i < length; i++) {
        if (listA.length <= i) {
            return -1;
        }
        let a = parseInt(listA[i]);
        if (listB.length <= i) {
            return 1;
        }
        let b = parseInt(listB[i]);
        if (a === b) {
            continue;
        }
        return a > b ? 1 : -1;
    }
    return 0;
}

function DepsTask(version, configFile, platform) {
    this.version = version;
    this.configFile = configFile;
    this.platform = platform;
}

DepsTask.prototype.run = function (callback) {
    if (!fs.existsSync(this.configFile)) {
        callback && callback();
        return;
    }
    let config = Config.parse(this.configFile, this.platform);
    if (!config) {
        callback && callback();
        return;
    }
    if (compareVersion(this.version, config.version) < 0) {
        Utils.error("DEPS file requires version: " + config.version);
        Utils.error("The current depsync version: " + this.version);
        Utils.error("Please update the depsync tool and then try again.");
        callback && callback();
        return;
    }
    let tasks = [];
    for (let item of config.repos) {
        tasks.push(new RepoTask(item));
        let depsFile = path.join(item.dir, "DEPS");
        tasks.push(new DepsTask(this.version, depsFile, this.platform));
    }
    for (let item of config.files) {
        tasks.push(new FileTask(item));
    }
    for (let item of config.actions) {
        tasks.push(new ActionTask(item));
    }

    TaskRunner.runTasks(tasks, () => {
        callback && callback();
    });
};

module.exports = DepsTask;