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

const File = require('./File')
const fs = require("fs");
const path = require("path");
const crypto = require('crypto')

function findConfigFile(searchPath) {
    while (true) {
        let fileName = File.joinPath(searchPath, "DEPS");
        if (fs.existsSync(fileName)) {
            return fileName;
        }
        let parentPath = path.dirname(searchPath);
        if (parentPath === searchPath) {
            break;
        }
        searchPath = parentPath;
    }
    return "";
}

function getHash(content) {
    let hash = crypto.createHash('sha1')
    hash.update(content)
    return hash.digest('hex')
}

function filterByHash(items) {
    if (!items) {
        return [];
    }
    let list = [];
    for (let item of items) {
        let cache = File.readFile(item.hashFile);
        if (cache !== item.hash) {
            list.push(item);
        }
    }
    return list;
}


function parseFiles(files, vars, projectPath) {
    if (!files) {
        return [];
    }
    let downloads = [];
    for (let item of files) {
        downloads.push(item);
        item.url = formatString(item.url, vars);
        item.dir = formatString(item.dir, vars);
        item.hash = getHash(item.url);
        item.dir = path.resolve(projectPath, item.dir);
        item.hashFile = "." + path.basename(item.url) + ".sha1";
        item.hashFile = path.resolve(item.dir, item.hashFile);
        let unzip = item.unzip;
        if (typeof unzip == "string") {
            unzip = formatString(unzip, vars);
            item.unzip = (unzip === "true");
        } else if (typeof unzip != "boolean") {
            item.unzip = false;
        }
    }
    return filterByHash(downloads);
}

function parseActions(actions, vars, projectPath) {
    if (!actions) {
        return [];
    }
    let list = [];
    for (let item of actions) {
        list.push(item);
        item.command = formatString(item.command, vars);
        item.dir = formatString(item.dir, vars);
        item.dir = path.resolve(projectPath, item.dir);
    }
    return list;
}

function formatString(text, vars) {
    let index = text.indexOf("${");
    while (index !== -1) {
        let prefix = text.substring(0, index);
        text = text.substring(index);
        index = text.indexOf("}");
        if (index === -1) {
            text = prefix + text;
            break;
        }
        let key = text.substring(2, index);
        text = text.substring(index + 1);
        let value = vars[key] ? vars[key] : "${" + key + "}";
        text = prefix + value + text;
        index = text.indexOf("${");
    }
    return text;
}

function filterByPlatform(items, hostPlatform) {
    if (!items) {
        return [];
    }
    let list = [];
    let platforms = Object.keys(items);
    for (let platform of platforms) {
        if (platform === hostPlatform || platform === "common") {
            for (let item of items[platform]) {
                list.push(item);
            }
        }
    }
    return list;
}

function parse(configFileName, platform) {
    let data;
    try {
        let jsonText = File.readFile(configFileName);
        data = JSON.parse(jsonText);
    } catch (e) {
        return null;
    }
    let projectPath = path.dirname(configFileName);
    let config = {};
    config.version = data.version ? data.version : "0.0.0";
    let files = filterByPlatform(data.files, platform);
    config.files = parseFiles(files, data.vars, projectPath);
    let actions = filterByPlatform(data.actions, platform);
    config.actions = parseActions(actions, data.vars, projectPath);
    return config;
}

exports.findConfigFile = findConfigFile;
exports.parse = parse;