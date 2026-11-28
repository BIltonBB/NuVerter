---
name: Terraria Mod UI
description: Adding or changing modded UI in tmodloader — textures, draw overrides, and verifying with the screenshot tool
---

Terraria mod UI basics:

- **Textures:** modded sprites live in the mod's `Content/` tree and load in `Mod.Load()`/`PostSetupContent()` (e.g. via `GetTexture("MyMod:MySprite")`). Reuse existing vanilla assets only where the license allows; prefer new sprites.
- **Draw overrides:** UI is drawn through draw overrides on mod classes (`ModItem`, `ModNPC`, `ModTile`, etc.) and modded panels. Keep draw methods small and side-effect-free; feature-flag experimental UI behind a setting while iterating.
- **Two coordinate spaces:** world objects use world-space rectangles; screen elements use viewport-space coordinates. Scaling, lighting, and flipped sprites behave differently — test both.
- **Verify by seeing it:** use the mod's screenshot tool to capture the frame and pick the region that shows the UI. It reads the game's back buffer, so it shows modded UI but nothing in front of the game.
- **Check contrast and tone:** modded sprites sometimes look washed out or saturated against vanilla UI — eyeball a vanilla panel next to yours when fine-tuning.
