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

function Terminal(stdout, stderr) {
    this.needSave = false;
    this.savedString = "";
    this.stdout = stdout;
    this.stderr = stderr;
}

Terminal.prototype.saveCursor = function () {
    this.needSave = true;
    this.savedString = "";
};

Terminal.prototype.restoreCursorAndClear = function () {

    if (this.stdout.isTTY && this.savedString) {
        let lines = this.savedString.split("\n");
        if (lines[lines.length - 1] === "") {
            lines.pop();
        }
        let columns = this.stdout.columns;
        if (process.platform === "win32") {
            columns--;
        }
        let lineCount = 0;
        for (let line of lines) {
            while (line.length > columns) {
                line = line.substr(columns);
                lineCount++;
            }
            lineCount++;
        }
        let readLine = require("readline");
        readLine.moveCursor(this.stdout, 0, -lineCount);
        readLine.clearScreenDown(this.stdout);
    }
    this.needSave = false;
    this.savedString = "";
};

Terminal.formatString = function (format) {
    let objects = new Array(arguments.length);
    for (let index = 0; index < arguments.length; index++) {
        objects[index] = arguments[index];
    }
    return objects.join(' ');
};

Terminal.prototype.writeStdout = function (text) {
    if (this.needSave) {
        this.savedString += text;
    }
    this.stdout.write(text);
};

Terminal.prototype.writeStderr = function (text) {
    this.stderr.write(text);
};

Terminal.prototype.log = function (message) {
    let text = Terminal.formatString.apply(this, arguments) + "\n";
    this.writeStdout(text);
};

Terminal.prototype.assert = function (assertion, message) {
    if (!assertion) {
        this.stderr.write(message + "\n");
    }
};

Terminal.prototype.warn = function (message) {
    let text = Terminal.formatString.apply(this, arguments) + "\n";
    this.writeStderr(text);
};

Terminal.prototype.error = function (message) {
    let text = Terminal.formatString.apply(this, arguments) + "\n";
    this.writeStderr(text);
};

module.exports = new Terminal(process.stdout, process.stderr);