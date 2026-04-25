import { X, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'

const STATUS_OPTIONS = [
  { value: 'in_stock', label: 'В наличии' },
  { value: 'order',    label: 'Под заказ' },
]

function FilterSection({ title, children }) {
  return (
    <div className="border-b border-stone-100 pb-4 dark:border-stone-800">
      <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500">
        {title}
      </p>
      {children}
    </div>
  )
}

function CheckboxItem({ label, checked, onChange, badge }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 py-1 text-sm text-stone-700 hover:text-stone-900 dark:text-stone-300 dark:hover:text-stone-100">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="filter-checkbox"
      />
      <span className="flex-1">{label}</span>
      {badge != null && (
        <span className="text-xs text-stone-400 dark:text-stone-500">{badge}</span>
      )}
    </label>
  )
}

export function FilterPanel({
  // данные
  types, metals, sizes,
  // текущие значения
  filters,
  // коллбэки
  onFilterChange,
  onReset,
  // мобильное состояние
  isOpen,
  onClose,
  // счётчики
  counts,
}) {
  const { statuses, selectedTypes, selectedMetals, selectedSizes, search } = filters

  function toggleSet(key, value) {
    const current = new Set(filters[key])
    current.has(value) ? current.delete(value) : current.add(value)
    onFilterChange(key, current)
  }

  const hasActive =
    statuses.size > 0 ||
    selectedTypes.size > 0 ||
    selectedMetals.size > 0 ||
    selectedSizes.size > 0 ||
    search.length > 0

  const content = (
    <div className="flex h-full flex-col">
      {/* Шапка */}
      <div className="flex items-center justify-between py-3">
        <span className="text-sm font-semibold text-stone-800 dark:text-stone-100">
          Фильтры
        </span>
        <div className="flex items-center gap-1">
          {hasActive && (
            <button
              onClick={onReset}
              className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-stone-800 dark:hover:text-stone-300"
            >
              <RotateCcw size={11} />
              Сбросить
            </button>
          )}
          {/* Кнопка закрыть — только мобильная */}
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-stone-100 dark:hover:bg-stone-800 lg:hidden"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-4" style={{ scrollbarGutter: 'stable' }}>
        {/* Поиск */}
        <FilterSection title="Артикул / поиск">
          <input
            type="text"
            value={search}
            onChange={e => onFilterChange('search', e.target.value)}
            placeholder="Введите артикул…"
            className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm outline-none
                       placeholder:text-stone-300 focus:border-gold-400 focus:ring-1 focus:ring-gold-300
                       dark:border-stone-700 dark:bg-stone-900 dark:placeholder:text-stone-600 dark:focus:border-gold-500"
          />
        </FilterSection>

        {/* Наличие */}
        <FilterSection title="Наличие">
          {STATUS_OPTIONS.map(opt => (
            <CheckboxItem
              key={opt.value}
              label={opt.label}
              checked={statuses.has(opt.value)}
              onChange={() => toggleSet('statuses', opt.value)}
              badge={counts.byStatus?.[opt.value]}
            />
          ))}
        </FilterSection>

        {/* Тип украшения */}
        <FilterSection title="Тип украшения">
          {types.map(t => (
            <CheckboxItem
              key={t}
              label={t}
              checked={selectedTypes.has(t)}
              onChange={() => toggleSet('selectedTypes', t)}
              badge={counts.byType?.[t]}
            />
          ))}
        </FilterSection>

        {/* Металл */}
        <FilterSection title="Металл">
          {metals.map(m => (
            <CheckboxItem
              key={m}
              label={m}
              checked={selectedMetals.has(m)}
              onChange={() => toggleSet('selectedMetals', m)}
              badge={counts.byMetal?.[m]}
            />
          ))}
        </FilterSection>

        {/* Размер */}
        {sizes.length > 0 && (
          <FilterSection title="Размер">
            <div className="flex flex-wrap gap-1.5">
              {sizes.map(s => (
                <button
                  key={s}
                  onClick={() => toggleSet('selectedSizes', s)}
                  className={cn(
                    'rounded-lg border px-2.5 py-1 text-xs font-medium transition-all',
                    selectedSizes.has(s)
                      ? 'border-gold-400 bg-gold-50 text-gold-700 dark:border-gold-500 dark:bg-gold-950/30 dark:text-gold-400'
                      : 'border-stone-200 text-stone-500 hover:border-stone-300 hover:text-stone-700 dark:border-stone-700 dark:text-stone-400'
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </FilterSection>
        )}
      </div>

      {/* Мобильный футер — кнопка закрытия + подсказка */}
      <div className="lg:hidden pt-4 pb-1">
        <button
          onClick={onClose}
          className="w-full rounded-xl border border-stone-200 bg-stone-50 py-2.5 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-100 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:bg-stone-800"
        >
          Закрыть фильтры
        </button>
        <p className="mt-2.5 text-center text-xs leading-snug text-stone-400 dark:text-stone-500">
          Фильтры применяются сразу — результаты&nbsp;обновляются по&nbsp;мере выбора
        </p>
      </div>
    </div>
  )

  return (
    <>
      {/* Десктоп — статичная боковая панель */}
      <aside className="hidden w-64 shrink-0 lg:block">
        <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto">
          {content}
        </div>
      </aside>

      {/* Мобильный — выдвижная шторка */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/40 lg:hidden animate-fade-in"
            onClick={onClose}
          />
          <div className="fixed inset-y-0 left-0 z-50 w-72 bg-white px-4 pb-6 shadow-2xl lg:hidden animate-slide-up dark:bg-stone-950">
            {content}
          </div>
        </>
      )}
    </>
  )
}
