# Nicos Weg A1 episode banner stills

These 76 decorative JPEG backgrounds are single frames from the corresponding official Deutsche Welle A1 episode videos. Film copyright belongs to Deutsche Welle. `sources.json` records each video, episode title, official script PDF and frame timestamp. The lesson header displays the film credit and episode number.

The vocabulary library uses the exact episode for each deck. The 19 grammar lessons use a selected episode within their own four-episode unit. Story lessons preserve the scene image already selected in the coursebook, including teacher edits. The final review uses episode 76.

Each image is 1280 pixels wide. Next Image provides responsive sizing and optimisation. Images are served locally; opening a banner does not request or play a DW video.

To reproduce missing stills, set `NICOS_BANNER_FFMPEG` to a full FFmpeg binary and run `node --experimental-strip-types scripts/generate-nicos-topic-banners.mjs`. Existing files are preserved. Use `--sample` to extract only episodes 1 and 2. Source videos are streamed for frame extraction; full videos are not saved.
