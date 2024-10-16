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

const fs = require('fs');
const http = require('follow-redirects').http;
const https = require('follow-redirects').https;
const path = require("path");
const AdmZip = require('adm-zip');
const ProgressBar = require("progress");
const Utils = require('../Utils');
const Compress = require('compressjs');


function getEntryName(entry) {
    let entryName = entry.entryName.toString();
    if (entryName.substr(0, 8) === "__MACOSX" || entryName.substr(entryName.length - 9, 9) === ".DS_Store") {
        return "";
    }
    return entryName;
}

function parseTar(buffer, outputDir) {
    let offset = 0;
    const BLOCK_SIZE = 512;

    let topLevelDir = null;
    let isFirstFile = true;

    while (offset < buffer.length) {
        const header = buffer.slice(offset, offset + BLOCK_SIZE);
        offset += BLOCK_SIZE;

        // Check if it's an empty block, two consecutive empty blocks indicate the end
        const isEnd = header.every(byte => byte === 0);
        if (isEnd) break;

        // Parse file name
        let fileName = '';
        for (let i = 0; i < 100; i++) {
            if (header[i] === 0) break;
            fileName += String.fromCharCode(header[i]);
        }

        // Parse file size (Octal)
        let sizeOctal = '';
        for (let i = 124; i < 124 + 12; i++) {
            if (header[i] === 0) break;
            sizeOctal += String.fromCharCode(header[i]);
        }
        const fileSize = parseInt(sizeOctal.trim(), 8);

        // Parse file type
        const typeFlag = String.fromCharCode(header[156]);

        // Ignore non-regular files
        if (typeFlag !== '0' && typeFlag !== '\0') {
            // Skip the data part of the file
            offset += Math.ceil(fileSize / BLOCK_SIZE) * BLOCK_SIZE;
            continue;
        }

        // Extract file data
        const fileData = buffer.slice(offset, offset + fileSize);
        offset += Math.ceil(fileSize / BLOCK_SIZE) * BLOCK_SIZE;

        // Handle file path, remove top-level directory
        if (isFirstFile) {
            const parts = fileName.split('/');
            if (parts.length > 1) {
                topLevelDir = parts[0];
            }
            isFirstFile = false;
        }

        let relativePath = fileName;
        if (topLevelDir) {
            const prefix = `${topLevelDir}/`;
            if (fileName.startsWith(prefix)) {
                relativePath = fileName.slice(prefix.length);
            }
        }

        // If the relative path is empty (i.e., the top-level directory itself), skip it
        if (!relativePath) continue;

        // Create directory structure
        const fullPath = path.join(outputDir, relativePath);
        const dirName = path.dirname(fullPath);
        if (!fs.existsSync(dirName)) {
            fs.mkdirSync(dirName, { recursive: true });
        }

        // Write file
        fs.writeFileSync(fullPath, fileData);
        console.log(`Extracted file: ${fullPath}`);
    }
}

// Main decompression function
function decompressTarBz2Sync(inputPath, outputDir) {
    // Read .tar.bz2 file
    const compressedData = fs.readFileSync(inputPath);
    // Decompress Bzip2
    const decompressedData = Compress.Bzip2.decompressFile(compressedData);
    // Convert decompressed data to Buffer
    const tarBuffer = Buffer.from(decompressedData);
    // Parse and extract TAR
    parseTar(tarBuffer, outputDir);
    // Delete original file
    Utils.deletePath(inputPath);
}


function unzipFile(filePath, dir) {
    Utils.log("Unzipping: " + filePath);

    // Handle bz2 files separately
    if (filePath.endsWith('.tar.bz2')) {
        decompressTarBz2Sync(filePath, dir);
        return;
    }
    let zip = new AdmZip(filePath);
    let entries = zip.getEntries();
    let rootNames = [];
    for (let entry of entries) {
        let entryName = getEntryName(entry);
        if (!entryName) {
            continue;
        }
        let name = entryName.split("\\").join("/").split("/")[0];
        if (rootNames.indexOf(name) === -1) {
            rootNames.push(name);
        }
    }
    for (let name of rootNames) {
        let targetPath = path.resolve(dir, name);
        Utils.deletePath(targetPath);
    }
    for (let entry of entries) {
        let entryName = getEntryName(entry);
        if (!entryName) {
            continue;
        }
        let targetPath = path.resolve(dir, entryName);
        if (entry.isDirectory) {
            Utils.createDirectory(targetPath);
            continue;
        }
        let content = entry.getData();
        if (!content) {
            throw new Error("Cannot unzip file:" + filePath);
        }
        Utils.writeFile(targetPath, content);
    }
    Utils.deletePath(filePath);
}

function loadMultiParts(urls, filePath, timeout, callback) {
    if (urls.length === 0) {
        callback && callback();
        return;
    }
    let url = urls.shift();
    loadSingleFile(url, filePath, timeout, function (error) {
        if (error) {
            callback && callback(error);
            return;
        }
        loadMultiParts(urls, filePath, timeout, callback);
    }, {flags: 'a'});
}

function loadSingleFile(url, filePath, timeout, callback, options) {
    let retryTimes = 0;
    Utils.log("Downloading: " + url);
    loadSingleFileWithTimeOut(url, filePath, timeout, onFinish, options);

    function onFinish(error) {
        if (error && error.message === "timeout" && retryTimes < 3) {
            retryTimes++;
            Utils.log("Downloading retry " + retryTimes + ": " + url);
            loadSingleFileWithTimeOut(url, filePath, timeout, onFinish, options);
        } else {
            callback(error);
        }
    }
}

function loadSingleFileWithTimeOut(url, filePath, timeout, callback, options) {
    let httpClient = url.slice(0, 5) === 'https' ? https : http;
    try {
        Utils.createDirectory(path.dirname(filePath));
    } catch (e) {
        Utils.error("Cannot create directory: " + path.dirname(filePath));
        process.exit(1);
    }
    let file = fs.createWriteStream(filePath, options);
    let outputError;
    let hasProgressBar = false;
    file.on("close", function () {
        callback && callback(outputError);
    });
    let request = httpClient.get(url, function (response) {
        if (response.statusCode >= 400 || response.statusCode === 0) {
            file.close();
            outputError = new Error(response.statusMessage);
            return;
        }
        let length = parseInt(response.headers['content-length'], 10);
        let complete = process.platform === "win32" ? "#" : '█';
        let incomplete = process.platform === "win32" ? "=" : '░';
        let bar = new ProgressBar(':bar [ :percent | :current/:total | :etas ] ', {
            complete: complete,
            incomplete: incomplete,
            width: 80,
            total: length,
            clear: true
        });
        hasProgressBar = true;
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
        request.setTimeout(timeout, function () {
            request.abort();
            file.close();
            outputError = new Error("timeout");
        });
    });
}

function FileTask(item) {
    this.item = item;
}

function writeHash(item) {
    if (!item || !item.hashFile || !item.hash) {
        return;
    }
    Utils.writeFile(item.hashFile, item.hash);
}

FileTask.prototype.run = function (callback) {
    let item = this.item;
    let fileName = item.url.split("?")[0];
    fileName = path.basename(fileName);
    Utils.log("【depsync】downloading file: " + fileName);
    let filePath = path.resolve(item.dir, fileName);
    Utils.deletePath(filePath);
    if (item.multipart) {
        let urls = [];
        for (let tail of item.multipart) {
            urls.push(item.url + tail);
        }
        loadMultiParts(urls, filePath, item.timeout, onFinish);
    } else {
        loadSingleFile(item.url, filePath, item.timeout, onFinish);
    }

    function onFinish(error) {
        if (error) {
            Utils.error("Cannot download file : " + error.message);
            process.exit(1);
            return;
        }
        if (item.unzip) {
            try {
                unzipFile(filePath, item.dir);
            } catch (e) {
                Utils.error("Cannot unzip file: " +  filePath);
                console.error(e);
                process.exit(1);
            }
        }
        writeHash(item);
        callback && callback();
    }
};

module.exports = FileTask;
