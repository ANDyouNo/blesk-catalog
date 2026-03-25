import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Header }       from '@/components/Header'
import { FilterPanel }  from '@/components/FilterPanel'
import { ProductGrid }  from '@/components/ProductGrid'
import { ProductModal } from '@/components/ProductModal'
import { extractTypes, extractMetals, extractSizes, hasSize } from '@/lib/utils'

const PAGE_SIZE = 48   // карточек на страницу

const EMPTY_FILTERS = {
  search:         '',
  statuses:       new Set(),
  selectedTypes:  new Set(),
  selectedMetals: new Set(),
  selectedSizes:  new Set(),
}

function countByField(products, field) {
  const acc = {}
  for (const p of products) {
    const v = p[field]
    acc[v] = (acc[v] || 0) + 1
  }
  return acc
}

function countByStatus(products) {
  const acc = {}
  for (const p of products) {
    const v = p.status === 'merged' ? 'in_stock' : p.status
    acc[v] = (acc[v] || 0) + 1
  }
  return acc
}

export default function App() {
  const [allProducts, setAllProducts]   = useState([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState(null)
  const [filters, setFilters]           = useState(EMPTY_FILTERS)
  const [page, setPage]                 = useState(1)
  const [selectedProduct, setSelected]  = useState(null)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const scrollPosRef  = useRef(0)
  const loadMoreRef   = useRef(null)

  // Загрузка данных
  useEffect(() => {
    fetch('/catalog.json')
      .then(r => { if (!r.ok) throw new Error('Не удалось загрузить каталог'); return r.json() })
      .then(data => { setAllProducts(data.products || []); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [])

  // Данные для панели фильтров (вычисляются один раз)
  const types  = useMemo(() => extractTypes(allProducts),  [allProducts])
  const metals = useMemo(() => extractMetals(allProducts), [allProducts])
  const sizes  = useMemo(() => extractSizes(allProducts),  [allProducts])

  const counts = useMemo(() => ({
    byType:   countByField(allProducts, 'type'),
    byMetal:  countByField(allProducts, 'metal_group'),
    byStatus: countByStatus(allProducts),
  }), [allProducts])

  // Фильтрация (пересчитывается только при смене filters или данных)
  const filtered = useMemo(() => {
    const { search, statuses, selectedTypes, selectedMetals, selectedSizes } = filters
    const q = search.trim().toLowerCase()

    return allProducts.filter(p => {
      if (q && !p.article.toLowerCase().includes(q)) return false

      if (statuses.size > 0) {
        const s = p.status === 'merged' ? 'in_stock' : p.status
        if (!statuses.has(s)) return false
      }

      if (selectedTypes.size > 0  && !selectedTypes.has(p.type))         return false
      if (selectedMetals.size > 0 && !selectedMetals.has(p.metal_group)) return false

      if (selectedSizes.size > 0) {
        if (![...selectedSizes].some(s => hasSize(p, s))) return false
      }

      return true
    })
  }, [allProducts, filters])

  // Сброс страницы при смене фильтра
  useEffect(() => { setPage(1) }, [filters])

  // Видимый срез — только текущие страницы
  const visible = useMemo(() => filtered.slice(0, page * PAGE_SIZE), [filtered, page])
  const hasMore = visible.length < filtered.length

  const activeFiltersCount = useMemo(() => {
    const f = filters
    return (f.search ? 1 : 0) + f.statuses.size + f.selectedTypes.size +
           f.selectedMetals.size + f.selectedSizes.size
  }, [filters])

  const handleFilterChange = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }, [])

  const handleReset = useCallback(() => setFilters(EMPTY_FILTERS), [])

  const handleLoadMore = useCallback(() => setPage(p => p + 1), [])

  // Открытие модалки — сохраняем позицию скролла
  const handleProductClick = useCallback(product => {
    scrollPosRef.current = window.scrollY
    setSelected(product)
    document.body.style.overflow = 'hidden'
  }, [])

  // Закрытие — восстанавливаем позицию
  const handleModalClose = useCallback(() => {
    setSelected(null)
    document.body.style.overflow = ''
    requestAnimationFrame(() => {
      window.scrollTo({ top: scrollPosRef.current, behavior: 'instant' })
    })
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-stone-50 dark:bg-stone-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-200 border-t-gold-500" />
          <p className="text-sm text-stone-400">Загружаем каталог…</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-stone-50 dark:bg-stone-950">
        <div className="text-center">
          <p className="text-base font-medium text-stone-700 dark:text-stone-300">Ошибка загрузки</p>
          <p className="mt-1 text-sm text-stone-400">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-stone-50 dark:bg-stone-950">
      <Header
        onOpenFilters={() => setMobileFiltersOpen(true)}
        activeFiltersCount={activeFiltersCount}
      />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="flex gap-6">
          <FilterPanel
            types={types}
            metals={metals}
            sizes={sizes}
            filters={filters}
            onFilterChange={handleFilterChange}
            onReset={handleReset}
            isOpen={mobileFiltersOpen}
            onClose={() => setMobileFiltersOpen(false)}
            counts={counts}
          />

          <div className="min-w-0 flex-1">
            {/* Счётчик */}
            <div className="mb-4">
              <p className="text-sm text-stone-400 dark:text-stone-500">
                {filtered.length === allProducts.length
                  ? `${allProducts.length} украшений`
                  : `${filtered.length} из ${allProducts.length}`}
              </p>
            </div>

            <ProductGrid
              products={visible}
              onProductClick={handleProductClick}
            />

            {/* Кнопка «Загрузить ещё» */}
            {hasMore && (
              <div ref={loadMoreRef} className="mt-10 flex flex-col items-center gap-2">
                <button
                  onClick={handleLoadMore}
                  className="rounded-full border border-stone-200 bg-white px-8 py-3 text-sm font-medium text-stone-600 shadow-sm transition-all hover:border-stone-300 hover:shadow active:scale-95 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:border-stone-600"
                >
                  Загрузить ещё
                </button>
                <p className="text-xs text-stone-400 dark:text-stone-500">
                  Показано {visible.length} из {filtered.length}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={handleModalClose}
        />
      )}
    </div>
  )
}
