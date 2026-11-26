#!/usr/bin/env python3
"""Patch a freshly generated Tauri Android project to sign release APKs.

Tauri's `android init` template does not configure release signing, so CI
writes keystore.properties and then runs this script once against
src-tauri/gen/android/app/build.gradle.kts.

Usage: python3 scripts/android-signing.py <path/to/app/build.gradle.kts>
"""

from __future__ import annotations

import pathlib
import sys

SIGNING_CONFIGS = """
    signingConfigs {
        create("release") {
            val nvKeystore = rootProject.file("keystore.properties")
            val nvProps = Properties()
            nvKeystore.inputStream().use { nvProps.load(it) }
            keyAlias = nvProps["keyAlias"] as String
            keyPassword = nvProps["password"] as String
            storeFile = file(nvProps["storeFile"] as String)
            storePassword = nvProps["password"] as String
        }
    }
"""


def main() -> int:
    path = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else "app/build.gradle.kts")
    if not path.exists():
        print(f"build file not found: {path}", file=sys.stderr)
        return 1

    source = path.read_text(encoding="utf-8")
    if 'create("release")' in source and "nvKeystore" in source:
        print("already configured for release signing")
        return 0

    if "import java.util.Properties" not in source:
        source = "import java.util.Properties\n" + source

    if "android {" not in source:
        print("unexpected Gradle file: no android block", file=sys.stderr)
        return 1

    if 'create("release")' not in source:
        if "    buildTypes {" not in source:
            print("unexpected Gradle file: no buildTypes block", file=sys.stderr)
            return 1
        source = source.replace("    buildTypes {", SIGNING_CONFIGS + "    buildTypes {", 1)

    marker = 'getByName("release") {'
    if marker not in source:
        print("unexpected Gradle file: no release build type", file=sys.stderr)
        return 1
    source = source.replace(
        marker,
        marker + '\n            signingConfig = signingConfigs.getByName("release")',
        1,
    )

    path.write_text(source, encoding="utf-8")
    print(f"release signing enabled in {path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
