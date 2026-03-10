#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TARGET_DIR="$ROOT_DIR/assets/ffmpeg"
mkdir -p "$TARGET_DIR"

BASE_URL="https://unpkg.com/@ffmpeg/core@0.12.6/dist"
for file in ffmpeg-core.js ffmpeg-core.wasm ffmpeg-core.worker.js; do
  echo "Downloading $file"
  curl -fL "$BASE_URL/$file" -o "$TARGET_DIR/$file"
done

echo "Downloaded FFmpeg core assets to $TARGET_DIR"
