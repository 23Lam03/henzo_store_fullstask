#!/usr/bin/env python3
"""Giảm weight chữ quá nặng (800/900) xuống mức tinh tế hơn.

800/900 là dấu hiệu rõ của template AI: chữ quá đậm, không có nhịp thị giác.
Ở hệ editorial, tiêu đề dùng serif weight 600, chữ phụ dùng 600–700.
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent / "src"

# 900 -> 700, 800 -> 700
WEIGHT_MAP = {
    "font-weight: 900": "font-weight: 700",
    "font-weight:900": "font-weight:700",
    "font-weight: 800": "font-weight: 700",
    "font-weight:800": "font-weight:700",
}


def migrate(text: str) -> str:
    original = text
    for old, new in WEIGHT_MAP.items():
        text = re.sub(re.escape(old) + r"(?=\s*[;])", new, text)
    return text


def main() -> None:
    changed = 0
    total = 0
    for css_file in ROOT.rglob("*.css"):
        content = css_file.read_text(encoding="utf-8")
        updated = migrate(content)
        if updated != content:
            n = sum(
                1
                for a, b in zip(content.splitlines(), updated.splitlines())
                if a != b
            )
            total += n
            css_file.write_text(updated, encoding="utf-8")
            changed += 1
    print(f"{changed} file(s), {total} rule(s) updated.")


if __name__ == "__main__":
    sys.exit(main())
