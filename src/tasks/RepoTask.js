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
const fs = require('fs');
const os = require('os')
const Utils = require("../Utils");

function AddLoginInfo(url, user, password) {
    if (url.indexOf("@") !== -1) {
        return url;
    }
    let index = url.indexOf("://");
    if (index === -1) {
        return url;
    }
    url = url.substring(0, index + 3) + user + ":" + password + "@" + url.substring(index + 3);
    return url;
}

function RepoTask(item) {
    this.item = item;
    this.username = process.env["GIT_USER"];
    this.password = process.env["GIT_PASSWORD"];
    let domainName = process.env["DomainName"];
    if ((!this.username || !this.password) && domainName) {
        let list = domainName.split("@");
        if (list.length === 2) {
            list = list[0].split(":");
            if (list.length === 2) {
                this.username = list[0];
                this.password = list[1];
            }
        }
    }
}

RepoTask.prototype.run = function (callback) {
    let item = this.item;
    let name = path.basename(item.dir);
    Utils.log("【depsync】checking out repository: " + name + "@" + item.commit);
    let url = item.url;
    if (this.username && this.password) {
        url = AddLoginInfo(url, this.username, this.password);
    }
    let lfsDir = path.join(item.dir, ".git", "lfs");
    let lfsBakDir = path.join(item.dir, ".git", "lfs.bak");
    let tempLFSDir = path.join(item.dir, ".lfs.bak");
    Utils.movePath(lfsDir, tempLFSDir);
    Utils.deletePath(path.join(item.dir, ".git"));
    if (!fs.existsSync(item.dir)) {
        Utils.createDirectory(item.dir);
    }
    Utils.exec("git init -q", item.dir);
    Utils.exec("git remote add origin " + url, item.dir);
    Utils.exec("git fetch --depth 1 origin " + item.commit, item.dir);
    Utils.movePath(tempLFSDir, lfsBakDir);
    process.env["GIT_LFS_SKIP_SMUDGE"] = "1";
    Utils.exec("git reset --hard FETCH_HEAD && git clean -df -q", item.dir);
    callback && callback();
};

module.exports = RepoTask;