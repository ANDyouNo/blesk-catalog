import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { PRICE_MULTIPLIERS, ORDER_DISCOUNTS } from '@/config/pricing'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

/**
 * Рассчитывает цену для отображения.
 * Для in_stock/merged: берёт price из sizes_in_stock[0] (если есть).
 * Для order: price_supplier × multiplier × (1 - discount).
 * Возвращает { price: number|null, original: number|null, discount: number|null }
 */
export function calcPrice(product, selectedSize = null) {
  const metal = product.metal_group

  if (product.status === 'order') {
    const multiplier = PRICE_MULTIPLIERS[metal] ?? 1
    const discount   = ORDER_DISCOUNTS[metal]   ?? 0

    // Берём цену из sizes_on_order (по выбранному размеру или первому)
    const sizeEntries = product.sizes_on_order || []
    let entry = sizeEntries[0]
    if (selectedSize) {
      entry = sizeEntries.find(s => s.size === selectedSize) || sizeEntries[0]
    }
    if (!entry || entry.price == null) return { price: null, original: null, discount: null }

    const original = Math.round(entry.price * multiplier)
    const final    = Math.round(original * (1 - discount))
    return { price: final, original, discount: discount > 0 ? Math.round(discount * 100) : null }
  }

  // in_stock / merged — цена из sizes_in_stock
  const sizeEntries = product.sizes_in_stock || []
  let entry = sizeEntries[0]
  if (selectedSize) {
    entry = sizeEntries.find(s => s.size === selectedSize) || sizeEntries[0]
  }
  if (!entry || entry.price == null) return { price: null, original: null, discount: null }
  return { price: entry.price, original: null, discount: null }
}

/** Форматирует число как цену в рублях: 12 345 ₽ */
export function formatPrice(n) {
  if (n == null) return null
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency', currency: 'RUB',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(n)
}

/** Вес для отображения */
export function formatWeight(product) {
  const w = product.weight ?? product.avg_weight
  if (!w) return null
  return `${w} г`
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

/** Проверяет, есть ли у товара заданный размер в наличии */
export function hasSize(product, size) {
  const allSizes = [
    ...(product.sizes_in_stock || []),
    ...(product.sizes_on_order || []),
  ]
  return allSizes.some(s => s.size === size)
}
