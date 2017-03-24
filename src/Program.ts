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

let fs = require("fs");

const version = "0.0.3";

function run(args:string[]):void {
    let commandOptions = CommandLine.parse(args);
    if (commandOptions.errors.length > 0) {
        console.log(commandOptions.errors.join("\n") + "\n");
        process.exit(1);
        return;
    }

    if (commandOptions.version) {
        printVersion();
        process.exit(0);
    }

    if (commandOptions.help) {
        printVersion();
        printHelp();
        process.exit(0);
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
            console.log("Cannot find a DEPS file at the specified directory: " + commandOptions.project + "\n");
            process.exit(1);
        }
    }
    else {
        let searchPath = process.cwd();
        configFileName = Config.findConfigFile(searchPath);
        if (!configFileName) {
            printVersion();
            printHelp();
            process.exit(0);
        }
    }

    // let result = Config.parseOptionsFromFile(configFileName);
    // if (result.errors.length > 0) {
    //     console.log(result.errors.join("\n")+"\n");
    //     process.exit(1);
    // }

}

function printVersion():void {
    console.log("Version " + version + "\n");
}

function printHelp():void {
    const newLine = "\n";
    let output = "";
    output += "Syntax:   depsync [options]" + newLine + newLine;
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
    console.log(output);
}

function makePadding(paddingLength:number):string {
    return Array(paddingLength + 1).join(" ");
}

run(process.argv.slice(1));