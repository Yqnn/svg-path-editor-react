#!/bin/sh
# Builds the app and updates the gh-pages branch of the target repository.
#
# Usage:
#   GH_PAGES_REPO=https://github.com/Yqnn/svg-path-editor-react.git \
#   GH_PAGES_BASE=/svg-path-editor-react/ \
#   sh ./scripts/deploy-gh-pages.sh
#
# Set GH_PAGES_YES=1 to push without the interactive confirmation.

set -eu

REPO="${GH_PAGES_REPO:-https://github.com/Yqnn/svg-path-editor-react.git}"
BASE="${GH_PAGES_BASE:-/svg-path-editor-react/}"
BRANCH="${GH_PAGES_BRANCH:-gh-pages}"
MESSAGE="${GH_PAGES_MESSAGE:-Refreshed gh-pages from the React port}"

ROOT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

cd "$ROOT_DIR"

echo "Building with base path $BASE..."
npm ci
npx tsc --noEmit
npx vite build --base="$BASE"

echo "Cloning $REPO ($BRANCH)..."
if ! git clone --depth 1 --branch "$BRANCH" "$REPO" "$TMP_DIR" 2>/dev/null; then
  git clone --depth 1 "$REPO" "$TMP_DIR"
  cd "$TMP_DIR"
  git checkout --orphan "$BRANCH"
  git rm -rf . >/dev/null 2>&1 || true
fi

cd "$TMP_DIR"

# Keep git metadata and optional CNAME, replace everything else.
find . -mindepth 1 -maxdepth 1 ! -name .git ! -name CNAME -exec rm -rf {} +
cp -R "$ROOT_DIR/dist/." .

git add --all
if git diff --cached --quiet; then
  echo "gh-pages is already up to date."
  exit 0
fi
git commit -m "$MESSAGE"
git show --stat

if [ "${GH_PAGES_YES:-0}" = "1" ]; then
  git push origin "$BRANCH"
else
  printf 'Confirm publication? [yn] '
  read -r REPLY
  case "$REPLY" in
    y | Y) git push origin "$BRANCH" ;;
    *) echo "Not published." ;;
  esac
fi
