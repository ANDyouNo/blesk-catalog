import { useState, useEffect } from 'react'
import { X, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Таблица размеров ───────────────────────────────────────────────────────────
const RING_SIZES = [
  { size: 15,   diam: 14.86, circ: [47, 48] },
  { size: 15.5, diam: 15.27, circ: [48, 49] },
  { size: 16,   diam: 16.10, circ: [49, 50] },
  { size: 16.5, diam: 16.51, circ: [50, 52] },
  { size: 17,   diam: 16.92, circ: [52, 53] },
  { size: 17.5, diam: 17.50, circ: [53, 55] },
  { size: 18,   diam: 18.19, circ: [55, 57] },
  { size: 18.5, diam: 18.53, circ: [58, 59] },
  { size: 19,   diam: 18.89, circ: [59, 60] },
  { size: 19.5, diam: 19.41, circ: [60, 61] },
  { size: 20,   diam: 19.84, circ: [61, 63] },
  { size: 20.5, diam: 20.51, circ: [63, 64] },
  { size: 21,   diam: 21.08, circ: [64, 65] },
  { size: 21.5, diam: 21.63, circ: [67, 68] },
  { size: 22,   diam: 22.20, circ: [69, 70] },
]

const POPULAR_FEMALE = [17, 17.5, 18]
const POPULAR_MALE   = [19, 19.5, 20, 20.5]

function findByDiam(mm) {
  return RING_SIZES.reduce((p, c) =>
    Math.abs(c.diam - mm) < Math.abs(p.diam - mm) ? c : p
  )
}

function findByCirc(mm) {
  const exact = RING_SIZES.find(r => mm >= r.circ[0] && mm <= r.circ[1])
  if (exact) return exact
  return RING_SIZES.reduce((p, c) => {
    const pd = Math.min(Math.abs(mm - p.circ[0]), Math.abs(mm - p.circ[1]))
    const cd = Math.min(Math.abs(mm - c.circ[0]), Math.abs(mm - c.circ[1]))
    return cd < pd ? c : p
  })
}

// ── Карточка результата ────────────────────────────────────────────────────────
function ResultCard({ match, highlight }) {
  if (!match) return null
  return (
    <div className={cn(
      'rounded-2xl border p-4 transition-all',
      highlight
        ? 'border-gold-300 bg-gold-50 dark:border-gold-600/40 dark:bg-gold-950/20'
        : 'border-stone-100 bg-stone-50 dark:border-stone-700 dark:bg-stone-800/50'
    )}>
      <div className="mb-3 flex items-baseline gap-2">
        <span className="text-3xl font-bold text-gold-600 dark:text-gold-400">{match.size}</span>
        <span className="text-sm text-stone-400">— ваш размер</span>
      </div>
      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-stone-500 dark:text-stone-400">Диаметр</span>
          <span className="font-medium text-stone-700 dark:text-stone-200">{match.diam} мм</span>
        </div>
        <div className="flex justify-between">
          <span className="text-stone-500 dark:text-stone-400">Обхват пальца</span>
          <span className="font-medium text-stone-700 dark:text-stone-200">{match.circ[0]}–{match.circ[1]} мм</span>
        </div>
      </div>
      {(POPULAR_FEMALE.includes(match.size) || POPULAR_MALE.includes(match.size)) && (
        <p className="mt-2 text-xs text-gold-600 dark:text-gold-400">
          ✦ Популярный размер {POPULAR_FEMALE.includes(match.size) ? 'для женщин' : 'для мужчин'}
        </p>
      )}
    </div>
  )
}

// ── Вкладка: По экрану ─────────────────────────────────────────────────────────
function ScreenTab() {
  // calibPx = сколько пикселей соответствует 10 мм на экране пользователя
  const [calibPx, setCalibPx] = useState(38)
  const [calibrated, setCalibrated] = useState(false)
  const [diamMm, setDiamMm] = useState(17)

  const pxPerMm   = calibPx / 10
  const circlePx  = Math.round(diamMm * pxPerMm)
  const match     = findByDiam(diamMm)
  const minCircle = Math.round(14 * pxPerMm)
  const maxCircle = Math.round(23 * pxPerMm)

  if (!calibrated) {
    return (
      <div className="space-y-6 px-4 py-4">
        <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
          📏 Для измерения вам понадобится линейка
        </div>

        <div>
          <p className="mb-1 text-sm font-medium text-stone-700 dark:text-stone-200">Шаг 1 из 2 — Калибровка</p>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            Приложите линейку к экрану. Двигайте ползунок пока золотой отрезок точно не совпадёт
            с отметками <strong>0</strong> и <strong>10 мм</strong> на линейке.
          </p>
        </div>

        {/* Калибровочный отрезок */}
        <div className="flex flex-col items-start gap-3">
          <div className="flex items-center gap-3">
            <div
              className="h-1.5 rounded-full bg-gold-500 transition-none"
              style={{ width: calibPx }}
            />
            <span className="whitespace-nowrap text-xs font-medium text-stone-500 dark:text-stone-400">
              10 мм
            </span>
          </div>
          <input
            type="range" min={20} max={130} value={calibPx}
            onChange={e => setCalibPx(Number(e.target.value))}
            className="w-full accent-gold-500"
          />
          <div className="flex w-full justify-between text-xs text-stone-400">
            <span>меньше</span>
            <span>больше</span>
          </div>
        </div>

        <button
          onClick={() => setCalibrated(true)}
          className="btn-primary w-full justify-center"
        >
          Откалибровано — измерить кольцо →
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-5 px-4 py-4">
      <button
        onClick={() => setCalibrated(false)}
        className="flex items-center gap-1 text-sm text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
      >
        <ArrowLeft size={13} /> Перекалибровать
      </button>

      <p className="text-sm text-stone-500 dark:text-stone-400">
        Положите кольцо на экран и подберите ползунком окружность под его <strong>внутренний диаметр</strong>.
        Размер кольца отображается внутри круга.
      </p>

      {/* Окружность */}
      <div
        className="mx-auto flex items-center justify-center"
        style={{ minHeight: maxCircle + 32 }}
      >
        <div
          className="flex items-center justify-center rounded-full border-2 border-gold-500"
          style={{ width: circlePx, height: circlePx, minWidth: minCircle, minHeight: minCircle }}
        >
          <span className={cn(
            'select-none font-bold text-gold-600 dark:text-gold-400 transition-none',
            circlePx < 60 ? 'text-sm' : circlePx < 80 ? 'text-lg' : 'text-2xl'
          )}>
            {match.size}
          </span>
        </div>
      </div>

      {/* Ползунок диаметра */}
      <div className="space-y-1">
        <input
          type="range" min={14} max={23} step={0.1} value={diamMm}
          onChange={e => setDiamMm(Number(e.target.value))}
          className="w-full accent-gold-500"
        />
        <div className="flex justify-between text-xs text-stone-400">
          <span>14 мм</span>
          <span className="font-medium text-stone-600 dark:text-stone-300">
            ⌀ {diamMm.toFixed(1)} мм
          </span>
          <span>23 мм</span>
        </div>
      </div>

      <ResultCard match={match} highlight />
    </div>
  )
}

// ── Вкладка: По нитке / кольцу ─────────────────────────────────────────────────
function ManualTab() {
  const [mode, setMode]       = useState('circ') // 'circ' | 'diam'
  const [inputVal, setInputVal] = useState('')

  const numVal = parseFloat(inputVal.replace(',', '.'))
  const valid  = !isNaN(numVal) && numVal > 10 && numVal < 120
  const result = valid
    ? (mode === 'circ' ? findByCirc(numVal) : findByDiam(numVal))
    : null

  return (
    <div className="space-y-5 px-4 py-4">
      {/* Переключатель метода */}
      <div className="flex rounded-xl bg-stone-100 p-1 dark:bg-stone-800">
        {[
          { value: 'circ', label: 'По нитке' },
          { value: 'diam', label: 'По кольцу' },
        ].map(({ value, label }) => (
          <button
            key={value}
            onClick={() => { setMode(value); setInputVal('') }}
            className={cn(
              'flex-1 rounded-lg py-2 text-sm font-medium transition-all',
              mode === value
                ? 'bg-white text-stone-800 shadow-sm dark:bg-stone-700 dark:text-stone-100'
                : 'text-stone-500 hover:text-stone-700 dark:text-stone-400'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Инструкция */}
      {mode === 'circ' ? (
        <div className="rounded-2xl bg-stone-50 px-4 py-3 text-sm text-stone-600 dark:bg-stone-800 dark:text-stone-300">
          <p className="mb-2 font-medium">Как измерить обхват пальца ниткой:</p>
          <ol className="space-y-1 pl-4" style={{ listStyleType: 'decimal' }}>
            <li>Возьмите тонкую нить или полоску бумаги шириной ~5 мм</li>
            <li>Оберните вокруг нужного пальца (не слишком туго)</li>
            <li>Отметьте точку, где конец нити встретился с основанием</li>
            <li>Разверните и измерьте длину линейкой в миллиметрах</li>
          </ol>
        </div>
      ) : (
        <div className="rounded-2xl bg-stone-50 px-4 py-3 text-sm text-stone-600 dark:bg-stone-800 dark:text-stone-300">
          <p className="mb-2 font-medium">Как измерить диаметр кольца:</p>
          <ol className="space-y-1 pl-4" style={{ listStyleType: 'decimal' }}>
            <li>Возьмите кольцо подходящего размера</li>
            <li>Положите на лист бумаги, обведите внутреннюю окружность</li>
            <li>Измерьте линейкой расстояние между двумя крайними точками</li>
          </ol>
          <p className="mt-2 text-xs text-stone-400">
            💡 Также можно просто приложить линейку к внутреннему отверстию кольца
          </p>
        </div>
      )}

      {/* Поле ввода */}
      <div className="relative">
        <input
          type="number"
          inputMode="decimal"
          placeholder={mode === 'circ' ? 'Длина нити, мм' : 'Диаметр кольца, мм'}
          value={inputVal}
          onChange={e => setInputVal(e.target.value)}
          className={cn(
            'w-full rounded-xl border bg-white px-4 py-3 pr-14 text-lg outline-none transition-all',
            'placeholder:text-stone-300 dark:bg-stone-900 dark:placeholder:text-stone-600',
            valid
              ? 'border-gold-400 focus:ring-1 focus:ring-gold-300 dark:border-gold-600'
              : 'border-stone-200 focus:border-gold-400 focus:ring-1 focus:ring-gold-300 dark:border-stone-700 dark:focus:border-gold-500'
          )}
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-stone-400">мм</span>
      </div>

      {result && <ResultCard match={result} highlight />}

      {inputVal && !valid && (
        <p className="text-sm text-rose-500">
          Введите значение от 14 до 120 мм
        </p>
      )}
    </div>
  )
}

// ── Вкладка: Таблица и советы ──────────────────────────────────────────────────
function TableTab() {
  return (
    <div className="space-y-6 px-4 py-4">
      {/* Таблица */}
      <div>
        <p className="mb-3 text-sm font-medium text-stone-700 dark:text-stone-200">Таблица размеров</p>
        <div className="overflow-x-auto rounded-2xl border border-stone-100 dark:border-stone-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100 bg-stone-50 text-left text-xs text-stone-500 dark:border-stone-800 dark:bg-stone-800/50 dark:text-stone-400">
                <th className="px-3 py-2.5 font-medium">Размер</th>
                <th className="px-3 py-2.5 font-medium">Диаметр, мм</th>
                <th className="px-3 py-2.5 font-medium">Обхват, мм</th>
              </tr>
            </thead>
            <tbody>
              {RING_SIZES.map((r, i) => {
                const isPopular = POPULAR_FEMALE.includes(r.size) || POPULAR_MALE.includes(r.size)
                return (
                  <tr
                    key={r.size}
                    className={cn(
                      'border-b border-stone-50 last:border-0 dark:border-stone-800/50',
                      isPopular && 'bg-gold-50/60 dark:bg-gold-950/10'
                    )}
                  >
                    <td className="px-3 py-2">
                      <span className={cn(
                        'font-semibold',
                        isPopular ? 'text-gold-600 dark:text-gold-400' : 'text-stone-700 dark:text-stone-200'
                      )}>
                        {r.size}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-stone-600 dark:text-stone-300">{r.diam}</td>
                    <td className="px-3 py-2 text-stone-600 dark:text-stone-300">{r.circ[0]}–{r.circ[1]}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-stone-400">
          ✦ золотом выделены популярные женские (17–18) и мужские (19–20,5) размеры
        </p>
      </div>

      {/* Советы */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-stone-700 dark:text-stone-200">Полезные советы</p>

        {[
          {
            icon: '🌡️',
            title: 'Время и условия замера',
            text: 'Измеряйте в дневное время, после нахождения в тёплом помещении не менее часа. В холоде пальцы тоньше, к вечеру появляется отёчность.',
          },
          {
            icon: '⚠️',
            title: 'Когда не стоит измерять',
            text: 'Сразу после физнагрузок или перелёта, после обильного питья, при повышенной температуре, в жару. Девушкам — не в критические дни.',
          },
          {
            icon: '💍',
            title: 'Широкие кольца',
            text: 'Если ширина кольца от 6 мм и выше — берите размер на один больше обычного. Широкое кольцо плотнее садится на палец.',
          },
          {
            icon: '☝️',
            title: 'Правильный палец',
            text: 'Измеряйте на том пальце и на той руке, где будете носить украшение. Один и тот же палец на разных руках может отличаться на целый размер.',
          },
          {
            icon: '🕵️',
            title: 'Секретный способ',
            text: 'Наденьте чужое кольцо на свой палец — туда, куда оно налезет плотно. Запомните это место. Только не переусердствуйте, иначе понадобится мыло.',
          },
        ].map(tip => (
          <div
            key={tip.title}
            className="rounded-2xl bg-stone-50 px-4 py-3 dark:bg-stone-800/50"
          >
            <p className="mb-1 text-sm font-medium text-stone-700 dark:text-stone-200">
              {tip.icon} {tip.title}
            </p>
            <p className="text-sm text-stone-500 dark:text-stone-400">{tip.text}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Главный компонент ──────────────────────────────────────────────────────────
const TABS = [
  { id: 'screen', label: '📱 По экрану' },
  { id: 'manual', label: '📐 По нитке/кольцу' },
  { id: 'table',  label: '📋 Таблица' },
]

export function RingSizeGuide({ onClose }) {
  const [tab, setTab] = useState('screen')

  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-white animate-fade-in dark:bg-stone-950">
      {/* Шапка */}
      <div className="flex shrink-0 items-center justify-between border-b border-stone-100 px-4 py-4 dark:border-stone-800">
        <div>
          <h2 className="text-base font-semibold text-stone-800 dark:text-stone-100">
            Узнать размер кольца
          </h2>
          <p className="text-xs text-stone-400">Выберите удобный способ</p>
        </div>
        <button
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-stone-100 dark:hover:bg-stone-800"
        >
          <X size={18} />
        </button>
      </div>

      {/* Вкладки */}
      <div className="shrink-0 border-b border-stone-100 dark:border-stone-800">
        <div className="flex overflow-x-auto px-4">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'shrink-0 whitespace-nowrap border-b-2 px-3 py-3 text-sm font-medium transition-colors',
                tab === t.id
                  ? 'border-gold-500 text-gold-600 dark:text-gold-400'
                  : 'border-transparent text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Контент */}
      <div className="flex-1 overflow-y-auto">
        {tab === 'screen' && <ScreenTab />}
        {tab === 'manual' && <ManualTab />}
        {tab === 'table'  && <TableTab />}
      </div>
    </div>
  )
}
