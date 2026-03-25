#!/usr/bin/env python3
"""
compress_images.py — сжимает все картинки товаров в WebP.
Запускать из корня проекта: python scripts/compress_images.py

Требования: pip install Pillow
"""

import os
import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("Установи Pillow: pip install Pillow")
    sys.exit(1)

BASE_DIR   = Path(__file__).parent.parent
PARENT_DIR = BASE_DIR.parent   # BleskUserCatalog/

SRC_JEWELRY  = PARENT_DIR / "jewelry-store" / "backend" / "images"
SRC_AQUA     = PARENT_DIR / "aquamarine_scrap" / "images"

DST_JEWELRY  = BASE_DIR / "public" / "images" / "jewelry"
DST_AQUA     = BASE_DIR / "public" / "images" / "aquamarine"

WEBP_QUALITY = 82   # 0-100; 82 — хороший баланс качества и размера

def convert_dir(src: Path, dst: Path, label: str):
    dst.mkdir(parents=True, exist_ok=True)
    files = sorted(f for f in src.iterdir() if f.suffix.lower() in (".jpg", ".jpeg", ".png", ".webp"))
    total = len(files)
    converted = 0
    skipped = 0
    errors = 0

    for i, src_file in enumerate(files, 1):
        out_file = dst / (src_file.stem + ".webp")

        # Пропускаем если уже конвертировано и не изменился исходник
        if out_file.exists() and out_file.stat().st_mtime >= src_file.stat().st_mtime:
            skipped += 1
            continue

        try:
            with Image.open(src_file) as img:
                # RGBA → RGB если нужно для WebP
                if img.mode in ("RGBA", "P"):
                    img = img.convert("RGBA")
                elif img.mode != "RGB":
                    img = img.convert("RGB")
                img.save(out_file, "WEBP", quality=WEBP_QUALITY, method=4)
            converted += 1
        except Exception as e:
            print(f"  [ERR] {src_file.name}: {e}")
            errors += 1

        if i % 200 == 0 or i == total:
            print(f"  [{label}] {i}/{total} обработано …")

    print(f"  [{label}] Конвертировано: {converted}, пропущено (актуально): {skipped}, ошибок: {errors}")
    return converted, skipped, errors

def main():
    import time
    t0 = time.time()

    print(f"WebP quality = {WEBP_QUALITY}\n")

    print("── Украшения (jewelry) ──")
    convert_dir(SRC_JEWELRY, DST_JEWELRY, "jewelry")

    print("\n── Поставщик (aquamarine) ──")
    convert_dir(SRC_AQUA, DST_AQUA, "aquamarine")

    elapsed = time.time() - t0
    print(f"\n✓ Готово за {elapsed:.0f} сек.")

    # Сравниваем размеры
    def dir_size_mb(p: Path):
        return sum(f.stat().st_size for f in p.rglob("*") if f.is_file()) / 1024 / 1024

    src_total = dir_size_mb(SRC_JEWELRY) + dir_size_mb(SRC_AQUA)
    dst_total = dir_size_mb(DST_JEWELRY) + dir_size_mb(DST_AQUA)
    print(f"  Исходники:  {src_total:.0f} MB")
    print(f"  WebP:       {dst_total:.0f} MB")
    print(f"  Сжатие:     {(1 - dst_total/src_total)*100:.0f}%")

if __name__ == "__main__":
    main()
