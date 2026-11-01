# Third-party components

NuVerter ships these components locally. No runtime CDN calls are made.

## Engine

- **@ffmpeg/ffmpeg** 0.12.10 - MIT License
  - https://github.com/ffmpegwasm/ffmpeg.wasm
  - Vendored as `vendor/ffmpeg/ffmpeg.js` and `vendor/ffmpeg/814.ffmpeg.js`
- **@ffmpeg/core** 0.12.6 (single-thread build) - MIT License
  - https://github.com/ffmpegwasm/ffmpeg.wasm-core
  - Vendored as `vendor/ffmpeg/ffmpeg-core.js` and `vendor/ffmpeg/ffmpeg-core.wasm`
  - WebAssembly build of FFmpeg (LGPL/GPL components; see FFmpeg licensing).

## Compression

- **fflate** (MIT License) - https://github.com/101arrowz/fflate
  - Vendored as `vendor/zip/fflate.js`
  - Used for ZIP batch export.

## Fonts (SIL Open Font License 1.1)

- **Inter** - https://github.com/rsms/inter
  - `fonts/inter-latin.woff2`
- **JetBrains Mono** - https://github.com/JetBrains/JetBrainsMono
  - `fonts/jetbrains-mono-latin.woff2`

## Icons

- **Lucide** icon set (ISC License) - https://github.com/lucide-icons/lucide
  - Inline subset in `index.html` (SVG sprite). The full source sprite is not
    shipped.

## No other runtime dependencies

The application itself (`assets/js/app.js`, `assets/css/*.css`, `index.html`) is
original code. No package manager, build step or backend is required.