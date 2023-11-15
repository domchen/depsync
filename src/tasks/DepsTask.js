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

function DepsTask(configFile, version, platform, nonRecursive) {
    this.configFile = configFile;
    this.version = version;
    this.platform = platform;
    this.nonRecursive = nonRecursive;
}

DepsTask.prototype.run = function (callback) {
    let config = Config.parse(this.configFile, this.version, this.platform);
    if (!config) {
        callback && callback();
        return;
    }
    let tasks = [];
    for (let item of config.repos) {
        let shallowFile = path.join(item.dir, ".git", "shallow");
        let wasShallow = fs.existsSync(shallowFile);
        let commit = "";
        if (wasShallow) {
            commit = Utils.readFile(shallowFile).substr(0, 40);
        } else {
            let fetchHeadFile = path.join(item.dir, ".git", "FETCH_HEAD");
            commit = Utils.readFile(fetchHeadFile).substr(0, 40);
        }
        if (commit !== item.commit || wasShallow !== item.shallow) {
            tasks.push(new RepoTask(item));
        }
        if (!this.nonRecursive) {
            let depsFile = path.join(item.dir, "DEPS");
            if (fs.existsSync(depsFile)) {
                tasks.push(new DepsTask(depsFile, this.version, this.platform, this.nonRecursive));
            }
        }
    }
    for (let item of config.files) {
        let cache = Utils.readFile(item.hashFile).substring(0, 40);
        if (cache !== item.hash) {
            tasks.push(new FileTask(item));
        }
    }
    for (let item of config.actions) {
        tasks.push(new ActionTask(item));
    }

    TaskRunner.runTasks(tasks, () => {
        callback && callback();
    });
};

module.exports = DepsTask;