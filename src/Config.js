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
const terminal = require('./Terminal')

function Config(configFileName) {
    let data;
    try {
        let fs = require("fs");
        let jsonText = fs.readFileSync(configFileName, "utf-8");
        data = JSON.parse(jsonText);
    } catch (e) {
        terminal.log("The DEPS config file is not a JSON file: " + configFileName);
        process.exit(1);
    }
    let path = require("path");
    let projectPath = path.dirname(configFileName);
    this.parse(data, projectPath);
}

Config.findConfigFile = function (searchPath) {
    let fs = require("fs");
    let path = require("path");
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
};

Config.prototype.parse = function (data, projectPath) {
    this.version = data.version ? data.version : "0.0.0";
    this.files = this.parseFiles(data.vars, data.files, projectPath);
    this.actions = this.parseActions(data.vars, data.actions, projectPath);
};

Config.prototype.parseFiles = function (vars, files, projectPath) {
    if (!files) {
        return [];
    }
    let path = require("path");
    let downloads = [];
    let platforms = Object.keys(files);
    for (let _i = 0, platforms_1 = platforms; _i < platforms_1.length; _i++) {
        let platform = platforms_1[_i];
        for (let _a = 0, _b = files[platform]; _a < _b.length; _a++) {
            let item = _b[_a];
            downloads.push(item);
            item.url = this.formatString(item.url, vars);
            item.dir = this.formatString(item.dir, vars);
            item.dir = path.resolve(projectPath, item.dir);
            let unzip = item.unzip;
            if (typeof unzip == "string") {
                unzip = this.formatString(unzip, vars);
                item.unzip = (unzip === "true");
            } else if (typeof unzip != "boolean") {
                item.unzip = false;
            }
            item.platform = platform;
        }
    }
    return downloads;
};

Config.prototype.parseActions = function (vars, actions, projectPath) {
    if (!actions) {
        return [];
    }
    let path = require("path");
    let list = [];
    let platforms = Object.keys(actions);
    for (let _i = 0, platforms_2 = platforms; _i < platforms_2.length; _i++) {
        let platform = platforms_2[_i];
        for (let _a = 0, _b = actions[platform]; _a < _b.length; _a++) {
            let item = _b[_a];
            list.push(item);
            item.command = this.formatString(item.command, vars);
            item.dir = this.formatString(item.dir, vars);
            item.dir = path.resolve(projectPath, item.dir);
            item.platform = platform;
        }
    }
    return list;
};

Config.prototype.formatString = function (text, vars) {
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
};

module.exports = Config;