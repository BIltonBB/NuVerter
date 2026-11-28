# Third-party components

NuVerter's own code (`assets/js/app.js`, `assets/css/*.css`, `index.html`, the
SVG icons, and the generated sample media) is original work, licensed under the
GNU GPL v3 — see `LICENSE` and the root `README.md`.

Everything below is third-party material that NuVerter either ships locally or
loads from a network service. Each entry stays under its own license, not the
GPL, and those notices must be kept when this app or its bundles are
redistributed.

NuVerter ships the runtime engines locally: no CDN is used for FFmpeg, the PDF
libraries, the fonts, or the icons. A few optional features do talk to network
services at runtime, and one imports a JS module from a CDN — both are listed
under [Runtime network use](#runtime-network-use) below.

## Engine

- **@ffmpeg/ffmpeg** 0.12.10 - MIT License
  - https://github.com/ffmpegwasm/ffmpeg.wasm
  - Vendored as `vendor/ffmpeg/ffmpeg.js`, `vendor/ffmpeg/814.ffmpeg.js` and
    `vendor/ffmpeg/util.js`
- **@ffmpeg/core** 0.12.6 (single-thread build) - MIT License
  - https://github.com/ffmpegwasm/ffmpeg.wasm-core
  - Vendored as `vendor/ffmpeg/ffmpeg-core.js` and `vendor/ffmpeg/ffmpeg-core.wasm`
  - WebAssembly build of FFmpeg. FFmpeg itself is LGPL-2.1-or-later by default,
    and this build includes LGPL/GPL components; see FFmpeg's licensing page
    (https://ffmpeg.org/legal.html) for the obligations that come with them.

## Compression

- **fflate** (MIT License) - https://github.com/101arrowz/fflate
  - Vendored as `vendor/zip/fflate.js`
  - Used for ZIP batch export.

## PDF

- **pdf-lib** 1.17.1 (MIT License) - https://github.com/Hopding/pdf-lib
  - Vendored as `vendor/pdf-lib/pdf-lib.esm.min.js`
  - Used for PDF merge / split / redact / images→PDF.
  - Bundles **tslib** (Apache-2.0, Copyright (c) Microsoft Corporation) inside
    the minified file.
- **PDF.js** 4.7.76 (Apache-2.0, Copyright 2024 Mozilla Foundation) -
  https://github.com/mozilla/pdf.js
  - Vendored as `vendor/pdfjs/pdf.min.mjs` and `vendor/pdfjs/pdf.worker.min.mjs`
  - Used for rendering PDF pages (PDF→Images) and the redaction preview.

## Media / image

- **qrcode-generator** (MIT License, Copyright (c) 2009 Kazuhiko Arase) -
  https://github.com/kazuhikoarase/qrcode-generator
  - Vendored as `vendor/qrcode.js`
  - Used by the QR code generator (offline). "QR Code" is a registered
    trademark of DENSO WAVE INCORPORATED; the generator is an independent
    implementation and is not affiliated with DENSO WAVE.
- **Potrace JS** (GPL, Peter Selinger) - vendored from kilobyte.github.io/potrace
  - Vendored as `vendor/potrace/potrace.js`
  - Used by the image vectorizer. This is GPL code, which is compatible with
    NuVerter's own GPL v3 license.
- **mp4box.js** (BSD-3-Clause, gpac) - https://github.com/gpac/mp4box.js
  - Vendored as `vendor/mp4box/mp4box.all.min.js`
  - Used by the WebCodecs MP4 diagnostic / demux experiments.
- **mp4-muxer** (MIT License, Vanilagy) - https://github.com/Vanilagy/mp4-muxer
  - Vendored as `vendor/mp4-muxer/mp4-muxer.mjs`

## Shared-array-buffer helper

- **coi-serviceworker** v0.1.7 (MIT License, Guido Zuidhof and contributors) -
  https://github.com/gzuidhof/coi-serviceworker
  - Vendored as `coi-serviceworker.js`; the license header is kept in-file.
  - Enables the cross-origin isolation headers that the FFmpeg core needs when
    the page is served without them (for example on GitHub Pages).

## Fonts

All of these are redistributable under their own font licenses; none are sold
or sublicensed by NuVerter.

- **Inter** - SIL Open Font License 1.1 - https://github.com/rsms/inter
  - `fonts/inter-latin.woff2`
- **JetBrains Mono** - SIL Open Font License 1.1 -
  https://github.com/JetBrains/JetBrainsMono
  - `fonts/jetbrains-mono-latin.woff2`
- **Open Sans** 3.003 - SIL Open Font License 1.1, Copyright 2020 The Open Sans
  Project Authors - `vendor/fonts/OpenSans-*.ttf`
  - "Open Sans" is a trademark of Google LLC.
- **Roboto** 2.001 - Apache-2.0, Copyright 2015 Google Inc. -
  `vendor/fonts/Roboto-*.ttf`
  - "Roboto" is a trademark of Google LLC.
- **DejaVu** - Bitstream Vera / DejaVu license (permissive), Copyright (c) 2003
  Bitstream, Inc., Copyright (c) 2006 Tavmjong Bah - `vendor/fonts/DejaVu*.ttf`

## Icons

- **Lucide** icon set (ISC License) - https://github.com/lucide-icons/lucide
  - Inline subset in `index.html` (SVG sprite). The full source sprite is not
    shipped.

## Desktop shell (Tauri)

- **Tauri** 2 and the official plugins (`tauri-plugin-opener`,
  `tauri-plugin-dialog`, `tauri-plugin-fs`, `tauri-plugin-updater`) -
  MIT / Apache-2.0. Exact versions are pinned in
  `tauri/src-tauri/Cargo.lock`, where each crate's own license applies.
- **window-vibrancy**, **serde**, **serde_json**, **ureq** - MIT / Apache-2.0;
  see `Cargo.lock`.
- Windows / Android scaffolding shipped with Tauri:
  - `src-tauri/installer.nsi` and `src-tauri/languages/English.nsh` — NSIS
    installer template from Tauri (MIT).
  - `src-tauri/gen/android/` — Tauri-generated Android glue, including the
    Gradle wrapper (`gradlew`, `gradle-wrapper.jar`, Apache-2.0).

## Sample media

Every file in `samples/` and `assets/` is generated inside this repository, so
there is no upstream source to credit:

- `samples/sample-speech.webm` - a gradient clip muxed with a locally
  synthesized speech track (Windows SAPI text-to-speech), made for the subtitle
  editor demo. Not human narration, and not a recording of any person.
- `samples/demo-*.mp4`, `demo-audio.mp3`, `demo-image.png`, `demo-photo.jpg` -
  synthetic assets produced with FFmpeg and the browser tooling in this repo.
- `assets/*.svg` and `assets/icons.svg` - original SVG artwork.

If you add a sample from somewhere else, record its source and license here
before committing it.

## Runtime network use

These are not vendored, but they are fetched while the app runs:

- **Transformers.js** `@xenova/transformers@2.17.2` (Apache-2.0) is imported
  from `https://cdn.jsdelivr.net/npm/...` by `assets/js/whisper-worker.js`, and
  that worker also downloads a Whisper speech model on first use. This affects
  the in-browser transcription path only. Set `env.allowLocalModels` /
  `env.localModelPath` to use local copies instead of the CDN and the model
  hub.
- **AI image generation** goes through `api/ai-image.php` (or the matching
  route in `server.cjs`) to Pollinations AI, which may also receive an optional
  `POLLINATIONS_API_KEY`. Generated images are not stored in this repository;
  the terms of the upstream service and of the chosen model apply to what it
  returns.
- **Wikipedia search** goes through `api/search.php`, which returns Wikipedia
  content — generally CC BY-SA 4.0. Attribute Wikipedia if you re-display or
  redistribute those results.
- **The link reader** (`api/fetch.php`, `/api/fetch` in `server.cjs`) returns up
  to 20 KB of whatever URL the user supplies. That content belongs to its
  publisher.
- **The desktop build** downloads the `yt-dlp` executable once, on first use,
  from yt-dlp's official release archive (public domain / Unlicense). It is
  stored in the app data directory, not shipped in the installer, and it is
  used only for the links the user asks to download.
