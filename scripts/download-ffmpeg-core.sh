#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TARGET_DIR="$ROOT_DIR/assets/ffmpeg"
mkdir -p "$TARGET_DIR"

CORE_FILES=(ffmpeg-core.js ffmpeg-core.wasm ffmpeg-core.worker.js)
CORE_BASE_URLS=(
  "https://unpkg.com/@ffmpeg/core@0.12.6/dist"
  "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist"
)
LIB_URLS=(
  "https://unpkg.com/@ffmpeg/ffmpeg@0.12.6/dist/ffmpeg.min.js"
  "https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.12.6/dist/ffmpeg.min.js"
)

download_with_fallback() {
  local output_file="$1"
  shift

  local url
  for url in "$@"; do
    echo "Attempting download: $url"
    if curl -fsSL "$url" -o "$TARGET_DIR/$output_file"; then
      echo "Downloaded $output_file"
      return 0
    fi
  done

  echo "Failed to download $output_file from all configured mirrors." >&2
  return 1
}

for file in "${CORE_FILES[@]}"; do
  urls=()
  for base in "${CORE_BASE_URLS[@]}"; do
    urls+=("$base/$file")
  done
  download_with_fallback "$file" "${urls[@]}"
done

download_with_fallback "ffmpeg.min.js" "${LIB_URLS[@]}"

echo "Downloaded FFmpeg browser assets to $TARGET_DIR"
