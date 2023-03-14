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

const os = require("os");

const optionDeclarations = [
    {
        name: "help",
        shortName: "h",
        type: "boolean",
        description: "Print help message."
    },
    {
        name: "project",
        shortName: "p",
        type: "string",
        description: "Synchronize the project in the given directory."
    },
    {
        name: "clean",
        shortName: "c",
        type: "boolean",
        description: "Clean the repos and files of current directory that do not exist in the DEPS file."
    },
    {
        name: "non-recursive",
        shortName: "",
        type: "boolean",
        description: "Skip synchronizing the sub-projects."
    },
    {
        name: "version",
        shortName: "v",
        type: "boolean",
        description: "Print depsync’s version."
    }
];

let optionNameMapCache;

function getOptionNameMap() {
    if (optionNameMapCache) {
        return optionNameMapCache;
    }
    let optionNameMap = {};
    let shortOptionNames = {};
    optionDeclarations.forEach(function (option) {
        optionNameMap[option.name.toLowerCase()] = option;
        if (option.shortName) {
            shortOptionNames[option.shortName] = option.name;
        }
    });
    optionNameMapCache = {optionNameMap: optionNameMap, shortOptionNames: shortOptionNames};
    return optionNameMapCache;
}

function parse(args) {
    let options = {};
    options.errors = [];
    let _a = getOptionNameMap(), optionNameMap = _a.optionNameMap, shortOptionNames = _a.shortOptionNames;
    let i = 0;
    while (i < args.length) {
        let s = args[i];
        i++;
        if (s.charAt(0) === "-") {
            s = s.slice(s.charAt(1) === "-" ? 2 : 1).toLowerCase();
            if (s in shortOptionNames) {
                s = shortOptionNames[s];
            }
            if (s in optionNameMap) {
                let opt = optionNameMap[s];
                if (!args[i] && opt.type !== "boolean") {
                    options.errors.push("Option '" + opt.name + "' expects an argument.");
                }
                switch (opt.type) {
                    case "number":
                        options[opt.name] = parseInt(args[i]);
                        i++;
                        break;
                    case "boolean":
                        options[opt.name] = true;
                        break;
                    case "string":
                        options[opt.name] = args[i] || "";
                        i++;
                        break;
                }
            } else {
                options.errors.push("Unknown option '" + s + "'.");
            }
        } else {
            options.platform = s;
        }
    }
    if (!options.platform) {
        let p = os.platform();
        if (p === "darwin") {
            options.platform = "mac";
        } else if (p === "win32") {
            options.platform = "win";
        } else if (p === "linux") {
            options.platform = "linux";
        }
    }
    return options;
}

exports.optionDeclarations = optionDeclarations;
exports.parse = parse;