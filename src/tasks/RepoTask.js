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

const path = require('path');
const terminal = require("../Terminal");
const Utils = require("../Utils");

function AddLoginInfo(url) {
    if (url.indexOf("@") !== -1) {
        return url;
    }
    let index = url.indexOf("://");
    if (index === -1) {
        return url;
    }
    let user = process.env["GIT_USER"];
    let password = process.env["GIT_PASSWORD"];
    if (!user || !password) {
        return url;
    }
    url = url.substring(0, index + 3) + user + ":" + password + "@" + url.substring(index + 3);
    return url;
}

function RepoTask(item) {
    this.item = item;
}

RepoTask.prototype.run = function (callback) {
    let item = this.item;
    let name = path.basename(item.dir);
    terminal.log("【depsync】checking out repository: " + name + "@" + item.commit);
    Utils.deletePath(item.dir);
    Utils.createDirectory(item.dir);
    let url = AddLoginInfo(item.url);
    Utils.exec("git init -q", item.dir);
    Utils.exec("git remote add origin " + url, item.dir);
    Utils.exec("git fetch --depth 1 origin " + item.commit, item.dir);
    Utils.exec("git reset --hard FETCH_HEAD -q", item.dir);
    callback && callback();
};

module.exports = RepoTask;