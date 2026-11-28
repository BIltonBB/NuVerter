# NuVerter â€” Next Session Notes (2026-11-03, WebCodecs handoff)

> Written at the end of the WebCodecs session because context was running out.
> Read this file first, then `ZNotes/NEXT_SESSION_NOTES.md` (full project history) and `ZNotes/GOOD IDEAS.md` (roadmap).

---

## 1. TL;DR

- **WebCodecs Phase A and Phase B are done, committed, and pushed.**
  - Latest pushed mirror commit: **`506cd5b` â€” "WebCodecs Phase B: decode 240 frames in ~270ms (timing report)"**.
  - Mirror `D:\GitHub\NuVerter` is clean and in sync with `main`.
- **WebCodecs Phase C is now WORKING (v=132).** Frame extraction at ~1.0s in ~240ms, 240 frames decoded, canvas visible. Debug hooks removed. Still uncommitted/unmirrored.
  - Button: *Extract frame @1s (WebCodecs)* in Dev Tools â†’ WebCodecs.
  - Clicking it leaves `#dev-wc-out` at `"Click to run."` â€” no output, no console error, no toast.
  - Current cache-bust in `web/index.html` is **`app.js?v=115`**.
- **Two temporary debug hooks exist and MUST be removed before any commit:**
  - `web/assets/js/app.js` line ~5506: `try { window.__runFrame = runWebCodecsFrameExtract; } catch {}`
  - `web/assets/js/app.js` line ~5655 (after the function): same line again.
- `node --check web/assets/js/app.js` currently passes (exit 0).

---

## 2. Environment / commands

| Thing | Value |
|---|---|
| Workspace (edit here) | `D:\Websites\Universal Converter` â€” **NOT a git repo** |
| Git mirror (deploy here) | `D:\GitHub\NuVerter` â†’ `https://github.com/BIltonBB/NuVerter` (`main`) |
| Live site | https://biltonbb.github.io/NuVerter/ |
| Local server | `node web/server.cjs 4173` from workspace root |
| Local URL | http://localhost:4173/ |
| Main app | `web/assets/js/app.js` (~13.7k lines, single module) |
| MP4 demuxer | `web/vendor/mp4box/mp4box.all.min.js` (vendored, ~1 MB) |
| Demo video | `web/samples/demo-gradient.mp4` (1280Ã—720, avc1.42c01f, 240 frames) |

PowerShell notes: use `;` not `&&`; `$?` is unreliable, trust `node --check` / `$LASTEXITCODE`; `git push` may print a harmless `NativeCommandError`.

Syntax check:
```powershell
cd "D:\Websites\Universal Converter"
node --check web/assets/js/app.js
Write-Host "CHECK_EXIT=$LASTEXITCODE"   # must be 0
```

Deploy:
```powershell
Copy-Item "D:\Websites\Universal Converter\web\assets\js\app.js" "D:\GitHub\NuVerter\web\assets\js\app.js" -Force
Copy-Item "D:\Websites\Universal Converter\web\index.html"       "D:\GitHub\NuVerter\web\index.html" -Force
cd "D:\GitHub\NuVerter"
git add -A
git commit -m "â€¦"
git push origin main
```
Only `web/` is published (`.github/workflows/pages.yml`).

---

## 3. What is already done (Phases A & B)

### Phase A â€” vendored demuxer + diagnostic (`f1454f5`)
- `window.MP4Box` is loaded lazily from `vendor/mp4box/mp4box.all.min.js`.
- Dev Tools â†’ WebCodecs â†’ *Run diagnostic* reports:
  - `VideoDecoder`, `VideoEncoder`, WebGPU support.
  - MP4Box version.
  - Demuxed track list (codec, dimensions, frame count).

### Phase B â€” decode benchmark (`506cd5b`)
- *Decode 30 frames (timing)* button (actually decodes all extracted samples).
- `runWebCodecsDecode()` in `app.js` (~line 5360).
- Result on the demo clip: **240 frames, ~270 ms, ~889 FPS, 0 decoder errors**.
- Key fix: `VideoDecoder` needs an AVC `description` (AVCDecoderConfigurationRecord) for H.264, otherwise `decode()` throws â€œA key frame is required after configure()â€.
- The description is built manually from `stsd.entries[0].avcC`:
  - `box.SPS[i]` / `box.PPS[i]` are objects `{ length, nalu }` â€” use `.nalu`.
  - Header: `configurationVersion, AVCProfileIndication, profile_compatibility, AVCLevelIndication, 0xff, 0xe0 | numSPS`, then SPS/PPS with 2-byte length prefixes.
  - In this clip: `lengthSizeMinusOne = 3`, profile 66, level 31, 1 SPS (23 bytes), 1 PPS, total description 39 bytes.

---

## 4. Phase C â€” current implementation (WIP)

### UI (in `devToolsView`, around `app.js` line ~5314)
```html
<button class="btn btn-secondary btn-sm" data-action="dev-wc-frame" style="margin-left:6px">Extract frame @1s (WebCodecs)</button>
<canvas id="dev-wc-canvas" style="max-width:100%;border:1px solid var(--border);border-radius:8px;margin-top:8px;display:none"></canvas>
<pre id="dev-wc-out" class="util-out" style="white-space:pre-wrap;word-break:break-word;margin-top:10px">Click to run.</pre>
```

### Dispatch
- `handleExtraAction` (~line 12468):
  ```js
  case 'dev-wc-frame': { await runWebCodecsFrameExtract(); return true; }
  ```
- `handleClick` â†’ `handleAction()` â†’ `handleExtraAction()` is wired normally (same path as the working Phase B button).

### Function
- `runWebCodecsFrameExtract()` â€” `app.js` lines **5505â€“5654**.
- Intended behaviour:
  1. Lazy-load MP4Box if needed.
  2. Fetch + demux `samples/demo-gradient.mp4`.
  3. Build the same AVC `description` as Phase B.
  4. Decode samples with `cts/1e6 <= 1.5 s` into a `frames[]` array.
  5. Pick the last frame with `timestamp/1e6 <= 1.0 s`.
  6. Draw it to `#dev-wc-canvas`, report elapsed ms / frame count.
  7. On any failure, fall back to a detached `<video>` element, seek to 1 s, draw to the canvas, report fallback timing.
  8. Finally `out.textContent = lines.join('\n')`.

---

## 5. The bug (what to fix next)

**Symptom:** clicking *Extract frame @1s (WebCodecs)* (or calling `window.__runFrame()`) returns, but `#dev-wc-out` stays at `"Click to run."`. No console errors, no toasts, canvas stays hidden.

**What is confirmed:**
- The button exists and the click handler runs (`window.__runFrame()` is callable).
- `window.__runFrame.toString()` shows the current `v=115` code, so cache is not the issue.
- `#dev-wc-out` exists (`document.getElementById('dev-wc-out')` returns an element).
- Phase B (`runWebCodecsDecode`) works on the same clip with the same `description` construction.

**Most likely causes (in order):**
1. **The function never reaches the final `out.textContent` line** because one of the awaited promises never settles. The two candidates:
   - `await dec2.flush()` hanging after a decoder error (the `error:` callback only pushes a string; it does not reject the flush).
   - The HTML-video fallback hanging on `seeked`: a detached video whose `currentTime` is set on `loadedmetadata` may never fire `seeked` without being attached / preloaded (also note the listener order: `loadedmetadata` may fire before the `seeked` listener is relevant, but `seeked` is separate).
2. **The first stray `VideoDecoder`** (`const decoder = new VideoDecoder({ error: (e) => { throw e; } })`) is configured but never used or closed. Throwing inside the `error` callback is an uncaught async throw, which will not be caught by the surrounding `try/catch`. It is dead code and should be removed.
3. **`dec2.flush()` rejection** would be caught by the outer `try`, but if the fallback then hangs, the output is never written.

**Note on `out`:** it is captured at function start; because the WebCodecs view is not re-rendered during the run, it should be the live element. Still worth asserting `out` is non-null before the final write.

---

## 6. Recommended fix / debug steps

1. Remove both temporary debug hooks (`window.__runFrame` at ~5506 and ~5655).
2. Delete the dead first decoder; keep only `dec2`. Attach the error callback to `dec2` and capture errors in an array.
3. Add early progress writes to `out` so a hang is visible:
   ```js
   const log = (s) => { out.textContent = lines.concat(s).join('\n'); };
   ```
   Call `log('fetchingâ€¦')`, `log('demuxedâ€¦')`, `log('decodingâ€¦')` etc.
4. Guard `flush`:
   ```js
   try { await dec2.flush(); } catch (e) { lines.push('flush failed: ' + (e?.message || e)); throw e; }
   ```
5. Make the fallback robust:
   - Append the `<video>` to `document.body` off-screen (`position:fixed;left:-9999px`), set `preload='auto'`, `muted`, `playsInline`.
   - Wait for `loadeddata` (not just `loadedmetadata`), then set `currentTime`, then wait for `seeked` with a timeout (e.g. 3 s).
   - Remove the element afterwards.
6. Ensure the canvas is visible (`canvas.style.display = 'block'`) and that `chosen` is still open when `drawImage` runs (i.e. close it only after drawing â€” current code does draw then close, good).
7. Verify with:
   - `node --check`
   - Browser: Dev Tools â†’ WebCodecs â†’ *Extract frame @1s*, wait ~2 s, read `#dev-wc-out`, check console.
   - Expect lines like `Extracted frame at ~1.00s`, `WebCodecs time: â€¦ ms`, `Frames decoded: â€¦`.
8. Bump `app.js?v=116` in `web/index.html`.
9. Mirrored deploy (see Â§2). Suggested commit message: `WebCodecs Phase C: frame extraction at 1s with HTML-video fallback`.
10. Update this file / `NEXT_SESSION_NOTES.md` with the final state.

### Quick browser test recipes
```js
// open Dev Tools â†’ WebCodecs, then:
document.querySelector('[data-action="dev-wc-frame"]').click();
// wait ~2 s
document.getElementById('dev-wc-out').textContent;
document.getElementById('dev-wc-canvas').style.display;
```

Reading output via the browser tool in the agent harness:
- Focus tab on `http://localhost:4173/`.
- Click *Dev Tools*, then *WebCodecs*, then the extract button.
- `Start-Sleep -Seconds 6` before reading `#dev-wc-out` (the harness `evaluate` returns immediately).

---

## 7. Where things are (line numbers as of `app.js?v=115`)

| Item | Line |
|---|---|
| WebCodecs UI block (`devToolsView`) | ~5300â€“5325 |
| `runWebCodecsDiag()` | ~5321 |
| `runWebCodecsDecode()` (working Phase B) | ~5360â€“5470 |
| `runWebCodecsFrameExtract()` (WIP Phase C) | 5505â€“5654 |
| Debug hook #1 | 5506 |
| Debug hook #2 | 5655 |
| `handleExtraAction` `dev-wc-*` cases | ~12466â€“12470 |
| â€œWebCodecsâ€ dev tab button | search `data-devtab="webcodecs"` / `'WebCodecs'` |
| Cache-bust | `web/index.html` line ~953 (currently `v=115`) |

---

## 8. Project status snapshot / other roadmap items

Everything before WebCodecs is committed and pushed. Recently completed:
- Video editor keyframes Phases 1â€“3 (opacity/size, x/y/volume, easing + split/reorder + preview).
- ONNX inpaint Phases Aâ€“C (preset-aware pipeline, tiled inference + blending, WebGPU option + progress + disclosure).
- WebCodecs Phase A (mp4box vendored, diagnostic) and Phase B (240 frames / ~270 ms / ~889 FPS).

Still open (see `NEXT_SESSION_NOTES.md` Â§7 for detail):
- WebCodecs Phase C (this file) â€” then optional integration into converter/compressor with FFmpeg fallback.
- Metadata stripping verification against the actual output.
- Output-size estimate for the image converter.
- Full multi-track timeline polish, Auto Reframe tracking, Local AI Model Manager actions, workflow branching/merge, batch rename, clipboard assistance, usage stats, long-file waveform streaming, smart-drop suggestions.
- Native/Tauri appearance (no cargo/rustc in this environment).

---

## 9. Gotchas

- `web/assets/js/app.js` has no build step; edit and reload `http://localhost:4173/`.
- Always bump `app.js?v=NN` after editing JS, otherwise the browser serves a cached module.
- Do not break the FFmpeg conversion path; WebCodecs must remain an optional fast path with fallback.
- Remove temporary debug hooks and `console.log`s before commit.
- Never push `web/assets/js/app.corrupt.bak` if it reappears.
- The workspace is not a git repo â€” commit from `D:\GitHub\NuVerter`.

