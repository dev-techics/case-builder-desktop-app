# Bundled Ghostscript

Place the platform Ghostscript files here before building installers.

Expected layouts:

```text
build/ghostscript/win32/bin/gswin64c.exe
build/ghostscript/win32/bin/*.dll
build/ghostscript/win32/lib/**
build/ghostscript/win32/Resource/**

build/ghostscript/darwin/bin/gs
build/ghostscript/darwin/bin/gs.bin
build/ghostscript/darwin/share/ghostscript/**

build/ghostscript/linux/bin/gs
build/ghostscript/linux/bin/gs.bin
build/ghostscript/linux/share/ghostscript/**
```

`electron-builder` copies this directory to the installed app's
`resources/ghostscript` folder. At runtime the app resolves:

```text
resources/ghostscript/win32/bin/gswin64c.exe
resources/ghostscript/darwin/bin/gs
resources/ghostscript/linux/bin/gs
```

Copy the full Ghostscript runtime tree, not only the executable, because the
binary needs its supporting library and resource files.
