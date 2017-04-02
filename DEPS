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