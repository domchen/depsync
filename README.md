<p align="left">
  <a href="https://travis-ci.org/domchen/depsync"><img src="https://img.shields.io/travis/domchen/depsync/master.svg" alt="Build Status"></a>
  <a href="https://www.npmjs.com/package/depsync"><img src="https://img.shields.io/npm/v/depsync.svg" alt="Version"></a>
  <a href="https://github.com/domchen/depsync/blob/master/LICENSE"><img src="https://img.shields.io/npm/l/depsync.svg" alt="License"></a>
  <a href="https://github.com/Microsoft/Typescript"><img src="https://img.shields.io/badge/code-TypeScript-blue.svg" alt="TypeScript"></a>
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

If you don't pass any platform parameter, it will automatically choose the host platform as the target platform. So that the result of running `depsync` in macOS is the same as running `depsync mac`.

The available platform names are defined in the DEPS file, you can also define any other platform names as you want, such as `ios`, `android`, `linux`... but only the `mac` and `win` can be automatically chosen.

Here is an example of DEPS file:

```
{
  "vars": {
    "SKIA_ROOT": "https://raw.githubusercontent.com/domchen/libskia/release",
    "V8_ROOT": "https://raw.githubusercontent.com/domchen/libv8/release"
  },
  "files": {
    "common": [
      {
        "url": "${SKIA_ROOT}/m58/include.zip",
        "dir": "third_party/skia",
        "unzip": true
      },
      {
        "url": "${V8_ROOT}/5.7.492/include.zip",
        "dir": "third_party/v8",
        "unzip": "true"
      }
    ],
    "mac": [
      {
        "url": "${SKIA_ROOT}/m58/darwin-x64.zip",
        "dir": "third_party/skia",
        "unzip": true
      },
      {
        "url": "${V8_ROOT}/5.7.492/darwin-x64.zip",
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
        "url": "${SKIA_ROOT}/m58/win-ia32.zip",
        "dir": "third_party/skia",
        "unzip": true
      },
      {
        "url": "${V8_ROOT}/5.7.492/win-ia32.zip",
        "dir": "third_party/v8",
        "unzip": true
      }
    ]
  }
}
```
