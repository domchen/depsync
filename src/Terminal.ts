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

interface WriteStream extends NodeJS.WritableStream {
    columns:number;
    rows:number;
}

class Terminal {

    public constructor(stdout:NodeJS.WritableStream, stderr:NodeJS.WritableStream) {
        this.stdout = <WriteStream><any>stdout;
        this.stderr = <WriteStream><any>stderr;
    }

    /**
     * @internal
     * The standard output stream.
     */
    private stdout:WriteStream;

    /**
     * @internal
     * The standard error stream.
     */
    private stderr:WriteStream;

    private needSave:boolean = false;
    private savedString:string = "";

    public saveCursor():void {
        this.needSave = true;
        this.savedString = "";
    }

    public restoreCursorAndClear():void {
        if (this.stdout.isTTY && this.savedString) {
            let lines = this.savedString.split("\n");
            if (lines[lines.length - 1] == "") {
                lines.pop();
            }
            let columns = this.stdout.columns;
            if(process.platform=="win32"){
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
    }

    private static formatString(format):string {
        let objects = new Array(arguments.length);
        for (let index = 0; index < arguments.length; index++) {
            objects[index] = arguments[index];
        }
        return objects.join(' ');
    }

    /**
     * Writes an message to the terminal.
     * @param message the message written to the console
     * @param optionalParams the extra messages written to the console
     */
    public log(message?:any, ...optionalParams:any[]):void {
        let text = Terminal.formatString.apply(this, arguments);
        if (this.needSave) {
            this.savedString += text + "\n";
        }
        this.stdout.write(text + "\n");
    }

    /**
     * Writes an error message to the console if the assertion is false. If the assertion is true, nothing will happen.
     * @param assertion Any boolean expression. If the assertion is false, the message will get written to the terminal.
     * @param message the message written to the console
     * @param optionalParams the extra messages written to the console
     */
    public assert(assertion?:boolean, message?:string, ...optionalParams:any[]):void {
        if (!assertion) {
            this.stderr.write(message + "\n");
        }
    }

    /**
     * Writes a warning message to the terminal.
     * @param message the message written to the console
     * @param optionalParams the extra messages written to the console
     */
    public warn(message?:any, ...optionalParams:any[]):void {
        let text = Terminal.formatString.apply(this, arguments);
        this.stderr.write(text + "\n");
    }

    /**
     * Writes an error message to the terminal.
     * @param message the message written to the console
     * @param optionalParams the extra messages written to the console
     */
    public error(message?:any, ...optionalParams:any[]):void {
        let text = Terminal.formatString.apply(this, arguments);
        this.stderr.write(text + "\n");
    }

}

let terminal = new Terminal(process.stdout, process.stderr);