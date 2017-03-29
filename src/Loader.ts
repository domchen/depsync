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

namespace Loader {

    let fs = require('fs');
    let http = require('follow-redirects').http;
    let https = require('follow-redirects').https;
    let path = require("path");

    export function downloadFiles(list:DownloadItem[]) {
        function next() {
            if (list.length == 0) {
                return;
            }
            let item = list.shift();
            console.log("downloading...", item.url, " to ", item.dir);
            download(item.url, item.dir, function () {
                next();
            });
        }

        next();
    }

    function download(url:string, filePath:string, callback:() => void):void {
        let httpClient = url.slice(0, 5) === 'https' ? https : http;
        try {
            createDirectory(path.dirname(filePath));
        } catch (e) {
            console.log("Cannot create directory: " + path.dirname(filePath));
            process.exit(1);
        }

        let writer = fs.createWriteStream(filePath);
        writer.on('finish', function () {
            callback && callback();
        });
        httpClient.get(url, function (response) {
            response.pipe(writer);
        });
    }

    function createDirectory(filePath:string, mode?:number):void {
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
}