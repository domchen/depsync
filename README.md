
[![npm version](https://badge.fury.io/js/depsync.svg)](https://badge.fury.io/js/depsync) 
[![TypeScript](https://badges.frapsoft.com/typescript/love/typescript.svg?v=101)](https://github.com/ellerbrock/typescript-badges/)
[![MIT Licence](https://badges.frapsoft.com/os/mit/mit.svg?v=103)](https://opensource.org/licenses/mit-license.php)   


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
    "SKIA_ROOT": "https://github.com/domchen/libskia/releases/download",
    "V8_ROOT": "https://github.com/domchen/libv8/releases/download"
  },
  "files": {
    "common": [
      {
        "url": "${SKIA_ROOT}/m58/skia-include.zip",
        "dir": "third_party/skia",
        "unzip": "true"
      },
      {
        "url": "${V8_ROOT}/5.7.492/v8-include.zip",
        "dir": "third_party/skia",
        "unzip": "true"
      }
    ],
    "mac": [
      {
        "url": "${SKIA_ROOT}/m58/skia-darwin-x64.zip",
        "dir": "third_party/skia",
        "unzip": "true"
      },
      {
        "url": "${V8_ROOT}/5.7.492/v8-darwin-x64.zip",
        "dir": "third_party/skia",
        "unzip": "true"
      }
    ],
    "win": [
      {
        "url": "${SKIA_ROOT}/m58/skia-win-ia32.zip",
        "dir": "third_party/skia",
        "unzip": "true"
      },
      {
        "url": "${V8_ROOT}/5.7.492/v8-win-ia32.zip",
        "dir": "third_party/skia",
        "unzip": "true"
      }
    ]
  }
}
```
