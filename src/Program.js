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

const fs = require("fs");
const Utils = require('./Utils');
const CommandLine = require('./CommandLine');
const Config = require('./Config');
const CleanTask = require('./tasks/CleanTask');
const DepsTask = require('./tasks/DepsTask');
const {version} = require('../package.json');
const path = require("path");

function printVersion() {
    Utils.log("Version", version);
}

function printHelp() {
    let newLine = "\n";
    let output = "";
    output += "Syntax:   depsync [platform] [options]" + newLine + newLine;
    output += "Examples: depsync --version" + newLine;
    output += "Examples: depsync mac" + newLine;
    output += "Examples: depsync mac --project /usr/local/test/" + newLine + newLine;
    output += "Options:" + newLine;
    CommandLine.optionDeclarations.forEach(function (option) {
        let name = "";
        if (option.shortName) {
            name += "-" + option.shortName + ", ";
        }
        name += "--" + option.name;
        name += makePadding(25 - name.length);
        output += name + option.description + newLine;
    });
    Utils.log(output);
}

function makePadding(paddingLength) {
    return Array(paddingLength + 1).join(" ");
}


function run(args) {
    let commandOptions = CommandLine.parse(args);
    if (commandOptions.errors.length > 0) {
        Utils.error(commandOptions.errors.join("\n") + "\n");
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
    let configFileName = "";
    if (commandOptions.project) {
        configFileName = path.join(commandOptions.project, "DEPS");
        if (!fs.existsSync(configFileName)) {
            Utils.error("Cannot find a DEPS file at the specified directory: " + commandOptions.project + "\n");
            process.exit(1);
        }
    } else {
        let searchPath = process.cwd();
        configFileName = Config.findConfigFile(searchPath);
        if (!configFileName) {
            printVersion();
            printHelp();
            return;
        }
    }
    if (commandOptions.clean) {
        let task = new CleanTask(configFileName, version);
        task.run(() => {
            process.exit(0);
        });
    } else {
        let task = new DepsTask(configFileName, version, commandOptions.platform, commandOptions["non-recursive"]);
        task.run(() => {
            process.exit(0);
        });
    }
}

exports.run = run;