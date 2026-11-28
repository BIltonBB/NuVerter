# NuVerter Handoff - 2026-11-10 - AI Tools (real ONNX pipelines)

## Session objective
Finish the AI Tools that had been left as placeholders: implement what is feasible in the
browser, and mark genuinely oversized models as desktop-only instead of faking output.

## Current state
- Working copy: `D:\Websites\Universal Converter` (NOT a git repo)
- GitHub mirror: `D:\GitHub\NuVerter` (commit + push from here)
- Branch: `main`
- Latest commit: `ff7c67f` - "Point desktop-only AI notices at AI Tools models"
- Cache bust: `web/index.html` -> `assets/js/app.js?v=262`
- `node --check web/assets/js/app.js` passes
- All 53 AI Tools tabs render; no application console errors (ORT emits harmless
  `constant_folding.cc` warnings to console.error - filter them out when checking)

## Implemented and verified this session

### 1. Real LaMa inpainting (AI Tools -> Inpainting)
- File: `web/assets/js/app.js`
- Functions: `utilInpaintBody()`, `utilInpaintLoad()`, `utilInpaintPoint()`,
  `utilInpaintClear()`, `utilInpaint()`, plus `var NU_INPAINT` state.
- UI: image picker -> base canvas + overlay mask canvas -> brush size slider ->
  Clear mask -> Inpaint. Pointer events are delegated at document level and use
  `setPointerCapture` so strokes keep working outside the canvas.
- Pipeline: resize image + mask to 512, feed LaMa, resize result back, composite the
  model output through a blurred mask so unmasked pixels stay at full resolution.
- Model: `https://huggingface.co/Carve/LaMa-ONNX/resolve/main/lama_fp32.onnx` (~200MB)
- Tensor contract (confirmed from the Carve demo Space):
  - input `image`: `[1,3,512,512]` float32, 0..1
  - input `mask`: `[1,1,512,512]` float32, 1 = hole
  - output: `[1,3,512,512]`, values 0..255
- Verified in browser: loaded a 256x256 test image, painted a stroke, ran inference,
  downloaded `inpainted.png`, sampled output pixels (not black / not garbage).

### 2. Real DDColor colorization (AI Tools -> Colorize)
- Function: `utilColorize()` plus Lab helpers `nuRGBToLab()`, `nuLabToRGB()`,
  `nuSrgbToLinear()`, `nuLinearToSrgb()`.
- Model: `https://huggingface.co/edgetools/ddcolor/resolve/main/ddcolor-tiny-fp16.onnx` (~135MB)
- Tensor contract (from the edgetools model card):
  - input: `[1,3,512,512]` float32, rebuilt grayscale RGB from L only (a=b=0),
    no ImageNet normalisation
  - output: `[1,2,512,512]` float32 = ab chroma
  - keep full-resolution L, bilinear upscale ab, Lab -> RGB
- Added a heuristic: if max |ab| <= 2 the export is normalised to [-1,1] and is
  multiplied by 110 (Lab units); otherwise assumed already in Lab units.
- Verified in browser: 96x96 grayscale gradient -> "Colorized 96x96. Downloaded colorized.png."

### 3. DSP stem separation (AI Tools -> Stem separation)
- Functions: `utilStemSepBody()`, `utilStemSep()`, `nuEncodeWav()`.
- Mid/side center extraction with a "Center width" slider.
- Exports `vocals.wav` (mid) and `instrumental.wav` (side), generated fully offline.
- This replaces the old fake HTDemucs placeholder. AI 4-stem is explicitly called out
  as desktop-only in the UI copy.
- Verified with a synthetic stereo WAV; both download links appear.

### 4. Procedural music generator (AI Tools -> Music gen)
- Functions: `utilMusicGenBody()`, `utilMusicGen()`, `nuEncodeWav()`.
- Controls: key, tempo, bars, mood -> chord progression + bass + melody + drums,
  synthesized with simple oscillators/noise and exported as `composition.wav`.
- This replaces the old "MusicGen ~2GB pending" placeholder. Real text-to-music
  (MusicGen) is called out as desktop-only.
- Verified: "Generated 8 bars at 110 BPM".

### 5. Desktop-only gates (no fake output)
- Helper: `desktopOnlyNotice(toolName, modelSize, detail)`.
- Used by `utilVoiceCloneBody()`, `utilTalkingHeadBody()`, `utilImg2ImgBody()`.
- Web: "Desktop only" panel + "Get desktop app" button.
- Desktop: "Desktop engine required ... add it under AI Tools -> Models".
- These tools intentionally do NOT pretend to run.

## Bugs found and fixed (important)
1. **ONNX Runtime CDN URL was 404** - `getOrt()` imported
   `onnxruntime-web@1.21.0/dist/esm/ort.min.js`, which does not exist. This silently
   broke face restore and Real-ESRGAN. Fixed to
   `https://cdn.jsdelivr.net/npm/onnxruntime-web@1.21.0/dist/ort.min.mjs`.
2. **GFPGAN model URL was 404** - `sidkonduru/gfpgan-v1.4-onnx` no longer resolves.
   Switched to `https://huggingface.co/HowToSD/GFPGAN-ONNX/resolve/main/GFPGANv1.4.onnx`
   (~340MB; label updated from 170MB).
3. **GFPGAN output range** - `tensorToImage()` now samples the tensor and handles
   [-1,1], [0,1], or [0,255] outputs instead of assuming [-1,1].
4. **Model caching** - `loadOnnxModel()` was re-downloading on every run. Replaced with
   `fetchModelBuffer()` which streams download progress and stores bytes in
   Cache API (`nuverter-models-v1`), so models survive reloads.

## Verified working model URLs
| Tool | URL | Size |
|------|-----|------|
| Face restore (GFPGAN v1.4) | `huggingface.co/HowToSD/GFPGAN-ONNX/resolve/main/GFPGANv1.4.onnx` | ~340MB |
| Real-ESRGAN 4x | `huggingface.co/openpixels-app/browser-models/resolve/main/realesrgan_x4plus_w16.onnx` | ~34MB |
| LaMa inpainting | `huggingface.co/Carve/LaMa-ONNX/resolve/main/lama_fp32.onnx` | ~200MB |
| DDColor tiny | `huggingface.co/edgetools/ddcolor/resolve/main/ddcolor-tiny-fp16.onnx` | ~135MB |

Real-ESRGAN verified: "Upscaled to 256x256". Face restore verified: "Face restored".

## Still not implemented (honest)
- Voice cloning: Coqui XTTS-class model, ~2GB. Needs a native/desktop model backend.
- Talking head: Wav2Lip / SadTalker, 1GB+. Needs native video pipeline.
- Image-to-image: needs a VAE *encoder* + the 2.5GB SD-Turbo weights. The existing
  `web/assets/js/ai-image.js` engine only ships `vae_decoder`, so img2img cannot reuse it yet.
- True AI 4-stem separation (HTDemucs): ~166MB+ ONNX, complex STFT/ISTFT pipeline.

## Next steps (suggested)
1. If desktop-exclusive AI is required: add a native inference bridge (e.g. a bundled
   Python/Ollama-style sidecar or a Rust ONNX runtime) rather than loading >1GB in the
   WebView. Then wire `desktopOnlyNotice` tools to it.
2. Add `vae_encoder/model.onnx` to `LOCAL_MODEL_SPEC` in `web/assets/js/ai-image.js`
   and implement img2img with a strength/noise parameter.
3. Optional: tiled LaMa inference (the Image Editor already has a tiled implementation at
   `imageEditorOnnxInpaintApply()` - reuse it for large images).
4. Optional: replace DSP stem split with a real HTDemucs ONNX pipeline on desktop.

## Gotchas for the next session
- `web/assets/js/app.js` is ~1.05MB and uses CRLF. Python patch scripts must read with
  `open(p, encoding='utf-8')` (universal newlines) and write the same way; `newline=''`
  breaks line-ending regexes.
- Always bump `?v=NN` in `web/index.html` after editing `app.js`.
- Hash-only navigation (`#aitools` -> `#aitools`) does NOT reload the module; use a full
  reload when testing JS changes.
- The dev server is `node web/server.cjs 4173`; app at `http://localhost:4173`.
- The working copy is not a git repo; copy changed files to `D:\GitHub\NuVerter` then
  `git add -A; git commit; git push origin main`. PowerShell prints a benign
  `NativeCommandError` on push even when it succeeds.
- ORT console noise: filter messages containing `onnxruntime` or `constant_folding`.

## Files changed this session
| File | Change |
|------|--------|
| `web/assets/js/app.js` | `getOrt` URL fix, `fetchModelBuffer`, DDColor, LaMa inpaint UI, DSP stems, procedural composer, desktop gates, GFPGAN URL/range |
| `web/index.html` | `app.js?v=262` |
| `D:\GitHub\NuVerter` | commits `20e1558`, `ff7c67f` pushed to `main` |

## Quick test recipe (browser)
1. `node web/server.cjs 4173`
2. Open `http://localhost:4173/#aitools`
3. Inpainting: choose image -> paint -> Inpaint -> expect `inpainted.png`
4. Colorize: choose grayscale -> Colorize -> expect `colorized.png`
5. Stem: choose audio -> Separate -> expect vocals/instrumental WAV links
6. Music gen: pick key/tempo -> Generate -> expect audio preview + `composition.wav`
