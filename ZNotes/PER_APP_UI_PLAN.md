# NuVerter — Per-App Specialized UI Plan

Status: **Phases 1-5 implemented (Media/Documents/AI/Developer workspaces); Phase 6 polish partial; Phase 7 verification in progress**
Created: 2026-11-06
Supersedes: the mid-turn "deepen all four apps" edits (reverted; see §0)

---

## 0. What was reverted (record)

The previous attempt at deepening the app dashboards was stopped mid-turn and rolled back.
Workspace was restored to match the pushed mirror commit `696b6bd` (`app.js?v=212`).

Removed / reverted:

- Rewritten `appDashboardView()` with `app-hero` + `app-tool-card` markup.
- New `web/assets/css/app-dashboard.css`.
- `<link rel="stylesheet" href="assets/css/app-dashboard.css?v=1">` in `web/index.html`.
- `launch-all` handler change that forced `setTool('converter')` when leaving an app view.

Kept (already committed and working):

- `APP_DASHBOARDS` registry + four app dashboard tools (`mediaapp`, `docsapp`, `aiapp`, `devapp`).
- Launch overlay with 4 app cards, `launch-all` footer button.
- `CATEGORY_GROUPS` / `applyCategoryFilter` nav scoping, persisted as `NuVerter-category`.
- Phase-1 "Smart suggestions" toast on app pick (`CATEGORY_SUGGESTIONS`).
- `app-open-tool` action opening a tool from a dashboard card.

The revert is intentional: the next attempt must be designed against the real tool flows,
not layered on top of a markup sketch.

---

## 1. Goal

Each of the four launch apps should feel like a **different product workspace**, not the
same grid of tool cards with a different title:

| App | Feel | Primary surface |
|---|---|---|
| Media Studio | Editing bay / batch pipeline | persistent queue + preview + inspector |
| Documents | Document desk | file/page list + operation rail + output |
| AI Lab | Chat-first assistant | conversation + model + attachments |
| Developer Tools | Command console | input editor + operation + output |

Meanwhile:

- **"Show all tools" must keep the original unified NuVerter UI exactly as it is today.**
  It is the escape hatch back to the classic tool list + converter landing.
- No existing tool may lose functionality. Specialized UIs wrap the existing views/actions;
  they do not fork the conversion engine.
- Deep links and browser back/forward must keep working.

### Non-goals

- No new conversion engine, model, or backend work in this plan.
- No renames of existing tools, nav groups, or localStorage keys that would drop user data.
- No second parallel tool implementation. If a specialized UI needs an action, it calls the
  existing handler / `setTool()` / engine function.

---

## 2. Research to do before building (Phase 0)

Do this first; do not skip straight to markup.

### 2.1 Code audit

- Map every tool action in `handleClick` and every `data-action` used by the four app tool sets.
- List which tools already have a persistent file/result area and which are one-shot forms.
- Identify shared primitives already present: `viewHead`, `.tool-grid`, `.launch-card`,
  `.dropzone`, `renderQueue`, history/result records, `toast`, `openModal`.
- Confirm which tools are safe to embed vs must stay full views (e.g. video editor is
  layout-heavy and should probably remain a full view opened from Media, not embedded).

### 2.2 Interaction patterns (desk research)

Use established patterns, not novelty:

- **Workspace-first apps** (Adobe/Resolve/Figma): left rail = assets/layers, center = canvas,
  right = inspector. Progressive disclosure; no dead ends.
- **Chat-first apps** (ChatGPT/Claude/Linear AI): composer anchored bottom, thread history
  left, context chips above composer, tool results inline as cards.
- **Developer consoles** (Raycast/Postman/DevTools): command/search first, input → output
  split, copy/download always visible, recent operations.
- **Empty states**: one primary action + 2–3 secondary examples; never an empty grid.
- **Mobile**: panels become bottom sheets/tabs; no horizontal scrolling for primary actions.

### 2.3 Decisions to confirm with the user after research

1. Should Media Studio's queue be the **same** converter queue (shared state) or a
   dashboard-only "recent files" list? (Recommend: share the real queue.)
2. Should AI Lab default to **chat**, or to a tool launcher with chat as one option?
   (Recommend: chat, with a tool rail.)
3. Should Documents support **multi-file** operations in v1 (merge) or single-file first?
   (Recommend: multi-file only for merge/split; single-file elsewhere.)
4. Should the specialized UI be reachable from the **normal sidebar** as well as the
   launch overlay? (Recommend: yes — clicking the sidebar group header or a pinned
   "App home" item.)
5. Is embedding tool forms inside panels allowed, or must tools stay full-page?
   (Recommend: embed only lightweight forms; heavy editors stay full-page.)

---

## 3. Architecture

### 3.1 App registry (single source of truth)

Extend the existing `APP_DASHBOARDS` into a richer registry. Keep the same keys so
`#mediaapp` etc. keep working.

```js
const APP_DASHBOARDS = {
  mediaapp: {
    id: 'mediaapp',
    title: 'Media Studio',
    icon: 'film',
    index: 'A1',
    accent: 'media',
    layout: 'media',
    group: 'media',            // maps to CATEGORY_GROUPS
    defaultTool: 'converter',
    tools: [ ... ],
    nav: [ ... ]               // optional custom rail entries
  },
  docsapp: { layout: 'documents', ... },
  aiapp:   { layout: 'ai', ... },
  devapp:  { layout: 'developer', ... }
};
```

A single renderer dispatches on `layout`:

```js
function appView(key) {
  const app = APP_DASHBOARDS[key];
  switch (app.layout) {
    case 'media': return mediaWorkspace(app);
    case 'documents': return documentsWorkspace(app);
    case 'ai': return aiWorkspace(app);
    case 'developer': return developerWorkspace(app);
    default: return appDashboardView(key); // legacy fallback
  }
}
```

`renderView()` keeps its current shape and calls `appView()` for the four app keys.

### 3.2 Shared workspace primitives (build once)

New helpers in `app.js` (or a small `web/assets/js/workspaces.js` module if it stays
clean). CSS in a new `web/assets/css/workspaces.css`.

- `wsShell({ rail, main, inspector, status })` — responsive 2/3-pane layout.
- `wsPanel({ title, actions, body, scroll })`
- `wsEmpty({ icon, title, copy, primary, secondary })`
- `wsRailItem({ tool, icon, label, active })`
- `wsStatusBar({ left, right })`
- `wsResult({ record })` — uses existing history record shape (`name`, `size`, `url`, `mime`).
- `wsChips({ items })` — suggested next actions.

Rules: no inline styles for layout; all colors via existing CSS variables; honor
`prefers-reduced-motion` and `state.prefs.reduceMotion`.

### 3.3 State

Add one namespaced slice, persisted separately:

```js
state.appUi = {
  media: { pane: 'queue', selectedId: null, showInspector: true, filter: 'all' },
  docs:  { fileId: null, op: 'merge', page: 1 },
  ai:    { threadId: null, scope: 'general', attach: [] },
  dev:   { op: 'json', input: '', output: '', history: [] }
};
```

Persist only lightweight UI state under `NuVerter-appui` (debounced). **Do not** persist
file blobs or inputs that may contain secrets. Merge with defaults on load; tolerate
corrupt JSON.

Shared data stays where it already lives:

- Media queue → `state.queue` / `state.converter`.
- Documents files → reuse `state.pdftools` (or add a docs file list that points at the
  same File objects).
- AI chat → `state.aiChat` (`messages`, `model`, `attachments`).
- Dev input/output → new `state.appUi.dev` only (no engine changes).

### 3.4 Routing

- `#mediaapp`, `#docsapp`, `#aiapp`, `#devapp` → app workspace.
- Optional sub-route later: `#mediaapp/queue`, `#aiapp/chat`. v1 may keep a single route
  and internal state only.
- `setTool()` must not early-return when the tool is already active but the app view needs
  a refresh; keep the existing renderView forcing fix for sub-tools.
- Clicking a tool from the app rail calls `setTool(tool)` (full view), and the tool's
  "back to app" affordance returns to `#<app>`. Use browser back naturally; add an explicit
  back button in the view head for clarity.

### 3.5 "Show all tools" (must not regress)

Current behavior to preserve and harden:

1. `applyCategoryFilter(null)` → all nav groups visible.
2. Close the launch overlay.
3. Show the **classic unified UI**: converter landing + full sidebar. If currently on an
   app workspace, `setTool('converter')`.
4. Clear the saved category so a reload does not re-scope the nav.
5. Do **not** show the app workspace for "all".

Acceptance: from any of the four apps, Show all tools produces the same DOM/behavior as a
fresh user with no category selected.

---

## 4. Per-app designs

### 4.1 Media Studio (`mediaapp`)

Layout: 3 zones, collapsible on mobile.

```
┌ rail ─────┬ queue / dropzone ──────────────┬ inspector ─────┐
│ Convert   │  Add media / drop files         │ Selected file  │
│ Compress  │  [file row] [file row] ...      │ Format         │
│ Crop      │                                 │ Quality        │
│ Extract   │  batch toolbar (start/stop)     │ Output name    │
│ GIF/Audio │                                 │ Est. size      │
└───────────┴─────────────────────────────────┴────────────────┘
              results tray (download all / open folder)
```

- **Empty state**: big dropzone + "Add media" + "Load demo batch" + "From link"; below it,
  three quick-start cards (Compress video, Make GIF, Extract audio).
- **Queued state**: real `state.queue` rows (reuse `renderQueue` row markup where possible),
  batch actions, estimate output size already implemented.
- **Inspector**: format chips + quality + resolution + rename template; "Open full converter"
  link for advanced options.
- Result tray: recent outputs from `state.history` filtered to media tools; Download /
  Download all / Send to editor.
- Heavy editors (video editor, image editor) open as full views, not embedded.

Acceptance: add files → rows appear; start batch works; result appears in tray; app rail
switches to a tool; back returns to workspace with queue intact.

### 4.2 Documents (`docsapp`)

Layout: file/page rail + operation panel + output panel.

```
┌ files ───────┬ operation ─────────────────────┬ output ────────┐
│ [doc.pdf]    │ Merge / Split / Convert / OCR  │ result preview │
│ [scan.png]   │ options for chosen op          │ download       │
│ + Add        │ [Run]                          │ open           │
└──────────────┴────────────────────────────────┴────────────────┘
```

- Empty state: drop PDF/images, "Add documents", plus "Merge PDFs" and "OCR a scan" cards.
- Page thumbnails for PDFs (reuse existing PDF tool rendering if available); list fallback
  if thumbnails are expensive.
- Operation rail maps to existing `pdftools` operations; do not reimplement PDF logic.
- OCR lives in Utilities today — surface it here as an operation that opens the OCR tool
  preloaded with the selected file (or embed if the tool is lightweight enough).
- Multi-file only where the operation needs it (merge).

Acceptance: select files, run merge/split/convert, output downloadable; OCR route opens
with the file; no PDF code duplicated.

### 4.3 AI Lab (`aiapp`)

Layout: chat-first with a tool rail.

```
┌ threads ─────┬ conversation ───────────────────────────────┐
│ + New chat   │  message bubbles / tool result cards         │
│ [thread]     │                                              │
│              │  ┌ context chips: image, doc, tool ┐          │
│              │  │ composer + model picker + send  │          │
│              │  └─────────────────────────────────┘          │
└──────────────┴──────────────────────────────────────────────┘
   tool rail: Image gen · BG removal · Upscale · Embeddings · AI chat (full)
```

- Default tab: chat (uses existing `state.aiChat`, WebLLM status, model picker).
- Model picker must reflect real availability (no fake "installed" states).
- Context chips show attached files; attachments reuse existing `state.aiChat.attachments`.
- Non-chat AI tools are rail entries that open their full views (or inline result cards if
  already lightweight).
- Empty state: starter prompts scoped to the app plus "Open AI image tools".
- Streaming/busy state must use the existing `state.aiChat.busy` and not double-send.
- Per-app scoped chat (domain prompt) is a later phase; v1 is the existing chat in a
  better shell.

Acceptance: send a message, see streamed reply, model switch persists, attachment works,
rail opens tools, no duplicate chat state.

### 4.4 Developer Tools (`devapp`)

Layout: command console.

```
┌ operations ──┬ input ──────────────────────┬ output ────────┐
│ JSON format  │ textarea / file drop         │ result         │
│ Hash         │                              │ copy / download│
│ Base64       │ [Run]                        │ diff (if text) │
│ Regex        │                              │                │
└──────────────┴──────────────────────────────┴────────────────┘
   recent operations + saved snippets
```

- Operation list maps to existing dev/practical tools; selecting one shows its form but
  within the console shell where feasible.
- Output always has Copy, Download, and (for text) "Open as file".
- Keyboard: `Ctrl+Enter` runs; `Ctrl+K` focuses operation search (do not conflict with
  `Ctrl+L` launcher).
- Recent operations stored in `state.appUi.dev.history` (max ~20, no secrets persisted by
  default; add a "remember inputs" opt-in).
- Utilities/practical tools that are full workflows open as full views.

Acceptance: run JSON format/hash/base64, copy output, switch ops without losing output,
`Ctrl+Enter` works, no console errors.

---

## 5. Phased implementation

Each phase ends with: `node --check web/assets/js/app.js`, cache-bust bump in
`web/index.html`, localhost console errors = 0, and a mirror commit/push.

### Phase 0 — Research & confirmation (0.5 session)
- Complete §2 audit; write findings at the bottom of this file.
- Ask the five decisions in §2.3.
- Deliverable: confirmed scope + final per-app wireframes.

### Phase 1 — Shell + registry + shared primitives (1 session)
- Extend `APP_DASHBOARDS` with `layout`, `accent`, `group`, `defaultTool`.
- Add `appView()` dispatch and `ws*` primitives + `workspaces.css`.
- Keep `appDashboardView()` as fallback; no app-specific layout yet.
- Add `state.appUi` defaults + load/save with corruption tolerance.
- Acceptance: all four app routes still render (legacy dashboards), no regressions.

### Phase 2 — Media Studio (1–1.5 sessions)
- Left rail, queue pane reusing real queue, inspector, result tray, empty state.
- Batch actions wired to existing start/stop/clear handlers.
- Acceptance: §4.1.

### Phase 3 — Documents (1–1.5 sessions)
- File rail, page list/thumbnails, operation panel, output panel.
- Route OCR/file selection into existing tools.
- Acceptance: §4.2.

### Phase 4 — AI Lab (1.5 sessions)
- Chat shell, thread list (from `state.aiChat.messages` or a simple thread store),
  composer, model picker, attachments, tool rail.
- Acceptance: §4.3.

### Phase 5 — Developer Tools (1 session)
- Console shell, operation list, input/output, copy/download, run shortcut, recents.
- Acceptance: §4.4.

### Phase 6 — Unified-UI guard + polish (0.5–1 session)
- Harden `launch-all` (all nav visible, clear category, classic converter landing).
- Responsive: 3-pane → 2-pane → stacked/bottom-sheet.
- Focus states, aria labels, reduced motion, empty/loading/error states.
- Acceptance: §3.5 matrix passes; keyboard-only pass.

### Phase 7 — Verification & release (0.5 session)
- Manual test matrix (below), Tauri build/installer smoke check, mirror push.
- Update `ZNotes/NEXT_SESSION_NOTES.md` and this file's status.

Total estimate: ~7–9 focused sessions.

---

## 6. Risks & mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Duplicating tool logic in workspaces | Bugs, drift | Workspaces call existing actions/tools only; embed only lightweight forms |
| Shared queue state conflicts | Lost files / double processing | Treat `state.queue` as the single source; no copies |
| AI double-send / state race | Duplicate messages, cost | Reuse `state.aiChat.busy`; disable composer while busy |
| "Show all tools" regression | Lost classic UI | Explicit Phase 6 matrix; clear `NuVerter-category`; force converter landing |
| Mobile 3-pane unusable | Bad UX | Stacked layout + bottom sheets; test at 390/768/1280 |
| localStorage bloat/secrets | Privacy | Persist UI only; opt-in remember inputs; cap history |
| Cache-bust forgotten | Stale JS | Bump `app.js?v=` every phase; verify in devtools |
| Scope creep into engines | Delays | Non-goals in §1; engine work stays in `HIGH_EFFORT_ROADMAP.md` |

Rollback: each app layout is behind its `layout` value. If one misbehaves, set its
`layout` back to `'legacy'` to restore `appDashboardView()` without touching the others.

---

## 7. Test matrix

For each app and for "Show all tools":

- [ ] Load `?v=<new>` with cleared `NuVerter-category` / `NuVerter-launched`.
- [ ] Launch overlay → each app card → correct workspace.
- [ ] App rail → every listed tool opens; Back returns to workspace.
- [ ] Deep link directly to `#mediaapp` / `#docsapp` / `#aiapp` / `#devapp`.
- [ ] Reload preserves lightweight UI state; corrupt `NuVerter-appui` does not crash.
- [ ] Show all tools: all nav groups visible, classic converter landing, category cleared.
- [ ] Add/convert a media file (queue + result tray).
- [ ] Run one Documents op and one OCR route.
- [ ] Send one AI chat message; switch model; attach a file.
- [ ] Run one Developer op; copy output; `Ctrl+Enter`.
- [ ] Console errors = 0 on every route.
- [ ] Widths 390 / 768 / 1280: no horizontal overflow of primary controls.
- [ ] Reduced motion honored; keyboard focus visible.
- [ ] Tauri build smoke test (installer still builds; harmless signing warning).

---

## 8. Files touched (expected)

- `web/assets/js/app.js` — registry, `appView`, `ws*` helpers, `state.appUi`, handlers,
  `launch-all` hardening.
- `web/assets/css/workspaces.css` — new; add link in `web/index.html`.
- `web/index.html` — CSS link + `app.js?v=` bump (currently `v=212`).
- Possibly `web/assets/css/components.css` — only if a shared primitive genuinely belongs
  there; prefer `workspaces.css`.
- `web/assets/js/workspaces.js` — optional, only if `app.js` becomes unwieldy.
- `ZNotes/PER_APP_UI_PLAN.md` — status updates.
- `ZNotes/NEXT_SESSION_NOTES.md` — final session record.

Do **not** edit `web/assets/css/app-dashboard.css` (removed in the revert).

---

## 9. Definition of done

- Four visibly different workspaces, each optimized for its job.
- All existing tools reachable and functionally unchanged.
- "Show all tools" is byte-for-byte behaviorally the classic unified UI.
- No console errors; no horizontal overflow at target widths; reduced-motion respected.
- State persists safely and survives corrupt storage.
- Tauri installer still builds.
- Plan status updated + mirror pushed.

---

## 10. Research findings (fill in during Phase 0)

- [ ] Tool/action inventory:
- [ ] Tools safe to embed:
- [ ] Tools that must remain full views:
- [ ] Shared primitives confirmed:
- [x] User decisions from §2.3: Media=batch-first + link-only video editor; Documents=list fallback; AI=chat-first with inline tool results; Dev=recents only; Theming=shared tokens (per-app accent deferred to Phase 6).
- [x] Implementation progress (2026-11-07): Phases 1-5 implemented (Media/Documents/AI/Developer specialized workspaces), Phase 6 partial (launch-all hardening + aitab/devtab wiring). All 23 routes load with 0 console errors. Mirror pushed 50ac847.

- [ ] User decisions from §2.3 (original placeholder):
