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

## PDF

- **pdf-lib** 1.17.1 (MIT License) - https://github.com/Hopding/pdf-lib
  - Vendored as `vendor/pdf-lib/pdf-lib.esm.min.js`
  - Used for PDF merge / split / redact / images→PDF.
- **PDF.js** 4.7.76 (Apache-2.0) - https://github.com/mozilla/pdf.js
  - Vendored as `vendor/pdfjs/pdf.min.mjs` and `vendor/pdfjs/pdf.worker.min.mjs`
  - Used for rendering PDF pages (PDF→Images) and the redaction preview.

## Media / image

- **qrcode-generator** (MIT License) - https://github.com/kazuhikoarase/qrcode-generator
  - Vendored as `vendor/qrcode.js`
  - Used by the QR code generator (offline).
- **Potrace JS** (GPL) - vendored from kilobyte.github.io/potrace
  - Vendored as `vendor/potrace/potrace.js`
  - Used by the image vectorizer.
- **mp4box.js** (BSD-3-Clause) - https://github.com/gpac/mp4box.js
  - Vendored as `vendor/mp4box/mp4box.all.min.js`
  - Used by the WebCodecs MP4 diagnostic / demux experiments.
- **mp4-muxer** (MIT License) - https://github.com/Vanilagy/mp4-muxer
  - Vendored as `vendor/mp4-muxer/mp4-muxer.mjs`

## Fonts (SIL Open Font License 1.1 / Apache-2.0)

- **Inter** - https://github.com/rsms/inter
  - `fonts/inter-latin.woff2`
- **JetBrains Mono** - https://github.com/JetBrains/JetBrainsMono
  - `fonts/jetbrains-mono-latin.woff2`
- **Open Sans**, **Roboto**, **DejaVu** (TTF) - `vendor/fonts/`
  - Used by the text-card and canvas rendering utilities.

## Icons

- **Lucide** icon set (ISC License) - https://github.com/lucide-icons/lucide
  - Inline subset in `index.html` (SVG sprite). The full source sprite is not
    shipped.

## No other runtime dependencies

The application itself (`assets/js/app.js`, `assets/css/*.css`, `index.html`) is
original code. No package manager, build step or backend is required.