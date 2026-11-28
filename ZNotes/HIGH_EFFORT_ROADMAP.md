# NuVerter — High-Effort Roadmap (Deferred)

These items are intentionally deferred. Each needs a dedicated session.

## 1. Real ONNX Inpainting (LaMa-class)
- Preset-aware pipeline (input size 512, normalization, mask semantics, grayscale/RGB).
- Tiled inference for large images, progress UI, download-size/hardware disclosure.
- Keep patch-based fallback.
- Estimated effort: 2-3 sessions.

## 2. WebCodecs Acceleration
- Vendor mp4box.js demuxer + VideoDecoder/VideoEncoder path.
- Keep FFmpeg.wasm fallback when unsupported; benchmark before claiming acceleration.
- Estimated effort: 2-3 sessions.

## 3. Full Keyframe Timeline (remaining gaps)
- Per-property keyframes (position/scale/opacity/volume) with click-to-add on timeline.
- Clip splitting/reordering UI polish; multi-overlay layer animation export.
- State-model already supports kf; UI polish remaining.
- Estimated effort: 1-2 sessions.

## 4. Auto Reframe Real Tracking
- MediaPipe face tracking already integrated; needs per-frame keyframed crop path + smoothing.
- Estimated effort: 1-2 sessions.

## 5. Tauri Native Effects
- Rust toolchain available now; install tauri-cli, build, test installer.
- Native window effects (vibrancy) with web fallback.
- Estimated effort: 1 session.

## 6. Long-file Waveform Streaming
- Decode in chunks instead of whole file.
- Estimated effort: 1 session.

## 7. Local AI Model Manager Actions
- Install/remove/select with real disk/memory reporting.
- Estimated effort: 1-2 sessions.

## 8. Workflow Branching/Merge UI
- Branch/merge nodes, more adapters, per-node config.
- Estimated effort: 2 sessions.

## 9. Output-size Estimate (refinement)
- Basic heuristic implemented; refine with actual encoding stats.
- Estimated effort: 1 session.

---
# AI Per App (Proposed)

> Full design + phased plan for specialized per-app UIs:
> see `ZNotes/PER_APP_UI_PLAN.md`.

Each major app (Media, Documents, AI, Developer) gets a lightweight "Smart suggestions" panel
that recommends relevant tools/actions based on current context (loaded file, queue, settings).
This is a UX layer on top of existing tools — no new AI models required initially.

Phase 1: Static suggestion cards per category (low effort).
Phase 2: Context-aware suggestions (file type, queue state) (medium).
Phase 3: Per-app scoped chat using WebLLM with domain prompt (high).

Start with Phase 1.