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
const childProcess = require("child_process");
let hasLineBreaker = false;

function createDirectory(filePath, mode) {
    if (mode === undefined) {
        mode = 511 & (~process.umask());
    }
    filePath = path.resolve(filePath);
    try {
        fs.mkdirSync(filePath, mode);
    } catch (err0) {
        switch (err0.code) {
            case 'ENOENT':
                createDirectory(path.dirname(filePath), mode);
                createDirectory(filePath, mode);
                break;
            default:
                let stat = void 0;
                try {
                    stat = fs.statSync(filePath);
                } catch (err1) {
                    throw err0;
                }
                if (!stat.isDirectory()) {
                    throw err0;
                }
                break;
        }
    }
}

function deleteDirectory(path) {
    let files = [];
    if (fs.existsSync(path)) {
        files = fs.readdirSync(path);
        files.forEach(function (file) {
            let curPath = path + "/" + file;
            if (fs.statSync(curPath).isDirectory()) {
                deleteDirectory(curPath);
            } else {
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(path);
    }
}

function deletePath(path) {
    try {
        if (fs.lstatSync(path).isDirectory()) {
            deleteDirectory(path);
        } else {
            fs.unlinkSync(path);
        }
    } catch (e) {
    }
}

function readFile(filePath) {
    try {
        return fs.readFileSync(filePath, "utf-8");
    } catch (e) {
        return "";
    }
}

function writeFile(filePath, content) {
    if (fs.existsSync(filePath)) {
        deletePath(filePath);
    }
    let folder = path.dirname(filePath);
    if (!fs.existsSync(folder)) {
        createDirectory(folder);
    }
    let fd;
    try {
        fd = fs.openSync(filePath, 'w', 438);
    } catch (e) {
        fs.chmodSync(filePath, 438);
        fd = fs.openSync(filePath, 'w', 438);
    }
    if (fd) {
        if (typeof content == "string") {
            fs.writeSync(fd, content, 0, 'utf8');
        } else {
            fs.writeSync(fd, content, 0, content.length, 0);
        }
        fs.closeSync(fd);
    }
    fs.chmodSync(filePath, 438);
    return true;
}

function formatString(format) {
    let objects = new Array(arguments.length);
    for (let index = 0; index < arguments.length; index++) {
        objects[index] = arguments[index];
    }
    let text = objects.join(' ');
    if (hasLineBreaker) {
        hasLineBreaker = false;
        text = "\n" + text;
    }
    return text;
}

function log(message) {
    let text = formatString.apply(this, arguments);
    if (text) {
        text += "\n";
    }
    process.stdout.write(text);
}

function error(message) {
    let text = formatString.apply(this, arguments);
    if (text) {
        text += "\n";
    }
    process.stderr.write(text);
}

function exec(cmd, dir, quiet) {
    let options = {
        shell: true,
        cwd: dir,
        env: process.env
    }
    if (!quiet) {
        options.stdio = "inherit";
    }

    let result = childProcess.spawnSync(cmd, options);
    if (result.status !== 0) {
        if (quiet) {
            log(result.stdout);
            error(result.stderr);
        }
        process.exit(1);
    }
}

function addLineBreaker() {
    hasLineBreaker = true;
}

exports.createDirectory = createDirectory;
exports.deletePath = deletePath;
exports.readFile = readFile;
exports.writeFile = writeFile;
exports.exec = exec;
exports.log = log;
exports.error = error;
exports.addLineBreaker = addLineBreaker;
