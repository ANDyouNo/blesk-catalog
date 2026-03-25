import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { PRICE_MULTIPLIERS, ORDER_DISCOUNTS } from '@/config/pricing'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

// ── Внутренний хелпер: цена с наценкой + скидкой ─────────────────────────────
function applyOrderPricing(supplierPrice, metalGroup) {
  const multiplier = PRICE_MULTIPLIERS[metalGroup] ?? 1
  const disc       = ORDER_DISCOUNTS[metalGroup]   ?? 0
  const original   = Math.round(supplierPrice * multiplier)
  const final      = Math.round(original * (1 - disc))
  return {
    price:    final,
    original,
    discount: disc > 0 ? Math.round(disc * 100) : null,
  }
}

/**
 * Средняя цена для карточки товара (без выбранного варианта).
 * Для in_stock/merged: среднее из sizes_in_stock (если есть).
 * Для order: среднее из sizes_on_order × наценка × (1 − скидка).
 * Возвращает { price: number|null, discount: number|null }
 */
export function calcCardPrice(product) {
  const metal = product.metal_group

  if (product.status === 'order') {
    const entries = (product.sizes_on_order || []).filter(e => e.price != null)
    if (!entries.length) return { price: null, discount: null }
    const disc       = ORDER_DISCOUNTS[metal]   ?? 0
    const multiplier = PRICE_MULTIPLIERS[metal] ?? 1
    const avg   = entries.reduce((s, e) => s + e.price, 0) / entries.length
    const final = Math.round(avg * multiplier * (1 - disc))
    return { price: final, discount: disc > 0 ? Math.round(disc * 100) : null }
  }

  // in_stock / merged — из sizes_in_stock
  const stockEntries = (product.sizes_in_stock || []).filter(e => e.price != null)
  if (stockEntries.length) {
    const avg = Math.round(
      stockEntries.reduce((s, e) => s + e.price, 0) / stockEntries.length
    )
    return { price: avg, discount: null }
  }

  // merged без цен в наличии — откат к sizes_on_order
  const orderEntries = (product.sizes_on_order || []).filter(e => e.price != null)
  if (!orderEntries.length) return { price: null, discount: null }
  const disc       = ORDER_DISCOUNTS[metal]   ?? 0
  const multiplier = PRICE_MULTIPLIERS[metal] ?? 1
  const avg   = orderEntries.reduce((s, e) => s + e.price, 0) / orderEntries.length
  const final = Math.round(avg * multiplier * (1 - disc))
  return { price: final, discount: disc > 0 ? Math.round(disc * 100) : null }
}

/**
 * Цена конкретного варианта в модальном окне.
 * variant = { source: 'in_stock' | 'order', index: number }
 * Возвращает { price: number|null, original: number|null, discount: number|null }
 */
export function calcVariantPrice(product, variant) {
  if (!variant) return { price: null, original: null, discount: null }

  const metal   = product.metal_group
  const entries = variant.source === 'in_stock'
    ? product.sizes_in_stock || []
    : product.sizes_on_order || []
  const entry = entries[variant.index]

  if (!entry || entry.price == null) return { price: null, original: null, discount: null }

  if (variant.source === 'order') {
    return applyOrderPricing(entry.price, metal)
  }
  return { price: entry.price, original: null, discount: null }
}

/**
 * Вес варианта. Для in_stock берёт из entry.weight,
 * для order / без выбора — из product.weight или product.avg_weight.
 */
export function getVariantWeight(product, variant) {
  if (variant) {
    const entries = variant.source === 'in_stock'
      ? product.sizes_in_stock || []
      : product.sizes_on_order || []
    const w = entries[variant.index]?.weight
    if (w != null) return w
  }
  return product.weight ?? product.avg_weight ?? null
}

/** Форматирует граммы: "4.20 г" */
export function formatWeight(weightValue) {
  if (weightValue == null) return null
  // принимает число (грамм)
  const n = typeof weightValue === 'object'
    ? (weightValue?.weight ?? weightValue?.avg_weight ?? null) // backward compat
    : weightValue
  if (n == null) return null
  return `${n} г`
}

/** Форматирует число как цену в рублях: 12 345 ₽ */
export function formatPrice(n) {
  if (n == null) return null
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency', currency: 'RUB',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(n)
}

/** Все доступные типы из каталога (без дублей, отсортированы) */
export function extractTypes(products) {
  return [...new Set(products.map(p => p.type))].sort((a, b) => a.localeCompare(b, 'ru'))
}

/** Все доступные металлы */
export function extractMetals(products) {
  return [...new Set(products.map(p => p.metal_group))].sort((a, b) => a.localeCompare(b, 'ru'))
}

/** Все уникальные размеры из каталога */
export function extractSizes(products) {
  const set = new Set()
  for (const p of products) {
    for (const s of [...(p.sizes_in_stock || []), ...(p.sizes_on_order || [])]) {
      if (s.size && s.size !== 'Без размера') set.add(s.size)
    }
  }
  return [...set].sort((a, b) => parseFloat(a) - parseFloat(b))
}

/** Проверяет, есть ли у товара заданный размер */
export function hasSize(product, size) {
  return [
    ...(product.sizes_in_stock || []),
    ...(product.sizes_on_order || []),
  ].some(s => s.size === size)
}
