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

interface DEPSData {
    vars?:Map<string>;
    files?:{
        common?:DownloadItem[];
        mac?:DownloadItem[];
        win?:DownloadItem[]
    }
}

interface DownloadItem {
    url:string;
    dir:string;
    unzip?:string;
    multipart?:string[]
}

class Config {

    public static findConfigFile(searchPath:string):string {
        let fs = require("fs");
        let path = require("path");
        while (true) {
            let fileName = Utils.joinPath(searchPath, "DEPS");
            if (fs.existsSync(fileName)) {
                return fileName;
            }
            let parentPath = path.dirname(searchPath);
            if (parentPath === searchPath) {
                break;
            }
            searchPath = parentPath;
        }
        return "";
    }

    public constructor(data:DEPSData, projectPath:string, platform:string) {
        this.parse(data, projectPath, platform);
    }

    public downloads:DownloadItem[];

    private parse(data:DEPSData, projectPath:string, platform:string):void {
        let path = require("path");
        let files = data.files;
        let downloads:DownloadItem[] = [];
        if (files.common) {
            for (let item of files.common) {
                downloads.push(item);
            }
        }
        if (files[platform]) {
            for (let item of files[platform]) {
                downloads.push(item);
            }
        }
        for (let item of downloads) {
            item.url = this.formatString(item.url, data.vars);
            item.dir = this.formatString(item.dir, data.vars);
            item.dir = path.join(projectPath, item.dir);
            if (item.unzip) {
                item.unzip = this.formatString(item.unzip, data.vars);
            }
        }
        this.downloads = downloads;
    }

    private formatString(text:string, vars:Map<string>):string {
        let index = text.indexOf("${");
        while (index != -1) {
            let prefix = text.substring(0, index);
            text = text.substring(index);
            index = text.indexOf("}");
            if (index == -1) {
                text = prefix + text;
                break;
            }
            let key = text.substring(2, index);
            text = text.substring(index + 1);
            let value = vars[key] ? vars[key] : "${" + key + "}";
            text = prefix + value + text;
            index = text.indexOf("${");
        }
        return text;
    }
}