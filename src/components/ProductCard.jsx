import { memo } from 'react'
import { calcPrice, formatPrice, formatWeight } from '@/lib/utils'

function StatusBadge({ status }) {
  if (status === 'in_stock' || status === 'merged') {
    return <span className="badge-in-stock">● В наличии</span>
  }
  return <span className="badge-on-order">○ Под заказ</span>
}

export const ProductCard = memo(function ProductCard({ product, onClick }) {
  const { price, discount } = calcPrice(product)
  const weight = formatWeight(product)

  // Доступные размеры для краткого отображения
  const inStockSizes = (product.sizes_in_stock || []).map(s => s.size).filter(Boolean)
  const hasSizes = inStockSizes.length > 0 && inStockSizes[0] !== null

  return (
    <button
      onClick={onClick}
      className="card group flex flex-col overflow-hidden text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
    >
      {/* Фото */}
      <div className="relative aspect-square w-full overflow-hidden bg-stone-100 dark:bg-stone-800">
        {product.image ? (
          <img
            src={product.image}
            alt={`${product.type} ${product.article}`}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={e => { e.currentTarget.src = '/images/placeholder.svg' }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-stone-300 dark:text-stone-600">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="h-12 w-12">
              <path d="M12 2l3 6h6l-5 4 2 6-6-4-6 4 2-6L3 8h6z" />
            </svg>
          </div>
        )}

        {/* Плашка статуса */}
        <div className="absolute left-2 top-2">
          <StatusBadge status={product.status} />
        </div>

        {/* Скидка */}
        {discount && (
          <div className="absolute right-2 top-2">
            <span className="badge-discount">−{discount}%</span>
          </div>
        )}
      </div>

      {/* Данные */}
      <div className="flex flex-1 flex-col gap-1 p-3">
        <div className="flex items-start justify-between gap-1">
          <p className="text-xs font-medium text-stone-800 dark:text-stone-200 leading-snug">
            {product.type}
          </p>
          <p className="shrink-0 text-[10px] text-stone-400 dark:text-stone-500">
            арт. {product.article}
          </p>
        </div>

        <p className="text-xs text-stone-500 dark:text-stone-400">
          {product.metal_display}
        </p>

        {weight && (
          <p className="text-xs text-stone-400 dark:text-stone-500">{weight}</p>
        )}

        {/* Размеры (только in_stock) */}
        {hasSizes && (
          <p className="text-xs text-stone-400 dark:text-stone-500">
            р-р: {inStockSizes.slice(0, 3).join(', ')}{inStockSizes.length > 3 ? ' …' : ''}
          </p>
        )}

        {/* Цена */}
        <div className="mt-auto pt-2">
          {price != null ? (
            <p className="text-sm font-semibold text-stone-900 dark:text-stone-50">
              {formatPrice(price)}
            </p>
          ) : (
            <p className="text-sm text-stone-400 dark:text-stone-500">Цена по запросу</p>
          )}
        </div>
      </div>
    </button>
  )
})
