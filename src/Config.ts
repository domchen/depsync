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

interface DownloadItem {
    url:string;
    dir:string;
    unzip?:boolean | string;
    multipart?:string[]
    platform?:string;
}


interface ActionItem {
    command:string;
    dir:string;
    platform?:string;
}

interface FileList {
    [key:string]:DownloadItem[];
}

interface ActionList {
    [key:string]:ActionItem[];
}

interface DEPSData {
    version:string;
    vars?:Map<string>;
    files?:FileList;
    actions?:ActionList;
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

    public constructor(configFileName:string) {
        let data:DEPSData;
        try {
            let fs = require("fs");
            let jsonText = fs.readFileSync(configFileName, "utf-8");
            data = JSON.parse(jsonText);
        } catch (e) {
            terminal.log("The DEPS config file is not a JSON file: " + configFileName);
            process.exit(1);
        }
        let path = require("path");
        let projectPath = path.dirname(configFileName);
        this.parse(data, projectPath);
    }

    public version:string;
    public files:DownloadItem[];
    public actions:ActionItem[];

    private parse(data:DEPSData, projectPath:string):void {
        this.version = data.version ? data.version : "0.0.0";
        this.files = this.parseFiles(data.vars, data.files, projectPath);
        this.actions = this.parseActions(data.vars, data.actions, projectPath);
    }

    private parseFiles(vars:Map<string>, files:FileList, projectPath:string):DownloadItem[] {
        if (!files) {
            return [];
        }
        let path = require("path");
        let downloads:DownloadItem[] = [];
        let platforms = Object.keys(files);
        for (let platform of platforms) {
            for (let item of files[platform]) {
                downloads.push(item);
                item.url = this.formatString(item.url, vars);
                item.dir = this.formatString(item.dir, vars);
                item.dir = path.resolve(projectPath, item.dir);
                let unzip = item.unzip;
                if (typeof unzip == "string") {
                    unzip = this.formatString(<string>unzip, vars);
                    item.unzip = (unzip == "true");
                } else if (typeof unzip != "boolean") {
                    item.unzip = false;
                }
                item.platform = platform;
            }
        }
        return downloads;
    }

    private parseActions(vars:Map<string>, actions:ActionList, projectPath:string):ActionItem[] {
        if (!actions) {
            return [];
        }
        let path = require("path");
        let list:ActionItem[] = [];
        let platforms = Object.keys(actions);
        for (let platform of platforms) {
            for (let item of actions[platform]) {
                list.push(item);
                item.command = this.formatString(item.command, vars);
                item.dir = this.formatString(item.dir, vars);
                item.dir = path.resolve(projectPath, item.dir);
                item.platform = platform;
            }
        }
        return list;
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