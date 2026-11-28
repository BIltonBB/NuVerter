# NuVerter

A website that does a lot of things for you, possibly.

## Running it

The web app needs no build step and no backend:

```bash
npm start          # serves web/ on http://localhost:4173
```

Open `http://localhost:4173/`. Everything runs in the browser; files never leave
the device. The desktop build lives in `tauri/`.

## License

Copyright (C) 2026 BiltonB.

NuVerter is free software: you can redistribute it and/or modify it under the
terms of the GNU General Public License as published by the Free Software
Foundation, either version 3 of the License, or (at your option) any later
version.

NuVerter is distributed in the hope that it will be useful, but WITHOUT ANY
WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A
PARTICULAR PURPOSE. See the GNU General Public License for more details.

The full license text is in [`LICENSE`](LICENSE). Because NuVerter is GPL
software, redistributing a built copy means shipping the corresponding source
and keeping the notices intact.

## Third-party components

Bundled libraries, fonts, icons, and the licensing of the sample media are
listed in [`web/THIRD-PARTY.md`](web/THIRD-PARTY.md). Some of those components
carry their own copyleft terms (Potrace is GPL, and the bundled FFmpeg
WebAssembly core contains LGPL/GPL parts), so read that file before
redistributing a build.
