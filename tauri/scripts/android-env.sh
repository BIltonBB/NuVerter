#!/usr/bin/env bash
# Source this before local Android builds:
#   source tauri/scripts/android-env.sh
#
# Override NV_ANDROID_TOOLCHAIN if the JDK and SDK live somewhere else.
# The release workflow does not use this file; it installs the toolchain on CI.

TOOLCHAIN="${NV_ANDROID_TOOLCHAIN:-${LOCALAPPDATA:-$HOME}/NuVerterToolchain}"

if [ -z "${JAVA_HOME:-}" ]; then
  JAVA_HOME=$(ls -d "$TOOLCHAIN"/jdk-* 2>/dev/null | head -n 1)
fi
if [ -z "${ANDROID_HOME:-}" ]; then
  ANDROID_HOME="$TOOLCHAIN/android-sdk"
fi
if [ -z "${NDK_HOME:-}" ]; then
  NDK_HOME=$(ls -d "$ANDROID_HOME"/ndk/* 2>/dev/null | sort -V | tail -n 1)
fi

export JAVA_HOME ANDROID_HOME NDK_HOME

# Git Bash needs POSIX paths in PATH, while Gradle wants JAVA_HOME as a
# Windows path (C:/... or C:\...). Keep each in the form its consumer expects.
to_path() {
  if command -v cygpath >/dev/null 2>&1; then cygpath -u "$1"; else printf '%s' "$1"; fi
}
JAVA_BIN="$(to_path "$JAVA_HOME")/bin"
SDK_BIN="$(to_path "$ANDROID_HOME")/cmdline-tools/latest/bin"
PLATFORM_BIN="$(to_path "$ANDROID_HOME")/platform-tools"
EMULATOR_BIN="$(to_path "$ANDROID_HOME")/emulator"
export PATH="$JAVA_BIN:$SDK_BIN:$PLATFORM_BIN:$EMULATOR_BIN:$PATH"

if [ ! -x "$JAVA_BIN/java.exe" ] && [ ! -x "$JAVA_BIN/java" ]; then
  echo "Java not found under $JAVA_HOME" >&2
  echo "Install JDK 17 or set NV_ANDROID_TOOLCHAIN." >&2
  return 1 2>/dev/null || exit 1
fi
if [ ! -d "$ANDROID_HOME" ]; then
  echo "Android SDK not found at $ANDROID_HOME" >&2
  echo "Install the Android command-line tools or set NV_ANDROID_TOOLCHAIN." >&2
  return 1 2>/dev/null || exit 1
fi
