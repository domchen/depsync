<p align="left">
  <a href="https://www.npmjs.com/package/depsync"><img src="https://img.shields.io/npm/v/depsync.svg" alt="Version"></a>
  <a href="https://github.com/domchen/depsync/blob/master/LICENSE"><img src="https://img.shields.io/npm/l/depsync.svg" alt="License"></a>
</p>

# Introduction

Depsync is a command line tool for automatically synchronizing the dependencies of a project by the DEPS configuration file.


# Installation

`npm install depsync -g`


## Usage

Run the following command in the directory with a DEPS file:
```
depsync [platform]
```
For example, if you want to synchronize the mac platform, run:

```
depsync mac
```

If you don't pass any platform parameter, it will automatically choose the host platform as the target platform. So the result of running `depsync` in macOS is the same to running `depsync mac`.

The available platform names are defined in the DEPS file, you can also define any other platform names as you want, such as `ios`, `android`... but only the `mac`, `win` and `linux` can be automatically chosen.

Here is an example of DEPS file:

```json
{
  "version": "1.0.7",
  "vars": {
    "SKIA_ROOT": "https://github.com/domchen/depsync/releases/download/1.0.1",
    "V8_ROOT": "https://github.com/domchen/depsync/releases/download/1.0.2"
  },
  "files": {
    "common": [
      {
        "url": "${SKIA_ROOT}/include.zip",
        "dir": "third_party/skia",
        "unzip": true
      },
      {
        "url": "${V8_ROOT}/include.zip",
        "dir": "third_party/v8",
        "unzip": "true"
      }
    ],
    "mac": [
      {
        "url": "${SKIA_ROOT}/darwin-x64.zip",
        "dir": "third_party/skia",
        "unzip": true
      },
      {
        "url": "${V8_ROOT}/darwin-x64.zip",
        "multipart": [
          ".001",
          ".002",
          ".003"
        ],
        "dir": "third_party/v8",
        "unzip": true
      }
    ],
    "win": [
      {
        "url": "${SKIA_ROOT}/win-ia32.zip",
        "dir": "third_party/skia",
        "unzip": true
      },
      {
        "url": "${V8_ROOT}/win-ia32.zip",
        "dir": "third_party/v8",
        "unzip": true
      }
    ]
  },
  "actions": {
    "common": [
      {
        "command": "npm install tspack",
        "dir": "./"
      },
      {
        "command": "node node_modules/tspack/bin/tspack --v",
        "dir": "./"
      }
    ]
  }
}
```
