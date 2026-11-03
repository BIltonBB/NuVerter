# NuVerter — Handoff Prompt (for next AI session)

## Project
- Workspace: `D:\Websites\Universal Converter` (NOT a git repo) — edit here.
- Git mirror: `D:\GitHub\NuVerter` → `https://github.com/BIltonBB/NuVerter` (branch `main`), Pages at https://biltonbb.github.io/NuVerter/.
- Deploy = copy changed files into `D:\GitHub\NuVerter\web\...`, then `git add -A`, commit, `git push origin main` (PowerShell: use `;` not `&&`; push prints harmless `NativeCommandError` on stderr).
- Hosting only needs `web/`; Pages uses `.github/workflows/pages.yml` (deploys `web`).
- Cross-origin isolation on static hosts via `web/coi-serviceworker.js` + COOP/COEP meta tags in `index.html`; first visit needs one reload for SharedArrayBuffer/FFmpeg.wasm.
- Local test server: `node web/server.cjs 4173` → http://localhost:4173/ (run from workspace root).
- Main app: single file `web/assets/js/app.js` (~11k lines). Patch pattern: TOOLS entry in `web/assets/js/app.js` → nav button in `index.html` → `state.<tool>` → `xyzView()` in `renderView` chain → `bindXyz()` call → `case 'xyz-*'` in `handleExtraAction`/`handleAction` → record output with `registerOutput`.

## Recently completed (this session)
Auto Reframe · Eco/Turbo concurrency toggle · audio waveform drag-select · Local AI Model Manager tab · OCR document search · Workflows Phases 1–3 (sequential runner + visual canvas + save/load + IndexedDB + DAG execution + compress adapter) · spot-heal + patch-based inpaint in Image Editor · queue undo/redo (deep-clone) · optional audio-reactive theme · PII text scrub (Dev Tools) · permanent image redaction (Image Editor) · PDF redaction (PDF Tools) · fixed pdf-lib UMD→ESM import · local LLM document Q&A (AI Tools) · audio waveform editor (visual trim + WAV export).

## Remaining roadmap (large / partial)
- Full multi-track video timeline with keyframes
- WebCodecs/WASM acceleration investigation
- Local LLM for document Q&A
- Full local AI inpainting with ONNX model (beyond patch-based fill)
- System-native appearance effects
- Converter-queue command-based undo/redo (deepened, not command-pattern)
- Workflow branching/merge UI + more adapters (execution now DAG-capable, IndexedDB done)
- Output-size estimate for image converter (only compressor)
- Auto Reframe real tracking (still luminance bbox)
- Local AI Model Manager actions (still info-only)
- Metadata verification against output
- Full audio waveform editor (extractor only)
- Smart crop preview overlays

## Gotchas
- FFmpeg.wasm export is slow (~3+ min for 8s demo); slow progress is normal.
- `buildVideoEditorArgs` must keep `['-hide_banner','-y','-i','{in}']` and end with `'{out}'`.
- PowerShell `$?` unreliable; rely on `node --check` not throwing.
- Remove debug `console.log`s before commit.
- Delete stray `web/assets/js/app.corrupt.bak` if it reappears; never push it.
- Bump `app.js?v=NN` in `index.html` after JS changes to bust cache.

## First task suggestion
Inspect repo, run `node --check web/assets/js/app.js`, pick one remaining roadmap item, propose a phased plan before coding, get approval.
