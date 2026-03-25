#!/usr/bin/env python3
"""
export_catalog.py — генерирует public/catalog.json из двух БД.
Запускать из корня проекта: python scripts/export_catalog.py
"""

import sqlite3
import json
import os
import re
from datetime import datetime

# ── Пути ──────────────────────────────────────────────────────────────────────
BASE_DIR   = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PARENT_DIR = os.path.dirname(BASE_DIR)

JEWELRY_DB  = os.path.join(PARENT_DIR, "jewelry-store", "backend", "jewelry.db")
AQUA_DB     = os.path.join(PARENT_DIR, "aquamarine_scrap", "aquamarine.db")
OUTPUT_JSON = os.path.join(BASE_DIR, "public", "catalog.json")
PUBLIC_DIR  = os.path.join(BASE_DIR, "public")

# ── Металл из суффикса артикула (.1/.2/.3/.5/.6) ──────────────────────────────
# Суффикс в конце артикула jewelry.db кодирует точный вариант металла.
# Разные суффиксы = разные товары с разными картинками и характеристиками.
SUFFIX_METAL = {
    ".1": ("Золото 585",  "Золото 585 красное"),
    ".2": ("Золото 585",  "Золото 585 белое"),
    ".3": ("Золото 585",  "Золото 585 жёлтое"),
    ".5": ("Серебро 925", "Серебро 925 родирование"),
    ".6": ("Серебро 925", "Серебро 925 золочение"),
}

# Для артикулов без суффикса и для aquamarine.db
METAL_MAP = {
    "Au 585":                  ("Золото 585",  "Золото 585"),
    "Ag 925":                  ("Серебро 925", "Серебро 925"),
    "Золото 585 красное":      ("Золото 585",  "Золото 585 красное"),
    "Золото 585 белое":        ("Золото 585",  "Золото 585 белое"),
    "Золото 585 жёлтое":       ("Золото 585",  "Золото 585 жёлтое"),
    "Серебро 925 родирование": ("Серебро 925", "Серебро 925 родирование"),
    "Серебро 925 золочение":   ("Серебро 925", "Серебро 925 золочение"),
}

def metal_from_jewelry(article, metal_field):
    """
    Определяет (metal_group, metal_display) для товара из jewelry.db.
    Суффикс артикула имеет приоритет над полем metal.
    """
    m = re.search(r"(\.\d)$", (article or "").strip())
    if m:
        suffix = m.group(1)
        if suffix in SUFFIX_METAL:
            return SUFFIX_METAL[suffix]
    raw = (metal_field or "").strip()
    return METAL_MAP.get(raw, (raw, raw))

def normalize_metal(raw):
    """Нормализует металл для aquamarine.db (нет суффиксов)."""
    raw = (raw or "").strip()
    return METAL_MAP.get(raw, (raw, raw))

# ── Нормализация типа ──────────────────────────────────────────────────────────
def normalize_type(product_type, subtype=None):
    t = (product_type or "").strip()
    s = (subtype or "").strip()
    if s == "Обручальные кольца": return "Кольцо"
    if s == "Крест":  return "Крест"
    if s == "Икона":  return "Икона"
    return t

# ── Нормализация размера ───────────────────────────────────────────────────────
def normalize_size(size_str):
    if not size_str:
        return None
    s = size_str.strip().replace(",", ".")
    if s.lower() in ("без размера", "-", ""):
        return None
    return s

def parse_sizes(sizes_str):
    if not sizes_str:
        return []
    parts = [normalize_size(p.strip()) for p in sizes_str.split(",")]
    return sorted([p for p in parts if p], key=lambda x: float(x) if x else 0)

# ── Артикул: базовая часть (без суффикса металла) ─────────────────────────────
def base_article(article):
    """
    Убирает суффикс вида '.<цифра>' в конце артикула — для отображения клиенту
    и для ключа слияния с aquamarine.db.
    10001.5 → 10001,  74137А.5 → 74137А,  019583 → 019583
    """
    return re.sub(r"\.\d$", "", (article or "").strip())

# ── Путь к картинке ────────────────────────────────────────────────────────────
def image_path_jewelry(image_path, image_url):
    """
    Приоритет: локальный WebP (если сжат) → внешний URL → путь-заглушка.
    """
    if image_path and image_path.strip():
        fname = os.path.basename(image_path.strip())
        name, _ = os.path.splitext(fname)
        local_rel  = f"images/jewelry/{name}.webp"
        local_full = os.path.join(PUBLIC_DIR, local_rel)
        if os.path.exists(local_full):
            return local_rel
    if image_url and image_url.strip():
        return image_url.strip()
    if image_path and image_path.strip():
        fname = os.path.basename(image_path.strip())
        name, _ = os.path.splitext(fname)
        return f"images/jewelry/{name}.webp"
    return None

def image_path_aqua(image_path):
    if not image_path:
        return None
    fname = os.path.basename(image_path.strip())
    name, _ = os.path.splitext(fname)
    return f"images/aquamarine/{name}.webp"

# ── Читаем jewelry.db ──────────────────────────────────────────────────────────
def load_jewelry(conn):
    """
    Ключ группы: (raw_article, display_type).
    raw_article содержит суффикс металла (.1/.5/.6 и т.д.) — каждый суффикс
    означает отдельный товар с отдельной картинкой и характеристиками.
    Один и тот же raw_article в разных РАЗМЕРАХ → один товар, несколько чипов.
    """
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    cur.execute("""
        SELECT id, article, size, metal, type, subtype,
               image_url, image_path, weight, price, inserts
        FROM products
        WHERE is_sold = 0
        ORDER BY article, id
    """)
    rows = cur.fetchall()

    groups = {}  # key = (raw_article, display_type)
    for row in rows:
        raw_art      = (row["article"] or "").strip()
        base_art     = base_article(raw_art)
        display_type = normalize_type(row["type"], row["subtype"])
        metal_group, metal_display = metal_from_jewelry(raw_art, row["metal"])

        key = (raw_art, display_type)

        size   = normalize_size(row["size"])
        weight = row["weight"]
        price  = float(row["price"]) if row["price"] is not None else None
        img    = image_path_jewelry(row["image_path"], row["image_url"])

        if key not in groups:
            groups[key] = {
                # base_art — для отображения клиенту (без суффикса)
                # raw_art используется только как ключ группировки
                "id":             f"j_{raw_art}_{display_type}",
                "article":        base_art,
                "source":         "jewelry",
                "status":         "in_stock",
                "type":           display_type,
                "metal_group":    metal_group,
                "metal_display":  metal_display,
                "inserts":        row["inserts"] if row["inserts"] else None,
                "image":          img,
                "sizes_in_stock": [],
                "sizes_on_order": [],
                # Служебные поля для слияния (не попадают в JSON)
                "_base_art":      base_art,
            }

        g = groups[key]

        # Каждый физический экземпляр — отдельная запись (НЕ дедуплицируем)
        g["sizes_in_stock"].append({
            "size":   size,
            "price":  price,
            "weight": weight,
        })

        # Картинка: если у группы ещё нет изображения — берём первую найденную
        if img and not g["image"]:
            g["image"] = img

    return groups

# ── Читаем aquamarine.db ───────────────────────────────────────────────────────
def load_aquamarine(conn):
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    cur.execute("""
        SELECT pid, article, weight, avg_weight, inserts, metal,
               price, size, image_path, product_type
        FROM products
        WHERE detail_ok = 1
        ORDER BY article
    """)
    rows = cur.fetchall()

    products = []
    for row in rows:
        article      = (row["article"] or "").strip()
        display_type = normalize_type(row["product_type"])
        metal_group, metal_display = normalize_metal(row["metal"])
        sizes = parse_sizes(row["size"])
        img   = image_path_aqua(row["image_path"])
        sup_price = float(row["price"]) if row["price"] else None

        order_entries = (
            [{"size": s, "price": sup_price, "weight": None} for s in sizes]
            if sizes else
            [{"size": None, "price": sup_price, "weight": None}]
        )

        products.append({
            "id":             f"a_{row['pid']}",
            "article":        article,
            "source":         "aquamarine",
            "status":         "order",
            "type":           display_type,
            "metal_group":    metal_group,
            "metal_display":  metal_display,
            "weight":         row["weight"],
            "avg_weight":     row["avg_weight"],
            "inserts":        row["inserts"] if row["inserts"] else None,
            "image":          img,
            "sizes_in_stock": [],
            "sizes_on_order": order_entries,
        })
    return products

# ── Объединение ────────────────────────────────────────────────────────────────
def merge_products(jewelry_groups, aqua_list):
    """
    Ключ совпадения: (base_article, metal_display, type).
    base_article — артикул без суффикса металла.
    metal_display — точный вариант металла ("Золото 585 красное", "Серебро 925 родирование" …).

    Это позволяет сопоставить:
      jewelry  AB123.1 (Au 585)          →  metal_display = "Золото 585 красное"
      aquamarine AB123  metal="Золото 585 красное"  →  metal_display = "Золото 585 красное"
    """
    # aqua_by_key: (article, metal_display, type) → [продукты]
    aqua_by_key = {}
    for p in aqua_list:
        key = (p["article"], p["metal_display"], p["type"])
        aqua_by_key.setdefault(key, []).append(p)

    result    = []
    used_aqua = set()

    for j_key, j_prod in jewelry_groups.items():
        base_art     = j_prod["_base_art"]
        metal_display = j_prod["metal_display"]
        ptype        = j_prod["type"]

        merge_key = (base_art, metal_display, ptype)

        if merge_key in aqua_by_key:
            used_aqua.add(merge_key)
            a_prods = aqua_by_key[merge_key]

            merged = {k: v for k, v in j_prod.items() if not k.startswith("_")}
            merged["source"] = "merged"
            merged["status"] = "merged"

            # Размеры в наличии (из jewelry)
            in_stock_sizes = {e["size"] for e in merged["sizes_in_stock"] if e["size"]}

            # Размеры под заказ — только те которых нет в наличии
            order_entries = []
            for ap in a_prods:
                for e in ap["sizes_on_order"]:
                    if e["size"] not in in_stock_sizes:
                        order_entries.append(e)
            merged["sizes_on_order"] = order_entries

            result.append(merged)
        else:
            # Убираем служебные поля перед добавлением в результат
            result.append({k: v for k, v in j_prod.items() if not k.startswith("_")})

    # Оставшиеся aquamarine (не смержились)
    for key, a_prods in aqua_by_key.items():
        if key not in used_aqua:
            for ap in a_prods:
                result.append(ap)

    return result

# ── Финализация ────────────────────────────────────────────────────────────────
def finalize(products):
    """Сортирует размеры и весь список товаров."""
    def sort_key(e):
        s = e.get("size")
        try:    return float(s)
        except: return 9999

    for p in products:
        p["sizes_in_stock"] = sorted(p.get("sizes_in_stock", []), key=sort_key)
        p["sizes_on_order"] = sorted(p.get("sizes_on_order", []), key=sort_key)

    order = {"in_stock": 0, "merged": 0, "order": 1}
    products.sort(key=lambda p: (order.get(p["status"], 2), p["type"], p["article"]))
    return products

# ── Main ───────────────────────────────────────────────────────────────────────
def main():
    print("Читаю jewelry.db …")
    with sqlite3.connect(JEWELRY_DB) as c1:
        jewelry = load_jewelry(c1)
    print(f"  Групп товаров (jewelry): {len(jewelry)}")

    print("Читаю aquamarine.db …")
    with sqlite3.connect(AQUA_DB) as c2:
        aqua = load_aquamarine(c2)
    print(f"  Товаров (aquamarine): {len(aqua)}")

    print("Объединяю …")
    products = merge_products(jewelry, aqua)
    products = finalize(products)
    print(f"  Итого позиций: {len(products)}")

    in_stock = sum(1 for p in products if p["status"] in ("in_stock", "merged"))
    on_order = sum(1 for p in products if p["status"] == "order")
    merged   = sum(1 for p in products if p["status"] == "merged")
    print(f"  В наличии: {in_stock}  |  Под заказ: {on_order}  |  Совмещённые: {merged}")

    # Статистика по металлам
    from collections import Counter
    metal_cnt = Counter(p["metal_display"] for p in products if p["status"] in ("in_stock", "merged"))
    print("\n  Металлы (в наличии):")
    for md, cnt in sorted(metal_cnt.items()):
        print(f"    {cnt:4d}  {md}")

    catalog = {
        "generated_at": datetime.now().isoformat(timespec="seconds"),
        "products": products,
    }

    os.makedirs(os.path.dirname(OUTPUT_JSON), exist_ok=True)
    with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
        json.dump(catalog, f, ensure_ascii=False, indent=2)

    size_kb = os.path.getsize(OUTPUT_JSON) / 1024
    print(f"\n✓ Сохранено: {OUTPUT_JSON}  ({size_kb:.0f} KB)")

if __name__ == "__main__":
    main()
