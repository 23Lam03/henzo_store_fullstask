#!/usr/bin/env python3
"""Chuyển các giá trị màu hardcode sang token của design system.

Mục tiêu: loại bỏ hoàn toàn màu tím indigo cũ (rgba(79,70,229,...) / #4F46E5 ...)
và các hex rời rạc, thay bằng token ngữ nghĩa trong global.css.
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent / "src"

# Bảng tra cứu: mã cũ -> token thay thế
HEX_MAP = {
    # tím indigo cũ
    "#EEF2FF": "var(--color-primary-soft)",
    "#E0E7FF": "var(--brand-100)",
    "#C7D2FE": "var(--brand-200)",
    "#A5B4FC": "var(--brand-300)",
    "#818CF8": "var(--brand-400)",
    "#6366F1": "var(--brand-500)",
    "#4F46E5": "var(--color-primary)",
    "#4338CA": "var(--brand-700)",
    "#3730A3": "var(--brand-800)",
    "#312E81": "var(--brand-900)",
    # nền cũ
    "#F7F8FA": "var(--color-background)",
    "#FBFBFC": "var(--color-surface-2)",
    "#FAFAFB": "var(--color-surface-2)",
    "#F1F2F5": "var(--color-surface-sunken)",
    "#E4E6EB": "var(--color-border)",
    "#D3D6DD": "var(--color-border-strong)",
    "#EFF0F3": "var(--color-border-subtle)",
    "#FFFFFF": "#fff",
    # chữ cũ
    "#14161F": "var(--color-text-primary)",
    "#101322": "var(--color-surface-inverse)",
    "#1F2233": "var(--color-surface-sunken)",
    "#565B6B": "var(--color-text-secondary)",
    "#8A8FA0": "var(--color-text-muted)",
    # màu ngữ nghĩa cũ -> mới
    "#059669": "var(--color-success)",
    "#ECFDF5": "var(--color-success-soft)",
    "#D97706": "var(--color-warning)",
    "#FFFBEB": "var(--color-warning-soft)",
    "#DC2626": "var(--color-danger)",
    "#FEF2F2": "var(--color-danger-soft)",
    "#0284C7": "var(--color-info)",
    "#0EA5E9": "var(--color-accent)",
    "#F59E0B": "var(--color-warning)",
    "#FBBF24": "var(--color-warning)",
    "#10B981": "var(--color-success)",
    "#F97316": "var(--color-accent)",
    "#EF4444": "var(--color-danger)",
    "#FCA5A5": "var(--color-danger)",
    # dark mode
    "#0C0E15": "var(--color-background)",
    "#262A38": "var(--color-border)",
    "#333849": "var(--color-border-strong)",
    "#1E2130": "var(--color-border-subtle)",
    "#F1F3F8": "var(--color-text-primary)",
    "#A6ABBC": "var(--color-text-secondary)",
    "#6E7489": "var(--color-text-muted)",
    "#1E1B4B": "var(--brand-800)",
    # trung tính thường gặp
    "#F9FAFB": "var(--color-surface-2)",
    "#F3F4F6": "var(--color-surface-sunken)",
    "#FAFAFA": "var(--color-surface-2)",
    "#F9F9F9": "var(--color-surface-2)",
    "#F0F0F0": "var(--color-surface-sunken)",
    "#E8E8E8": "var(--color-border)",
    "#1a1a1a": "var(--color-text-primary)",
    "#CBD5E1": "var(--color-border-strong)",
    "#E5E7EB": "var(--color-border-strong)",
    "#9CA3AF": "var(--color-text-muted)",
}

# rgba cũ -> token
RGBA_MAP = [
    (r"rgba\(79,\s*70,\s*229,\s*0\.1\)", "var(--color-primary-soft)"),
    (r"rgba\(79,\s*70,\s*229,\s*0\.03\)", "var(--color-primary-soft)"),
    (r"rgba\(79,\s*70,\s*229,\s*0\.02\)", "var(--color-primary-soft)"),
    (r"rgba\(79,\s*70,\s*229,\s*0\.05\)", "var(--color-primary-soft)"),
    (r"rgba\(79,\s*70,\s*229,\s*0\.08\)", "var(--color-primary-soft)"),
    (r"rgba\(79,\s*70,\s*229,\s*0\.12\)", "var(--color-primary-soft)"),
    (r"rgba\(79,\s*70,\s*229,\s*0\.14\)", "var(--color-primary-soft)"),
    (r"rgba\(79,\s*70,\s*229,\s*0\.18\)", "var(--color-primary-soft)"),
    (r"rgba\(79,\s*70,\s*229,\s*0\.16\)", "var(--color-primary-soft)"),
    (r"rgba\(99,\s*102,\s*241,\s*0\.14\)", "var(--color-primary-soft)"),
    (r"rgba\(99,\s*102,\s*241,\s*0\.12\)", "var(--color-primary-soft)"),
    (r"rgba\(14,\s*165,\s*233,\s*0\.12\)", "var(--color-accent-soft)"),
    (r"rgba\(20,\s*22,\s*31,\s*0\.08\)", "var(--color-surface-sunken)"),
    (r"rgba\(16,\s*19,\s*34,\s*0\.55\)", "rgba(12, 16, 15, 0.55)"),
    (r"rgba\(16,\s*19,\s*34,\s*0\.6\)", "rgba(12, 16, 15, 0.6)"),
]


def migrate(text: str) -> str:
    original = text

    # rgba cũ
    for pattern, replacement in RGBA_MAP:
        text = re.sub(pattern, replacement, text)

    # hex cũ (chỉ trong property value, không đụng comment nếu có dấu)
    for old, new in HEX_MAP.items():
        pattern = re.compile(rf"(?<![\w-]){re.escape(old)}(?![\w-])", re.IGNORECASE)
        text = pattern.sub(new, text)

    return text if text != original else text


def main() -> None:
    changed = 0
    for css_file in ROOT.rglob("*.css"):
        if css_file.name == "global.css":
            continue
        content = css_file.read_text(encoding="utf-8")
        updated = migrate(content)
        if updated != content:
            css_file.write_text(updated, encoding="utf-8")
            changed += 1
            print(f"  updated {css_file.relative_to(ROOT.parent)}")
    print(f"\nDone: {changed} file(s) updated.")


if __name__ == "__main__":
    sys.exit(main())
