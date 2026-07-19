#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PKG="$ROOT/business-card-package"
OUT="$ROOT/downloads/burn-and-build-business-card.zip"

mkdir -p "$PKG/css" "$PKG/img/brand" "$(dirname "$OUT")"
cp "$ROOT/business-card-mockup.html" "$ROOT/business-card-editor.html" "$PKG/"
cp "$ROOT/css/business-card.css" "$PKG/css/"
cp "$ROOT/img/brand/bblogo.png" "$ROOT/img/brand/qr-burnandbuilddiet.png" "$PKG/img/brand/"

cd "$PKG"
zip -r "$OUT" . -x '*.DS_Store'
echo "Wrote $OUT"
