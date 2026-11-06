#!/usr/bin/env python3
"""Xoá các rule trùng lặp với design system (global.css) trong page CSS.

Cú pháp: python3 scripts/remove_css_rules.py <file.css> <selector> [<selector> ...]

Mỗi selector trong danh sách sẽ bị xoá cả rule thường lẫn biến thể
pseudo-class (:hover, :focus, ::placeholder...). Rule nằm trong @media
cũng bị xoá. Rule con (descendant) của selector bị xoá cũng bị xoá theo
(ví dụ '.input-label span' khi '.input-label' bị xoá).
"""
import re
import sys


def find_rules(css: str):
    """Trả về list (start, end, selector) cho MỌI rule, kể cả trong @media.

    `start` là vị trí bắt đầu thực sự của selector (sau khi bỏ '}' / ';'
    thừa), `end` là vị trí ngay sau '}' đóng của rule.
    """
    rules = []
    i = 0
    n = len(css)
    while i < n:
        brace = css.find('{', i)
        if brace == -1:
            break
        raw = css[i:brace]
        # bỏ phần rác thừa đứng trước selector (dấu '}' hoặc ';' của rule trước)
        lead = len(raw) - len(raw.lstrip('}; \t\r\n'))
        sel = raw[lead:].strip()
        sel_start = i + lead

        if sel.startswith('@'):
            # at-rule: bỏ qua prelude, tiếp tục quét bên trong
            i = brace + 1
            continue

        depth = 1
        j = brace + 1
        while j < n and depth > 0:
            if css[j] == '{':
                depth += 1
            elif css[j] == '}':
                depth -= 1
            j += 1
        rules.append((sel_start, j, sel))
        i = j
    return rules


PSEUDO_CLASSES = (
    'hover|focus|focus-visible|focus-within|active|disabled|checked|'
    'required|invalid|valid|empty|read-only|placeholder|first-child|'
    'last-child|only-child|first-of-type|last-of-type|nth-child|'
    'nth-last-child|not|is|where|root|visited|link|target|before|after|'
    'first-letter|first-line|selection|backdrop|marker|placeholder-shown|'
    'indeterminate|default|autofill|open|closed|modal|popover-open'
)


def base_selector(sel: str) -> str:
    """'.input:focus' -> '.input' ; '.input-label span' -> giữ nguyên.

    Chỉ bỏ pseudo-class/pseudo-element có tên trong danh sách hợp lệ,
    KHÔNG đụng tới descendant selector (dấu space) hay combinator.
    """
    sel = sel.strip()
    sel = re.sub(r'::?(?:%s)\b' % PSEUDO_CLASSES, '', sel)
    return sel.strip()


def matches(sel: str, targets: set[str]) -> bool:
    """Selector khớp target nếu base selector bằng target, hoặc nó là
    descendant/combinator của một target."""
    base = base_selector(sel)
    if not base:
        return False
    if base in targets:
        return True
    for part in re.split(r'\s+', base):
        if part in targets:
            return True
    return False


def remove_rules(path: str, targets: set[str]) -> int:
    with open(path, encoding='utf-8') as f:
        css = f.read()

    hits = [(s, e, sel) for s, e, sel in find_rules(css) if matches(sel, targets)]
    if not hits:
        return 0

    hits.sort()
    out = css
    for start, end, _ in reversed(hits):
        out = out[:start] + out[end:]

    out = re.sub(r'[ \t]+\n', '\n', out)
    out = re.sub(r'\n{3,}', '\n\n', out)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(out)
    return len(hits)


if __name__ == '__main__':
    target_file = sys.argv[1]
    selectors = set(sys.argv[2:])
    n = remove_rules(target_file, selectors)
    print(f'{target_file}: removed {n} rule(s)')
