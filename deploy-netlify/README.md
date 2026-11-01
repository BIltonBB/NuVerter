# NuVerter - Local Media Studio

A 100% client-side multimedia utility dashboard. Everything runs in your browser on
`localhost` - no uploads, no accounts, no tracking, no backend. Convert, compress,
crop, extract audio, make GIFs and record your screen privately.

## Quick start

1. Install [Node.js](https://nodejs.org/) (LTS).
2. Open this folder.
3. Double-click **`start.cmd`** (Windows) - or run `node server.cjs` in a terminal.
4. Your browser opens at `http://localhost:4173/`.

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
- **Queue** - sequential processing, retry, per-file progress, ZIP batch export.
- **Ethical ghost slots** - slots 4+ stay queued and process automatically; a
  non-blocking upsell offers Lifetime Premium for $1.
- **Pricing** - Lifetime Premium $1 USD / Rp 15.000, Team License (5 users)
  $5 USD / Rp 75.000. Payments are demo placeholders; "Unlock" stores a local
  flag only.
- **AI Text → Image** - three choices in AI Tools: **SD-Turbo** runs locally
  with WebGPU (2.5 GB of ONNX files you download once and pick from a folder;
  ~4–6 GB RAM), plus **FLUX** and **GPT Image** online models. Local generation
  never uploads the prompt or image.
- **Theming** - system / light / dark plus full appearance control: presets,
  background, surface, sidebar, border, text, accent and button colors, corner
  radius, ambient glow and gradient background. Persisted in `localStorage`.
- **Fully responsive** - desktop sidebar, mobile drawer, adbar never overlaps
  content.

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