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

namespace Cache {
    let fs = require('fs');
    let path = require("path");

    interface CacheData {
        downloads:DownloadItem[];
    }

    let downloads:DownloadItem[];
    let projectPath:string;
    let cacheConfigFile:string;

    export function readCache(configFileName:string) {
        projectPath = path.dirname(configFileName);
        cacheConfigFile = path.join(projectPath, "DEPS.cache");
        let data:CacheData;
        try {
            let jsonText = fs.readFileSync(cacheConfigFile, "utf-8");
            data = JSON.parse(jsonText);
            downloads = data.downloads;
        } catch (e) {
            downloads = [];
        }
    }

    export function isDownloaded(targetItem:DownloadItem):boolean {
        let cachedItem:DownloadItem;
        for (let item of downloads) {
            if (item.url == targetItem.url) {
                cachedItem = item;
                break;
            }
        }
        if (!cachedItem || cachedItem.unzip != targetItem.unzip || cachedItem.dir != path.relative(projectPath, targetItem.dir)) {
            return false;
        }
        if (cachedItem.multipart && targetItem.multipart) {
            if (cachedItem.multipart.length != targetItem.multipart.length) {
                return false;
            }
            let index = 0;
            for (let part of cachedItem.multipart) {
                if (part != targetItem.multipart[index]) {
                    return false;
                }
                index++;
            }
            return true;
        }

        return (!cachedItem.multipart && !targetItem.multipart);
    }

    export function finishDownload(targetItem:DownloadItem):void {
        let index = 0;
        for (let item of downloads) {
            if (item.url == targetItem.url) {
                downloads.splice(index, 1);
                break;
            }
            index++;
        }
        let cachedItem:DownloadItem = {"url": targetItem.url, "dir": path.relative(projectPath, targetItem.dir)};
        if (targetItem.unzip) {
            cachedItem.unzip = true;
        }
        if (targetItem.multipart) {
            cachedItem.multipart = targetItem.multipart.concat();
        }
        downloads.push(cachedItem);
    }

    export function save() {
        let data:CacheData = {"downloads": downloads};
        Utils.writeFileTo(cacheConfigFile, JSON.stringify(data, null, "  "), true);
    }
}