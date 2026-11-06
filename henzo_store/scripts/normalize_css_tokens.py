#!/usr/bin/env python3
"""Chuẩn hoá CSS: thay giá trị px cứng bằng design token của global.css.

Cú pháp: python3 scripts/normalize_css_tokens.py <file.css> [...] [--dry]

Chỉ thay trong đúng property tương ứng (border-radius -> radius token,
font-size -> font token, ...) để không làm lẫn giữa các nhóm.
"""
import re
import sys

# property -> danh sách (px, token), theo thứ tự ưu tiên giá trị lớn -> nhỏ.
PROPERTY_TOKENS = {
    'border-radius': [
        ('20px', 'var(--radius-lg)'),
        ('18px', 'var(--radius-lg)'),
        ('16px', 'var(--radius-lg)'),
        ('14px', 'var(--radius-md)'),
        ('12px', 'var(--radius-md)'),
        ('10px', 'var(--radius-sm)'),
        ('8px', 'var(--radius-sm)'),
        ('6px', 'var(--radius-xs)'),
        ('4px', 'var(--radius-xs)'),
    ],
    'font-size': [
        ('26px', 'var(--font-size-2xl)'),
        ('24px', 'var(--font-size-2xl)'),
        ('22px', 'var(--font-size-xl)'),
        ('20px', 'var(--font-size-xl)'),
        ('18px', 'var(--font-size-lg)'),
        ('17px', 'var(--font-size-md)'),
        ('16px', 'var(--font-size-md)'),
        ('15px', 'var(--font-size-md)'),
        ('14px', 'var(--font-size-base)'),
        ('13.5px', 'var(--font-size-base)'),
        ('13px', 'var(--font-size-sm)'),
        ('12.5px', 'var(--font-size-sm)'),
        ('12px', 'var(--font-size-xs)'),
        ('11.5px', 'var(--font-size-xs)'),
        ('11px', 'var(--font-size-2xs)'),
        ('10.5px', 'var(--font-size-2xs)'),
        ('10px', 'var(--font-size-2xs)'),
    ],
    'gap': [
        ('32px', 'var(--space-8)'),
        ('28px', 'var(--space-7)'),
        ('24px', 'var(--space-6)'),
        ('20px', 'var(--space-5)'),
        ('16px', 'var(--space-4)'),
        ('12px', 'var(--space-3)'),
        ('8px', 'var(--space-2)'),
        ('4px', 'var(--space-1)'),
    ],
}

# rgba cứng -> token (áp dụng toàn cục, không phụ thuộc property).
RGBA_RULES = [
    (r'rgba\(79,\s*70,\s*229,\s*0\.(?:04|06|08|12|15|2)\)', 'var(--color-primary-soft)'),
    (r'rgba\(79,\s*70,\s*229,\s*0\.(?:3|35|4|5)\)', 'var(--shadow-primary)'),
    (r'rgba\(16,\s*185,\s*129,\s*0\.\d+\)', 'var(--color-success-soft)'),
    (r'rgba\(245,\s*158,\s*11,\s*0\.\d+\)', 'var(--color-warning-soft)'),
    (r'rgba\(239,\s*68,\s*68,\s*0\.\d+\)', 'var(--color-danger-soft)'),
    (r'rgba\(6,\s*182,\s*212,\s*0\.\d+\)', 'rgba(14, 165, 233, 0.12)'),
]


def normalize(text: str) -> tuple[str, int]:
    count = 0

    for pattern, repl in RGBA_RULES:
        text, n = re.subn(pattern, repl, text)
        count += n

    for prop, tokens in PROPERTY_TOKENS.items():
        for px, token in tokens:
            # chỉ thay trong khai báo của đúng property này
            pattern = r'(?m)(^\s*' + prop + r'\s*:\s*[^;{}]*?)\b' + re.escape(px) + r'\b'
            text, n = re.subn(pattern, lambda m: m.group(1) + token, text)
            count += n

    return text, count


if __name__ == '__main__':
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    dry = '--dry' in sys.argv
    for path in args:
        with open(path, encoding='utf-8') as f:
            css = f.read()
        out, n = normalize(css)
        if n and not dry:
            with open(path, 'w', encoding='utf-8') as f:
                f.write(out)
        print(f'{path}: {n} replacement(s)')
