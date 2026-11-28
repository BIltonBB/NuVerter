# NuVerter - Local Media Studio

Source: https://github.com/BIltonBB/NuVerter

A 100% client-side multimedia utility dashboard. Everything runs in your browser on
`localhost` - no uploads, no cloud account, no tracking, no backend. Convert, compress,
crop, extract audio, make GIFs and record your screen privately.

## Quick start

1. Install [Node.js](https://nodejs.org/) (LTS).
2. Open this folder.
3. Double-click **`start.cmd`** (Windows) - or run `node server.cjs` in a terminal.
4. Your browser opens at `http://localhost:4173/`.

## Tests

```bash
npm test           # server/SSRF tests, then Playwright opens every sidebar view
npm run test:e2e   # Playwright only
```

The first local e2e run needs `npx playwright install chromium`. CI uses the
runner's Chrome so it does not download a browser.

The server only serves files and sets the `Cross-Origin-Opener-Policy` /
`Cross-Origin-Embedder-Policy` headers that the bundled FFmpeg engine needs.

## Requirements

- A modern Chromium-based browser (Chrome or Edge) for screen recording and the
  full FFmpeg feature set.
- Firefox / Safari work for most conversions; screen recording is Chromium-only.
- `localhost` is required. Opening `index.html` directly via `file://` disables
  FFmpeg (the page shows a warning).

## What is included

- **Universal Converter** - one queue for video, audio and images. AUTO routes
  each file to the right format. Supports MP4, WEBM, MOV, MKV, GIF, MP3, WAV,
  M4A, FLAC, OGG, PNG, JPG, WEBP. Advanced trim, bitrate, resolution, fps,
  aspect ratio, normalize and fade.
- **PDF Tools** (Documents) - merge PDFs (page numbers, normalise to A4/Letter/
  Legal), split/extract to separate files or ZIP, redact regions, render pages
  to PNG/JPEG, build PDFs from images, text → PDF with real pagination. PDF.js
  and pdf-lib are vendored; nothing is fetched from a CDN.
- **Utilities** - 77 local helpers: QR generator, image/video/audio merge,
  speed, rotate and normalize, hashing, JWT decode, cron parsing, password
  generation, archive zip/unzip, code formatters, mock data and more. Every
  tool runs in the tab; no uploads.
- **Video Compressor** - quality presets, target file size, resolution and mute.
- **Video Cropper** - draggable crop box with aspect chips (Free, 16:9, 9:16,
  1:1, 4:5, 4:3). Images are cropped losslessly to PNG.
- **Audio Extractor** - waveform preview, trim sliders, normalize, fade, format
  and bitrate.
- **GIF Maker** - palette-based GIF export.
- **Screen Recorder** - tab/window/display capture with mic and system audio,
  pause/resume.
- **Session History** - IndexedDB output store (max 24 items / 320 MB), preview,
  download, reuse, delete.
- **Queue** - every queued file processes automatically, with retry, per-file
  progress and ZIP batch export. No slot limits.
- **Support license (optional)** - Lifetime Premium $1 USD / Rp 15.000 and a
  Team license (5 users) for $5 USD / Rp 75.000. Nothing is gated: every tool
  and every queue slot already works without it; the license only changes the
  badge and styling.
- **Local profile (optional)** - a name/email/password hash kept only in this
  browser. It is a convenience, not security, and never required. "Unlock" is
  an honor-system local flag because this static build has no payment backend.
- **AI Text → Image** - three choices in AI Tools: **SD-Turbo** runs locally
  with WebGPU (2.5 GB of ONNX files you download once and pick from a folder;
  ~4–6 GB RAM), plus **FLUX** and **GPT Image** online models. Local generation
  never uploads the prompt or image.
- **Theming** - system / light / dark plus full appearance control: presets,
  background, surface, sidebar, border, text, accent and button colors, corner
  radius, ambient glow and gradient background. Persisted in `localStorage`.
- **Fully responsive** - desktop sidebar, mobile drawer and layouts that
  never overlap content. The Android build (Tauri) adds safe-area padding,
  larger touch targets and a one-tap update prompt that downloads the latest
  APK from GitHub releases.

## Static hosting (GitHub Pages, Netlify, etc.)

Only the `web/` folder is needed. The bundled `coi-serviceworker.js` enables
the cross-origin isolation (COOP/COEP) that FFmpeg.wasm requires on hosts that
cannot send custom headers. API proxies are optional: the app falls back to
direct requests when `/api/*` is unavailable. No Node.js or PHP is required for
the core converter to work.

## Notes

- AVIF canvas encoding is disabled in this browser build (Chrome does not expose
  it as of testing).
- The local SD-Turbo model needs Chrome/Edge with WebGPU and `shader-f16`. The
  files are read from the folder you pick; the folder handle is remembered in
  IndexedDB, and the files themselves are never copied or uploaded.
- VP9 (`libvpx-vp9`) crashes the engine in this build; WEBM uses VP8.
- All output blobs are kept in IndexedDB until you delete them or exceed the
  storage cap.
- Premium is a demo-only `localStorage` flag (`NuVerter-premium`). No payment
  backend exists.