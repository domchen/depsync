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

namespace Program {

    let fs = require("fs");
    let path = require("path");
    const VERSION = "1.0.7";

    export function run(args:string[]):void {
        let commandOptions = CommandLine.parse(args);
        if (commandOptions.errors.length > 0) {
            terminal.log(commandOptions.errors.join("\n") + "\n");
            process.exit(1);
        }

        if (commandOptions.version) {
            printVersion();
            return;
        }

        if (commandOptions.help) {
            printVersion();
            printHelp();
            return;
        }
        let configFileName:string = "";
        if (commandOptions.project) {
            if (!commandOptions.project || fs.existsSync(commandOptions.project)) {
                configFileName = Utils.joinPath(commandOptions.project, "DEPS");
            }
            else {
                configFileName = commandOptions.project;
            }
            if (!fs.existsSync(configFileName)) {
                terminal.log("Cannot find a DEPS file at the specified directory: " + commandOptions.project + "\n");
                process.exit(1);
            }
        }
        else {
            let searchPath = process.cwd();
            configFileName = Config.findConfigFile(searchPath);
            if (!configFileName) {
                printVersion();
                printHelp();
                return;
            }
        }

        let config = new Config(configFileName);
        if (compareVersion(VERSION, config.version) < 0) {
            terminal.log("DEPS file requires version: " + config.version);
            terminal.log("The current depsync version: " + VERSION);
            terminal.log("Please update the depsync tool and then try again.");
            process.exit(1);
        }
        Cache.initCache(configFileName);
        Loader.downloadFiles(config.files, commandOptions.platform, function () {
            Action.executeActions(config.actions, commandOptions.platform, function () {
                Cache.clean(config.files);
            })
        });
    }

    function printVersion():void {
        terminal.log("Version " + VERSION + "\n");
    }

    function compareVersion(versionA:string, versionB:string):number {
        if (versionA == versionB) {
            return 0;
        }
        let listA = versionA.split(".");
        let listB = versionB.split(".");
        let length = Math.max(listA.length, listB.length)
        for (let i = 0; i < length; i++) {
            if (listA.length <= i) {
                return -1;
            }
            let a = parseInt(listA[i]);
            if (listB.length <= i) {
                return 1
            }
            let b = parseInt(listB[i]);
            if (a == b) {
                continue;
            }
            return a > b ? 1 : -1;
        }
        return 0;
    }

    function printHelp():void {
        const newLine = "\n";
        let output = "";
        output += "Syntax:   depsync [platform] [options]" + newLine + newLine;
        output += "Examples: depsync --version" + newLine;
        output += "Examples: depsync mac" + newLine;
        output += "Examples: depsync mac --project /usr/local/test/" + newLine + newLine;
        output += "Options:" + newLine;
        CommandLine.optionDeclarations.forEach(option => {
            let name = "";
            if (option.shortName) {
                name += "-" + option.shortName + ", ";
            }
            name += "--" + option.name;
            name += makePadding(25 - name.length);
            output += name + option.description + newLine;
        });
        terminal.log(output);
    }

    function makePadding(paddingLength:number):string {
        return Array(paddingLength + 1).join(" ");
    }

}

Program.run(process.argv.slice(2));