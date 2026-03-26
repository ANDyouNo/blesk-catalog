import { useEffect, useLayoutEffect, useRef, useState, useMemo, useCallback } from 'react'
import { useWindowVirtualizer } from '@tanstack/react-virtual'
import { ProductCard } from './ProductCard'

// Минимальная ширина карточки и отступ между ними (px)
// Gap = gap-3 в Tailwind = 12px
const CARD_MIN_WIDTH = 160
const GAP            = 12

// Высота блока с текстом под фото (тип, металл, вес, цена)
const CARD_INFO_HEIGHT = 100

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"
           className="mb-4 h-16 w-16 text-stone-300 dark:text-stone-600">
        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
      </svg>
      <p className="text-base font-medium text-stone-500 dark:text-stone-400">Ничего не найдено</p>
      <p className="mt-1 text-sm text-stone-400 dark:text-stone-500">Попробуйте изменить фильтры</p>
    </div>
  )
}

export function VirtualGrid({ products, onProductClick, animKey = 0 }) {
  const containerRef  = useRef(null)
  const [width, setWidth] = useState(0)

  // Следим за шириной контейнера через ResizeObserver
  useEffect(() => {
    if (!containerRef.current) return
    const ro = new ResizeObserver(entries => {
      const w = entries[0].contentRect.width
      if (w > 0) setWidth(w)
    })
    ro.observe(containerRef.current)
    // Записываем начальное значение
    setWidth(containerRef.current.getBoundingClientRect().width)
    return () => ro.disconnect()
  }, [])

  // Количество колонок: максимум при котором карточка >= CARD_MIN_WIDTH
  const cols = useMemo(() => {
    if (!width) return 2
    const n = Math.floor((width + GAP) / (CARD_MIN_WIDTH + GAP))
    return Math.max(2, Math.min(5, n))
  }, [width])

  // Разбиваем товары на строки
  const rows = useMemo(() => {
    const result = []
    for (let i = 0; i < products.length; i += cols) {
      result.push(products.slice(i, i + cols))
    }
    return result
  }, [products, cols])

  // Оценочная высота одной строки = ширина карточки (квадрат) + инфо-блок + gap
  const estimateSize = useCallback(() => {
    if (!width || !cols) return 320
    const cardWidth = (width - GAP * (cols - 1)) / cols
    return Math.round(cardWidth + CARD_INFO_HEIGHT + GAP)
  }, [width, cols])

  // Расстояние от верха документа до нашего контейнера
  const [scrollMargin, setScrollMargin] = useState(0)
  useEffect(() => {
    if (!containerRef.current) return
    const update = () => {
      const top = containerRef.current.getBoundingClientRect().top + window.scrollY
      setScrollMargin(top)
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [width])

  // Анимация появления рядов при первой загрузке и смене фильтров.
  // useLayoutEffect — срабатывает до покраски, поэтому браузер никогда
  // не видит кадр без класса анимации.
  const [isAnimating, setIsAnimating] = useState(true)
  useLayoutEffect(() => {
    setIsAnimating(true)
    const t = setTimeout(() => setIsAnimating(false), 550)
    return () => clearTimeout(t)
  }, [animKey])

  const virtualizer = useWindowVirtualizer({
    count:        rows.length,
    estimateSize,
    overscan:     4,          // 4 строки-буфера выше и ниже видимой области
    scrollMargin,
  })

  const virtualItems = virtualizer.getVirtualItems()

  if (products.length === 0) return <EmptyState />

  return (
    <div ref={containerRef}>
      {/* Внешний div резервирует всю высоту списка, чтобы скроллбар был корректным */}
      <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
        {virtualItems.map(vRow => (
          <div
            key={vRow.key}
            data-index={vRow.index}
            ref={virtualizer.measureElement}   // библиотека сама измерит реальную высоту
            style={{
              position:  'absolute',
              top:       0,
              left:      0,
              width:     '100%',
              transform: `translateY(${vRow.start - scrollMargin}px)`,
            }}
          >
            {/* Анимация ряда — отдельный div, не конфликтует с transform позиционирования.
                key меняется при isAnimating=true → React пересоздаёт DOM-элемент
                → браузер гарантированно перезапускает CSS-анимацию. */}
            <div
              key={isAnimating ? `${vRow.key}-a${animKey}` : String(vRow.key)}
              className={isAnimating ? 'animate-row-in' : ''}
              style={isAnimating ? {
                animationDelay:    `${Math.min(vRow.index, 4) * 45}ms`,
                animationFillMode: 'both',
              } : undefined}
            >
              {/* Строка сетки */}
              <div
                style={{
                  display:             'grid',
                  gridTemplateColumns: `repeat(${cols}, 1fr)`,
                  gap:                 GAP,
                  paddingBottom:       GAP,
                }}
              >
                {rows[vRow.index].map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onClick={() => onProductClick(product)}
                  />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
