from pathlib import Path
import textwrap


ROOT = Path(__file__).resolve().parents[1]
INPUT_FILE = ROOT / "docs" / "multiplayer-gaming-site-100-steps.md"
OUTPUT_FILE = ROOT / "docs" / "multiplayer-gaming-site-100-steps.pdf"


def escape_pdf_text(text: str) -> str:
    return (
        text.replace("\\", "\\\\")
        .replace("(", "\\(")
        .replace(")", "\\)")
    )


def markdown_to_lines(markdown_text: str) -> list[str]:
    lines: list[str] = []
    for raw in markdown_text.splitlines():
        stripped = raw.strip()
        if not stripped:
            lines.append("")
            continue
        if stripped.startswith("# "):
            lines.append(stripped[2:].upper())
            lines.append("")
            continue
        if stripped.startswith("## "):
            lines.append(stripped[3:].upper())
            continue
        if stripped.startswith("- "):
            wrapped = textwrap.wrap(f"* {stripped[2:]}", width=90) or [""]
            lines.extend(wrapped)
            continue
        wrapped = textwrap.wrap(stripped, width=90) or [""]
        lines.extend(wrapped)
    return lines


def build_pdf_text(lines: list[str]) -> bytes:
    page_width = 612
    page_height = 792
    margin_left = 50
    margin_top = 50
    line_height = 14
    usable_height = page_height - (margin_top * 2)
    lines_per_page = usable_height // line_height

    pages: list[list[str]] = []
    current_page: list[str] = []

    for line in lines:
        current_page.append(line)
        if len(current_page) >= lines_per_page:
            pages.append(current_page)
            current_page = []

    if current_page:
        pages.append(current_page)

    objects: list[bytes] = []

    def add_object(data: str | bytes) -> int:
        if isinstance(data, str):
            data = data.encode("latin-1", errors="replace")
        objects.append(data)
        return len(objects)

    font_obj = add_object("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")

    page_ids: list[int] = []
    content_ids: list[int] = []

    for page_lines in pages:
        text_cmds = ["BT", f"/F1 11 Tf", f"{margin_left} {page_height - margin_top} Td", f"{line_height} TL"]
        first = True
        for line in page_lines:
            if first:
                text_cmds.append(f"({escape_pdf_text(line)}) Tj")
                first = False
            else:
                text_cmds.append("T*")
                text_cmds.append(f"({escape_pdf_text(line)}) Tj")
        text_cmds.append("ET")
        stream = "\n".join(text_cmds).encode("latin-1", errors="replace")
        content_obj = add_object(
            b"<< /Length " + str(len(stream)).encode("ascii") + b" >>\nstream\n" + stream + b"\nendstream"
        )
        content_ids.append(content_obj)
        page_obj = add_object(
            f"<< /Type /Page /Parent 0 0 R /MediaBox [0 0 {page_width} {page_height}] "
            f"/Resources << /Font << /F1 {font_obj} 0 R >> >> /Contents {content_obj} 0 R >>"
        )
        page_ids.append(page_obj)

    kids = " ".join(f"{page_id} 0 R" for page_id in page_ids)
    pages_obj = add_object(f"<< /Type /Pages /Kids [{kids}] /Count {len(page_ids)} >>")

    for page_id in page_ids:
        page_data = objects[page_id - 1].decode("latin-1")
        objects[page_id - 1] = page_data.replace("/Parent 0 0 R", f"/Parent {pages_obj} 0 R").encode("latin-1")

    catalog_obj = add_object(f"<< /Type /Catalog /Pages {pages_obj} 0 R >>")

    pdf = bytearray(b"%PDF-1.4\n")
    offsets = [0]
    for idx, obj in enumerate(objects, start=1):
        offsets.append(len(pdf))
        pdf.extend(f"{idx} 0 obj\n".encode("ascii"))
        pdf.extend(obj)
        pdf.extend(b"\nendobj\n")

    xref_offset = len(pdf)
    pdf.extend(f"xref\n0 {len(objects) + 1}\n".encode("ascii"))
    pdf.extend(b"0000000000 65535 f \n")
    for offset in offsets[1:]:
        pdf.extend(f"{offset:010d} 00000 n \n".encode("ascii"))

    pdf.extend(
        (
            f"trailer\n<< /Size {len(objects) + 1} /Root {catalog_obj} 0 R >>\n"
            f"startxref\n{xref_offset}\n%%EOF"
        ).encode("ascii")
    )
    return bytes(pdf)


def main() -> None:
    markdown_text = INPUT_FILE.read_text(encoding="utf-8")
    lines = markdown_to_lines(markdown_text)
    pdf_bytes = build_pdf_text(lines)
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_FILE.write_bytes(pdf_bytes)
    print(f"Created {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
