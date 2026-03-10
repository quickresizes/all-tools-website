# FFmpeg core assets

This folder is intended to contain the FFmpeg core runtime files used by `tools/video-converter.html`.

Required files:

- `ffmpeg.min.js` (version `@ffmpeg/ffmpeg@0.12.6`)
- `ffmpeg-core.js` (version `@ffmpeg/core@0.12.6`)
- `ffmpeg-core.wasm`
- `ffmpeg-core.worker.js`

Source URLs:

- `https://unpkg.com/@ffmpeg/core@0.12.6/dist/ffmpeg-core.js`
- `https://unpkg.com/@ffmpeg/core@0.12.6/dist/ffmpeg-core.wasm`
- `https://unpkg.com/@ffmpeg/core@0.12.6/dist/ffmpeg-core.worker.js`

To fetch/update these files locally, run: `./scripts/download-ffmpeg-core.sh`.
