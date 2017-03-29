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
var __reflect = (this && this.__reflect) || function (p, c, t) {
    p.__class__ = c, t ? t.push(c) : t = [c], p.__types__ = p.__types__ ? t.concat(p.__types__) : t;
};
var Config = (function () {
    function Config(data, projectPath, platform) {
        this.parse(data, projectPath, platform);
    }
    Config.findConfigFile = function (searchPath) {
        var fs = require("fs");
        var path = require("path");
        while (true) {
            var fileName = Utils.joinPath(searchPath, "DEPS");
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
    };
    Config.prototype.parse = function (data, projectPath, platform) {
        var path = require("path");
        var files = data.files;
        var downloads = [];
        if (files.common) {
            for (var _i = 0, _a = files.common; _i < _a.length; _i++) {
                var item = _a[_i];
                downloads.push(item);
            }
        }
        if (files[platform]) {
            for (var _b = 0, _c = files[platform]; _b < _c.length; _b++) {
                var item = _c[_b];
                downloads.push(item);
            }
        }
        for (var _d = 0, downloads_1 = downloads; _d < downloads_1.length; _d++) {
            var item = downloads_1[_d];
            item.url = this.formatString(item.url, data.vars);
            item.dir = this.formatString(item.dir, data.vars);
            var fileName = item.url.split("?")[0];
            item.dir = path.join(projectPath, item.dir, path.basename(fileName));
            if (item.unzip) {
                item.unzip = this.formatString(item.unzip, data.vars);
            }
        }
        this.downloads = downloads;
    };
    Config.prototype.formatString = function (text, vars) {
        var index = text.indexOf("${");
        while (index != -1) {
            var prefix = text.substring(0, index);
            text = text.substring(index);
            index = text.indexOf("}");
            if (index == -1) {
                text = prefix + text;
                break;
            }
            var key = text.substring(2, index);
            text = text.substring(index + 1);
            var value = vars[key] ? vars[key] : "${" + key + "}";
            text = prefix + value + text;
            index = text.indexOf("${");
        }
        return text;
    };
    return Config;
}());
__reflect(Config.prototype, "Config");
var CommandLine;
(function (CommandLine) {
    var os = require("os");
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
            else {
                options.platform = s;
            }
        }
        if (!options.platform) {
            var p = os.platform();
            if (p == "darwin") {
                options.platform = "mac";
            }
            else if (p == "win32") {
                options.platform = "win";
            }
        }
        return options;
    }
    CommandLine.parse = parse;
})(CommandLine || (CommandLine = {}));
var Loader;
(function (Loader) {
    var fs = require('fs');
    var http = require('follow-redirects').http;
    var https = require('follow-redirects').https;
    var path = require("path");
    function downloadFiles(list) {
        function next() {
            if (list.length == 0) {
                return;
            }
            var item = list.shift();
            console.log("downloading...", item.url, " to ", item.dir);
            download(item.url, item.dir, function () {
                next();
            });
        }
        next();
    }
    Loader.downloadFiles = downloadFiles;
    function download(url, filePath, callback) {
        var httpClient = url.slice(0, 5) === 'https' ? https : http;
        try {
            createDirectory(path.dirname(filePath));
        }
        catch (e) {
            console.log("Cannot create directory: " + path.dirname(filePath));
            process.exit(1);
        }
        var writer = fs.createWriteStream(filePath);
        writer.on('finish', function () {
            callback && callback();
        });
        httpClient.get(url, function (response) {
            response.pipe(writer);
        });
    }
    function createDirectory(filePath, mode) {
        if (mode === undefined) {
            mode = 511 & (~process.umask());
        }
        filePath = path.resolve(filePath);
        try {
            fs.mkdirSync(filePath, mode);
        }
        catch (err0) {
            switch (err0.code) {
                case 'ENOENT':
                    createDirectory(path.dirname(filePath), mode);
                    createDirectory(filePath, mode);
                    break;
                default:
                    var stat = void 0;
                    try {
                        stat = fs.statSync(filePath);
                    }
                    catch (err1) {
                        throw err0;
                    }
                    if (!stat.isDirectory()) {
                        throw err0;
                    }
                    break;
            }
        }
    }
})(Loader || (Loader = {}));
function createMap() {
    var map = Object.create(null);
    map["__"] = undefined;
    delete map["__"];
    return map;
}
var Program;
(function (Program) {
    var fs = require("fs");
    var path = require("path");
    var CHARSET = "utf-8";
    var VERSION = "0.0.3";
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
        var data;
        try {
            var jsonText = fs.readFileSync(configFileName, CHARSET);
            data = JSON.parse(jsonText);
        }
        catch (e) {
            console.log("The DEPS config file is not a JSON file: " + configFileName);
            process.exit(0);
        }
        var projectPath = path.dirname(configFileName);
        var config = new Config(data, projectPath, commandOptions.platform);
        Loader.downloadFiles(config.downloads);
    }
    Program.run = run;
    function printVersion() {
        console.log("Version " + VERSION + "\n");
    }
    function printHelp() {
        var newLine = "\n";
        var output = "";
        output += "Syntax:   depsync [platform] [options]" + newLine + newLine;
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
})(Program || (Program = {}));
Program.run(process.argv.slice(2));
