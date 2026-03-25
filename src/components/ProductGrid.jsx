import { ProductCard } from './ProductCard'

export function ProductGrid({ products, onProductClick }) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"
             className="mb-4 h-16 w-16 text-stone-300 dark:text-stone-600">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <p className="text-base font-medium text-stone-500 dark:text-stone-400">Ничего не найдено</p>
        <p className="mt-1 text-sm text-stone-400 dark:text-stone-500">Попробуйте изменить фильтры</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
      {products.map(product => (
        <ProductCard
          key={product.id}
          product={product}
          onClick={() => onProductClick(product)}
        />
      ))}
    </div>
  )
}
