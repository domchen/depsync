var Utils;
(function (Utils) {
    function getRootLength(path) {
        if (path.charAt(0) == "/") {
            if (path.charAt(1) != "/")
                return 1;
            var p1 = path.indexOf("/", 2);
            if (p1 < 0)
                return 2;
            var p2 = path.indexOf("/", p1 + 1);
            if (p2 < 0)
                return p1 + 1;
            return p2 + 1;
        }
        if (path.charAt(1) == ":") {
            if (path.charAt(2) == "/")
                return 3;
            return 2;
        }
        if (path.lastIndexOf("file:///", 0) === 0) {
            return "file:///".length;
        }
        var idx = path.indexOf("://");
        if (idx !== -1) {
            return idx + "://".length;
        }
        return 0;
    }
    var directorySeparator = "/";
    function joinPath(path1, path2) {
        if (!(path1 && path1.length))
            return path2;
        if (!(path2 && path2.length))
            return path1;
        path1 = path1.split("\\").join(directorySeparator);
        path2 = path2.split("\\").join(directorySeparator);
        if (getRootLength(path2) !== 0)
            return path2;
        if (path1.charAt(path1.length - 1) === directorySeparator)
            return path1 + path2;
        return path1 + directorySeparator + path2;
    }
    Utils.joinPath = joinPath;
})(Utils || (Utils = {}));
var CommandLine;
(function (CommandLine) {
    CommandLine.optionDeclarations = [
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
    var optionNameMapCache;
    function getOptionNameMap() {
        if (optionNameMapCache) {
            return optionNameMapCache;
        }
        var optionNameMap = {};
        var shortOptionNames = {};
        CommandLine.optionDeclarations.forEach(function (option) {
            optionNameMap[option.name.toLowerCase()] = option;
            if (option.shortName) {
                shortOptionNames[option.shortName] = option.name;
            }
        });
        optionNameMapCache = { optionNameMap: optionNameMap, shortOptionNames: shortOptionNames };
        return optionNameMapCache;
    }
    function parse(args) {
        var options = {};
        options.errors = [];
        var _a = getOptionNameMap(), optionNameMap = _a.optionNameMap, shortOptionNames = _a.shortOptionNames;
        var i = 0;
        while (i < args.length) {
            var s = args[i];
            i++;
            if (s.charAt(0) == "-") {
                s = s.slice(s.charAt(1) == "-" ? 2 : 1).toLowerCase();
                if (s in shortOptionNames) {
                    s = shortOptionNames[s];
                }
                if (s in optionNameMap) {
                    var opt = optionNameMap[s];
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
            }
        }
        return options;
    }
    CommandLine.parse = parse;
})(CommandLine || (CommandLine = {}));
var Config;
(function (Config) {
    var fs = require("fs");
    var path = require("path");
    function findConfigFile(searchPath) {
        while (true) {
            var fileName = Utils.joinPath(searchPath, "tspack.json");
            if (fs.existsSync(fileName)) {
                return fileName;
            }
            fileName = Utils.joinPath(searchPath, "tsconfig.json");
            if (fs.existsSync(fileName)) {
                return fileName;
            }
            var parentPath = path.dirname(searchPath);
            if (parentPath === searchPath) {
                break;
            }
            searchPath = parentPath;
        }
        return "";
    }
    Config.findConfigFile = findConfigFile;
})(Config || (Config = {}));
var fs = require("fs");
var version = "0.0.3";
function run(args) {
    var commandOptions = CommandLine.parse(args);
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
    var configFileName = "";
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
        var searchPath = process.cwd();
        configFileName = Config.findConfigFile(searchPath);
        if (!configFileName) {
            printVersion();
            printHelp();
            process.exit(0);
        }
    }
}
function printVersion() {
    console.log("Version " + version + "\n");
}
function printHelp() {
    var newLine = "\n";
    var output = "";
    output += "Syntax:   depsync [options]" + newLine + newLine;
    output += "Examples: depsync --version" + newLine;
    output += "Examples: depsync mac" + newLine;
    output += "Examples: depsync mac --project /usr/local/test/" + newLine + newLine;
    output += "Options:" + newLine;
    CommandLine.optionDeclarations.forEach(function (option) {
        var name = "";
        if (option.shortName) {
            name += "-" + option.shortName + ", ";
        }
        name += "--" + option.name;
        name += makePadding(25 - name.length);
        output += name + option.description + newLine;
    });
    console.log(output);
}
function makePadding(paddingLength) {
    return Array(paddingLength + 1).join(" ");
}
run(process.argv.slice(1));
