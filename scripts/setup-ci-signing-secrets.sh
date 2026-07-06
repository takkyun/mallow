#!/usr/bin/env sh
# Register the GitHub Actions secrets that .github/workflows/release.yml needs
# to sign + notarize macOS builds in CI. Apple account values are read from
# .env.signing (the same file the local build uses) and the certificate from a
# password-protected .p12 you export from Keychain Access. No secret value is
# printed — each is piped straight into `gh secret set`.
#
# Usage:
#   ./scripts/setup-ci-signing-secrets.sh path/to/DeveloperID.p12
#
# Export the certificate first: Keychain Access > login > My Certificates >
# "Developer ID Application: <Name> (<TEAMID>)" > right-click > Export…, save as
# a .p12 and set an export password (you'll type it below).
#
# Prerequisites: `gh` authenticated for this repo (`gh auth status`) and a
# filled-in .env.signing (see .env.signing.example).
set -eu

root=$(CDPATH= cd "$(dirname "$0")/.." && pwd)
env_file="$root/.env.signing"
p12="${1:-}"

if [ -z "$p12" ]; then
  echo "usage: $0 path/to/DeveloperID.p12" >&2
  exit 1
fi
[ -f "$p12" ] || { echo "error: certificate '$p12' not found." >&2; exit 1; }
[ -f "$env_file" ] || {
  echo "error: $env_file not found — copy .env.signing.example and fill it in." >&2
  exit 1
}

# Load APPLE_SIGNING_IDENTITY / APPLE_ID / APPLE_PASSWORD / APPLE_TEAM_ID
# without echoing them.
set -a
# shellcheck source=/dev/null
. "$env_file"
set +a

# Prompt for the .p12 export password with echo off.
printf 'Export password for %s: ' "$p12"
stty -echo 2>/dev/null || true
IFS= read -r p12_password
stty echo 2>/dev/null || true
printf '\n'

# APPLE_CERTIFICATE is the base64-encoded .p12; the rest come from .env.signing.
# Piping keeps every value off the argv list and out of the logs.
base64 < "$p12"                       | gh secret set APPLE_CERTIFICATE
printf '%s' "$p12_password"           | gh secret set APPLE_CERTIFICATE_PASSWORD
printf '%s' "$APPLE_SIGNING_IDENTITY" | gh secret set APPLE_SIGNING_IDENTITY
printf '%s' "$APPLE_ID"               | gh secret set APPLE_ID
printf '%s' "$APPLE_PASSWORD"         | gh secret set APPLE_PASSWORD
printf '%s' "$APPLE_TEAM_ID"          | gh secret set APPLE_TEAM_ID

echo "Registered signing secrets on $(gh repo view --json nameWithOwner -q .nameWithOwner)."
echo "Verify with: gh secret list"
