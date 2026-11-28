# Archived — advertisement bar & advertising modal

Removed from the web build on 2026-11-25. The desktop (Tauri) shell shares `web/`,
so the bar is gone there too. Nothing here is loaded by the app anymore.
Restore by re-adding the markup/CSS/JS below (and the `--adbar-h` variable).

## Markup (`web/index.html`)

```html
<footer class="adbar" aria-label="Advertisement space">
  <span class="ad-label">Advertisement</span>
  <span class="ad-divider"></span>
  <span class="ad-copy">A quiet slot for a privacy-respecting partner. <span class="ad-size">970 × 90</span></span>
  <button class="ad-action" data-action="advertise">
    Advertise
    <svg class="icon"><use href="#i-arrow-right" /></svg>
  </button>
</footer>
```

## CSS (`web/assets/css/base.css`)

```css
--adbar-h: 58px; /* on :root */

/* ---------- ad slot ---------- */
.adbar {
  position: relative;
  z-index: 20;
  flex: none;
  height: var(--adbar-h);
  padding: 0 24px;
  display: flex;
  align-items: center;
  gap: 13px;
  border-top: 1px solid var(--border);
  background: var(--bg-2);
  color: var(--text-3);
  font-size: 10.5px;
}
.ad-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: .15em;
  text-transform: uppercase;
  color: #6b6b75;
}
.ad-divider { width: 1px; height: 18px; background: var(--border); }
.ad-copy { flex: 1; min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.ad-size { font-family: var(--font-mono); font-size: 10px; color: #6b6b75; margin-left: 5px; }
.ad-action {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 8px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--text-2);
  font-size: 10.5px;
  font-weight: 550;
  transition: background .16s, color .16s;
}
.ad-action:hover { background: var(--surface-hover); color: var(--text); }
.ad-action .icon { width: 11px; height: 11px; }
```

Responsive rules (`web/assets/css/responsive.css`):

```css
:root { --adbar-h: 54px; } /* @media (max-width: 1024px) */
:root { --adbar-h: 50px; } /* @media (max-width: 720px) */
.toast-stack { bottom: calc(var(--adbar-h) + 12px); }
.adbar { gap: 8px; padding: 0 14px calc(0px + env(safe-area-inset-bottom)); font-size: 11px; }
.ad-size { display: none; }
.ad-copy { font-size: 11px; }
.ad-label { font-size: 11px; }
.ad-divider { height: 14px; }
.ad-action { font-size: 11px; padding: 4px 3px; }
.ad-action .icon { display: none; }
.adbar { padding-left: 11px; padding-right: 11px; }
.ad-label { display: none; }
.ad-divider { display: none; }
.ad-copy { flex: 1; }
```

Other offsets that referenced the bar:

```css
/* components.css */
.toast-stack { bottom: calc(var(--adbar-h) + 16px); }
/* views.css */
.settings-card { max-height: calc(100dvh - var(--topbar-h) - var(--adbar-h) - 26px); }
```

## CSS (`web/assets/css/extra.css`)

```css
/* ---------- advertise ---------- */
.advertise-hero {
  padding: 14px;
  border: 1px solid var(--accent-border);
  border-radius: 11px;
  background: linear-gradient(130deg, var(--accent-soft), transparent 70%), var(--surface);
}
.advertise-hero strong { font-size: 12px; font-weight: 620; }
.advertise-hero p { margin-top: 3px; font-size: 10px; line-height: 1.5; color: var(--text-3); }
.ad-spec-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 5px; margin-top: 11px; }
.ad-spec {
  padding: 8px;
  border: 1px solid var(--border);
  border-radius: 7px;
  background: var(--surface-2);
}
.ad-spec span { display: block; font-size: 10px; letter-spacing: .08em; text-transform: uppercase; color: var(--text-4); }
.ad-spec strong { display: block; margin-top: 2px; font-family: var(--font-mono); font-size: 10px; font-weight: 500; color: var(--text-2); }
.ad-principles { display: flex; flex-direction: column; gap: 5px; }
.ad-principles .feature-item .icon { color: var(--accent-text); }
```

Responsive: `.ad-spec-grid { grid-template-columns: 1fr 1fr; }` inside the 720px query.

## JavaScript (`web/assets/js/app.js`)

```js
const AD_SNIPPET = ''; // optional ad-network snippet injected into `.adbar`

/* ---------- advertise ---------- */
function openAdvertise() {
  openModal({
    title: 'Advertise in the quiet slot',
    subtitle: 'One reserved placement. No trackers, no interstitials, no uploads.',
    size: 'wide',
    kind: 'advertise',
    body: `
      <div class="advertise-hero">
        <strong>A calm 970 × 90 placement</strong>
        <p>The bar is fixed to the bottom of the workspace, never overlaps content, and is visible on desktop and mobile. This build ships with an empty, clearly labelled placeholder.</p>
      </div>
      <div class="ad-spec-grid">
        <div class="ad-spec"><span>Desktop</span><strong>970 × 90</strong></div>
        <div class="ad-spec"><span>Mobile</span><strong>fluid × 50</strong></div>
        <div class="ad-spec"><span>Slots</span><strong>1 · fixed</strong></div>
      </div>
      <div class="modal-section">
        <div class="modal-section-title">${icon('shield-check')}Placement principles</div>
        <div class="ad-principles">
          <div class="feature-item">${icon('check')}<span>Static creative or a privacy-respecting partner link — <b>no scripts that inspect media</b>.</span></div>
          <div class="feature-item">${icon('check')}<span>No pop-ups, no auto-play audio, no layout shift.</span></div>
          <div class="feature-item">${icon('check')}<span>Clearly labelled and dismissible in a future build.</span></div>
          <div class="feature-item">${icon('check')}<span>Content stays aligned with a local-first, creative audience.</span></div>
        </div>
      </div>
      <div class="modal-section">
        <div class="modal-section-title">${icon('info')}Demo notice</div>
        <div class="modal-note">This static build has no ad server and no sales pipeline attached. The bar is a reserved slot so the layout is honest about where a partner would live. Use the button below to copy placeholder media-kit text.</div>
      </div>`,
    footer: `
      <button class="btn btn-secondary" data-action="copy-media-kit">${icon('copy')}Copy media kit</button>
      <button class="btn btn-primary" data-action="close-modal">Close</button>`
  });
}

function copyMediaKit() {
  const text = [
    'NuVerter — Local Media Suite · advertising placeholder',
    'Placement: fixed bottom bar, 970 × 90 desktop, fluid × 50 mobile',
    'Audience: creators, editors and privacy-conscious teams using local media tools',
    'Principles: static creative only, no trackers, no media inspection, no pop-ups',
    'This build is a local with no live ad server.'
  ].join('\n');
  copyText(text).then((ok) => toast(ok ? 'Media kit copied' : 'Copy failed', ok ? 'Paste it into your notes or email.' : 'Your browser blocked clipboard access.', ok ? 'success' : 'error'));
}

// action wiring
case 'advertise': openAdvertise(); break;
case 'copy-media-kit': copyMediaKit(); break;

// the "Advertise here" button in the plans modal
<button class="btn btn-ghost btn-sm" data-action="advertise">${icon('badge-dollar-sign')}Advertise here</button>

// snippet injection at the end of app.js
if (AD_SNIPPET) { const slot = document.querySelector('.adbar'); if (slot) { const wrap = document.createElement('div'); wrap.innerHTML = AD_SNIPPET; slot.appendChild(wrap); } }
```
