# NuVerter Tauri (desktop + mobile)

Requires Rust: https://rustup.rs

## Dev
```
cd tauri
cargo tauri dev
```

## Build (desktop)
```
cd tauri
cargo tauri build
```
On low-RAM machines, a plain `cargo build --release` with `CARGO_PROFILE_RELEASE_OPT_LEVEL=0` also works and still uses the system webview.

Output in `tauri/src-tauri/target/release/bundle`.

## Build (Android)

One-time setup: Android Studio or the Android SDK + NDK, JDK 17, and the
Android Rust targets.

```
rustup target add aarch64-linux-android armv7-linux-androideabi i686-linux-android x86_64-linux-android
cd tauri
cargo tauri android init
cargo tauri android dev          # run on a device / emulator
cargo tauri android build --apk  # release APK in src-tauri/gen/android/app/build/outputs/apk
```

`tauri/src-tauri/src/lib.rs` is the shared entry point; `main.rs` only launches
it on desktop. Desktop-only features (the signed updater, the Mica window
effect and the folder picker) are behind cfg gates, so the same crate compiles
for Android and iOS.

The web UI detects the mobile runtime, adds safe-area padding and larger touch
targets, and hides desktop-only settings. Downloads go through the system save
dialog (`dialog.save` -> `save_to_uri`), because Android WebViews ignore
`<a download>`; the command writes the bytes into the returned `content://` URI
via the fs plugin.

### Local toolchain (Windows)

This project was built locally with a portable toolchain under
`%LOCALAPPDATA%\NuVerterToolchain`:

- Temurin JDK 17
- Android command-line tools with `platform-tools`, `platforms;android-36`,
  `platforms;android-37.0`, `build-tools;36.0.0`, `build-tools;37.0.0`
  and `ndk;27.0.12077973`

Run `source tauri/scripts/android-env.sh` to put the JDK, SDK, platform-tools
and emulator on `PATH` for the current shell. `platforms;android-36` is required by the `:tauri-android`
module even though the app compiles against 37; `platforms;android-37` does
not exist (the package is `37.0`).

On Windows without Developer Mode, `tauri android build` fails after compiling
because Tauri symlinks the `.so` into `jniLibs`. Copy it and let Gradle
assemble instead. The copy must come *after* that command every time: the
failed symlink attempt deletes whatever `libnuverter_lib.so` is already in
`jniLibs`, and an APK built without it crashes at startup with
`UnsatisfiedLinkError` in `System.loadLibrary`.

```bash
source tauri/scripts/android-env.sh
cd tauri
npx tauri android build -t aarch64 --apk --debug   # compiles the .so, then stops
SO=$(cargo metadata --format-version 1 --no-deps --manifest-path src-tauri/Cargo.toml \
  | python -c "import json,sys;print(json.load(sys.stdin)['target_directory'])")/aarch64-linux-android/debug/libnuverter_lib.so
mkdir -p src-tauri/gen/android/app/src/main/jniLibs/arm64-v8a
cp "$SO" src-tauri/gen/android/app/src/main/jniLibs/arm64-v8a/
cd src-tauri/gen/android
./gradlew.bat :app:assembleArm64Debug \
  -x rustBuildArm64Debug -x rustBuildArmDebug -x rustBuildX86Debug -x rustBuildX86_64Debug
```

Swap the target and task for other ABIs (`-t x86_64` with
`:app:assembleX86_64Debug` is what the local emulator uses).

Debug APKs are large (the unstripped library is ~147 MB); release builds strip
it. Enabling Windows Developer Mode removes the manual step. The release
workflow runs on Linux and does not need it.

### Signing keys and GitHub secrets

Two unrelated keys are involved. Desktop updates are verified with the Tauri
updater key; Android builds are signed with a JKS keystore. Neither key is in
git (`tauri/src-tauri/.tauri/` is ignored).

| Secret | Used by | Value |
| --- | --- | --- |
| `TAURI_SIGNING_PRIVATE_KEY` | desktop updater | contents of `tauri/src-tauri/.tauri/updater.key` |
| `ANDROID_KEY_BASE64` | Android APK | `base64 -w0 tauri/src-tauri/.tauri/android-upload.jks` (one line) |
| `ANDROID_KEY_ALIAS` | Android APK | `nuverter` |
| `ANDROID_KEY_PASSWORD` | Android APK | the keystore password |

Set them from the repository root, on the machine that holds the key files:

```bash
gh secret set TAURI_SIGNING_PRIVATE_KEY -R BIltonBB/NuVerter \
  < tauri/src-tauri/.tauri/updater.key
gh secret set ANDROID_KEY_BASE64 -R BIltonBB/NuVerter \
  < <(base64 -w0 tauri/src-tauri/.tauri/android-upload.jks)
gh secret set ANDROID_KEY_ALIAS -R BIltonBB/NuVerter --body nuverter
gh secret set ANDROID_KEY_PASSWORD -R BIltonBB/NuVerter \
  < tauri/src-tauri/.tauri/android-keystore-password.txt
```

Without the Android secrets the workflow still publishes a **debug-signed**
APK. It installs fine, but Android refuses to update over an install signed by
a different key, so set them before distributing builds users will update.

Key rotation (done 2026-11-28):

```bash
# desktop updater key (blank password, matching the workflow)
npx @tauri-apps/cli signer generate -w tauri/src-tauri/.tauri/updater.key -p "" --ci --force
# copy the new public key into plugins.updater.pubkey in tauri.conf.json

# Android keystore
keytool -genkeypair -keystore tauri/src-tauri/.tauri/android-upload.jks \
  -alias nuverter -keyalg RSA -keysize 3072 -validity 10000 \
  -storepass <password> -keypass <password> \
  -dname "CN=NuVerter, OU=Mobile, O=BiltonB, C=US"
```

Keep both keys backed up. Losing the updater key means no further signed
updates; losing the keystore means future APKs cannot update the installed app.

Desktop installs can be migrated without a manual reinstall: tag one release
while `TAURI_SIGNING_PRIVATE_KEY` still holds the *retired* key. Clients verify
that manifest against the key they embedded, install the new build, and from
then on trust the new key in `tauri.conf.json`. So the order is: publish the
transition release with the old secret, then point the secret at
`updater.key`. Phones get no such path, because Android compares the APK
signing certificate, not a manifest: each device installs the first
post-rotation APK by hand.

### Publishing and updates

`.github/workflows/release.yml` runs on `v*` tags:

1. Builds the Windows NSIS installer and the signed desktop updater.
2. Generates the Android project, builds the APK and attaches
   `NuVerter_<version>_android.apk` to the same GitHub release.

The Android app has no in-app installer plugin (Tauri's updater is desktop
only). On launch it asks the GitHub releases API for the newest tag, compares
it with the native package version, and offers a one-tap **Download APK** when
a newer release exists. After installing the APK, Android keeps the app data.

The desktop app uses the signed updater manifest that `tauri-action` attaches
to each GitHub release (`releases/latest/download/latest.json`) plus the same
GitHub release check as a fallback. Publishing a tag is therefore enough to
roll both desktop and Android clients forward; no manifest commit is needed.

Releases up to `1.1.36` shipped the previous updater public key, and their
APKs were debug-signed because the Android secrets did not exist yet. Those
installs reject manifests signed with the current key, and Android refuses the
new release-signed APK over the old debug one, so each device has to install
the first post-rotation release by hand; that means uninstalling the old APK,
which also clears its app data. Later versions update normally.

## Notes
- Frontend is loaded from `../web` (same UI as the web/Electron builds).
- COOP/COEP headers are set by Tauri's webview config; FFmpeg.wasm needs them
  for `SharedArrayBuffer`. The web build additionally ships
  `coi-serviceworker.js` as a fallback.
- Auto-update: configure `plugins.updater` with a pubkey + endpoint, then publish signed releases.
- System webview is used, so idle RAM is ~30-60 MB instead of Electron's ~300 MB.
