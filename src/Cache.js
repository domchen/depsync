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
const path = require("path");
const File = require('./File')
let projectPath;
let cacheConfigFile;

function initCache(configFileName) {
    projectPath = path.dirname(configFileName);
    cacheConfigFile = path.join(projectPath, "DEPS.cache");
}

function clean(downloads) {
    let data = readCache();
    for (let i = data.downloads.length - 1; i >= 0; i--) {
        let item = data.downloads[i];
        let found = false;
        for (let _i = 0, downloads_1 = downloads; _i < downloads_1.length; _i++) {
            let downloadItem = downloads_1[_i];
            if (downloadItem.url === item.url) {
                found = true;
                break;
            }
        }
        if (!found) {
            data.downloads.splice(i, 1);
        }
    }
    saveCache(data);
}

function isDownloaded(targetItem) {
    let data = readCache();
    let cachedItem;
    for (let _i = 0, _a = data.downloads; _i < _a.length; _i++) {
        let item = _a[_i];
        if (item.url === targetItem.url) {
            cachedItem = item;
            break;
        }
    }
    if (!cachedItem || cachedItem.unzip !== targetItem.unzip || cachedItem.dir !== path.relative(projectPath, targetItem.dir)) {
        return false;
    }
    if (cachedItem.multipart && targetItem.multipart) {
        if (cachedItem.multipart.length !== targetItem.multipart.length) {
            return false;
        }
        let index = 0;
        for (let _b = 0, _c = cachedItem.multipart; _b < _c.length; _b++) {
            let part = _c[_b];
            if (part !== targetItem.multipart[index]) {
                return false;
            }
            index++;
        }
        return true;
    }
    return (!cachedItem.multipart && !targetItem.multipart);
}


function finishDownload(targetItem) {
    let data = readCache();
    let index = 0;
    for (let _i = 0, _a = data.downloads; _i < _a.length; _i++) {
        let item = _a[_i];
        if (item.url === targetItem.url) {
            data.downloads.splice(index, 1);
            break;
        }
        index++;
    }
    let cachedItem = {"url": targetItem.url, "dir": path.relative(projectPath, targetItem.dir)};
    if (targetItem.unzip) {
        cachedItem.unzip = true;
    }
    if (targetItem.multipart) {
        cachedItem.multipart = targetItem.multipart.concat();
    }
    data.downloads.push(cachedItem);
    saveCache(data);
}

function readCache() {
    let data;
    try {
        let jsonText = fs.readFileSync(cacheConfigFile, "utf-8");
        data = JSON.parse(jsonText);
    } catch (e) {
        data = {downloads: []};
    }
    return data;
}

let ignoreFileChecked = false;

function saveCache(data) {
    try {
        File.writeFileTo(cacheConfigFile, JSON.stringify(data, null, "  "), true);
    } catch (e) {
    }
    if (!ignoreFileChecked) {
        ignoreFileChecked = true;
        checkIgnoreFile(path.resolve(projectPath, ".gitignore"));
        checkIgnoreFile(path.resolve(projectPath, ".npmignore"));
    }
}

function checkIgnoreFile(configFile) {
    if (fs.existsSync(configFile)) {
        try {
            let configText = fs.readFileSync(configFile, "utf-8");
            if (configText.indexOf("DEPS.cache") === -1) {
                configText = configText.trim() + "\nDEPS.cache\n";
                File.writeFileTo(configFile, configText, true);
            }
        } catch (e) {
        }
    }
}

exports.initCache = initCache;
exports.clean = clean;
exports.isDownloaded = isDownloaded;
exports.finishDownload = finishDownload;
