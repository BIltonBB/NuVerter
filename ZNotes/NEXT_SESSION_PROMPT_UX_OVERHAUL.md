# NuVerter — Next Session Prompt: UX Overhaul (Settings Containment, Categories, Mobile, Searchable Selectors)

> **Read first:** `ZNotes/NEXT_SESSION_NOTES.md` (full project record) → `ZNotes/NEXT_SESSION_NOTES_2026-11-03_WebCodecs.md` (latest handoff) → `ZNotes/GOOD IDEAS.md` (roadmap spec).  
> **Workspace:** `D:\Websites\Universal Converter` (NOT a git repo). **Mirror:** `D:\GitHub\NuVerter` → push to `main`.  
> **Local server:** `node web/server.cjs 4173` → http://localhost:4173/.  
> **Cache-bust:** bump `app.js?v=NN` in `web/index.html` after any JS change.

---

## 0. Mission (one sentence)

Make NuVerter feel like a real desktop media suite (Chipchamp/CapCut-class): **timeline is the main surface**, settings are **contained in collapsible/inspector panels**, the **nav is grouped into more, clearer categories**, **mobile text and layout stop breaking**, and **multi-tool selectors (Utilities) become searchable** — **without breaking any existing feature**.

This is a **UI/UX-only** pass. Do not rewrite processing engines, FFmpeg args, or state models unless a layout change strictly requires it.

---

## 1. Verified baseline (do not regress)

As of this prompt the app is healthy:

- `node --check web/assets/js/app.js` → exit 0.
- Browser smoke (all 18 nav tools) → 0 console errors.
- WebCodecs Phase C works: Dev Tools → WebCodecs → "Extract frame @1s" prints `WebCodecs time: ~309 ms`, `Frames decoded: 240`, canvas shows frame.
- Mirror `D:\GitHub\NuVerter` is clean and in sync with workspace (hash-verified).
- Cache-bust is `app.js?v=183`.

**Before touching anything:** re-run `node --check` and the 18-tool smoke test. If either fails, stop and fix that first.

---

## 2. Problems to solve (concrete, with where they live)

### P1 — Settings are not contained (video editor is the worst case)

**File:** `web/assets/js/app.js` → `videoEditorView()` (~line 8980). `web/index.html` nav groups.

Current layout: the left column stacks `Source`, `Adjustments`, `Text overlay`, `Layers/Overlays` cards, and the right column stacks `Timeline`, `Audio volume keyframes`, `Trim & crop`, `Undo/Redo`, `Export`. The timeline is buried among settings, and the "Layers/Overlays" card even contains a *second* mini timeline. This is backwards: in Clipchamp/CapCut the **timeline is the dominant bottom strip**, the **preview is center/top**, and **properties live in a right-side inspector that changes with selection**.

**Target (Clipchamp/CapCut-style):**
- Top: thin toolbar (play/pause, timecode, export, undo/redo).
- Center: preview canvas with overlay, large.
- Bottom: full-width multi-track timeline (video / overlays / audio) with ruler + playhead — this is the visual anchor.
- Right (or collapsible drawer on narrow screens): **inspector** with tabs/sections — `Adjust`, `Text`, `Audio`, `Trim & Crop`, `Export`. Each section is a collapsible card (`<details>`-style) so only one is open by default. On mobile, inspector becomes a bottom sheet.
- Remove the duplicate mini-timeline inside "Layers/Overlays"; the timeline is the single source of truth.
- Other tools with the same disease (Image Editor, Cropper, Compressor settings) get the same treatment: primary surface first, settings in a collapsible/inspector panel.

**Acceptance:** timeline is visible without scrolling on a 1080p viewport; no settings card sits above the timeline in the DOM order for the video editor; all existing actions (play, scrub, drag overlay, keyframes, export) still work.

### P2 — Nav needs more, clearer categories

**File:** `web/index.html` nav groups (lines ~660–767). `web/assets/js/app.js` `TOOLS` (~511).

Current groups: `Workspace` (4), `Create` (3), `Tools` (8 — too many, mixed), `AI` (2), `More` (2), `Library` (1). "Tools" is a junk drawer and `Practical`/`Utilities`/`Dev Tools` overlap conceptually. Index numbers are also off (`audiotools` and `aitools` both `12`).

**Target:** regroup into ~6–7 collapsible sections, each ≤5 items, with clear labels:
- `Convert` — Universal Converter, Video Compressor, Video Cropper, Audio Extractor
- `Create` — GIF Maker, Screen Recorder, Subtitle Editor, Text card (move text tools here?)
- `Edit` — Image Editor, Video Editor, Auto Reframe, Workflows
- `Audio` — Audio Tools, Waveform, Silence trim, Audio clean, TTS
- `Documents` — PDF Tools, OCR
- `Developer` — Dev Tools, Utilities, Hash, JSON mock, PII scrub
- `AI` — AI Tools, AI Chat, AI BG, AI Upscale, Embeddings
- `Library` — Session History

Make each `<div class="nav-group">` collapsible (click label to toggle, persist state in localStorage). Keep the existing `nav-search` filter working and make it also filter by category.

**Acceptance:** no group has >6 items; search filters both tools and group labels; collapsed state persists across reload.

### P3 — Mobile support: text too small / overflow

**Files:** `web/assets/css/responsive.css`, `web/assets/css/base.css`.

Base font is 13px and many labels are 10–10.5px. On phones these are hard to read; some fixed widths (`width:80px` inputs) and `white-space:nowrap` chips overflow.

**Target (mobile-first text pass):**
- Raise mobile base font to 14px at `≤720px`.
- Bump the smallest labels (10px → 12px minimum) in `responsive.css` for `≤720px`.
- Ensure every `.btn`, `.nav-item`, `.field-label` has `min-height: 36px` tap target on touch.
- Fix overflow: inputs with fixed widths get `max-width:100%`; long tool names wrap with `word-break: break-word`.
- Verify no horizontal scroll at 360px width (iPhone SE) for: Converter, Utilities, Video Editor, Dev Tools.

**Acceptance:** Lighthouse-ish manual check: no horizontal scrollbar at 360px; body text ≥12px; all primary buttons ≥36px tall.

### P4 — Multi-tool selectors are ugly and not searchable (Utilities)

**File:** `web/assets/js/app.js` → `utilitiesView()` (~4185). Also `devToolsView`, `aiToolsView`, `practicalView`, `audioToolsView`, `pdfToolsView` if they use the same pattern.

Current: groups of segmented buttons (Media/Audio/AI/Text). Works but not searchable, wraps badly on mobile, and `textimage` appears in both Media and Text groups (duplicate).

**Target:** replace the segmented-button groups with a **searchable combobox**:
- A search input at top of the utilities view (`<input type="search" placeholder="Search tools…">`).
- A horizontally scrollable row of category chips (Media, Audio, AI, Text, All) that filters.
- The selected tool shown as an active chip with an "×" to clear.
- Keyboard: ↑/↓/Enter to navigate, Esc to close.
- Reuse the existing command-palette search logic if possible (`Ctrl+K`).

Also fix the duplicate `textimage` entry.

**Acceptance:** typing "hash" filters to File hash; arrow keys navigate; Enter selects; Esc clears search; no duplicate tabs; works on mobile (input full width).

---

## 3. Hard constraints (do NOT violate)

1. **No feature regression.** Every tool, button, action, export, and shortcut must still work. Run the smoke test after each phase.
2. **Local-first.** No new cloud/paid APIs. No new CDN deps unless already used.
3. **Single-file app.** All JS stays in `web/assets/js/app.js`. CSS in `web/assets/css/*`. Markup in `web/index.html`.
4. **Patch pattern.** New UI follows: state → view → bind → action → registerOutput. See `NEXT_SESSION_NOTES.md` §3.
5. **State is module-private.** Do not put state on `window`. Temporary debug hooks must be removed before commit.
6. **Bump cache-bust** `app.js?v=NN` after JS changes.
7. **Remove stray `app.corrupt.bak`** if it reappears; never push it.
8. **PowerShell:** use `;` not `&&`; trust `node --check` / `$LASTEXITCODE`.

---

## 4. Suggested phased plan (get approval before Phase 2+)

### Phase 0 — Safety net (no UI changes)
- Run `node --check`, 18-tool smoke, capture baseline screenshots of: Video Editor, Utilities, a mobile viewport (360px).
- Create `web/assets/css/ux-overhaul.css` (new file) and include it in `index.html` so overrides don't pollute existing sheets. Actually prefer editing existing sheets; new file only if needed.

### Phase 1 — Mobile text pass (lowest risk, highest value)
- Edit `responsive.css` `≤720px` and `≤480px` blocks: base font 14px, min label 12px, tap targets ≥36px, fix fixed-width inputs.
- Test at 360px, 768px, 1024px, 1440px.

### Phase 2 — Nav categories + collapsible groups
- Edit `index.html` nav groups per §P2.
- Add collapse toggle JS (small module in app.js) + localStorage persistence.
- Update `nav-search` filter to also match group labels.
- Fix duplicate index numbers.

### Phase 3 — Searchable utility selector
- Rewrite `utilitiesView()` tab selector per §P4.
- Apply same component to Dev Tools / AI Tools / Practical / Audio Tools / PDF Tools if they share the pattern.
- Fix duplicate `textimage`.

### Phase 4 — Settings containment (Video Editor first)
- Restructure `videoEditorView()` per §P1 (preview top, timeline bottom full-width, inspector right/bottom-sheet).
- Move `Adjustments`, `Text overlay`, `Audio keyframes`, `Trim & crop` into inspector sections.
- Remove duplicate mini-timeline.
- Then apply the same inspector pattern to Image Editor and Cropper.

### Phase 5 — Verify & ship
- `node --check` → 0.
- Full smoke: 18 tools, key flows (convert one file, edit image, trim video, export), mobile 360px.
- Bump `v=`.
- Mirror → commit → push.
- Update `NEXT_SESSION_NOTES.md` and this file with final state.

---

## 5. Research notes: how Clipchamp/CapCut organize (for the agent)

- **Preview** is the large center canvas; **timeline** is a full-width strip at the bottom with tracks (video, overlay/text, audio) and a red playhead.
- **Properties/inspector** is a right column that is **contextual** (shows settings for the selected clip) and **collapsible**; it never competes with the timeline for vertical space.
- **Top bar** holds play/pause, timecode, undo/redo, export — not settings.
- **Left rail** holds media/text/audio/effects pickers.
- On mobile, the inspector becomes a **bottom sheet**, timeline stays horizontal-scrollable, and preview shrinks but stays above timeline.

Apply this mental model; do not invent a new layout language.

---

## 6. Files you will touch

| File | Why |
|---|---|
| `web/index.html` | nav groups, cache-bust, CSS include |
| `web/assets/js/app.js` | `videoEditorView`, `utilitiesView`, dev/ai/practical/audio/pdf views, nav collapse JS, tab selectors |
| `web/assets/css/responsive.css` | mobile text + tap targets + overflow |
| `web/assets/css/base.css` | base font (careful: affects desktop too) |
| `web/assets/css/views.css` | inspector/timeline layout classes |
| `web/assets/css/components.css` | collapsible cards, combobox, chips |

---

## 7. Acceptance criteria (definition of done)

- [ ] `node --check` passes.
- [ ] 18-tool smoke test: 0 console errors.
- [ ] Video Editor: timeline visible without scroll at 1080p; no settings card above timeline; all actions work; export still produces file.
- [ ] Utilities: searchable combobox works (type/arrow/enter/esc); no duplicate tabs; mobile full-width input.
- [ ] Nav: ≤6 items per group; groups collapsible + persisted; search filters groups.
- [ ] Mobile at 360px: no horizontal scroll on Converter, Utilities, Video Editor, Dev Tools; body text ≥12px; primary buttons ≥36px.
- [ ] No stray debug hooks or `console.log`.
- [ ] Mirror synced, committed, pushed.
- [ ] `NEXT_SESSION_NOTES.md` + this file updated with final state.

---

## 8. Open questions for the user (ask before Phase 2+)

1. Should `Utilities` stay one tool with a searchable selector, or be split into individual nav items (Frames, Hash, Favicon, …)? Splitting increases nav length but removes the selector entirely.
2. Inspector placement on desktop: right column (CapCut) or collapsible right drawer (saves width)? 
3. Mobile bottom sheet: use native `<dialog>` or a custom slide-up? (Custom gives more control but more code.)
4. Keep the ad bar on mobile? It eats vertical space; hiding it frees room for the timeline.

---

## 9. First action

1. Re-verify baseline (`node --check` + smoke).
2. Ask the user the 4 questions in §8 (or proceed with recommended defaults: keep Utilities as one tool with searchable selector; right-column inspector; custom bottom sheet; keep ad bar).
3. Propose the Phase 1 diff before coding (per `GOOD IDEAS.md`).
4. After approval, code Phase 1 → smoke → Phase 2 → … 

**Do not start Phase 4 (video editor restructure) without explicit approval — it touches the most-used tool.**
