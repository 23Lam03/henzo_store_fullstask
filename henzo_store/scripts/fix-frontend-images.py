#!/usr/bin/env python3
"""Thay ảnh sai/chết trong products.ts bằng ảnh đúng danh mục.

Mỗi ảnh đã được kiểm chứng bằng Vision framework (macOS) là đúng loại thiết
bị trong danh mục, và đã kiểm tra HTTP 200 (không chết).
"""
import re
import sys

PATH = 'src/data/products.ts'

CATEGORY_IMAGES = {
    'Điện thoại': [
        'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600',
        'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600',
        'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=600',
        'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600',
        'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600',
        'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=600',
        'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=600',
        'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=600',
    ],
    'Laptop': [
        'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600',
        'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=600',
        'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600',
        'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=600',
        'https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?w=600',
        'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=600',
    ],
    'PC Gaming': [
        'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=600',
        'https://images.unsplash.com/photo-1563770660941-20978e870e26?w=600',
        'https://images.unsplash.com/photo-1555680202-c86f0e12f086?w=600',
    ],
    'Màn hình': [
        'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600',
        'https://images.unsplash.com/photo-1547394765-185e1e68f34e?w=600',
    ],
    'Chuột': [
        'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600',
        'https://images.unsplash.com/photo-1586816879360-004f5b0c51e5?w=600',
    ],
    'Bàn phím': [
        'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=600',
        'https://images.unsplash.com/photo-1601597111158-2fceff292cdc?w=600',
    ],
    'Tai nghe': [
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600',
        'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600',
        'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=600',
    ],
    'Phụ kiện': [
        'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=600',
        'https://images.unsplash.com/photo-1555680202-c86f0e12f086?w=600',
        'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=600',
    ],
}

FALLBACK = [
    'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=600',
    'https://images.unsplash.com/photo-1555680202-c86f0e12f086?w=600',
]

# Ảnh đã bị Vision xác minh sai danh mục / 404 -> phải loại khỏi danh sách
BAD_IDS = {
    'photo-1512470604395-f0b3f83454e0',  # 404
    'photo-1592750475338-74b7b21085ab',  # document
    'photo-1603891128711-11b4b03bb138',  # document 91%
    'photo-1591337676887-a217a6970a8a',  # document 85%
    'photo-1615971677499-5467cbab01c0',  # sofa
    'photo-1544427920-c49ccfb85579',  # people/crowd
    'photo-1587202372775-e229f172b9d7',  # music/speakers
    'photo-1616763355548-1b606f439f86',  # wood
}


def photo_id(url: str) -> str:
    """Trả về photo id dạng 'photo-1592750475338-74b7b21085ab'."""
    tail = url.split('/photo-')[-1].split('?')[0]
    return f'photo-{tail}'


def main() -> int:
    with open(PATH, encoding='utf-8') as f:
        src = f.read()

    out = []
    pos = 0
    changed_products = 0
    replaced = 0

    pattern = re.compile(r"\{\s*\n\s*id: 'p\d+'[^\n]*\n(?:.*?\n)*?\s*\},", re.DOTALL)

    for m in pattern.finditer(src):
        block = m.group(0)

        cat_m = re.search(r"categoryName: '([^']+)'", block)
        if not cat_m:
            out.append(src[pos:m.end()])
            pos = m.end()
            continue
        category = cat_m.group(1)
        pool = CATEGORY_IMAGES.get(category, FALLBACK)

        imgs = re.findall(
            r"'(https://images\.unsplash\.com/photo-[^']+)'", block
        )
        if not imgs or not any(photo_id(u) in BAD_IDS for u in imgs):
            out.append(src[pos:m.end()])
            pos = m.end()
            continue

        kept = [u for u in imgs if photo_id(u) not in BAD_IDS]
        chosen: list[str] = []
        for u in kept:
            if u in pool and u not in chosen:
                chosen.append(u)
        for u in pool:
            if len(chosen) >= 5:
                break
            if u not in chosen:
                chosen.append(u)
        for u in kept:
            if len(chosen) >= 5:
                break
            if u not in chosen:
                chosen.append(u)
        chosen = chosen[:5]

        new_imgs = (
            '    images: [\n'
            + ''.join(f"      '{u}',\n" for u in chosen)
            + '    ],'
        )
        new_block = re.sub(
            r"    images: \[\n(?:\s*'[^']+',\n)+\s*\],", new_imgs, block
        )
        out.append(src[pos:m.start()])
        out.append(new_block)
        pos = m.end()
        changed_products += 1
        replaced += len([u for u in imgs if photo_id(u) in BAD_IDS])

    out.append(src[pos:])
    with open(PATH, 'w', encoding='utf-8') as f:
        f.write(''.join(out))

    print(
        f'Đã sửa {changed_products} sản phẩm, thay {replaced} ảnh sai/chết.'
    )
    return 0


if __name__ == '__main__':
    sys.exit(main())
