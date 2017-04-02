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
    let readLine = require("readline");
    let AdmZip = require('adm-zip');
    let ProgressBar = require("progress");

    export function downloadFiles(list:DownloadItem[], callback:() => void) {
        if (list.length == 0) {
            callback && callback();
            return;
        }
        let item = list.shift();
        if (Cache.isDownloaded(item)) {
            downloadFiles(list, callback);
            return;
        }
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

        function onFinish(error?:Error) {
            if (error) {
                console.log(error.message);
                return;
            }
            let filePaths:string[] = [];
            if (item.unzip) {
                try {
                    unzipFile(filePath, item.dir);
                } catch (e) {
                    console.log("Cannot unzip file: " + filePath);
                    process.exit(1);
                }

            } else {
                filePaths.push(filePath);
            }
            Cache.finishDownload(item);
            downloadFiles(list, callback);
        }
    }

    function unzipFile(filePath:string, dir:string) {
        console.log("unzip... " + filePath);
        let zip = new AdmZip(filePath);
        for (let entry of zip.getEntries()) {
            let entryName = entry.entryName.toString();
            if (entryName.substr(0, 8) == "__MACOSX" || entryName.substr(entryName.length - 9, 9) == ".DS_Store") {
                continue;
            }
            let targetPath = path.resolve(dir, entryName);
            if (entry.isDirectory) {
                Utils.deletePath(targetPath);
                Utils.createDirectory(targetPath);
                continue;
            }
            let content = entry.getData();
            if (!content) {
                readLine.moveCursor(process.stderr, 0, -1);
                readLine.clearScreenDown(process.stderr);
                throw new Error("Cannot unzip file:" + filePath);
            }
            Utils.writeFileTo(targetPath, content, true);
        }
        Utils.deletePath(filePath);
        readLine.moveCursor(process.stderr, 0, -1);
        readLine.clearScreenDown(process.stderr);
    }

    function loadMultiParts(urls:string[], filePath:string, callback:(error?:Error) => void) {
        if (urls.length == 0) {
            callback && callback();
            return;
        }
        let url = urls.shift();
        loadSingleFile(url, filePath, function (error?:Error) {
            if (error) {
                callback && callback(error);
                return;
            }
            loadMultiParts(urls, filePath, callback);
        }, {flags: 'a'});
    }

    function loadSingleFile(url:string, filePath:string, callback:(error?:Error) => void, options?:any) {
        console.log("download... " + url);
        let httpClient = url.slice(0, 5) === 'https' ? https : http;
        try {
            Utils.createDirectory(path.dirname(filePath));
        } catch (e) {
            console.log("Cannot create directory: " + path.dirname(filePath));
            process.exit(1);
        }

        let file = fs.createWriteStream(filePath, options);
        let outputError:Error;
        file.on("close", function () {
            callback && callback(outputError);
        });
        let request = httpClient.get(url, function (response) {
            if (response.statusCode >= 400 || response.statusCode == 0) {
                file.close();
                outputError = new Error("Cannot download file : "+response.statusMessage);
                return;
            }
            let length = parseInt(response.headers['content-length'], 10);
            let bar = new ProgressBar(':bar [ :percent | :current/:total | :etas ] ', {
                complete: '█',
                incomplete: '░',
                width: 80,
                total: length
            });
            response.on('data', function (chunk) {
                file.write(chunk);
                bar.tick(chunk.length);
            });
            response.on('end', function () {
                file.end();
                readLine.moveCursor(process.stderr, 0, -1);
                readLine.clearScreenDown(process.stderr);
            });
            response.on('error', function (error:Error) {
                file.close();
                outputError = error;
                readLine.moveCursor(process.stderr, 0, -1);
                readLine.clearScreenDown(process.stderr);
            });
        });
    }
}