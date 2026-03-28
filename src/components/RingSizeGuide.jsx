import { useState, useEffect } from 'react'
import { X, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Таблица размеров колец ─────────────────────────────────────────────────────
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

// ── Таблица размеров браслетов ─────────────────────────────────────────────────
// length = длина браслета в мм, wrist = обхват запястья при комфортной посадке
const BRACELET_SIZES = [
  { length: 155, wristMin: 120, wristMax: 140 },
  { length: 160, wristMin: 130, wristMax: 145 },
  { length: 165, wristMin: 135, wristMax: 150 },
  { length: 170, wristMin: 140, wristMax: 155 },
  { length: 175, wristMin: 145, wristMax: 160 },
  { length: 180, wristMin: 150, wristMax: 165 },
  { length: 185, wristMin: 155, wristMax: 170 },
  { length: 190, wristMin: 160, wristMax: 175 },
  { length: 195, wristMin: 165, wristMax: 180 },
  { length: 200, wristMin: 170, wristMax: 185 },
]

// ── Карточка результата (кольца) ──────────────────────────────────────────────
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
        <p className={cn(
          'mt-2 text-xs font-medium',
          POPULAR_FEMALE.includes(match.size)
            ? 'text-pink-500 dark:text-pink-400'
            : 'text-blue-500 dark:text-blue-400'
        )}>
          ✦ Популярный размер {POPULAR_FEMALE.includes(match.size) ? 'для женщин' : 'для мужчин'}
        </p>
      )}
    </div>
  )
}

// ── Вкладка: По экрану ─────────────────────────────────────────────────────────
function ScreenTab() {
  const [calibPx, setCalibPx]     = useState(38)
  const [calibrated, setCalibrated] = useState(false)
  const [diamMm, setDiamMm]       = useState(17)

  const pxPerMm   = calibPx / 10
  const circlePx  = Math.round(diamMm * pxPerMm)
  const match     = findByDiam(diamMm)
  const minCircle = Math.round(14 * pxPerMm)
  const maxCircle = Math.round(23 * pxPerMm)

  if (!calibrated) {
    return (
      <div className="space-y-5 px-4 py-4">
        {/* Предупреждение для десктопа */}
        <div className="hidden lg:flex items-start gap-2 rounded-2xl bg-blue-50 px-4 py-3 text-sm text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
          <span className="shrink-0">💻</span>
          <span>Измерение по экрану точнее работает на мобильном устройстве. На десктопе рекомендуем использовать вкладку «По нитке/кольцу».</span>
        </div>

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
        <div className="flex flex-col items-start gap-8">
          <div className="flex items-center gap-3">
            <div
              className="h-1.5 bg-gold-500 transition-none"
              style={{ width: calibPx }}
            />
            <span className="whitespace-nowrap text-xs font-medium text-stone-500 dark:text-stone-400">
              10 мм
            </span>
          </div>
          <input
            type="range" min={20} max={130} value={calibPx}
            onChange={e => setCalibPx(Number(e.target.value))}
            className="range-lg"
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
      <div className="space-y-3">
        <input
          type="range" min={14} max={23} step={0.1} value={diamMm}
          onChange={e => setDiamMm(Number(e.target.value))}
          className="range-lg"
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

// ── Вкладка: По нитке / кольцу ────────────────────────────────────────────────
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

// ── Вкладка: Таблица и советы ─────────────────────────────────────────────────
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
              {RING_SIZES.map(r => {
                const isFemale = POPULAR_FEMALE.includes(r.size)
                const isMale   = POPULAR_MALE.includes(r.size)
                return (
                  <tr
                    key={r.size}
                    className={cn(
                      'border-b border-stone-50 last:border-0 dark:border-stone-800/50',
                      isFemale && 'bg-pink-50/60 dark:bg-pink-950/10',
                      isMale   && 'bg-blue-50/60 dark:bg-blue-950/10'
                    )}
                  >
                    <td className="px-3 py-2">
                      <span className={cn(
                        'font-semibold',
                        isFemale ? 'text-pink-500 dark:text-pink-400'
                        : isMale ? 'text-blue-500 dark:text-blue-400'
                        : 'text-stone-700 dark:text-stone-200'
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
        <div className="mt-2 flex flex-wrap gap-3 text-xs">
          <span className="flex items-center gap-1 text-pink-500 dark:text-pink-400">
            <span className="inline-block h-2 w-2 rounded-sm bg-pink-400 dark:bg-pink-500" />
            Популярные женские (17–18)
          </span>
          <span className="flex items-center gap-1 text-blue-500 dark:text-blue-400">
            <span className="inline-block h-2 w-2 rounded-sm bg-blue-400 dark:bg-blue-500" />
            Популярные мужские (19–20,5)
          </span>
        </div>
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

// ── Вкладка: Браслет ──────────────────────────────────────────────────────────
function BraceletTab() {
  const [inputVal, setInputVal] = useState('')

  const numVal = parseFloat(inputVal.replace(',', '.'))
  const valid  = !isNaN(numVal) && numVal >= 100 && numVal <= 250

  const fits = valid ? {
    tight:      Math.round(numVal + 15),
    comfortable: Math.round(numVal + 25),
    loose:      Math.round(numVal + 35),
  } : null

  return (
    <div className="space-y-5 px-4 py-4">
      {/* Как измерить */}
      <div className="rounded-2xl bg-stone-50 px-4 py-3 text-sm text-stone-600 dark:bg-stone-800 dark:text-stone-300">
        <p className="mb-2 font-medium">Как измерить обхват запястья:</p>
        <ol className="space-y-1 pl-4" style={{ listStyleType: 'decimal' }}>
          <li>Оберните нить или полоску бумаги вокруг запястья</li>
          <li>Отметьте точку, где конец нити встретился с основанием</li>
          <li>Разверните и измерьте длину линейкой в миллиметрах</li>
        </ol>
        <p className="mt-2 text-xs text-stone-400">
          💡 Измеряйте в самой широкой части запястья
        </p>
      </div>

      {/* Поле ввода */}
      <div className="relative">
        <input
          type="number"
          inputMode="decimal"
          placeholder="Обхват запястья, мм"
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

      {inputVal && !valid && (
        <p className="text-sm text-rose-500">Введите значение от 100 до 250 мм</p>
      )}

      {/* Результат */}
      {fits && (
        <div className="rounded-2xl border border-gold-300 bg-gold-50 p-4 dark:border-gold-600/40 dark:bg-gold-950/20">
          <p className="mb-3 text-sm font-medium text-stone-700 dark:text-stone-200">
            Обхват запястья: <span className="text-gold-600 dark:text-gold-400">{numVal} мм ({(numVal / 10).toFixed(1)} см)</span>
          </p>
          <div className="space-y-2 text-sm">
            {[
              { label: 'Плотно',      value: fits.tight,       desc: 'минимальный зазор' },
              { label: 'Комфортно',   value: fits.comfortable, desc: 'рекомендуется' },
              { label: 'Свободно',    value: fits.loose,       desc: 'свободная посадка' },
            ].map(row => (
              <div key={row.label} className="flex items-center justify-between">
                <span className="text-stone-500 dark:text-stone-400">
                  {row.label} <span className="text-xs text-stone-400">({row.desc})</span>
                </span>
                <span className="font-semibold text-stone-800 dark:text-stone-100">
                  {row.value} мм
                  <span className="ml-1 font-normal text-stone-400 text-xs">
                    ({(row.value / 10).toFixed(1)} см)
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Таблица размеров браслетов */}
      <div>
        <p className="mb-3 text-sm font-medium text-stone-700 dark:text-stone-200">Таблица размеров</p>
        <div className="overflow-x-auto rounded-2xl border border-stone-100 dark:border-stone-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100 bg-stone-50 text-left text-xs text-stone-500 dark:border-stone-800 dark:bg-stone-800/50 dark:text-stone-400">
                <th className="px-3 py-2.5 font-medium">Длина</th>
                <th className="px-3 py-2.5 font-medium">Обхват запястья</th>
              </tr>
            </thead>
            <tbody>
              {BRACELET_SIZES.map(b => {
                const isMatch = fits && fits.comfortable >= b.wristMin + 15 && fits.comfortable <= b.wristMax + 25
                return (
                  <tr
                    key={b.length}
                    className={cn(
                      'border-b border-stone-50 last:border-0 dark:border-stone-800/50',
                      isMatch && 'bg-gold-50/60 dark:bg-gold-950/10'
                    )}
                  >
                    <td className="px-3 py-2">
                      <span className={cn(
                        'font-semibold',
                        isMatch ? 'text-gold-600 dark:text-gold-400' : 'text-stone-700 dark:text-stone-200'
                      )}>
                        {(b.length / 10).toFixed(1)} см
                      </span>
                    </td>
                    <td className="px-3 py-2 text-stone-500 dark:text-stone-400">
                      {b.wristMin}–{b.wristMax} мм
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-stone-400">
          Диапазон обхвата запястья для комфортной посадки (+20–25 мм)
        </p>
      </div>

      {/* Советы */}
      <div className="space-y-3 pb-2">
        <p className="text-sm font-medium text-stone-700 dark:text-stone-200">Советы по выбору</p>
        {[
          { icon: '⏰', title: 'Когда измерять', text: 'Измеряйте в дневное время, когда запястье наиболее стабильного размера. Вечером запястье может быть чуть больше.' },
          { icon: '💎', title: 'Плотное или свободное?', text: 'Для постоянного ношения выбирайте комфортную посадку (+2–2,5 см). Для тонких браслетов-нитей достаточно +1,5 см. Для массивных браслетов берите на 0,5–1 см больше.' },
          { icon: '📐', title: 'Браслет с замком', text: 'Учитывайте, что замок занимает 0,5–1 см длины. Если замок крупный — выберите размер побольше.' },
        ].map(tip => (
          <div key={tip.title} className="rounded-2xl bg-stone-50 px-4 py-3 dark:bg-stone-800/50">
            <p className="mb-1 text-sm font-medium text-stone-700 dark:text-stone-200">{tip.icon} {tip.title}</p>
            <p className="text-sm text-stone-500 dark:text-stone-400">{tip.text}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Схема длин цепи (SVG) ─────────────────────────────────────────────────────
function ChainSVG() {
  return (
    <svg
      width="401" height="400" viewBox="0 0 401 400" fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-auto dark:invert"
      style={{ display: 'block' }}
    >
      <path d="M199.864 198.667C234.531 177.64 262.598 175.467 263.184 173.48C265.731 164.827 268.851 149.747 268.851 127.747" stroke="#93928F" strokeWidth="2" strokeMiterlimit="10"/>
      <path d="M200.905 198.667C166.238 177.64 138.238 175.467 137.598 173.48C135.052 164.827 131.932 149.747 131.932 127.747" stroke="#93928F" strokeWidth="2" strokeMiterlimit="10"/>
      <path d="M213.371 123.613C221.627 121.278 229.055 116.656 234.798 110.28" stroke="#27251F" strokeWidth="2" strokeMiterlimit="10"/>
      <path d="M238.904 114.16C236.464 120.92 229.131 137.307 213.371 143.88" stroke="#27251F" strokeWidth="2" strokeMiterlimit="10"/>
      <path d="M243.198 117.56C240.611 129.387 232.904 154.8 213.371 163.72" stroke="#27251F" strokeWidth="2" strokeMiterlimit="10"/>
      <path d="M245.184 118.96C242.638 138.213 235.851 173.813 213.371 185" stroke="#27251F" strokeWidth="2" strokeMiterlimit="10"/>
      <path d="M246.811 120C245.131 143.867 240.824 191.547 213.371 205.573" stroke="#27251F" strokeWidth="2" strokeMiterlimit="10"/>
      <path d="M248.345 121.04C247.558 149.04 246.331 209.267 213.345 226" stroke="#27251F" strokeWidth="2" strokeMiterlimit="10"/>
      <path d="M249.984 121.973C249.904 139.4 249.331 226.44 213.371 246.293" stroke="#27251F" strokeWidth="2" strokeMiterlimit="10"/>
      <path d="M250.251 122.84C250.598 153.507 254.691 243.467 213.371 266.947" stroke="#27251F" strokeWidth="2" strokeMiterlimit="10"/>
      <path d="M251.011 122.293C252.011 155.627 258.105 263.493 213.385 289.173" stroke="#27251F" strokeWidth="2" strokeMiterlimit="10"/>
      <path d="M252.251 123.12C253.904 158.013 262.104 282.747 213.371 310.72" stroke="#27251F" strokeWidth="2" strokeMiterlimit="10"/>
      <path d="M253.531 123.84C255.918 159.027 267.011 301.64 213.371 330.16" stroke="#27251F" strokeWidth="2" strokeMiterlimit="10"/>
      <path d="M254.625 124.56C257.958 157.52 270.171 311.613 212.038 353.8" stroke="#27251F" strokeWidth="2" strokeMiterlimit="10"/>
      <path d="M186.358 123.613C178.102 121.284 170.677 116.661 164.944 110.28" stroke="#27251F" strokeWidth="2" strokeMiterlimit="10"/>
      <path d="M160.838 114.16C163.265 120.92 170.598 137.307 186.358 143.88" stroke="#27251F" strokeWidth="2" strokeMiterlimit="10"/>
      <path d="M156.531 117.56C159.118 129.387 166.825 154.8 186.358 163.72" stroke="#27251F" strokeWidth="2" strokeMiterlimit="10"/>
      <path d="M154.559 118.96C157.105 138.213 163.892 173.813 186.359 185" stroke="#27251F" strokeWidth="2" strokeMiterlimit="10"/>
      <path d="M152.932 120C154.612 143.867 158.905 191.547 186.358 205.573" stroke="#27251F" strokeWidth="2" strokeMiterlimit="10"/>
      <path d="M151.358 121.04C152.145 149.04 153.372 209.267 186.358 226" stroke="#27251F" strokeWidth="2" strokeMiterlimit="10"/>
      <path d="M149.745 121.973C149.825 139.4 150.398 226.44 186.358 246.293" stroke="#27251F" strokeWidth="2" strokeMiterlimit="10"/>
      <path d="M149.478 122.84C149.131 153.507 145.038 243.467 186.358 266.947" stroke="#27251F" strokeWidth="2" strokeMiterlimit="10"/>
      <path d="M148.731 122.293C147.731 155.627 141.638 263.493 186.358 289.173" stroke="#27251F" strokeWidth="2" strokeMiterlimit="10"/>
      <path d="M147.478 123.12C145.825 158.013 137.678 282.747 186.358 310.667" stroke="#27251F" strokeWidth="2" strokeMiterlimit="10"/>
      <path d="M146.198 123.84C143.811 159.027 132.731 301.64 186.358 330.16" stroke="#27251F" strokeWidth="2" strokeMiterlimit="10"/>
      <path d="M145.118 124.56C141.771 157.52 129.571 311.613 187.691 353.8" stroke="#27251F" strokeWidth="2" strokeMiterlimit="10"/>
      <path d="M227.998 79.9067C227.998 79.9067 226.918 98.0934 230.918 105.427C234.918 112.76 253.585 126.093 264.918 127.427C276.251 128.76 294.918 124.76 306.251 136.76C317.585 148.76 322.131 176.093 319.465 212.76C316.798 249.427 326.851 358.747 326.851 358.747" stroke="#93928F" strokeWidth="2" strokeMiterlimit="10"/>
      <path d="M172.691 79.9067C172.691 79.9067 173.771 98.0934 169.771 105.427C165.771 112.76 147.105 126.093 135.771 127.427C124.438 128.76 105.771 124.76 94.4379 136.76C83.1046 148.76 78.5579 176.093 81.2246 212.76C83.8912 249.427 73.8379 358.747 73.8379 358.747" stroke="#93928F" strokeWidth="2" strokeMiterlimit="10"/>
      <path d="M118.584 259.32C118.584 259.32 112.171 300.48 106.864 363.253" stroke="#93928F" strokeWidth="2" strokeMiterlimit="10"/>
      <path d="M282.198 259.32C282.198 259.32 288.612 300.48 293.918 363.253" stroke="#93928F" strokeWidth="2" strokeMiterlimit="10"/>
      <path d="M244.785 36.5867C244.785 36.5867 242.385 63.3334 235.145 72.0001C227.905 80.6667 212.745 95.8934 206.905 95.8934H193.878C188.038 95.9201 172.878 80.7067 165.678 72.0001C158.478 63.2934 156.038 36.5601 156.038 36.5601" stroke="#93928F" strokeWidth="2" strokeMiterlimit="10"/>
      <path d="M216.438 63.9199C216.438 63.9199 209.571 69.8133 203.225 69.8133H197.558C191.211 69.8133 184.345 63.9199 184.345 63.9199" stroke="#93928F" strokeWidth="2" strokeMiterlimit="10"/>
      <path d="M200.345 65.8C201.671 65.6242 203.007 65.5307 204.345 65.52C206.345 65.52 208.345 65.92 211.238 65.92C213.132 65.82 214.944 65.1194 216.412 63.92C211.665 63.92 209.905 61.2533 206.185 61.2533C202.465 61.2533 202.092 61.92 200.358 61.92C198.625 61.92 198.252 61.2533 194.545 61.2533C190.838 61.2533 189.052 63.92 184.318 63.92C185.786 65.1194 187.599 65.82 189.492 65.92C192.345 65.92 194.385 65.52 196.385 65.52C197.71 65.5313 199.032 65.6248 200.345 65.8V65.8Z" stroke="#93928F" strokeWidth="2" strokeMiterlimit="10"/>
      <path d="M150.559 36.5867C151.639 39.12 151.492 41.92 153.132 44.2133C154.187 45.5746 155.561 46.6552 157.132 47.36L157.599 47.5867" stroke="#93928F" strokeWidth="2" strokeMiterlimit="10"/>
      <path d="M250.225 36.5867C249.145 39.12 249.292 41.92 247.639 44.2133C246.588 45.5789 245.213 46.6605 243.639 47.36L243.172 47.5867" stroke="#93928F" strokeWidth="2" strokeMiterlimit="10"/>
      <path d="M282.451 363.413C279.187 329.041 279.115 294.439 282.238 260.053V260.36C282.998 246.293 285.038 232.453 284.798 218.2C284.691 211.747 284.158 205.32 283.984 198.867C283.731 189.973 283.118 142.387 283.451 127.507" stroke="#93928F" strokeWidth="2" strokeMiterlimit="10"/>
      <path d="M118.332 363.413C121.593 329.023 121.664 294.404 118.545 260V260.307C117.785 246.24 115.745 232.4 115.985 218.147C116.092 211.693 116.625 205.267 116.799 198.813C117.039 189.92 117.665 142.333 117.332 127.453" stroke="#93928F" strokeWidth="2" strokeMiterlimit="10"/>
      <path d="M197.771 126.173V125.707H195.745C195.225 125.707 194.678 125.707 194.145 125.707V124.6L197.611 119.373H199.011C199.011 119.693 198.945 120.333 198.945 121.027V124.6H200.278V125.707H198.945V126.173C198.945 126.813 198.945 127.507 199.011 127.827H197.678C197.678 127.48 197.771 126.813 197.771 126.173ZM197.771 124.653V121.12L195.438 124.64H197.785L197.771 124.653Z" fill="black"/>
      <path d="M205.052 127.827H200.972L203.078 125.08C204.412 123.333 205.185 122.493 205.185 121.6C205.188 121.428 205.154 121.258 205.087 121.1C205.019 120.943 204.919 120.801 204.794 120.684C204.668 120.567 204.519 120.478 204.357 120.422C204.195 120.366 204.023 120.345 203.852 120.36C203.328 120.418 202.827 120.609 202.398 120.915C201.969 121.22 201.625 121.631 201.398 122.107V120.56C201.688 120.163 202.07 119.843 202.512 119.627C202.953 119.411 203.44 119.306 203.932 119.32C204.246 119.275 204.567 119.299 204.871 119.392C205.175 119.484 205.455 119.642 205.692 119.854C205.928 120.067 206.115 120.328 206.239 120.621C206.364 120.913 206.423 121.229 206.412 121.547C206.164 122.865 205.517 124.075 204.558 125.013L203.225 126.773H205.132C205.625 126.773 206.132 126.773 206.638 126.773V127.933C206.052 127.867 205.545 127.827 205.052 127.827Z" fill="black"/>
      <path d="M197.678 146.96V146.493H195.652C195.132 146.493 194.585 146.493 194.052 146.493V145.387L197.505 140.16H198.945C198.945 140.48 198.878 141.12 198.878 141.813V145.387H200.212V146.493H198.878V146.96C198.878 147.6 198.878 148.293 198.945 148.613H197.612C197.572 148.267 197.678 147.6 197.678 146.96ZM197.678 145.44V141.907L195.345 145.427H197.678V145.44Z" fill="black"/>
      <path d="M201.012 147.413L201.945 146.56C202.13 146.9 202.404 147.184 202.737 147.381C203.071 147.578 203.451 147.681 203.838 147.68C204.079 147.686 204.317 147.642 204.54 147.552C204.763 147.462 204.965 147.327 205.133 147.156C205.302 146.985 205.434 146.781 205.521 146.557C205.607 146.333 205.648 146.093 205.638 145.853C205.648 145.617 205.608 145.382 205.522 145.162C205.435 144.943 205.303 144.743 205.135 144.578C204.967 144.412 204.765 144.283 204.544 144.2C204.324 144.116 204.088 144.08 203.852 144.093C203.126 144.13 202.43 144.396 201.865 144.853V140.213H204.452C205.025 140.213 205.585 140.213 206.158 140.213V141.333C205.585 141.333 205.025 141.333 204.452 141.333H203.012V143.307C203.44 143.156 203.898 143.11 204.348 143.172C204.797 143.234 205.226 143.402 205.598 143.663C205.969 143.924 206.273 144.269 206.484 144.671C206.695 145.073 206.808 145.519 206.812 145.973C206.818 146.356 206.745 146.737 206.599 147.091C206.452 147.445 206.235 147.765 205.96 148.033C205.686 148.3 205.359 148.508 205.001 148.645C204.643 148.781 204.261 148.843 203.878 148.827C203.321 148.844 202.769 148.724 202.269 148.478C201.769 148.231 201.337 147.866 201.012 147.413Z" fill="black"/>
      <path d="M192.892 166.867L193.825 166.013C194.01 166.353 194.284 166.637 194.617 166.834C194.951 167.031 195.331 167.135 195.718 167.133C195.958 167.139 196.197 167.095 196.42 167.005C196.643 166.915 196.845 166.78 197.013 166.609C197.182 166.438 197.314 166.234 197.4 166.01C197.487 165.786 197.527 165.547 197.518 165.307C197.528 165.071 197.488 164.835 197.401 164.616C197.315 164.396 197.183 164.197 197.015 164.031C196.846 163.865 196.645 163.737 196.424 163.653C196.203 163.57 195.967 163.533 195.732 163.547C195.009 163.582 194.318 163.848 193.758 164.307V159.667H196.345C196.932 159.667 197.478 159.667 198.052 159.667V160.84C197.478 160.84 196.932 160.84 196.345 160.84H194.932V162.667C195.228 162.567 195.539 162.513 195.852 162.507C196.23 162.476 196.61 162.526 196.967 162.654C197.324 162.782 197.65 162.984 197.922 163.248C198.195 163.512 198.408 163.831 198.548 164.183C198.687 164.536 198.75 164.914 198.732 165.293C198.739 165.677 198.668 166.058 198.522 166.413C198.377 166.768 198.16 167.089 197.884 167.357C197.609 167.625 197.282 167.833 196.923 167.969C196.565 168.104 196.182 168.165 195.798 168.147C195.246 168.186 194.693 168.09 194.186 167.867C193.68 167.644 193.235 167.3 192.892 166.867Z" fill="black"/>
      <path d="M199.864 163.853C199.921 163.077 200.204 162.335 200.676 161.717C201.149 161.099 201.792 160.632 202.526 160.373C203.26 160.115 204.053 160.077 204.809 160.263C205.565 160.448 206.25 160.851 206.78 161.42C207.311 161.989 207.664 162.701 207.796 163.468C207.928 164.235 207.833 165.024 207.524 165.738C207.214 166.452 206.703 167.06 206.053 167.488C205.403 167.916 204.642 168.145 203.864 168.147C203.313 168.148 202.768 168.036 202.263 167.817C201.757 167.598 201.302 167.276 200.927 166.873C200.551 166.47 200.263 165.994 200.08 165.474C199.897 164.955 199.824 164.403 199.864 163.853ZM206.598 163.853C206.511 163.323 206.275 162.829 205.916 162.429C205.557 162.029 205.092 161.74 204.574 161.596C204.057 161.452 203.509 161.46 202.995 161.617C202.482 161.775 202.024 162.076 201.676 162.486C201.329 162.895 201.106 163.396 201.033 163.928C200.961 164.461 201.043 165.002 201.269 165.49C201.494 165.977 201.855 166.39 202.308 166.679C202.761 166.967 203.287 167.121 203.824 167.12C204.226 167.103 204.62 167.003 204.982 166.826C205.343 166.649 205.664 166.399 205.925 166.093C206.185 165.786 206.379 165.429 206.495 165.043C206.611 164.658 206.646 164.253 206.598 163.853Z" fill="black"/>
      <path d="M193.131 186.227C193.153 185.435 193.393 184.664 193.824 184L195.878 180.453H197.318L195.238 183.6C195.466 183.529 195.705 183.493 195.944 183.493C196.307 183.473 196.669 183.528 197.01 183.653C197.35 183.778 197.662 183.971 197.925 184.221C198.189 184.47 198.398 184.771 198.541 185.104C198.685 185.438 198.758 185.797 198.758 186.16C198.758 186.523 198.685 186.882 198.541 187.216C198.398 187.549 198.189 187.85 197.925 188.099C197.662 188.349 197.35 188.542 197.01 188.667C196.669 188.792 196.307 188.847 195.944 188.827C195.587 188.846 195.23 188.794 194.894 188.673C194.558 188.552 194.249 188.365 193.987 188.123C193.724 187.88 193.513 187.587 193.366 187.262C193.219 186.936 193.139 186.584 193.131 186.227ZM197.611 186.227C197.618 186.006 197.581 185.786 197.5 185.58C197.42 185.374 197.3 185.186 197.145 185.028C196.991 184.869 196.806 184.744 196.602 184.659C196.398 184.574 196.179 184.531 195.958 184.533C195.536 184.571 195.144 184.765 194.858 185.077C194.573 185.389 194.414 185.797 194.414 186.22C194.414 186.643 194.573 187.051 194.858 187.363C195.144 187.675 195.536 187.869 195.958 187.907C196.184 187.922 196.411 187.889 196.624 187.811C196.837 187.732 197.031 187.61 197.193 187.451C197.355 187.293 197.482 187.102 197.566 186.891C197.649 186.68 197.687 186.453 197.678 186.227H197.611Z" fill="black"/>
      <path d="M199.838 184.64C199.895 183.864 200.177 183.121 200.65 182.503C201.123 181.885 201.765 181.418 202.5 181.16C203.234 180.902 204.027 180.863 204.783 181.049C205.538 181.235 206.223 181.637 206.754 182.207C207.284 182.776 207.637 183.488 207.769 184.255C207.901 185.021 207.807 185.81 207.497 186.524C207.188 187.238 206.677 187.846 206.027 188.274C205.377 188.702 204.616 188.931 203.838 188.933C203.287 188.935 202.742 188.822 202.236 188.603C201.731 188.384 201.276 188.063 200.901 187.66C200.525 187.257 200.237 186.781 200.054 186.261C199.871 185.741 199.798 185.189 199.838 184.64ZM206.505 184.64C206.416 184.114 206.178 183.625 205.821 183.229C205.463 182.833 205 182.548 204.486 182.407C203.972 182.265 203.428 182.274 202.918 182.431C202.408 182.588 201.954 182.888 201.609 183.295C201.264 183.701 201.042 184.198 200.97 184.726C200.897 185.254 200.977 185.793 201.2 186.277C201.423 186.761 201.78 187.172 202.228 187.461C202.676 187.75 203.198 187.904 203.731 187.907C204.14 187.9 204.542 187.808 204.912 187.636C205.283 187.464 205.613 187.216 205.881 186.907C206.149 186.599 206.349 186.238 206.468 185.847C206.587 185.457 206.622 185.045 206.571 184.64H206.505Z" fill="black"/>
      <path d="M194.238 209.64L197.184 203.36H195.011C194.478 203.36 193.944 203.36 193.411 203.427V202.267C193.944 202.267 194.478 202.267 195.011 202.267H198.891L195.518 209.6C195.371 209.933 195.264 210.32 195.144 210.667H193.678C193.838 210.36 194.064 210 194.238 209.64Z" fill="black"/>
      <path d="M199.411 206.493C199.471 205.718 199.755 204.977 200.229 204.361C200.703 203.745 201.347 203.28 202.081 203.024C202.815 202.767 203.608 202.731 204.363 202.918C205.117 203.105 205.801 203.508 206.33 204.078C206.859 204.648 207.211 205.359 207.342 206.126C207.473 206.892 207.378 207.68 207.068 208.393C206.759 209.106 206.248 209.714 205.598 210.141C204.949 210.569 204.189 210.798 203.411 210.8C202.859 210.802 202.313 210.689 201.806 210.469C201.3 210.249 200.844 209.927 200.469 209.522C200.093 209.118 199.805 208.64 199.623 208.118C199.441 207.597 199.369 207.044 199.411 206.493ZM206.078 206.493C205.991 205.963 205.755 205.469 205.396 205.069C205.038 204.669 204.572 204.38 204.054 204.236C203.537 204.092 202.989 204.1 202.475 204.257C201.962 204.415 201.504 204.716 201.157 205.126C200.809 205.535 200.586 206.036 200.514 206.568C200.441 207.101 200.523 207.642 200.749 208.13C200.975 208.617 201.335 209.03 201.788 209.319C202.241 209.607 202.767 209.761 203.305 209.76C203.712 209.752 204.114 209.658 204.483 209.485C204.852 209.312 205.181 209.064 205.449 208.756C205.716 208.449 205.917 208.088 206.036 207.699C206.156 207.309 206.193 206.898 206.145 206.493H206.078Z" fill="black"/>
      <path d="M195.358 230.667L198.292 224.387H196.132C195.612 224.387 195.065 224.387 194.545 224.387V223.227C195.065 223.227 195.612 223.227 196.132 223.227H200.025L196.652 230.56C196.507 230.908 196.383 231.264 196.278 231.627H194.772C195.012 231.413 195.185 231.053 195.358 230.667Z" fill="black"/>
      <path d="M200.545 230.56L201.478 229.707C201.66 230.05 201.933 230.336 202.267 230.533C202.601 230.731 202.983 230.833 203.372 230.827C203.612 230.832 203.851 230.789 204.073 230.699C204.296 230.608 204.498 230.474 204.666 230.302C204.835 230.131 204.967 229.927 205.054 229.703C205.141 229.479 205.181 229.24 205.172 229C205.181 228.764 205.141 228.529 205.055 228.309C204.968 228.089 204.836 227.89 204.668 227.724C204.5 227.559 204.299 227.43 204.078 227.346C203.857 227.263 203.621 227.227 203.385 227.24C202.66 227.282 201.966 227.547 201.398 228V223.36H203.985C204.558 223.36 205.118 223.36 205.692 223.36V224.52C205.118 224.52 204.558 224.52 203.985 224.52H202.572V226.493C202.868 226.393 203.179 226.339 203.492 226.333C203.869 226.305 204.247 226.356 204.603 226.485C204.958 226.614 205.282 226.817 205.553 227.08C205.824 227.344 206.036 227.662 206.175 228.014C206.314 228.365 206.376 228.742 206.358 229.12C206.366 229.502 206.295 229.882 206.15 230.237C206.005 230.591 205.789 230.911 205.516 231.179C205.242 231.446 204.917 231.654 204.559 231.791C204.202 231.928 203.82 231.99 203.438 231.973C202.876 232 202.316 231.885 201.81 231.638C201.305 231.39 200.869 231.02 200.545 230.56Z" fill="black"/>
      <path d="M193.131 250.013C193.123 249.562 193.234 249.117 193.451 248.722C193.669 248.326 193.986 247.995 194.371 247.76C194.156 247.567 193.984 247.331 193.866 247.066C193.749 246.802 193.689 246.516 193.691 246.227C193.691 245.65 193.92 245.097 194.328 244.69C194.735 244.282 195.288 244.053 195.865 244.053C196.441 244.053 196.994 244.282 197.401 244.69C197.809 245.097 198.038 245.65 198.038 246.227C198.04 246.516 197.98 246.802 197.863 247.066C197.746 247.331 197.573 247.567 197.358 247.76C197.725 248.025 198.018 248.379 198.211 248.789C198.403 249.199 198.488 249.651 198.457 250.103C198.426 250.554 198.281 250.991 198.035 251.371C197.789 251.751 197.45 252.062 197.051 252.275C196.651 252.488 196.204 252.596 195.752 252.588C195.299 252.58 194.856 252.458 194.464 252.231C194.072 252.005 193.744 251.683 193.51 251.295C193.277 250.907 193.147 250.466 193.131 250.013ZM197.438 250.013C197.43 249.704 197.331 249.404 197.154 249.15C196.976 248.897 196.728 248.702 196.439 248.589C196.151 248.476 195.836 248.45 195.534 248.515C195.231 248.58 194.955 248.733 194.739 248.955C194.523 249.176 194.377 249.457 194.319 249.761C194.262 250.065 194.295 250.379 194.415 250.664C194.535 250.949 194.737 251.193 194.995 251.364C195.253 251.535 195.555 251.627 195.865 251.627C196.077 251.631 196.288 251.591 196.484 251.51C196.68 251.429 196.857 251.308 197.005 251.156C197.153 251.003 197.267 250.822 197.342 250.623C197.416 250.424 197.449 250.212 197.438 250V250.013ZM196.945 246.227C196.942 246.014 196.876 245.806 196.756 245.63C196.636 245.455 196.466 245.318 196.269 245.238C196.071 245.159 195.854 245.139 195.646 245.182C195.437 245.226 195.246 245.329 195.096 245.481C194.947 245.633 194.845 245.825 194.804 246.034C194.764 246.243 194.786 246.46 194.868 246.656C194.95 246.853 195.089 247.021 195.266 247.139C195.443 247.257 195.652 247.32 195.865 247.32C196.008 247.318 196.15 247.288 196.282 247.232C196.414 247.175 196.534 247.093 196.634 246.99C196.734 246.888 196.813 246.766 196.866 246.633C196.92 246.499 196.946 246.357 196.945 246.213V246.227Z" fill="black"/>
      <path d="M199.878 248.333C199.938 247.558 200.222 246.817 200.696 246.201C201.17 245.585 201.814 245.12 202.548 244.864C203.282 244.607 204.075 244.57 204.829 244.758C205.584 244.945 206.268 245.348 206.797 245.918C207.326 246.488 207.678 247.199 207.809 247.966C207.94 248.732 207.845 249.52 207.535 250.233C207.225 250.947 206.715 251.554 206.065 251.981C205.416 252.409 204.656 252.638 203.878 252.64C203.326 252.642 202.779 252.529 202.273 252.309C201.767 252.089 201.311 251.767 200.935 251.362C200.56 250.958 200.272 250.48 200.09 249.958C199.908 249.437 199.836 248.884 199.878 248.333ZM206.545 248.333C206.458 247.803 206.222 247.309 205.863 246.909C205.504 246.509 205.039 246.22 204.521 246.076C204.004 245.932 203.456 245.94 202.942 246.097C202.429 246.255 201.971 246.556 201.623 246.966C201.276 247.375 201.053 247.876 200.98 248.408C200.908 248.94 200.99 249.482 201.216 249.97C201.442 250.457 201.802 250.87 202.255 251.159C202.708 251.447 203.234 251.601 203.771 251.6C204.179 251.592 204.58 251.498 204.95 251.325C205.319 251.152 205.648 250.904 205.916 250.596C206.183 250.289 206.383 249.928 206.503 249.539C206.623 249.149 206.66 248.738 206.611 248.333H206.545Z" fill="black"/>
      <path d="M197.798 270.867C197.568 270.931 197.33 270.967 197.091 270.973C196.722 270.996 196.352 270.941 196.006 270.813C195.659 270.684 195.342 270.486 195.077 270.229C194.811 269.971 194.601 269.662 194.462 269.32C194.322 268.977 194.255 268.61 194.265 268.24C194.273 267.879 194.353 267.523 194.5 267.193C194.648 266.862 194.859 266.565 195.122 266.317C195.384 266.069 195.694 265.875 196.032 265.748C196.37 265.62 196.73 265.561 197.091 265.573C197.455 265.551 197.819 265.604 198.161 265.728C198.503 265.853 198.816 266.046 199.081 266.295C199.346 266.545 199.557 266.847 199.701 267.181C199.845 267.516 199.919 267.876 199.918 268.24C199.894 269.036 199.654 269.81 199.225 270.48L197.158 274.013H195.718L197.798 270.867ZM198.731 268.2C198.731 267.761 198.557 267.341 198.247 267.031C197.937 266.721 197.516 266.547 197.078 266.547C196.639 266.547 196.219 266.721 195.909 267.031C195.599 267.341 195.425 267.761 195.425 268.2C195.417 268.421 195.455 268.641 195.535 268.847C195.615 269.053 195.736 269.241 195.89 269.399C196.045 269.557 196.23 269.683 196.434 269.767C196.638 269.852 196.857 269.895 197.078 269.893C197.299 269.903 197.519 269.866 197.725 269.786C197.931 269.705 198.118 269.582 198.273 269.426C198.429 269.269 198.55 269.081 198.629 268.874C198.708 268.668 198.743 268.447 198.731 268.227V268.2Z" fill="black"/>
      <path d="M200.785 272.8L201.718 271.96C201.907 272.3 202.183 272.582 202.519 272.777C202.855 272.972 203.237 273.072 203.625 273.067C203.865 273.072 204.104 273.029 204.327 272.939C204.55 272.848 204.751 272.714 204.92 272.542C205.089 272.371 205.221 272.167 205.307 271.943C205.394 271.719 205.434 271.48 205.425 271.24C205.433 271.003 205.391 270.768 205.303 270.548C205.215 270.328 205.082 270.129 204.913 269.964C204.743 269.798 204.541 269.67 204.32 269.586C204.098 269.503 203.862 269.467 203.625 269.48C202.902 269.52 202.21 269.791 201.652 270.253V265.6H204.318C204.892 265.6 205.438 265.6 206.012 265.6V266.667C205.438 266.667 204.892 266.667 204.318 266.667H202.892V268.627C203.194 268.532 203.508 268.482 203.825 268.48C204.201 268.451 204.579 268.503 204.933 268.631C205.288 268.759 205.611 268.96 205.882 269.222C206.153 269.484 206.365 269.801 206.505 270.151C206.644 270.501 206.708 270.877 206.692 271.253C206.699 271.638 206.628 272.019 206.483 272.375C206.337 272.731 206.12 273.053 205.845 273.321C205.571 273.59 205.244 273.799 204.885 273.937C204.526 274.074 204.142 274.136 203.758 274.12C203.192 274.168 202.622 274.073 202.102 273.842C201.582 273.611 201.129 273.253 200.785 272.8Z" fill="black"/>
      <path d="M191.158 292.467V287.4L189.585 289.093V287.76L191.665 285.787H192.345C192.345 286.24 192.345 286.747 192.345 287.453V292.533C192.345 293.187 192.345 293.867 192.345 294.2H191.012C191.118 293.773 191.158 293.12 191.158 292.467Z" fill="black"/>
      <path d="M194.105 289.92C194.162 289.144 194.444 288.401 194.917 287.783C195.389 287.165 196.032 286.698 196.766 286.44C197.5 286.182 198.294 286.143 199.049 286.329C199.805 286.515 200.49 286.917 201.02 287.487C201.551 288.056 201.904 288.768 202.036 289.535C202.168 290.302 202.073 291.09 201.764 291.804C201.454 292.518 200.943 293.126 200.293 293.554C199.643 293.982 198.883 294.211 198.105 294.213C197.554 294.215 197.008 294.103 196.503 293.883C195.997 293.664 195.543 293.343 195.167 292.94C194.792 292.537 194.503 292.061 194.32 291.541C194.138 291.021 194.064 290.469 194.105 289.92ZM200.838 289.92C200.754 289.389 200.519 288.893 200.162 288.491C199.804 288.089 199.339 287.798 198.822 287.652C198.304 287.506 197.755 287.512 197.241 287.668C196.726 287.825 196.267 288.126 195.918 288.535C195.569 288.944 195.345 289.445 195.272 289.978C195.199 290.511 195.28 291.053 195.506 291.542C195.732 292.03 196.093 292.443 196.546 292.732C197 293.021 197.527 293.174 198.065 293.173C198.466 293.158 198.86 293.059 199.221 292.884C199.582 292.709 199.904 292.46 200.164 292.155C200.425 291.849 200.619 291.492 200.735 291.108C200.851 290.723 200.886 290.319 200.838 289.92Z" fill="black"/>
      <path d="M203.318 289.92C203.375 289.144 203.658 288.401 204.13 287.783C204.603 287.165 205.246 286.698 205.98 286.44C206.714 286.182 207.508 286.143 208.263 286.329C209.019 286.515 209.704 286.917 210.234 287.487C210.765 288.056 211.118 288.768 211.25 289.535C211.382 290.302 211.287 291.09 210.978 291.804C210.668 292.518 210.157 293.126 209.507 293.554C208.857 293.982 208.097 294.211 207.318 294.213C206.767 294.215 206.222 294.103 205.717 293.883C205.211 293.664 204.757 293.343 204.381 292.94C204.005 292.537 203.717 292.061 203.534 291.541C203.352 291.021 203.278 290.469 203.318 289.92ZM210.052 289.92C209.968 289.389 209.733 288.893 209.376 288.491C209.018 288.089 208.553 287.798 208.035 287.652C207.518 287.506 206.969 287.512 206.454 287.668C205.94 287.825 205.481 288.126 205.132 288.535C204.783 288.944 204.559 289.445 204.486 289.978C204.413 290.511 204.494 291.053 204.72 291.542C204.946 292.03 205.307 292.443 205.76 292.732C206.214 293.021 206.741 293.174 207.278 293.173C207.68 293.158 208.074 293.059 208.435 292.884C208.796 292.709 209.117 292.46 209.378 292.155C209.639 291.849 209.833 291.492 209.949 291.108C210.065 290.723 210.1 290.319 210.052 289.92Z" fill="black"/>
      <path d="M192.411 313.92V308.867L190.838 310.56V309.147L192.918 307.187H193.678C193.678 307.627 193.678 308.147 193.678 308.84V313.92C193.678 314.573 193.678 315.253 193.678 315.587H192.345C192.345 315.24 192.411 314.573 192.411 313.92Z" fill="black"/>
      <path d="M195.371 311.373C195.428 310.597 195.71 309.855 196.183 309.237C196.656 308.619 197.299 308.152 198.033 307.893C198.767 307.635 199.56 307.597 200.316 307.783C201.072 307.968 201.757 308.371 202.287 308.94C202.817 309.509 203.17 310.221 203.302 310.988C203.434 311.755 203.34 312.544 203.03 313.258C202.721 313.972 202.21 314.58 201.56 315.008C200.91 315.436 200.149 315.665 199.371 315.667C198.82 315.668 198.275 315.556 197.769 315.337C197.264 315.118 196.809 314.796 196.434 314.393C196.058 313.99 195.77 313.514 195.587 312.994C195.404 312.475 195.331 311.923 195.371 311.373ZM202.038 311.373C201.951 310.843 201.715 310.349 201.356 309.949C200.998 309.549 200.532 309.26 200.014 309.116C199.497 308.972 198.949 308.98 198.435 309.137C197.922 309.295 197.464 309.596 197.117 310.006C196.769 310.415 196.546 310.916 196.473 311.448C196.401 311.981 196.483 312.522 196.709 313.01C196.935 313.497 197.295 313.91 197.748 314.199C198.201 314.487 198.727 314.641 199.264 314.64C199.673 314.634 200.075 314.542 200.446 314.369C200.816 314.197 201.146 313.949 201.414 313.641C201.682 313.333 201.882 312.971 202.001 312.581C202.12 312.19 202.155 311.779 202.104 311.373H202.038Z" fill="black"/>
      <path d="M204.345 314.387L205.278 313.533C205.467 313.872 205.744 314.154 206.08 314.348C206.415 314.543 206.797 314.644 207.185 314.64C207.424 314.646 207.661 314.602 207.883 314.513C208.105 314.424 208.306 314.29 208.475 314.12C208.643 313.951 208.775 313.749 208.863 313.526C208.951 313.304 208.992 313.066 208.985 312.827C208.994 312.59 208.954 312.354 208.868 312.134C208.781 311.913 208.65 311.714 208.482 311.547C208.314 311.38 208.113 311.25 207.892 311.165C207.671 311.08 207.435 311.042 207.198 311.053C206.47 311.091 205.773 311.362 205.211 311.827V307.187H207.811C208.385 307.187 208.931 307.187 209.518 307.187V308.347C208.931 308.347 208.385 308.347 207.811 308.347H206.398V310.307C206.695 310.211 207.006 310.161 207.318 310.16C207.695 310.131 208.074 310.183 208.429 310.312C208.785 310.44 209.109 310.643 209.38 310.907C209.651 311.17 209.863 311.489 210.002 311.84C210.14 312.192 210.203 312.569 210.185 312.947C210.191 313.33 210.118 313.71 209.972 314.064C209.825 314.418 209.608 314.739 209.333 315.006C209.059 315.273 208.732 315.481 208.374 315.618C208.016 315.754 207.634 315.816 207.251 315.8C206.688 315.824 206.127 315.708 205.619 315.461C205.112 315.214 204.674 314.845 204.345 314.387Z" fill="black"/>
      <path d="M193.559 334.667V329.6L191.985 331.293V329.88L194.052 327.92H194.839C194.839 328.36 194.772 328.88 194.772 329.573V334.667C194.772 335.307 194.772 336 194.839 336.32H193.505C193.532 336 193.559 335.36 193.559 334.667Z" fill="black"/>
      <path d="M197.971 334.667V329.6L196.345 331.347V329.933L198.425 327.973H199.198C199.198 328.413 199.198 328.933 199.198 329.627V334.667C199.198 335.307 199.198 336 199.198 336.32H197.865C197.931 336 197.971 335.36 197.971 334.667Z" fill="black"/>
      <path d="M200.918 332.16C200.975 331.384 201.257 330.641 201.73 330.023C202.203 329.405 202.846 328.938 203.58 328.68C204.314 328.422 205.107 328.383 205.863 328.569C206.618 328.755 207.303 329.157 207.834 329.727C208.364 330.296 208.717 331.008 208.849 331.775C208.981 332.542 208.887 333.33 208.577 334.044C208.268 334.758 207.757 335.366 207.107 335.794C206.457 336.222 205.696 336.451 204.918 336.453C204.367 336.455 203.822 336.343 203.316 336.123C202.811 335.904 202.356 335.583 201.981 335.18C201.605 334.777 201.317 334.301 201.134 333.781C200.951 333.261 200.878 332.709 200.918 332.16ZM207.585 332.16C207.498 331.63 207.262 331.136 206.903 330.736C206.544 330.336 206.079 330.047 205.561 329.903C205.044 329.759 204.496 329.766 203.982 329.924C203.469 330.082 203.011 330.383 202.663 330.793C202.316 331.202 202.093 331.703 202.02 332.235C201.948 332.767 202.03 333.309 202.256 333.796C202.482 334.284 202.842 334.696 203.295 334.985C203.748 335.274 204.274 335.427 204.811 335.427C205.22 335.42 205.622 335.328 205.992 335.156C206.363 334.984 206.693 334.736 206.961 334.427C207.229 334.119 207.429 333.758 207.548 333.367C207.667 332.977 207.702 332.565 207.651 332.16H207.585Z" fill="black"/>
      <path d="M194.824 355.507V350.44L193.251 352.133V350.667L195.331 348.707H196.118C196.118 349.147 196.118 349.667 196.118 350.36V355.453C196.118 356.093 196.118 356.787 196.118 357.107H194.784C194.784 356.813 194.824 356.147 194.824 355.507Z" fill="black"/>
      <path d="M199.224 355.507V350.44L197.678 352.133V350.667L199.744 348.707H200.531C200.531 349.147 200.464 349.667 200.464 350.36V355.453C200.464 356.093 200.464 356.787 200.531 357.107H199.198C199.184 356.813 199.224 356.147 199.224 355.507Z" fill="black"/>
      <path d="M201.904 356L202.838 355.147C203.023 355.487 203.297 355.77 203.63 355.968C203.963 356.165 204.344 356.268 204.731 356.267C204.971 356.272 205.21 356.229 205.433 356.139C205.655 356.048 205.857 355.914 206.026 355.742C206.194 355.571 206.326 355.367 206.413 355.143C206.5 354.919 206.54 354.68 206.531 354.44C206.54 354.203 206.501 353.967 206.414 353.747C206.327 353.527 206.196 353.327 206.028 353.16C205.86 352.993 205.659 352.863 205.438 352.778C205.217 352.693 204.981 352.655 204.744 352.667C204.02 352.704 203.328 352.975 202.771 353.44V348.8H205.358C205.944 348.8 206.491 348.8 207.064 348.733V349.893C206.491 349.893 205.944 349.893 205.358 349.893H203.944V351.867C204.373 351.716 204.831 351.67 205.28 351.732C205.73 351.794 206.158 351.962 206.53 352.223C206.902 352.483 207.206 352.829 207.417 353.231C207.628 353.633 207.74 354.079 207.744 354.533C207.75 354.916 207.678 355.297 207.531 355.651C207.385 356.005 207.168 356.325 206.893 356.592C206.618 356.86 206.292 357.068 205.934 357.204C205.576 357.341 205.194 357.403 204.811 357.387C204.25 357.414 203.69 357.301 203.183 357.059C202.676 356.817 202.236 356.453 201.904 356Z" fill="black"/>
    </svg>
  )
}

// ── Вкладка: Цепи / Колье ─────────────────────────────────────────────────────
function ChainTab({ productType }) {
  return (
    <div className="space-y-4 px-4 py-4">
      <p className="text-sm text-stone-500 dark:text-stone-400">
        Воспользуйтесь схемой ниже, чтобы выбрать подходящую длину{' '}
        {productType === 'Колье' ? 'колье' : 'цепи'}.
        Числа на схеме — длина изделия в сантиметрах.
      </p>

      <div className="overflow-hidden rounded-2xl bg-stone-50 p-4 dark:bg-stone-800">
        <ChainSVG />
      </div>

      <div className="space-y-2 text-sm">
        {[
          { len: '40–42 см', name: 'Чокер',     desc: 'облегает шею, носится высоко' },
          { len: '45 см',   name: 'Принцесс',   desc: 'классическая длина, у ключиц' },
          { len: '50 см',   name: 'Матинэ',     desc: 'над грудью, универсальная' },
          { len: '55–60 см',name: 'Опера',      desc: 'до верхней части груди' },
          { len: '70–80 см',name: 'Лариат',     desc: 'длинная, можно складывать вдвое' },
          { len: '90+ см',  name: 'Роуп',       desc: 'очень длинная, многослойная' },
        ].map(row => (
          <div key={row.len} className="flex items-baseline gap-3 rounded-xl bg-stone-50 px-3 py-2 dark:bg-stone-800">
            <span className="w-20 shrink-0 text-xs font-semibold text-gold-600 dark:text-gold-400">{row.len}</span>
            <span className="font-medium text-stone-700 dark:text-stone-200">{row.name}</span>
            <span className="text-stone-400 text-xs">{row.desc}</span>
          </div>
        ))}
      </div>

      <div className="rounded-2xl bg-amber-50 px-4 py-3 text-xs text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
        💡 Учитывайте застёжку при выборе длины — она добавляет 1–2 см к общей длине изделия.
      </div>
    </div>
  )
}

// ── Главный компонент ──────────────────────────────────────────────────────────
const RING_TABS = [
  { id: 'screen', label: '📱 По экрану' },
  { id: 'manual', label: '📐 По нитке/кольцу' },
  { id: 'table',  label: '📋 Таблица' },
]

const GUIDE_META = {
  'Кольцо':  { title: 'Узнать размер кольца',    subtitle: 'Выберите удобный способ' },
  'Браслет': { title: 'Подобрать размер браслета', subtitle: 'Введите обхват запястья' },
  'Цепь':    { title: 'Длины цепей',              subtitle: 'Схема длин и названия' },
  'Колье':   { title: 'Длины колье',              subtitle: 'Схема длин и названия' },
}

export function RingSizeGuide({ onClose, productType = 'Кольцо' }) {
  const [tab, setTab] = useState('screen')

  const meta     = GUIDE_META[productType] ?? { title: 'Гид по размерам', subtitle: '' }
  const isRing   = productType === 'Кольцо'
  const isBrace  = productType === 'Браслет'
  const isChain  = productType === 'Цепь' || productType === 'Колье'

  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center animate-fade-in sm:items-center"
      onClick={onClose}
    >
      {/* Фон */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Панель */}
      <div
        className="relative z-10 flex w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white dark:bg-stone-950 sm:rounded-3xl"
        style={{ maxHeight: '90dvh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Шапка */}
        <div className="flex shrink-0 items-center justify-between border-b border-stone-100 px-4 py-4 dark:border-stone-800">
          <div>
            <h2 className="text-base font-semibold text-stone-800 dark:text-stone-100">
              {meta.title}
            </h2>
            <p className="text-xs text-stone-400">{meta.subtitle}</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-stone-100 dark:hover:bg-stone-800"
          >
            <X size={18} />
          </button>
        </div>

        {/* Вкладки (только для колец) */}
        {isRing && (
          <div className="shrink-0 border-b border-stone-100 dark:border-stone-800">
            <div className="flex overflow-x-auto px-4">
              {RING_TABS.map(t => (
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
        )}

        {/* Контент */}
        <div className="flex-1 overflow-y-auto">
          {isRing  && tab === 'screen' && <ScreenTab />}
          {isRing  && tab === 'manual' && <ManualTab />}
          {isRing  && tab === 'table'  && <TableTab />}
          {isBrace && <BraceletTab />}
          {isChain && <ChainTab productType={productType} />}
        </div>
      </div>
    </div>
  )
}
