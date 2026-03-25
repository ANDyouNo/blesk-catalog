#!/usr/bin/env python3
"""
export_catalog.py — генерирует public/catalog.json из двух БД.
Запускать из корня проекта: python scripts/export_catalog.py
"""

import sqlite3
import json
import os
from datetime import datetime

# ── Пути ──────────────────────────────────────────────────────────────────────
BASE_DIR   = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PARENT_DIR = os.path.dirname(BASE_DIR)           # BleskUserCatalog/

JEWELRY_DB  = os.path.join(PARENT_DIR, "jewelry-store", "backend", "jewelry.db")
AQUA_DB     = os.path.join(PARENT_DIR, "aquamarine_scrap", "aquamarine.db")
OUTPUT_JSON = os.path.join(BASE_DIR, "public", "catalog.json")

# ── Нормализация металла ───────────────────────────────────────────────────────
METAL_MAP = {
    # jewelry.db
    "Au 585":                    ("Золото 585",  "Золото 585"),
    "Ag 925":                    ("Серебро 925", "Серебро 925"),
    # aquamarine.db
    "Золото 585 красное":        ("Золото 585",  "Золото 585 (красное)"),
    "Золото 585 белое":          ("Золото 585",  "Золото 585 (белое)"),
    "Серебро 925 родирование":   ("Серебро 925", "Серебро 925 (родирование)"),
}

def normalize_metal(raw):
    """Возвращает (metal_group, metal_display)."""
    raw = (raw or "").strip()
    return METAL_MAP.get(raw, (raw, raw))

# ── Нормализация типа ──────────────────────────────────────────────────────────
def normalize_type(product_type, subtype=None):
    """Маппинг типов из jewelry.db согласно ТЗ."""
    t = (product_type or "").strip()
    s = (subtype or "").strip()

    if s == "Обручальные кольца":
        return "Кольцо"
    if s == "Крест":
        return "Крест"
    if s == "Икона":
        return "Икона"

    return t

# ── Нормализация размера ───────────────────────────────────────────────────────
def normalize_size(size_str):
    """Заменяет запятую на точку; возвращает None если 'Без размера' или пусто."""
    if not size_str:
        return None
    s = size_str.strip().replace(",", ".")
    if s.lower() in ("без размера", "-", ""):
        return None
    return s

def parse_sizes(sizes_str):
    """Разбивает строку '16, 16.5, 17' в список нормализованных размеров."""
    if not sizes_str:
        return []
    parts = [normalize_size(p.strip()) for p in sizes_str.split(",")]
    return sorted([p for p in parts if p], key=lambda x: float(x) if x else 0)

# ── Путь к картинке ────────────────────────────────────────────────────────────
def image_path_jewelry(image_path, image_url):
    """Возвращает либо внешний URL, либо локальный путь в public/."""
    if image_url and image_url.strip():
        return image_url.strip()
    if image_path and image_path.strip():
        # strip path, take filename only
        fname = os.path.basename(image_path.strip())
        # webp-версия будет после сжатия
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
    Группируем по (article, normalized_type).
    Возвращает dict: (article, type) -> product_dict
    """
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    cur.execute("""
        SELECT id, article, size, metal, type, subtype,
               image_url, image_path, weight, price, inserts
        FROM products
        WHERE is_sold = 0
        ORDER BY article
    """)
    rows = cur.fetchall()

    groups = {}  # key = (article, display_type)
    for row in rows:
        article = (row["article"] or "").strip()
        display_type = normalize_type(row["type"], row["subtype"])
        key = (article, display_type)

        metal_group, metal_display = normalize_metal(row["metal"])
        size = normalize_size(row["size"])
        img = image_path_jewelry(row["image_path"], row["image_url"])

        if key not in groups:
            groups[key] = {
                "id":            f"j_{article}_{display_type}",
                "article":       article,
                "source":        "jewelry",
                "status":        "in_stock",
                "type":          display_type,
                "metal_group":   metal_group,
                "metal_display": metal_display,
                "weight":        row["weight"],
                "avg_weight":    None,
                "inserts":       row["inserts"] if row["inserts"] else None,
                "image":         img,
                # sizes: список {size, price}
                "sizes_in_stock": [],
                "sizes_on_order": [],
            }

        g = groups[key]
        price = row["price"]
        g["sizes_in_stock"].append({
            "size":  size,
            "price": float(price) if price is not None else None,
        })

        # Берём картинку у первого попавшегося с внешним URL (приоритет)
        if img and img.startswith("http") and (not g["image"] or not g["image"].startswith("http")):
            g["image"] = img

    return groups

# ── Читаем aquamarine.db ───────────────────────────────────────────────────────
def load_aquamarine(conn):
    """Возвращает список product_dict."""
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
        article = (row["article"] or "").strip()
        display_type = normalize_type(row["product_type"])
        metal_group, metal_display = normalize_metal(row["metal"])
        sizes = parse_sizes(row["size"])
        img = image_path_aqua(row["image_path"])

        products.append({
            "id":            f"a_{row['pid']}",
            "article":       article,
            "source":        "aquamarine",
            "status":        "order",
            "type":          display_type,
            "metal_group":   metal_group,
            "metal_display": metal_display,
            "weight":        row["weight"],
            "avg_weight":    row["avg_weight"],
            "inserts":       row["inserts"] if row["inserts"] else None,
            "image":         img,
            "sizes_in_stock": [],
            "sizes_on_order": [{"size": s, "price": float(row["price"]) if row["price"] else None}
                                for s in sizes] if sizes else [{"size": None, "price": float(row["price"]) if row["price"] else None}],
        })
    return products

# ── Объединение дублирующихся артикулов ───────────────────────────────────────
def merge_products(jewelry_groups, aqua_list):
    """
    Если один и тот же (article, type) есть в обоих источниках:
    - Приоритет за jewelry (статус = in_stock)
    - sizes_in_stock берётся из jewelry
    - sizes_on_order добавляются из aquamarine
    Иначе — самостоятельные позиции.
    """
    # aquamarine indexed by (article, type)
    aqua_by_key = {}
    aqua_standalone = []

    for p in aqua_list:
        key = (p["article"], p["type"])
        if key in aqua_by_key:
            # редкий случай: несколько строк с одним артикулом в aqua
            aqua_by_key[key].append(p)
        else:
            aqua_by_key[key] = [p]

    result = []
    used_aqua_keys = set()

    for key, j_prod in jewelry_groups.items():
        article, ptype = key
        if key in aqua_by_key:
            # MERGE
            used_aqua_keys.add(key)
            a_prods = aqua_by_key[key]

            merged = dict(j_prod)
            merged["source"] = "merged"
            merged["status"] = "in_stock"   # в наличии в приоритете

            # Собираем sizes_on_order из всех aqua-вариантов
            all_order_sizes = []
            for ap in a_prods:
                all_order_sizes.extend(ap["sizes_on_order"])
            merged["sizes_on_order"] = all_order_sizes

            # Средний вес — из aquamarine (там он есть)
            if not merged["weight"] and a_prods[0]["weight"]:
                merged["weight"] = a_prods[0]["weight"]
            if not merged.get("avg_weight") and a_prods[0]["avg_weight"]:
                merged["avg_weight"] = a_prods[0]["avg_weight"]

            result.append(merged)
        else:
            result.append(j_prod)

    # Оставшиеся aquamarine
    for key, a_prods in aqua_by_key.items():
        if key not in used_aqua_keys:
            for ap in a_prods:
                result.append(ap)

    return result

# ── Финализация (подчистка) ────────────────────────────────────────────────────
def finalize(products):
    """Убирает поля с None-списками, сортирует."""
    for p in products:
        # Deduplicate sizes_in_stock (могут быть одинаковые размеры = несколько копий)
        seen = {}
        deduped = []
        for s in p.get("sizes_in_stock", []):
            size_key = s["size"]
            if size_key not in seen:
                seen[size_key] = True
                deduped.append(s)
            # если размер уже есть — считаем "несколько штук", но для каталога достаточно одного
        p["sizes_in_stock"] = sorted(deduped,
            key=lambda x: float(x["size"]) if x["size"] and x["size"] not in ("Без размера",) else 0)

        p["sizes_on_order"] = sorted(p.get("sizes_on_order", []),
            key=lambda x: float(x["size"]) if x["size"] and x["size"] not in ("Без размера",) else 0)

    # Сортировка: сначала in_stock, потом order; внутри — по типу, артикулу
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
