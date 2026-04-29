from __future__ import annotations

import re
import textwrap
from pathlib import Path


ROOT = Path(__file__).resolve().parent
SOURCE = ROOT / "PROJECT_REPORT.md"
OUTPUT = ROOT / "Smart_Attendance_Project_Report.pdf"

PAGE_WIDTH = 595
PAGE_HEIGHT = 842
MARGIN_X = 54
TOP_Y = 790
BOTTOM_Y = 56
LINE_HEIGHT = 14


def pdf_escape(text: str) -> str:
    return (
        text.replace("\\", "\\\\")
        .replace("(", "\\(")
        .replace(")", "\\)")
        .replace("\r", "")
    )


def normalize(text: str) -> str:
    replacements = {
        "\u2018": "'",
        "\u2019": "'",
        "\u201c": '"',
        "\u201d": '"',
        "\u2013": "-",
        "\u2014": "-",
        "\u2022": "-",
        "\u00a0": " ",
    }
    for src, dst in replacements.items():
        text = text.replace(src, dst)
    return text.encode("latin-1", "replace").decode("latin-1")


def line_ops(text: str, x: int, y: int, font: str, size: int) -> str:
    return f"BT /{font} {size} Tf {x} {y} Td ({pdf_escape(text)}) Tj ET\n"


class PdfWriter:
    def __init__(self) -> None:
        self.pages: list[str] = []
        self.current: list[str] = []
        self.y = TOP_Y
        self.page_number = 0
        self.in_code = False

    def new_page(self) -> None:
        if self.current:
            self.add_footer()
            self.pages.append("".join(self.current))
        self.current = []
        self.page_number += 1
        self.y = TOP_Y
        self.add_header()

    def ensure_page(self, needed: int = LINE_HEIGHT) -> None:
        if not self.current:
            self.new_page()
        if self.y - needed < BOTTOM_Y:
            self.new_page()

    def add_header(self) -> None:
        title = "Smart Attendance and Proxy Detection System"
        self.current.append(line_ops(title, MARGIN_X, PAGE_HEIGHT - 34, "F2", 9))
        self.current.append(
            f"{MARGIN_X} {PAGE_HEIGHT - 44} m {PAGE_WIDTH - MARGIN_X} {PAGE_HEIGHT - 44} l S\n"
        )

    def add_footer(self) -> None:
        footer = f"Page {self.page_number}"
        self.current.append(f"{MARGIN_X} 42 m {PAGE_WIDTH - MARGIN_X} 42 l S\n")
        self.current.append(line_ops(footer, PAGE_WIDTH - MARGIN_X - 44, 28, "F1", 9))

    def add_blank(self, height: int = 8) -> None:
        self.ensure_page(height)
        self.y -= height

    def add_wrapped(
        self,
        text: str,
        *,
        x: int = MARGIN_X,
        font: str = "F1",
        size: int = 10,
        width: int = 92,
        first_prefix: str = "",
        next_prefix: str = "",
        spacing_after: int = 2,
    ) -> None:
        text = normalize(text).strip()
        if not text:
            self.add_blank()
            return

        wrapped = textwrap.wrap(
            text,
            width=width,
            replace_whitespace=True,
            drop_whitespace=True,
            break_long_words=False,
        ) or [""]

        for idx, part in enumerate(wrapped):
            prefix = first_prefix if idx == 0 else next_prefix
            self.ensure_page(LINE_HEIGHT)
            self.current.append(line_ops(prefix + part, x, self.y, font, size))
            self.y -= LINE_HEIGHT
        self.y -= spacing_after

    def add_heading(self, text: str, level: int) -> None:
        clean = normalize(text.strip("# ").strip())
        if level == 1:
            self.ensure_page(34)
            self.y -= 8
            self.add_wrapped(clean, font="F2", size=18, width=54, spacing_after=8)
        elif level == 2:
            self.ensure_page(30)
            self.y -= 6
            self.add_wrapped(clean, font="F2", size=13, width=70, spacing_after=5)
        else:
            self.ensure_page(24)
            self.add_wrapped(clean, font="F2", size=11, width=78, spacing_after=3)

    def add_rule(self) -> None:
        self.ensure_page(12)
        self.current.append(f"{MARGIN_X} {self.y} m {PAGE_WIDTH - MARGIN_X} {self.y} l S\n")
        self.y -= 12

    def add_code(self, text: str) -> None:
        raw = normalize(text.rstrip("\n"))
        if not raw:
            self.add_blank(5)
            return
        for part in textwrap.wrap(raw, width=82, replace_whitespace=False, drop_whitespace=False):
            self.ensure_page(LINE_HEIGHT)
            self.current.append(line_ops(part, MARGIN_X + 12, self.y, "F3", 9))
            self.y -= LINE_HEIGHT

    def render_markdown(self, markdown: str) -> None:
        self.new_page()
        for raw_line in markdown.splitlines():
            line = raw_line.rstrip()

            if line.strip().startswith("```"):
                self.in_code = not self.in_code
                self.add_blank(5)
                continue

            if self.in_code:
                self.add_code(line)
                continue

            stripped = line.strip()
            if not stripped:
                self.add_blank(7)
                continue

            if stripped == "---":
                self.add_rule()
                continue

            heading = re.match(r"^(#{1,6})\s+(.*)$", stripped)
            if heading:
                self.add_heading(heading.group(2), len(heading.group(1)))
                continue

            if stripped.startswith("- "):
                self.add_wrapped(
                    stripped[2:],
                    x=MARGIN_X + 12,
                    first_prefix="- ",
                    next_prefix="  ",
                    width=86,
                )
                continue

            numbered = re.match(r"^(\d+)\.\s+(.*)$", stripped)
            if numbered:
                prefix = f"{numbered.group(1)}. "
                self.add_wrapped(
                    numbered.group(2),
                    x=MARGIN_X + 8,
                    first_prefix=prefix,
                    next_prefix=" " * len(prefix),
                    width=86,
                )
                continue

            self.add_wrapped(stripped)

        if self.current:
            self.add_footer()
            self.pages.append("".join(self.current))
            self.current = []

    def write(self, path: Path) -> None:
        objects: list[str] = []
        objects.append("<< /Type /Catalog /Pages 2 0 R >>")

        page_count = len(self.pages)
        page_ids = [3 + i * 2 for i in range(page_count)]
        kids = " ".join(f"{obj_id} 0 R" for obj_id in page_ids)
        objects.append(f"<< /Type /Pages /Kids [{kids}] /Count {page_count} >>")

        for i, content in enumerate(self.pages):
            page_obj = 3 + i * 2
            content_obj = page_obj + 1
            page = (
                f"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 {PAGE_WIDTH} {PAGE_HEIGHT}] "
                f"/Resources << /Font << /F1 1 0 R /F2 {2 + page_count * 2 + 1} 0 R "
                f"/F3 {2 + page_count * 2 + 2} 0 R >> >> /Contents {content_obj} 0 R >>"
            )
            objects.append(page)
            stream = normalize(content)
            objects.append(f"<< /Length {len(stream.encode('latin-1'))} >>\nstream\n{stream}endstream")

        helvetica_obj = len(objects) + 1
        bold_obj = helvetica_obj + 1
        courier_obj = helvetica_obj + 2
        objects.insert(0, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")
        objects.append("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>")
        objects.append("<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>")

        # Object numbers are intentionally rebuilt after inserting the Helvetica object.
        catalog = "<< /Type /Catalog /Pages 3 0 R >>"
        pages = f"<< /Type /Pages /Kids [{' '.join(f'{4 + i * 2} 0 R' for i in range(page_count))}] /Count {page_count} >>"
        rebuilt: list[str] = [
            "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
            catalog,
            pages,
        ]

        bold_id = 4 + page_count * 2
        courier_id = bold_id + 1
        for i, content in enumerate(self.pages):
            page_obj = 4 + i * 2
            content_obj = page_obj + 1
            page = (
                f"<< /Type /Page /Parent 3 0 R /MediaBox [0 0 {PAGE_WIDTH} {PAGE_HEIGHT}] "
                f"/Resources << /Font << /F1 1 0 R /F2 {bold_id} 0 R /F3 {courier_id} 0 R >> >> "
                f"/Contents {content_obj} 0 R >>"
            )
            rebuilt.append(page)
            stream = normalize(content)
            rebuilt.append(f"<< /Length {len(stream.encode('latin-1'))} >>\nstream\n{stream}endstream")

        rebuilt.append("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>")
        rebuilt.append("<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>")

        output = ["%PDF-1.4\n%\xe2\xe3\xcf\xd3\n"]
        offsets = [0]
        for idx, obj in enumerate(rebuilt, start=1):
            offsets.append(sum(len(part.encode("latin-1", "replace")) for part in output))
            output.append(f"{idx} 0 obj\n{obj}\nendobj\n")

        xref_offset = sum(len(part.encode("latin-1", "replace")) for part in output)
        output.append(f"xref\n0 {len(rebuilt) + 1}\n")
        output.append("0000000000 65535 f \n")
        for offset in offsets[1:]:
            output.append(f"{offset:010d} 00000 n \n")
        output.append(
            "trailer\n"
            f"<< /Size {len(rebuilt) + 1} /Root 2 0 R >>\n"
            "startxref\n"
            f"{xref_offset}\n"
            "%%EOF\n"
        )

        path.write_bytes("".join(output).encode("latin-1", "replace"))


def main() -> None:
    writer = PdfWriter()
    writer.render_markdown(SOURCE.read_text(encoding="utf-8"))
    writer.write(OUTPUT)
    print(f"Generated {OUTPUT.name} with {len(writer.pages)} pages")


if __name__ == "__main__":
    main()
