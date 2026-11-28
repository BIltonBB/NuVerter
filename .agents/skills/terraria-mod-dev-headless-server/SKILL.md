---
name: Terraria Mod Dev + Headless Server
description: Mod development workflow plus running a dedicated/headless server for testing
---

Development workflow: same as the Universal Modder skill — scope the change, build in the mod's source, run the project's tests, check for side effects, report what you did.

Headless testing reality (measured, not assumed):

- Terraria has no truly headless singleplayer: `-join -player -skipselect` lands at the main menu, so `launch("singleplayer")` refuses.
- There is no bare dedicated server: an empty server runs no update hooks, so the mod never polls and never answers. A server needs a client attached to become a game.
- So the standard test shape is dedicated server + attached client, or game + singleplayer client, with mod hooks firing while attached.

Testing with the mod's tooling (tmodloader-mcp):

- Snapshot first: `save_snapshot` the world and characters before anything mutates them; `save_restore` puts back what the run overwrote.
- Drive the run: `launch`, `join` (second client), `wait_until` (state with a budget instead of sleeps), `diag` (structured fields), `shot`/captures (the frame), `build_mod` (encodes tmodloader's refusal to build while the game is open).
- Logs: `logs`, `log_files`, `log_since` — including the run that rotated away.
