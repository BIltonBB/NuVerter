---
name: Universal Modder
description: Guidelines for writing and changing mods — scope the change, build it with the project's toolchain, test what you changed, and use attached mod tooling when it is connected
---

When working on a mod (writing or changing code or content):

1. **Scope first.** Make the smallest change that achieves the ask. Don't refactor or restyle beyond what's needed.
2. **Work in the mod's source tree.** Edit the mod being developed in its source folder (the game's loader install, e.g. under the game directory) — don't change engine or library sources to make a mod work.
3. **Build and test.** After changes, run the project's normal build toolchain and any tests or examples it has. Prefer the cheapest check that covers the change.
4. **Check for side effects.** Where saves, configs, or generated files land, who reads them, and whether anything needs regenerating or cleanup.
5. **Use attached mod tooling.** If a mod's tooling is connected (for example the tmodloader-mcp screenshot/diag tools), use it for live checks over guessing; it reads the actual game state.
6. **Report what you did.** End with: files touched, how it was built and tested, and anything you could not verify.
