# BLESK — Каталог украшений

Статический сайт-каталог. Данные из двух SQLite баз данных экспортируются в JSON, сайт строится через Vite+React и деплоится на Netlify.

## Структура

```
blesk-catalog/
├── public/
│   ├── images/
│   │   ├── jewelry/      ← сжатые WebP картинки из jewelry-store
│   │   └── aquamarine/   ← сжатые WebP картинки из aquamarine_scrap
│   └── catalog.json      ← генерируется скриптом
├── src/
│   ├── config/pricing.js ← КОЭФФИЦИЕНТЫ И КОНТАКТЫ (менять здесь)
│   └── components/
├── scripts/
│   ├── export_catalog.py   ← читает БД → пишет catalog.json
│   └── compress_images.py  ← конвертирует картинки в WebP
└── netlify.toml
```

---

## Первый запуск (один раз)

```bash
# 1. Установить зависимости Node
npm install

# 2. Установить Pillow для сжатия картинок
pip install Pillow

# 3. Сжать картинки (занимает несколько минут, ~250 MB в итоге)
python scripts/compress_images.py

# 4. Экспортировать данные из БД
python scripts/export_catalog.py

# 5. Запустить dev-сервер
npm run dev
```

---

## Обновление каталога (при изменении БД)

```bash
python scripts/export_catalog.py
# После этого — git add public/catalog.json && git commit && git push
# Netlify автоматически задеплоит новую версию
```

## Добавление новых картинок

```bash
python scripts/compress_images.py
# Скрипт пропускает уже конвертированные файлы (проверяет дату)
# После этого — git add public/images/ && git commit && git push
```

---

## Настройка цен и контактов

Открой `src/config/pricing.js` и измени:
- `PRICE_MULTIPLIERS` — коэффициенты наценки для «Под заказ»
- `ORDER_DISCOUNTS` — скидки для «Под заказ»
- `CONTACTS` — ссылки на Telegram, ВКонтакте, Max

---

## Деплой на Netlify через GitHub

1. Запушить весь проект в GitHub-репозиторий
2. В Netlify: New site → Import from Git → выбрать репо
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Netlify автоматически деплоит при каждом `git push`
