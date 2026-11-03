# NuVerter — Handoff Prompt (for next AI session)

> **Read `ZNotes/NEXT_SESSION_NOTES.md` first** — it is the detailed, up-to-date session record (2026-11-03). This file is the short version.

## Project
- Workspace: `D:\Websites\Universal Converter` (NOT a git repo) — edit here.
- Git mirror: `D:\GitHub\NuVerter` → `https://github.com/BIltonBB/NuVerter` (branch `main`), Pages at https://biltonbb.github.io/NuVerter/.
- Deploy = copy changed files into `D:\GitHub\NuVerter\web\...`, then `git add -A`, commit, `git push origin main` (PowerShell: use `;` not `&&`; push prints harmless `NativeCommandError` on stderr).
- Hosting only needs `web/`; Pages uses `.github/workflows/pages.yml` (deploys `web`).
- Cross-origin isolation on static hosts via `web/coi-serviceworker.js` + COOP/COEP meta tags in `index.html`; first visit needs one reload for SharedArrayBuffer/FFmpeg.wasm.
- Local test server: `node web/server.cjs 4173` → http://localhost:4173/ (run from workspace root).
- Main app: single file `web/assets/js/app.js` (~13k lines). Patch pattern: TOOLS entry in `web/assets/js/app.js` → nav button in `index.html` → `state.<tool>` → `xyzView()` in `renderView` chain → `bindXyz()` call → `case 'xyz-*'` in `handleExtraAction`/`handleAction` → record output with `registerOutput`.

## Recently completed (this session)
Auto Reframe (saliency tracking) · Eco/Turbo concurrency toggle · audio waveform drag-select · Local AI Model Manager tab · OCR document search · Workflows Phases 1–3 (sequential runner + visual canvas + save/load + IndexedDB + DAG execution + compress adapter) · spot-heal + patch-based inpaint in Image Editor · AI inpaint (ONNX, with patch fallback) · queue undo/redo (deep-clone) · optional audio-reactive theme · PII text scrub (Dev Tools) · permanent image redaction (Image Editor) · PDF redaction (PDF Tools) · fixed pdf-lib UMD→ESM import · local LLM document Q&A (AI Tools) · audio waveform editor (visual trim + WAV export) · video editor timed overlays + multi-track timeline (playhead scrubbing + draggable clips) · cropper rule-of-thirds grid toggle.

## Remaining roadmap (large / partial) — see NEXT_SESSION_NOTES.md §7 for detail
- Real ONNX inpainting pipeline (current code is a generic prototype: fixed 256, no normalization/presets)
- Full multi-track video timeline with per-property keyframes
- WebCodecs/WASM acceleration (needs vendored MP4 demuxer; no research results yet)
- System-native appearance (Tauri exists but no cargo/rustc in this environment)
- Auto Reframe real face/object tracking + keyframed smooth crop path
- Local AI Model Manager install/remove/select actions (still info-only)
- Metadata stripping verification against output
- Output-size estimate for image converter (only queue time estimate exists)
- Command-based queue undo/redo (currently deep-clone snapshots)
- Workflow branching/merge UI + more adapters
- Smart crop preview overlays (grid done; dim-outside/final framing missing)
- Batch rename, clipboard assistance, usage statistics, long-file waveform streaming, smart-drop suggestions

## Gotchas
- FFmpeg.wasm export is slow (~3+ min for 8s demo); slow progress is normal.
- `buildVideoEditorArgs` must keep `['-hide_banner','-y','-i','{in}']` and end with `'{out}'`.
- PowerShell `$?` unreliable; rely on `node --check` not throwing.
- Remove debug `console.log`s before commit.
- Delete stray `web/assets/js/app.corrupt.bak` if it reappears; never push it.
- Bump `app.js?v=NN` in `index.html` after JS changes to bust cache.

## First task suggestion
Read `ZNotes/NEXT_SESSION_NOTES.md`. Run `node --check web/assets/js/app.js`, pick one remaining roadmap item, propose a phased plan before coding, get approval.
