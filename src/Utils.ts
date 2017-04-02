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

namespace Utils {
    let fs = require("fs");
    let path = require("path");
    let directorySeparator = "/";

    function getRootLength(path:string):number {
        if (path.charAt(0) == "/") {
            if (path.charAt(1) != "/") return 1;
            const p1 = path.indexOf("/", 2);
            if (p1 < 0) return 2;
            const p2 = path.indexOf("/", p1 + 1);
            if (p2 < 0) return p1 + 1;
            return p2 + 1;
        }
        if (path.charAt(1) == ":") {
            if (path.charAt(2) == "/") return 3;
            return 2;
        }
        if (path.lastIndexOf("file:///", 0) === 0) {
            return "file:///".length;
        }
        const idx = path.indexOf("://");
        if (idx !== -1) {
            return idx + "://".length;
        }
        return 0;
    }

    export function joinPath(path1:string, path2:string):string {
        if (!(path1 && path1.length)) return path2;
        if (!(path2 && path2.length)) return path1;
        path1 = path1.split("\\").join(directorySeparator);
        path2 = path2.split("\\").join(directorySeparator);
        if (getRootLength(path2) !== 0) return path2;
        if (path1.charAt(path1.length - 1) === directorySeparator) return path1 + path2;
        return path1 + directorySeparator + path2;
    }

    export function createDirectory(filePath:string, mode?:number):void {
        if (mode === undefined) {
            mode = 511 & (~process.umask());
        }

        filePath = path.resolve(filePath);
        try {
            fs.mkdirSync(filePath, mode);
        }
        catch (err0) {
            switch (err0.code) {
                case 'ENOENT':
                    createDirectory(path.dirname(filePath), mode);
                    createDirectory(filePath, mode);
                    break;
                default:
                    let stat;
                    try {
                        stat = fs.statSync(filePath);
                    }
                    catch (err1) {
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
                }
                else {
                    fs.unlinkSync(curPath);
                }
            });
            fs.rmdirSync(path);
        }
    }

    export function deletePath(path:string):void {
        try {
            if (fs.lstatSync(path).isDirectory()) {
                deleteDirectory(path);
            } else {
                fs.unlinkSync(path);
            }
        }
        catch (e) {
        }
    }

    export function writeFileTo(filePath:string, content:any, overwrite?:boolean, mode?:number) {
        if (fs.existsSync(filePath)) {
            if (!overwrite) {
                return false;
            }
            let stat = fs.statSync(filePath);
            if (stat.isDirectory()) {
                return false;
            }
        }
        let folder = path.dirname(filePath);
        if (!fs.existsSync(folder)) {
            createDirectory(folder);
        }

        let fd;
        try {
            fd = fs.openSync(filePath, 'w', 438); // 0666
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
        fs.chmodSync(filePath, mode || 438);
        return true;
    }
}