import { useEffect, useState } from 'react'
import { Sun, Moon, Monitor } from 'lucide-react'
import { cn } from '@/lib/utils'

const THEMES = [
  { value: 'light',  icon: Sun,     label: 'Светлая' },
  { value: 'system', icon: Monitor, label: 'Системная' },
  { value: 'dark',   icon: Moon,    label: 'Тёмная' },
]

function getSystemDark() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function applyTheme(theme) {
  const root = document.documentElement
  const isDark = theme === 'dark' || (theme === 'system' && getSystemDark())
  root.classList.toggle('dark', isDark)
}

export function ThemeToggle() {
  const [theme, setTheme] = useState(() => localStorage.getItem('blesk-theme') || 'system')

  useEffect(() => {
    applyTheme(theme)
    localStorage.setItem('blesk-theme', theme)
  }, [theme])

  // Слушаем изменение системной темы
  useEffect(() => {
    if (theme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => applyTheme('system')
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [theme])

  return (
    <div className="flex items-center gap-0.5 rounded-full bg-stone-100 p-1 dark:bg-stone-800">
      {THEMES.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          title={label}
          onClick={() => setTheme(value)}
          className={cn(
            'flex h-7 w-7 items-center justify-center rounded-full transition-all',
            theme === value
              ? 'bg-white text-stone-800 shadow-sm dark:bg-stone-700 dark:text-stone-100'
              : 'text-stone-400 hover:text-stone-600 dark:hover:text-stone-300'
          )}
        >
          <Icon size={14} />
        </button>
      ))}
    </div>
  )
}
