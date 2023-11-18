<p align="left">
  <a href="https://www.npmjs.com/package/depsync"><img src="https://img.shields.io/npm/v/depsync.svg" alt="Version"></a>
  <a href="https://github.com/domchen/depsync/blob/master/LICENSE"><img src="https://img.shields.io/npm/l/depsync.svg" alt="License"></a>
</p>

# Introduction

A command line tool for automatically synchronizing the dependencies of a project by the DEPS configuration file.

# Advantages

The depsync tool provides a convenient way to download git repositories and files from the Internet, offering several key advantages over similar capabilities like git-submodules and git-lfs:

- Repositories are always checked out with a depth of 1 without any extra command arguments, ensuring that the main project maintains a relatively compact size at all times.
- Automatically download git-submodules and git-lfs files for your main project and third-party repositories without the need to run commands on each one individually.
- During downloading process, git-lfs files that already exist in the local cache can be skipped. This approach works even for the shallow cloned repositories.
- Enable the execution of custom actions after synchronization. For instance, you can include commands in the DEPS file to facilitate cleaning tasks and other operations.
- Repositories and files can be configured separately for each platform to avoid downloading unnecessary dependencies and only acquire platform-specific ones.

With all the advantages described above, all it takes is one straightforward command `depsync`. Execute it in the root of your main project, and you're good to go!

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
  "version": "1.3.2",
  "vars": {
    "GIT_DOMAIN": "github.com",
    "SKIA_ROOT": "https://github.com/domchen/depsync/releases/download/1.0.1",
    "V8_ROOT": "https://github.com/domchen/depsync/releases/download/1.0.2"
  },
  "repos": {
    "common": [
      {
        "url": "https://${GIT_DOMAIN}/webmproject/libwebp.git",
        "commit": "1fe3162541ab2f5ce69aca2e2b593fab60520d34",
        "dir": "third_party/libwebp"
      },
      {
        "url": "https://${GIT_DOMAIN}/libjpeg-turbo/libjpeg-turbo.git",
        "commit": "129f0cb76346ceede8f4d8d87dea8acb0809056c",
        "dir": "third_party/libjpeg-turbo"
      },
      {
        "url": "https://${GIT_DOMAIN}/Tencent/tgfx.git",
        "commit": "5948d72a0a5320a1ea055f23bc8312b07ab6d72c",
        "dir": "third_party/tgfx"
      }
    ]
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
        "command": "depsync --clean",
        "dir": "third_party"
      }
    ]
  }
}
```
