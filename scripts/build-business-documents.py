#!/usr/bin/env python3
"""Build the four public business PDFs from their existing Markdown sources.

Requires ReportLab (available in the Codex bundled Python runtime). Run from
any directory; output stays beside the source documents. No network access or
private business records are used. Invariant PDF metadata makes consecutive
builds with the same sources, font files and ReportLab version reproducible.
"""

from __future__ import annotations

import argparse
import hashlib
import re
from pathlib import Path
from xml.sax.saxutils import escape

import reportlab
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen.canvas import Canvas
from reportlab.platypus import (
    Flowable,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
DOCUMENTS = ROOT / "public" / "business" / "examples"
NAMES = ("learning-design", "assessment-guide", "client-review-checklist", "setup-and-use")
LABELS = {
    "learning-design": "DESIGN EXPLANATION",
    "assessment-guide": "EXERCISE AND SCORING GUIDE",
    "client-review-checklist": "REVIEW AND HANDOVER",
    "setup-and-use": "SETUP AND USE",
}
SITE = "https://www.sciencedojo.co.uk/business"
PUBLIC_FILES = "https://www.sciencedojo.co.uk/business/examples/"
NAVY = colors.HexColor("#12243A")
TEAL = colors.HexColor("#006B70")
INK = colors.HexColor("#273B50")
MUTED = colors.HexColor("#526071")
LINE = colors.HexColor("#DCE2E8")
PALE = colors.HexColor("#EDF5F5")
PAGE_W, PAGE_H = A4
MARGIN = 43
CONTENT_W = PAGE_W - 2 * MARGIN


def register_fonts() -> str:
    """Prefer common Unicode sans fonts and fall back to ReportLab's Vera."""
    bundled = (
        Path.home()
        / ".cache/codex-runtimes/codex-primary-runtime/dependencies/native/"
        "libreoffice-headless/libreoffice/LibreOfficeDev.app/Contents/Resources/fonts/truetype"
    )
    candidates = (
        (Path("/usr/share/fonts/truetype/dejavu"), "DejaVuSans.ttf", "DejaVuSans-Bold.ttf"),
        (bundled, "DejaVuSans.ttf", "DejaVuSans-Bold.ttf"),
        (Path("/System/Library/Fonts/Supplemental"), "Arial.ttf", "Arial Bold.ttf"),
        (Path("C:/Windows/Fonts"), "arial.ttf", "arialbd.ttf"),
        (Path(reportlab.__file__).resolve().parent / "fonts", "Vera.ttf", "VeraBd.ttf"),
    )
    for directory, regular, bold in candidates:
        if (directory / regular).is_file() and (directory / bold).is_file():
            pdfmetrics.registerFont(TTFont("ScienceSans", str(directory / regular)))
            pdfmetrics.registerFont(TTFont("ScienceSansBold", str(directory / bold)))
            pdfmetrics.registerFontFamily(
                "ScienceSans", normal="ScienceSans", bold="ScienceSansBold",
                italic="ScienceSans", boldItalic="ScienceSansBold",
            )
            return regular
    raise RuntimeError("No supported sans-serif TrueType font was found.")


def printable(value: str) -> str:
    # Keep source wording; normalise Unicode dash variants to printable ASCII.
    return value.translate(str.maketrans({"\u2010": "-", "\u2011": "-", "\u2012": "-", "\u2013": "-", "\u2014": "-"}))


def inline(value: str) -> str:
    """Convert the source's limited inline Markdown into Paragraph markup."""
    value = escape(printable(value))
    value = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", value)
    value = re.sub(r"`([^`]+)`", r"\1", value)
    value = re.sub(
        r"\[([^\]]+)\]\(([^)]+)\)",
        lambda match: f'<link href="{escape(match.group(2), {chr(34): "&quot;"})}" color="#006B70">{match.group(1)}</link>',
        value,
    )
    # Filenames in setup notes are useful links, while visible wording remains
    # the canonical Markdown source's wording (including editable .md names).
    value = re.sub(
        r"(?<![\w/])((?:client-handover-module|learning-design|assessment-guide|client-review-checklist|setup-and-use)\.(?:html|md|pdf))(?![\w])",
        lambda match: f'<link href="{PUBLIC_FILES}{match.group(1)}" color="#006B70">{match.group(1)}</link>',
        value,
    )
    return value.replace("\n", "<br/>")


def markdown_blocks(source: str) -> list[tuple[str, str]]:
    blocks: list[tuple[str, str]] = []
    pending: list[str] = []

    def flush() -> None:
        if pending:
            blocks.append(("paragraph", "\n".join(pending)))
            pending.clear()

    for line in source.splitlines():
        if not line.strip():
            flush()
        elif match := re.match(r"^(#{1,3})\s+(.+)$", line):
            flush()
            blocks.append((f"h{len(match.group(1))}", match.group(2)))
        elif line.startswith("- [ ] "):
            flush()
            blocks.append(("check", line[6:]))
        elif line.startswith("- "):
            flush()
            blocks.append(("bullet", line[2:]))
        else:
            pending.append(line)
    flush()
    if not blocks or blocks[0][0] != "h1":
        raise ValueError("Each document must begin with a level-one title.")
    return blocks


class Marker(Flowable):
    def __init__(self, checkbox: bool = False):
        super().__init__()
        self.checkbox = checkbox
        self.width, self.height = 10, 13

    def draw(self) -> None:
        self.canv.setStrokeColor(TEAL)
        self.canv.setFillColor(TEAL)
        if self.checkbox:
            self.canv.setLineWidth(0.85)
            self.canv.rect(0.5, 2.3, 7.5, 7.5, fill=0, stroke=1)
        else:
            self.canv.circle(3, 6, 1.7, fill=1, stroke=0)


def styles(compact: bool = False) -> dict[str, ParagraphStyle]:
    body = ParagraphStyle(
        "body", fontName="ScienceSans", fontSize=10 if compact else 10.25,
        leading=13 if compact else 14.6,
        textColor=INK, alignment=TA_LEFT, spaceAfter=6 if compact else 8.5,
        allowWidows=0, allowOrphans=0,
    )
    return {
        "body": body,
        "h1": ParagraphStyle(
            "title", parent=body, fontName="ScienceSansBold", fontSize=24,
            leading=29, textColor=NAVY, spaceBefore=5, spaceAfter=13,
            keepWithNext=1,
        ),
        "h2": ParagraphStyle(
            "section", parent=body, fontName="ScienceSansBold", fontSize=13 if compact else 13.5,
            leading=17 if compact else 18, textColor=NAVY,
            spaceBefore=8 if compact else 12, spaceAfter=5 if compact else 7,
            keepWithNext=1,
        ),
        "h3": ParagraphStyle(
            "criterion", parent=body, fontName="ScienceSansBold", fontSize=12,
            leading=16, textColor=TEAL, spaceBefore=9, spaceAfter=6,
            keepWithNext=1,
        ),
        "label": ParagraphStyle(
            "label", parent=body, fontName="ScienceSansBold", fontSize=8.5,
            leading=12, textColor=TEAL, spaceAfter=4,
        ),
        "notice": ParagraphStyle(
            "notice", parent=body, fontSize=9.3, leading=13.5,
            textColor=INK, spaceAfter=0,
        ),
        "list": ParagraphStyle("list", parent=body, spaceAfter=0),
    }


def list_item(value: str, style: ParagraphStyle, checkbox: bool = False, compact: bool = False) -> Flowable:
    item = Table(
        [[Marker(checkbox), Paragraph(inline(value), style)]],
        colWidths=[16, CONTENT_W - 16], hAlign="LEFT",
    )
    item.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5.5 if compact else 7),
    ]))
    return item


def furniture(canvas: Canvas, doc: SimpleDocTemplate) -> None:
    canvas.saveState()
    wordmark = canvas.beginText(MARGIN, PAGE_H - 37)
    wordmark.setFont("ScienceSansBold", 17)
    wordmark.setFillColor(NAVY)
    wordmark.textOut("sciencedojo")
    wordmark.setFillColor(TEAL)
    wordmark.textOut(".")
    canvas.drawText(wordmark)
    canvas.setFont("ScienceSansBold", 8)
    canvas.setFillColor(TEAL)
    canvas.drawString(MARGIN + 131, PAGE_H - 35, "FOR BUSINESS")
    canvas.linkURL(SITE, (MARGIN, PAGE_H - 42, MARGIN + 205, PAGE_H - 20), relative=0, thickness=0)
    canvas.setStrokeColor(LINE)
    canvas.setLineWidth(0.7)
    canvas.line(MARGIN, PAGE_H - 52, PAGE_W - MARGIN, PAGE_H - 52)
    canvas.line(MARGIN, 43, PAGE_W - MARGIN, 43)
    canvas.setFont("ScienceSans", 8)
    canvas.setFillColor(TEAL)
    canvas.drawString(MARGIN, 28, "www.sciencedojo.co.uk/business")
    canvas.linkURL(SITE, (MARGIN, 25, MARGIN + 200, 39), relative=0, thickness=0)
    canvas.setFillColor(MUTED)
    canvas.drawRightString(PAGE_W - MARGIN, 28, f"{doc.page}")
    canvas.restoreState()


def make_story(name: str, blocks: list[tuple[str, str]]) -> list[Flowable]:
    compact = name == "learning-design"
    s = styles(compact)
    story: list[Flowable] = [Paragraph(LABELS[name], s["label"])]
    for index, (kind, value) in enumerate(blocks):
        # Keep the exercise, first two criteria, and final two criteria on their
        # own deliberate pages; do not split a descriptive rating block.
        if name == "assessment-guide" and value in {"Criteria and completed example", "Deadline"} and kind in {"h2", "h3"}:
            story.append(PageBreak())
        if name == "setup-and-use" and kind == "h2" and value == "Responses and privacy":
            story.append(PageBreak())
        if kind.startswith("h"):
            story.append(Paragraph(inline(value), s[kind]))
        elif index == 1 and value.startswith("ScienceDojo for Business"):
            notice = Table([[Paragraph(inline(value), s["notice"])]], colWidths=[CONTENT_W])
            notice.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, -1), PALE),
                ("LINEBEFORE", (0, 0), (-1, -1), 2, TEAL),
                ("LEFTPADDING", (0, 0), (-1, -1), 11),
                ("RIGHTPADDING", (0, 0), (-1, -1), 11),
                ("TOPPADDING", (0, 0), (-1, -1), 9),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
            ]))
            story.extend([notice, Spacer(1, 3)])
        elif kind in {"bullet", "check"}:
            story.append(list_item(value, s["list"], checkbox=kind == "check", compact=compact))
        else:
            story.append(Paragraph(inline(value), s["body"]))
    return story


def build(name: str) -> Path:
    source_path = DOCUMENTS / f"{name}.md"
    source = source_path.read_text(encoding="utf-8")
    blocks = markdown_blocks(source)
    output = DOCUMENTS / f"{name}.pdf"
    digest = hashlib.sha256(source.encode("utf-8")).hexdigest()
    doc = SimpleDocTemplate(
        str(output), pagesize=A4, rightMargin=MARGIN, leftMargin=MARGIN,
        topMargin=67, bottomMargin=60, title=printable(blocks[0][1]),
        author="ScienceDojo for Business",
        subject=f"Public companion document; Markdown source SHA-256: {digest}",
        creator="ScienceDojo Markdown-to-PDF generator", pageCompression=1,
        invariant=1,
    )
    doc.build(make_story(name, blocks), onFirstPage=furniture, onLaterPages=furniture)
    return output


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "documents", nargs="*", metavar="DOCUMENT",
        help=f"Names to build; default: all four. Available: {', '.join(NAMES)}",
    )
    args = parser.parse_args()
    unknown = [name for name in args.documents if name not in NAMES]
    if unknown:
        parser.error(f"Unknown document name(s): {', '.join(unknown)}. Choose from: {', '.join(NAMES)}")
    font = register_fonts()
    for name in args.documents or NAMES:
        output = build(name)
        print(f"{output.relative_to(ROOT)}: {output.stat().st_size:,} bytes (font: {font})")


if __name__ == "__main__":
    main()
