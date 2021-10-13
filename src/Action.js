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

const childProcess = require('child_process');
const terminal = require('./Terminal')

function executeActions(list, callback) {
    if (list.length === 0) {
        callback && callback();
        return;
    }
    let item = list.shift();
    terminal.saveCursor();
    terminal.log("【depsync】executing action: " + item.command + " " + item.args.join(" "));
    let shell = childProcess.spawn(item.command, item.args, {cwd: item.dir, env: process.env});
    shell.stdout.on('data', (data) => {
        terminal.writeStdout(data);
    });
    shell.stderr.on('data', (data) => {
        terminal.writeStderr(data);
    })
    shell.on('close', (code) => {
        if (code !== 0) {
            process.exit(1);
        }
        terminal.restoreCursorAndClear();
        executeActions(list, callback);
    })
}

exports.executeActions = executeActions;