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
    let AdmZip = require('adm-zip');

    export function downloadFiles(list:DownloadItem[]) {
        function next() {
            if (list.length == 0) {
                return;
            }
            let item = list.shift();
            let fileName = item.url.split("?")[0];
            let filePath = path.join(item.dir, path.basename(fileName));
            Utils.deletePath(filePath);
            if (item.multipart) {
                let urls:string[] = [];
                for (let tail of item.multipart) {
                    urls.push(item.url + tail);
                }
                loadMultiParts(urls, filePath, onFinish);
            } else {
                loadSingleFile(item.url, filePath, onFinish);
            }

            function onFinish() {
                if (item.unzip) {
                    unzipFile(filePath, item.dir)
                }
                next();
            }
        }

        next();
    }

    function unzipFile(filePath:string, dir:string) {
        console.log("unzipping...", filePath);
        let zip = new AdmZip(filePath);
        for (let entry of zip.getEntries()) {
            let entryName = entry.entryName;
            if (entryName.substr(0, 8) == "__MACOSX" || entryName.substr(entryName.length - 9, 9) == ".DS_Store") {
                continue;
            }
            let targetPath = path.resolve(dir, entryName.toString());
            if (entry.isDirectory) {
                Utils.deletePath(targetPath);
                Utils.createDirectory(targetPath);
                continue;
            }
            let content = entry.getData();
            if (!content) {
                console.log("Cannot unzip file:" + filePath);
                break;
            }
            Utils.writeFileTo(targetPath, content, true);
        }
        Utils.deletePath(filePath);
    }

    function loadMultiParts(urls:string[], filePath:string, callback:() => void) {
        function next() {
            if (urls.length == 0) {
                callback && callback();
                return;
            }
            let url = urls.shift();
            loadSingleFile(url, filePath, next, {flags: 'a'});
        }

        next();
    }

    function loadSingleFile(url:string, filePath:string, callback:() => void, options?:any) {
        console.log("downloading...", url);
        let httpClient = url.slice(0, 5) === 'https' ? https : http;
        try {
            Utils.createDirectory(path.dirname(filePath));
        } catch (e) {
            console.log("Cannot create directory: " + path.dirname(filePath));
            process.exit(1);
        }

        let writer = fs.createWriteStream(filePath, options);
        writer.on('finish', function () {
            callback && callback();
        });
        httpClient.get(url, function (response) {
            response.pipe(writer);
        });
    }
}