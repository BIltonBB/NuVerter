# NuVerter — New Session Notes (2026-11-03)

> Written because the previous AI session ran out of context.
> Read this file first, then `GOOD IDEAS.md` (roadmap spec). `HANDOFF_PROMPT.md` is the older short version and now points here.

## 1. TL;DR — where things stand

- The app is fully working; last verified `node --check` passed and the browser smoke test had **0 console errors**.
- `web/assets/js/app.js` is ~13,050 lines. Cache-bust version in `web/index.html` is **`app.js?v=89`**.
- Last deployed commit (mirror repo): **`f35e83b` — "Cropper: rule-of-thirds grid toggle"**.
- Everything from the recent work chain is committed and pushed: PII (text/image/PDF), PDF redaction, pdf-lib ESM fix, workflow IndexedDB + DAG + compress adapter, queue deep-clone undo/redo, local LLM doc Q&A, audio waveform editor, video editor timed overlays + multi-track timeline, Auto Reframe saliency tracking, ONNX inpaint (with patch fallback), cropper grid.
- **No uncommitted work is pending.** Workspace and mirror are in sync as of this note.
- Biggest remaining items are genuinely large: real ONNX inpainting, WebCodecs acceleration, keyframe animation, native Tauri effects, and a few medium polish items (see §7).

---

## 2. Environment & commands

| Thing | Value |
|---|---|
| Workspace (edit here) | `D:\Websites\Universal Converter` — **NOT a git repo** |
| Git mirror (deploy here) | `D:\GitHub\NuVerter` → `https://github.com/BIltonBB/NuVerter` (`main`) |
| Live site | https://biltonbb.github.io/NuVerter/ |
| Local server | `node web/server.cjs 4173` from workspace root |
| Local URL | http://localhost:4173/ |
| Main app | `web/assets/js/app.js` (single file, ~13k lines) |
| Markup/sprite | `web/index.html` |
| Samples | `web/samples/demo-gradient.mp4`, `demo-portrait.mp4`, `demo-image.png`, `demo-photo.jpg`, `demo-audio.mp3`, `sample-speech.mp4`, `sample-speech-obama.webm` |

**PowerShell gotchas:** use `;` not `&&`. `$?` is unreliable; trust `node --check` / `$LASTEXITCODE`. No `head`/`sed`. `git push` may print a harmless `NativeCommandError` on stderr.

**Syntax check:**
```powershell
cd "D:\Websites\Universal Converter"
node --check web/assets/js/app.js
Write-Host "CHECK_EXIT=$LASTEXITCODE"   # must be 0
```

**Deploy / mirror:**
```powershell
Copy-Item "D:\Websites\Universal Converter\web\assets\js\app.js" "D:\GitHub\NuVerter\web\assets\js\app.js" -Force
Copy-Item "D:\Websites\Universal Converter\web\index.html"       "D:\GitHub\NuVerter\web\index.html" -Force
cd "D:\GitHub\NuVerter"
git add -A
git commit -m "…"
git push origin main
```
Only `web/` is needed by GitHub Pages; `.github/workflows/pages.yml` deploys it. Cross-origin isolation uses `web/coi-serviceworker.js` + COOP/COEP meta tags; first visit needs one reload for SharedArrayBuffer/FFmpeg.wasm.

---

## 3. Architecture / patch pattern

Single module file. To add or change a tool:

1. `TOOLS` entry (~line 479) and `state.<tool>` (~line 384+).
2. Nav button is generated from `TOOLS`; no manual `index.html` nav edit needed.
3. Add `xyzView()` and include it in the `renderView()` chain (~line 8813).
4. Call `bindXyz()` from the relevant bind step; add actions to `handleExtraAction` (~line 11675) or `handleAction`.
5. Record output with `registerOutput` so Session History works.

State keys currently present (all module-scoped; **not** on `window`):
`prefs, converter, subtitleEditor, utilities, utilWaveform, pdfTools, pdfRedact, aiChat, devTools, practical, aiTools, docSearch, workflow, aiImage, audioTools, compressor, cropper, extractor, gif, recorder, imageEditor, videoEditor, reframe`.

Views/tools: converter, compressor, cropper, extractor, gif, recorder, history, subtitles, utilities (= practical & audiotools aliases), devtools, aitools, pdftools, aichat, imageditor, videoeditor, reframe, workflow.

Useful anchors (line numbers as of `app.js?v=89`):

| Function | Line |
|---|---|
| `getPdfLib()` | 6692 |
| `getPdfJs()` | 6696 |
| `imageEditorOnnxInpaintApply()` | 7710 |
| `imageEditorRedactApply()` | 7672 |
| `bindImageEditor()` | 7828 |
| `videoEditorExport()` | 8253 |
| `renderVideoTimeline()` | 8024 |
| `bindVideoTimeline()` | 8075 |
| `reframeAnalyze()` | 8453 |
| `renderView()` | 8813 |
| `cropperView()` | 9152 |
| `handleExtraAction()` | 11675 |
| `handlePickedFiles()` | 11423 |
| `pickFiles()` | 11413 |
| `utilDocQaAsk()` | 6440 |
| `utilFaviconBody()` | 4388 |
| `utilWaveformBody()` | 4624 |
| `utilWaveformLoad()` | 4647 |
| `encodeWav()` | 4706 |
| `idbWorkflowsLoad()` | 1560 |
| `idbWorkflowsSave()` | 1571 |

Tab sets:
- Utilities: `frames, spritesheet, slicer, textimage, trimmer, watermark, upscale, pdf, chroma, fileinfo, palette, favicon, vector, audioclean, silencetrim, waveform, tts, ocr, aibg, aiup, emb, hash`
- Dev Tools: `json, base64, regex, pii, mock`
- AI Tools: `aiimg, aibg, aiup, ocr, tts, emb, models, docs, docqa`
- PDF Tools: `merge, split, img2pdf, pdf2img, redact`

---

## 4. Completed (verified) features

### Core
Converter (queue, drag/drop, batch, per-file progress, presets, Eco/Turbo concurrency), compressor, cropper (aspects + **rule-of-thirds grid toggle**), audio extractor, GIF maker, screen recorder, subtitle editor, session history, `registerOutput`.

### Image Editor
Non-destructive adjustments (brightness/contrast/saturation/hue/blur/sepia/grayscale/invert), history + undo/redo, spot-heal, patch-based inpaint, **AI inpaint via ONNX Runtime Web with patch fallback**, **permanent redaction** (black out masked pixels), mask tools, apply/reset, export.

### Video Editor
Adjustments, burned-in text, multiple timed text overlays (`enable='between(t,s,e)'`), trim range, aspect, speed, undo/redo, **multi-track timeline** (video + overlay tracks, click-to-scrub playhead, draggable overlay clips, timecode). Export via FFmpeg.wasm.

### Auto Reframe
Saliency-based subject tracking: saturation + center-bias weighted centroid over ~12 sampled frames, temporal smoothing, crop X applied. Tracking metadata shown in UI. Still heuristic, not face/object detection.

### PDF Tools
Merge, split, images→PDF, PDF→images, and **Redact** (pdf.js render → draw drag rectangles → export rasterized redacted PDF). pdf-lib is loaded as **ESM** (`pdf-lib.esm.min.js`) — do not revert to the UMD build (it returned an empty module).

### Workflows
Visual draggable-node canvas with typed ports, connect/disconnect, pan/zoom, save/load/duplicate, **IndexedDB persistence with localStorage fallback** (DB v3 `workflows` store), **DAG execution** with `outputs` Map + `getInput`, per-node status, `compress` adapter. Privacy reset clears workflows.

### Utilities
Frames, spritesheet, spritesheet slicer, text card, trimmer, watermark, upscale, PDF utilities, chroma key, file info, **color palette**, **favicon bundle**, **image vectorization**, audio clean, silence trim, **audio waveform editor (drag selection + WAV export)**, TTS, OCR, AI background, AI upscale, embeddings, **file hash**.

### Dev Tools
JSON formatter/minifier, Base64, regex tester, **PII scrubber** (email, phone, SSN, credit card w/ Luhn, IP; placeholders, copy/download), JSON mock-data generator.

### AI Tools
AI image, background removal, upscale, OCR, TTS, embeddings, **local model manager (info-only)**, **local document search**, **local LLM document Q&A** (WebLLM over indexed docs).

### UI / privacy
Command palette (Ctrl+K), themes (incl. optional audio-reactive), privacy reset, session history, keyboard shortcuts, Eco/Turbo.

---

## 5. Recent verified behavior notes

- Video editor timeline test: loaded `samples/demo-gradient.mp4`, timeline rendered, overlay clip drag and playhead scrubbing worked; no console errors.
- Cropper grid test: loaded `samples/demo-image.png` (1536×864), Grid button toggles 4 rule-of-thirds lines inside `#crop-box`; no console errors.
- PII scrubber test: 5/5 expected detections.
- Image redaction test: center pixel became `(0,0,0)`.
- PDF redaction tested end-to-end.
- FFmpeg.wasm export is **slow** (~3+ min for an 8s demo) — normal, not a hang.

---

## 6. Testing playbook (no test framework)

1. `node --check web/assets/js/app.js` → exit 0.
2. Start/keep `node web/server.cjs 4173`.
3. Open http://localhost:4173/ in the in-app browser tab.
4. Smoke: click each of the 18 tool nav buttons; check console errors = 0.
5. Load samples with the real UI. In browser automation, `state` is **not** global. Working trick:
   ```js
   // click the source drop first so pickContext is set, then feed the hidden input
   document.querySelector('.source-drop[data-context="cropper"]').click();
   const blob = await (await fetch('samples/demo-image.png')).blob();
   const dt = new DataTransfer();
   dt.items.add(new File([blob], 'demo-image.png', { type: 'image/png' }));
   const input = document.querySelector('#file-input');
   input.files = dt.files;
   input.dispatchEvent(new Event('change', { bubbles: true }));
   ```
   (Or temporarily add `window.__fn = fn` and remove it afterward — never commit debug hooks.)
6. Bump `app.js?v=NN` in `web/index.html` after any JS change.
7. Mirror + commit + push (see §2).

---

## 7. Remaining roadmap — accurate status

### Large / needs real effort
1. **Real ONNX inpainting (LaMa-class).**
   Current `imageEditorOnnxInpaintApply()` is a generic prototype: fixed 256×256, assumes exactly one image tensor (NCHW float32) + one mask tensor, no mean/std normalization, no model presets. It will fail or produce garbage for most real models. Needs:
   - model presets (input size 512, normalization, mask semantics, grayscale/RGB),
   - correct preprocessing/postprocessing per model,
   - tiled inference for large images,
   - progress UI + download-size/hardware disclosure,
   - keep patch-based fallback.
2. **WebCodecs / WASM acceleration.**
   No MP4 demuxer is vendored; research attempts failed (websearch returned nothing). Suggested path: vendor `mp4box.js` (or `mp4box.all.min.js`) into `web/vendor/`, demux samples, `VideoDecoder`/`VideoEncoder`, feed frames to canvas/FFmpeg fallback. Must keep `<video>`/FFmpeg path when unsupported. Benchmark before claiming acceleration.
3. **Full multi-track timeline with keyframes.**
   Timeline currently has video + overlay tracks, scrub, drag overlay timing. Missing: per-property keyframes (position/scale/opacity/volume), clip splitting/reordering, multiple overlay layers with per-keyframe animation, and export mapping of keyframes. This is a state-model rewrite of `state.videoEditor`.
4. **System-native appearance (Tauri).**
   `tauri/` and `desktop/` exist, but **no `cargo`/`rustc` on PATH** in this environment (`where cargo` returned nothing), so it cannot be built/tested here. Needs Rust toolchain + native window effects, with graceful web fallback.
5. **Auto Reframe real tracking.**
   Current saliency heuristic is decent but not face/object detection; no smooth per-frame crop path — one crop X for the whole clip. A real tracker needs a model (FaceDetector API or ONNX) and a keyframed crop path.

### Medium polish
6. **Local AI Model Manager actions** — currently info-only; needs install/remove/select + real disk/memory reporting (do not claim loaded/accelerated unless verified).
7. **Metadata stripping + verification** — `stripMetadata` pref exists; output verification not implemented.
8. **Output-size estimate for image converter** — only queue *time* estimate exists; no size estimate while adjusting quality.
9. **Command-based queue undo/redo** — currently deep-clone snapshots (`cloneQueue()`), not command pattern.
10. **Workflow branching/merge UI + more adapters** — engine is DAG-capable, UI/adapters are still basic; add branch/merge nodes, more tool adapters, per-node config.
11. **Smart crop preview overlays** — rule-of-thirds grid now done; still missing dim-outside-crop and final-framing preview.
12. **Batch rename** — not implemented (template like `{original_name}_NuVerter_{resolution}`, collision handling).
13. **Long-file waveform streaming** — currently decodes the whole audio file into memory.
14. **Clipboard assistance** — not implemented (must be explicit user action; never background-monitor or transmit).
15. **Usage statistics** — local bytes processed / completed operations not tracked.
16. **Smart-drop routing** — basic per-tool accept; no suggested actions after drag-in.

### Already done (do not re-implement)
Command palette, hash verification, color palette, favicon bundle, JSON mock generator, non-destructive image editor, waveform selection, smart-drop base, vectorization, spritesheet slicer, OCR + doc search, metadata stripping option, PII/redaction, privacy reset, workflow builder v1, local model manager UI (info), audio-reactive themes, Eco/Turbo.

---

## 8. Known gotchas / traps

- **pdf-lib**: use `https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.esm.min.js`. UMD build yields an empty module.
- **pdf.js**: `https://cdn.jsdelivr.net/npm/pdfjs-dist@4.7.76/build/pdf.min.mjs`.
- **ONNX Runtime**: `onnxruntime-web@1.19.0` ESM (`dist/ort.min.mjs`) with script fallback; WASM paths may need explicit `ort.env.wasm.wasmPaths` if CDN import fails under COEP.
- `buildVideoEditorArgs` must keep `['-hide_banner','-y','-i','{in}']` and end with `'{out}'`.
- Bump `app.js?v=NN` after JS changes or the browser serves stale code.
- `app.corrupt.bak` exists only in packaged `desktop/dist*`; never push it.
- Remove temporary `window.__*` debug hooks before committing.
- PowerShell edit pitfalls: exact whitespace matters; prefer `Get-Content` line dump when an `edit` fails. The file uses CRLF.
- Some icon names in `icon('…')` must exist as `#i-…` symbols in `index.html` (e.g. `layout-grid`, not `grid`).
- Module state is private; browser tests must go through the UI or temporary hooks.
- Git mirror can show CRLF warnings; harmless.

---

## 9. Suggested first task next session

Pick **one** and propose a short phased plan before coding (per `GOOD IDEAS.md`):

- **Best value / contained:** finish *real* ONNX inpainting with a preset-aware pipeline (LaMa 512, normalization, tiling) and honest model download/hardware disclosure.
- **Most visible:** keyframe animation for the video editor timeline (position/scale/opacity/volume), reusing the existing timeline UI and FFmpeg overlay `enable` expressions.
- **Riskiest:** WebCodecs + mp4box.js acceleration path (vendor demuxer, feature-detect, keep FFmpeg fallback).
- **Blocked here:** Tauri native effects until Rust toolchain is installed.

After the change: `node --check` → browser smoke (18 tools, 0 errors) → bump `v=` → mirror → commit/push → update this file and `HANDOFF_PROMPT.md`.

---

## 10. Quick file map

```
D:\Websites\Universal Converter\
  web\assets\js\app.js        # everything (state, views, bind, actions)
  web\index.html              # shell, icon sprite, cache-bust version
  web\server.cjs              # local static server (port 4173)
  web\samples\                # demo media for testing
  web\vendor\                 # vendored libs (ffmpeg etc.)
  tauri\ , desktop\           # native wrappers (not buildable here: no cargo)
  ZNotes\GOOD IDEAS.md        # full roadmap spec
  ZNotes\HANDOFF_PROMPT.md    # short handoff (points here)
  ZNotes\NEXT_SESSION_NOTES.md# this file
  D:\GitHub\NuVerter\         # deploy mirror (git)
```
