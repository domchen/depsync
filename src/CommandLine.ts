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


namespace CommandLine {
    let os = require("os");

    export interface OptionDeclaration {
        name:string;
        type:string;
        shortName?:string;
        description?:string;
    }

    export const optionDeclarations:OptionDeclaration[] = [
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
            description: "Synchronize the project in the given directory.."
        },
        {
            name: "version",
            shortName: "v",
            type: "boolean",
            description: "Print depsync’s version."
        }
    ];

    export interface CommandLineOption {
        help?:boolean;
        platform?:string;
        project?:string;
        version?:boolean;
        errors?:string[]
    }

    interface OptionNameMap {
        optionNameMap:Map<OptionDeclaration>;
        shortOptionNames:Map<string>;
    }

    let optionNameMapCache:OptionNameMap;

    function getOptionNameMap():OptionNameMap {
        if (optionNameMapCache) {
            return optionNameMapCache;
        }

        const optionNameMap:Map<OptionDeclaration> = {};
        const shortOptionNames:Map<string> = {};
        optionDeclarations.forEach(option => {
            optionNameMap[option.name.toLowerCase()] = option;
            if (option.shortName) {
                shortOptionNames[option.shortName] = option.name;
            }
        });
        optionNameMapCache = {optionNameMap, shortOptionNames};
        return optionNameMapCache;
    }

    export function parse(args:string[]):CommandLineOption {
        const options:CommandLineOption = {};
        options.errors = [];
        const {optionNameMap, shortOptionNames} = getOptionNameMap();
        let i = 0;
        while (i < args.length) {
            let s = args[i];
            i++;
            if (s.charAt(0) == "-") {
                s = s.slice(s.charAt(1) == "-" ? 2 : 1).toLowerCase();
                if (s in shortOptionNames) {
                    s = shortOptionNames[s];
                }

                if (s in optionNameMap) {
                    const opt = optionNameMap[s];
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
                }
                else {
                    options.errors.push("Unknown option '" + s + "'.");
                }
            } else {
                options.platform = s;
            }
        }
        if (!options.platform) {
            let p = os.platform();
            if (p == "darwin") {
                options.platform = "mac";
            } else if (p == "win32") {
                options.platform = "win";
            }
        }

        return options;
    }
}