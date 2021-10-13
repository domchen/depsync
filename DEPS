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
        "command": "npm",
        "args": [
          "install",
          "tspack"
        ],
        "dir": "./"
      },
      {
        "command": "node",
        "args": [
          "node_modules/tspack/bin/tspack",
          "--v"
        ],
        "dir": "./"
      }
    ]
  }
}