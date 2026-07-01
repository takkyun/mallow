#!/usr/bin/env sh
# Build a signed + notarized macOS bundle.
#
# Loads credentials from `.env.signing` (see `.env.signing.example`) and runs
# `pnpm tauri build`. When the APPLE_* variables are set, Tauri signs the .app
# with hardened runtime, submits it to Apple's notary service, and staples the
# notarization ticket — all automatically. Extra args are forwarded to the
# build (e.g. `./scripts/macos-sign-build.sh --target aarch64-apple-darwin`).
#
# Tauri notarizes the .app but NOT the .dmg that wraps it, so a downloaded disk
# image is rejected by Gatekeeper on open. This script notarizes + staples each
# produced .dmg afterwards to close that gap.
set -eu

root=$(CDPATH= cd "$(dirname "$0")/.." && pwd)
env_file="$root/.env.signing"

if [ ! -f "$env_file" ]; then
  echo "error: $env_file not found." >&2
  echo "       Copy .env.signing.example to .env.signing and fill it in." >&2
  exit 1
fi

# Export every variable assigned in the env file so the build inherits them.
set -a
# shellcheck source=/dev/null
. "$env_file"
set +a

pnpm tauri build "$@"

# Notarize + staple each produced .dmg (Tauri only handles the .app inside).
# Covers both the default host-target path and explicit --target paths.
staple_dmgs() {
  found=0
  for dmg in \
    "$root"/src-tauri/target/release/bundle/dmg/*.dmg \
    "$root"/src-tauri/target/*/release/bundle/dmg/*.dmg; do
    [ -e "$dmg" ] || continue
    found=1
    if xcrun stapler validate "$dmg" >/dev/null 2>&1; then
      echo "Already stapled, skipping: $dmg"
      continue
    fi
    echo "Notarizing DMG: $dmg"
    xcrun notarytool submit "$dmg" \
      --apple-id "$APPLE_ID" \
      --password "$APPLE_PASSWORD" \
      --team-id "$APPLE_TEAM_ID" \
      --wait
    xcrun stapler staple "$dmg"
  done
  [ "$found" -eq 1 ] || echo "note: no .dmg found to notarize (targets may not include dmg)."
}

staple_dmgs
