"""Prepare private workbook sources. Run with the bundled Python (pypdf required).

The source PDF, rendered pages, imported tracks and extracted content stay in
private-materials/ (gitignored). No source files are published to public/.
"""
import argparse
from concurrent.futures import ThreadPoolExecutor
import hashlib
import json
from pathlib import Path
import re
import subprocess
import wave

from pypdf import PdfReader

ROOT = Path(__file__).resolve().parent.parent
BASE = ROOT / "private-materials/aspekte-neu-b2"
TITLES = ["Heimat ist …", "Sprich mit mir!", "Arbeit ist das halbe Leben?",
          "Zusammen leben", "Wer Wissen schafft, macht Wissenschaft",
          "Fit für …", "Kulturwelten", "Das macht(e) Geschichte",
          "Mit viel Gefühl …", "Ein Blick in die Zukunft"]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--pdf", type=Path, required=True)
    args = parser.parse_args()
    derived = BASE / "derived"
    for folder in ["audio", "pages", "chapters", "text"]:
        (derived / folder).mkdir(parents=True, exist_ok=True)
    reader = PdfReader(args.pdf)
    assert len(reader.pages) == 185, "Check page mapping for this edition"
    text = []
    for number, page in enumerate(reader.pages, 1):
        content = page.extract_text()
        text.append({"pdfPage": number, "bookPage": number - 1, "text": content})
        (derived / "text" / f"{number:03d}.txt").write_text(content)
    (derived / "source-text.json").write_text(json.dumps(text, ensure_ascii=False, indent=2))
    last_image = derived / "pages/page-185.jpg"
    if not last_image.exists():
        subprocess.run(["pdftoppm", "-jpeg", "-jpegopt", "quality=82", "-scale-to", "1600", str(args.pdf), str(derived / "pages/page")], check=True)
    sources = {}
    for source in (BASE / "audio").iterdir():
        match = re.match(r"^(\d+)\s.*\.(aiff?|wav|mp3|m4a)$", source.name, re.I)
        if match:
            number = int(match[1])
            assert number not in sources, f"Duplicate track {number}"
            sources[number] = source
    assert set(sources) == set(range(1, 52)), "Expected CD tracks 1–51 exactly once"

    def convert(number):
        source = sources[number]
        target = derived / "audio" / f"{number:02d}.wav"
        if source.stat().st_size < 54:
            return {"number": number, "source": source.name, "available": False, "seconds": 0, "bytes": 0}
        fingerprint = hashlib.sha256(source.read_bytes()).hexdigest()
        stamp = target.with_suffix(".sha256")
        if not target.exists() or not stamp.exists() or stamp.read_text() != fingerprint:
            subprocess.run(["afconvert", "-f", "WAVE", "-d", "LEI16", str(source), str(target)], check=True)
            stamp.write_text(fingerprint)
        with wave.open(str(target)) as audio:
            duration = audio.getnframes() / audio.getframerate()
            assert duration > 0 and audio.getnchannels() in [1, 2]
        return {"number": number, "source": source.name, "available": True, "sha256": fingerprint, "seconds": round(duration, 2), "bytes": target.stat().st_size}

    with ThreadPoolExecutor(max_workers=4) as executor:
        tracks = list(executor.map(convert, range(1, 52)))
    chapters = [{"number": i + 1, "title": title, "firstPage": 6 + i * 14,
                 "lastPage": 19 + i * 14} for i, title in enumerate(TITLES)]
    manifest = {"title": "Aspekte neu B2", "subtitle": "Mein interaktives Arbeitsbuch",
                "editionIsbn": "978-3-12-605026-5", "pdfPages": len(reader.pages),
                "sourceSha256": hashlib.sha256(args.pdf.read_bytes()).hexdigest(),
                "chapters": chapters, "tracks": tracks}
    (derived / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2))
    print(json.dumps({"pages": len(reader.pages), "chapters": len(chapters), "tracks": len(tracks), "readyTracks": sum(t["available"] for t in tracks), "pendingTracks": [t["number"] for t in tracks if not t["available"]], "audioMinutes": round(sum(t["seconds"] for t in tracks) / 60, 1)}))


if __name__ == "__main__":
    main()
