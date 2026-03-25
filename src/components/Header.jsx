import { SlidersHorizontal } from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'

export function Header({ onOpenFilters, activeFiltersCount }) {
  return (
    <header className="sticky top-0 z-40 border-b border-stone-200 bg-stone-50/80 backdrop-blur-md dark:border-stone-800 dark:bg-stone-950/80">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Логотип */}
        <a href="/" className="flex items-baseline gap-1 select-none">
          <span className="font-display text-xl font-semibold tracking-[0.15em] text-stone-900 dark:text-stone-50">
            BLESK
          </span>
          <span className="ml-1 hidden text-xs font-light tracking-widest text-stone-400 sm:inline">
            УКРАШЕНИЯ
          </span>
        </a>

        <div className="flex items-center gap-2">
          <ThemeToggle />

          {/* Кнопка фильтров — только на мобильных */}
          <button
            className="relative flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-stone-100 dark:hover:bg-stone-800 lg:hidden"
            onClick={onOpenFilters}
            aria-label="Открыть фильтры"
          >
            <SlidersHorizontal size={18} />
            {activeFiltersCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-gold-500 text-[10px] font-bold text-white">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  )
}
