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

namespace Action {

    let childProcess = require('child_process');
    let terminal = require('terminal-kit').terminal

    export function executeActions(list:ActionItem[], platform:string, callback:() => void) {
        if (!list) {
            list = [];
        }
        let actions:ActionItem[] = [];
        for (let item of list) {
            if (item.platform == platform || item.platform == "common") {
                actions.push(item);
            }
        }
        doExecuteActions(actions, callback);
    }

    function doExecuteActions(list:ActionItem[], callback:() => void) {
        if (list.length == 0) {
            callback && callback();
            return;
        }
        let item = list.shift();
        terminal.saveCursor();
        console.log("executing... " + item.command);
        childProcess.exec(item.command, {cwd: item.dir}, onFinish)

        function onFinish(error:Error, stdout:string, stderr:string) {
            if (error) {
                console.log(error.message);
                process.exit(1);
            }
            terminal.restoreCursor();
            terminal.eraseDisplayBelow();
            doExecuteActions(list, callback);
        }
    }
}