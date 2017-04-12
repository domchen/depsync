var Utils;
(function (Utils) {
    var fs = require("fs");
    var path = require("path");
    var directorySeparator = "/";
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
    Utils.createDirectory = createDirectory;
    function deleteDirectory(path) {
        var files = [];
        if (fs.existsSync(path)) {
            files = fs.readdirSync(path);
            files.forEach(function (file) {
                var curPath = path + "/" + file;
                if (fs.statSync(curPath).isDirectory()) {
                    deleteDirectory(curPath);
                }
                else {
                    fs.unlinkSync(curPath);
                }
            });
            fs.rmdirSync(path);
        }
    }
    function deletePath(path) {
        try {
            if (fs.lstatSync(path).isDirectory()) {
                deleteDirectory(path);
            }
            else {
                fs.unlinkSync(path);
            }
        }
        catch (e) {
        }
    }
    Utils.deletePath = deletePath;
    function writeFileTo(filePath, content, overwrite, mode) {
        if (fs.existsSync(filePath)) {
            if (!overwrite) {
                return false;
            }
            var stat = fs.statSync(filePath);
            if (stat.isDirectory()) {
                return false;
            }
        }
        var folder = path.dirname(filePath);
        if (!fs.existsSync(folder)) {
            createDirectory(folder);
        }
        var fd;
        try {
            fd = fs.openSync(filePath, 'w', 438);
        }
        catch (e) {
            fs.chmodSync(filePath, 438);
            fd = fs.openSync(filePath, 'w', 438);
        }
        if (fd) {
            if (typeof content == "string") {
                fs.writeSync(fd, content, 0, 'utf8');
            }
            else {
                fs.writeSync(fd, content, 0, content.length, 0);
            }
            fs.closeSync(fd);
        }
        fs.chmodSync(filePath, mode || 438);
        return true;
    }
    Utils.writeFileTo = writeFileTo;
})(Utils || (Utils = {}));
var Config = (function () {
    function Config(configFileName) {
        var data;
        try {
            var fs = require("fs");
            var jsonText = fs.readFileSync(configFileName, "utf-8");
            data = JSON.parse(jsonText);
        }
        catch (e) {
            console.log("The DEPS config file is not a JSON file: " + configFileName);
            process.exit(1);
        }
        var path = require("path");
        var projectPath = path.dirname(configFileName);
        this.parse(data, projectPath);
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
    Config.prototype.parse = function (data, projectPath) {
        this.version = data.version ? data.version : "0.0.0";
        this.files = this.parseFiles(data.vars, data.files, projectPath);
        this.actions = this.parseActions(data.vars, data.actions, projectPath);
    };
    Config.prototype.parseFiles = function (vars, files, projectPath) {
        if (!files) {
            return [];
        }
        var path = require("path");
        var downloads = [];
        var platforms = Object.keys(files);
        for (var _i = 0, platforms_1 = platforms; _i < platforms_1.length; _i++) {
            var platform = platforms_1[_i];
            for (var _a = 0, _b = files[platform]; _a < _b.length; _a++) {
                var item = _b[_a];
                downloads.push(item);
                item.url = this.formatString(item.url, vars);
                item.dir = this.formatString(item.dir, vars);
                item.dir = path.resolve(projectPath, item.dir);
                var unzip = item.unzip;
                if (typeof unzip == "string") {
                    unzip = this.formatString(unzip, vars);
                    item.unzip = (unzip == "true");
                }
                else if (typeof unzip != "boolean") {
                    item.unzip = false;
                }
                item.platform = platform;
            }
        }
        return downloads;
    };
    Config.prototype.parseActions = function (vars, actions, projectPath) {
        if (!actions) {
            return [];
        }
        var path = require("path");
        var list = [];
        var platforms = Object.keys(actions);
        for (var _i = 0, platforms_2 = platforms; _i < platforms_2.length; _i++) {
            var platform = platforms_2[_i];
            for (var _a = 0, _b = actions[platform]; _a < _b.length; _a++) {
                var item = _b[_a];
                list.push(item);
                item.command = this.formatString(item.command, vars);
                item.dir = this.formatString(item.dir, vars);
                item.dir = path.resolve(projectPath, item.dir);
                item.platform = platform;
            }
        }
        return list;
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
var Cache;
(function (Cache) {
    var fs = require('fs');
    var path = require("path");
    var projectPath;
    var cacheConfigFile;
    function initCache(configFileName) {
        projectPath = path.dirname(configFileName);
        cacheConfigFile = path.join(projectPath, "DEPS.cache");
    }
    Cache.initCache = initCache;
    function clean(downloads) {
        var data = readCache();
        for (var i = data.downloads.length - 1; i >= 0; i--) {
            var item = data.downloads[i];
            var found = false;
            for (var _i = 0, downloads_1 = downloads; _i < downloads_1.length; _i++) {
                var downloadItem = downloads_1[_i];
                if (downloadItem.url == item.url) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                data.downloads.splice(i, 1);
            }
        }
        saveCache(data);
    }
    Cache.clean = clean;
    function isDownloaded(targetItem) {
        var data = readCache();
        var cachedItem;
        for (var _i = 0, _a = data.downloads; _i < _a.length; _i++) {
            var item = _a[_i];
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
            var index = 0;
            for (var _b = 0, _c = cachedItem.multipart; _b < _c.length; _b++) {
                var part = _c[_b];
                if (part != targetItem.multipart[index]) {
                    return false;
                }
                index++;
            }
            return true;
        }
        return (!cachedItem.multipart && !targetItem.multipart);
    }
    Cache.isDownloaded = isDownloaded;
    function finishDownload(targetItem) {
        var data = readCache();
        var index = 0;
        for (var _i = 0, _a = data.downloads; _i < _a.length; _i++) {
            var item = _a[_i];
            if (item.url == targetItem.url) {
                data.downloads.splice(index, 1);
                break;
            }
            index++;
        }
        var cachedItem = { "url": targetItem.url, "dir": path.relative(projectPath, targetItem.dir) };
        if (targetItem.unzip) {
            cachedItem.unzip = true;
        }
        if (targetItem.multipart) {
            cachedItem.multipart = targetItem.multipart.concat();
        }
        data.downloads.push(cachedItem);
        saveCache(data);
    }
    Cache.finishDownload = finishDownload;
    function readCache() {
        var data;
        try {
            var jsonText = fs.readFileSync(cacheConfigFile, "utf-8");
            data = JSON.parse(jsonText);
        }
        catch (e) {
            data = { downloads: [] };
        }
        return data;
    }
    var ignoreFileChecked = false;
    function saveCache(data) {
        try {
            Utils.writeFileTo(cacheConfigFile, JSON.stringify(data, null, "  "), true);
        }
        catch (e) {
        }
        if (!ignoreFileChecked) {
            ignoreFileChecked = true;
            checkIgnoreFile(path.resolve(projectPath, ".gitignore"));
            checkIgnoreFile(path.resolve(projectPath, ".npmignore"));
        }
    }
    function checkIgnoreFile(configFile) {
        if (fs.existsSync(configFile)) {
            try {
                var configText = fs.readFileSync(configFile, "utf-8");
                if (configText.indexOf("DEPS.cache") == -1) {
                    configText = configText.trim() + "\nDEPS.cache\n";
                    Utils.writeFileTo(configFile, configText, true);
                }
            }
            catch (e) {
            }
        }
    }
})(Cache || (Cache = {}));
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
    var readLine = require("readline");
    var AdmZip = require('adm-zip');
    var ProgressBar = require("progress");
    var terminal = require('terminal-kit').terminal;
    function downloadFiles(list, platform, callback) {
        if (!list) {
            list = [];
        }
        var files = [];
        for (var _i = 0, list_1 = list; _i < list_1.length; _i++) {
            var item = list_1[_i];
            if (item.platform == platform || item.platform == "common") {
                files.push(item);
            }
        }
        doDownloadFiles(files, callback);
    }
    Loader.downloadFiles = downloadFiles;
    function doDownloadFiles(list, callback) {
        if (list.length == 0) {
            callback && callback();
            return;
        }
        var item = list.shift();
        if (Cache.isDownloaded(item)) {
            doDownloadFiles(list, callback);
            return;
        }
        var fileName = item.url.split("?")[0];
        var filePath = path.resolve(item.dir, path.basename(fileName));
        Utils.deletePath(filePath);
        if (item.multipart) {
            var urls = [];
            for (var _i = 0, _a = item.multipart; _i < _a.length; _i++) {
                var tail = _a[_i];
                urls.push(item.url + tail);
            }
            loadMultiParts(urls, filePath, onFinish);
        }
        else {
            loadSingleFile(item.url, filePath, onFinish);
        }
        function onFinish(error) {
            if (error) {
                console.log("downloading... " + item.url);
                console.log("Cannot download file : " + error.message);
                process.exit(1);
                return;
            }
            if (item.unzip) {
                try {
                    terminal.saveCursor();
                    unzipFile(filePath, item.dir);
                    terminal.restoreCursor();
                    terminal.eraseDisplayBelow();
                }
                catch (e) {
                    console.log("Cannot unzip file: " + filePath);
                    process.exit(1);
                }
            }
            Cache.finishDownload(item);
            doDownloadFiles(list, callback);
        }
    }
    Loader.doDownloadFiles = doDownloadFiles;
    function getEntryName(entry) {
        var entryName = entry.entryName.toString();
        if (entryName.substr(0, 8) == "__MACOSX" || entryName.substr(entryName.length - 9, 9) == ".DS_Store") {
            return "";
        }
        return entryName;
    }
    function unzipFile(filePath, dir) {
        console.log("unzipping... " + filePath);
        var zip = new AdmZip(filePath);
        var entries = zip.getEntries();
        var rootNames = [];
        for (var _i = 0, entries_1 = entries; _i < entries_1.length; _i++) {
            var entry = entries_1[_i];
            var entryName = getEntryName(entry);
            if (!entryName) {
                continue;
            }
            var name_1 = entryName.split("\\").join("/").split("/")[0];
            if (rootNames.indexOf(name_1) == -1) {
                rootNames.push(name_1);
            }
        }
        for (var _a = 0, rootNames_1 = rootNames; _a < rootNames_1.length; _a++) {
            var name_2 = rootNames_1[_a];
            var targetPath = path.resolve(dir, name_2);
            Utils.deletePath(targetPath);
        }
        for (var _b = 0, entries_2 = entries; _b < entries_2.length; _b++) {
            var entry = entries_2[_b];
            var entryName = getEntryName(entry);
            if (!entryName) {
                continue;
            }
            var targetPath = path.resolve(dir, entryName);
            if (entry.isDirectory) {
                Utils.createDirectory(targetPath);
                continue;
            }
            var content = entry.getData();
            if (!content) {
                throw new Error("Cannot unzip file:" + filePath);
            }
            Utils.writeFileTo(targetPath, content, true);
        }
        Utils.deletePath(filePath);
    }
    function loadMultiParts(urls, filePath, callback) {
        if (urls.length == 0) {
            callback && callback();
            return;
        }
        var url = urls.shift();
        loadSingleFile(url, filePath, function (error) {
            if (error) {
                callback && callback(error);
                return;
            }
            loadMultiParts(urls, filePath, callback);
        }, { flags: 'a' });
    }
    function loadSingleFile(url, filePath, callback, options) {
        var retryTimes = 0;
        terminal.saveCursor();
        console.log("downloading... " + url);
        loadSingleFileWithTimeOut(url, filePath, onFinish, options);
        function onFinish(error) {
            terminal.restoreCursor();
            terminal.eraseDisplayBelow();
            if (error && error.message == "timeout" && retryTimes < 3) {
                retryTimes++;
                terminal.saveCursor();
                console.log("download retry " + retryTimes + "... " + url);
                loadSingleFileWithTimeOut(url, filePath, onFinish, options);
            }
            else {
                callback(error);
            }
        }
    }
    function loadSingleFileWithTimeOut(url, filePath, callback, options) {
        var httpClient = url.slice(0, 5) === 'https' ? https : http;
        try {
            Utils.createDirectory(path.dirname(filePath));
        }
        catch (e) {
            console.log("Cannot create directory: " + path.dirname(filePath));
            process.exit(1);
        }
        var file = fs.createWriteStream(filePath, options);
        var outputError;
        file.on("close", function () {
            callback && callback(outputError);
        });
        var request = httpClient.get(url, function (response) {
            if (response.statusCode >= 400 || response.statusCode == 0) {
                file.close();
                outputError = new Error(response.statusMessage);
                return;
            }
            var length = parseInt(response.headers['content-length'], 10);
            var bar = new ProgressBar(':bar [ :percent | :current/:total | :etas ] ', {
                complete: '█',
                incomplete: '░',
                width: 80,
                total: length
            });
            response.on('data', function (chunk) {
                file.write(chunk);
                bar.tick(chunk.length);
            });
            response.on('end', function () {
                file.end();
            });
            response.on('error', function (error) {
                file.close();
                outputError = error;
            });
            request.setTimeout(15000, function () {
                request.abort();
                file.close();
                outputError = new Error("timeout");
            });
        });
    }
})(Loader || (Loader = {}));
var Action;
(function (Action) {
    var childProcess = require('child_process');
    var terminal = require('terminal-kit').terminal;
    function executeActions(list, platform, callback) {
        if (!list) {
            list = [];
        }
        var actions = [];
        for (var _i = 0, list_2 = list; _i < list_2.length; _i++) {
            var item = list_2[_i];
            if (item.platform == platform || item.platform == "common") {
                actions.push(item);
            }
        }
        doExecuteActions(actions, callback);
    }
    Action.executeActions = executeActions;
    function doExecuteActions(list, callback) {
        if (list.length == 0) {
            callback && callback();
            return;
        }
        var item = list.shift();
        terminal.saveCursor();
        console.log("executing... " + item.command);
        childProcess.exec(item.command, { cwd: item.dir }, onFinish);
        function onFinish(error, stdout, stderr) {
            if (error) {
                console.log(error.message);
                process.exit(1);
            }
            terminal.restoreCursor();
            terminal.eraseDisplayBelow();
            doExecuteActions(list, callback);
        }
    }
})(Action || (Action = {}));
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
    var VERSION = "1.0.4";
    function run(args) {
        var commandOptions = CommandLine.parse(args);
        if (commandOptions.errors.length > 0) {
            console.log(commandOptions.errors.join("\n") + "\n");
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
                return;
            }
        }
        var config = new Config(configFileName);
        if (compareVersion(VERSION, config.version) < 0) {
            console.log("DEPS file requires version: " + config.version);
            console.log("The current depsync version: " + VERSION);
            console.log("Please update the depsync tool and then try again.");
            process.exit(1);
        }
        Cache.initCache(configFileName);
        Loader.downloadFiles(config.files, commandOptions.platform, function () {
            Action.executeActions(config.actions, commandOptions.platform, function () {
                Cache.clean(config.files);
            });
        });
    }
    Program.run = run;
    function printVersion() {
        console.log("Version " + VERSION + "\n");
    }
    function compareVersion(versionA, versionB) {
        if (versionA == versionB) {
            return 0;
        }
        var listA = versionA.split(".");
        var listB = versionB.split(".");
        var length = Math.max(listA.length, listB.length);
        for (var i = 0; i < length; i++) {
            if (listA.length <= i) {
                return -1;
            }
            var a = parseInt(listA[i]);
            if (listB.length <= i) {
                return 1;
            }
            var b = parseInt(listB[i]);
            if (a == b) {
                continue;
            }
            return a > b ? 1 : -1;
        }
        return 0;
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
