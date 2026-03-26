import { useEffect, useRef, useState, useMemo } from 'react'
import { X, Send } from 'lucide-react'
import { calcVariantPrice, getVariantWeight, formatPrice, formatWeight, cn } from '@/lib/utils'
import { CONTACTS, MESSAGE_TEMPLATE } from '@/config/pricing'

// ── Иконки мессенджеров ────────────────────────────────────────────────────────
function TelegramIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
    </svg>
  )
}

function VKIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.391 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.864-.525-2.05-1.727-1.033-1-1.49-1.135-1.744-1.135-.356 0-.458.102-.458.593v1.575c0 .424-.135.678-1.253.678-1.846 0-3.896-1.118-5.335-3.202C4.624 10.857 4.03 8.57 4.03 8.096c0-.254.102-.491.593-.491h1.744c.44 0 .61.203.78.677.864 2.49 2.303 4.675 2.896 4.675.22 0 .322-.102.322-.66V9.721c-.068-1.186-.695-1.287-.695-1.71 0-.203.17-.407.44-.407h2.744c.373 0 .508.203.508.643v3.473c0 .372.17.508.271.508.22 0 .407-.136.813-.542 1.253-1.406 2.151-3.574 2.151-3.574.119-.254.322-.491.763-.491h1.744c.525 0 .644.27.525.643-.22 1.017-2.354 4.031-2.354 4.031-.186.305-.254.44 0 .78.186.254.796.779 1.203 1.253.745.847 1.32 1.558 1.473 2.05.17.474-.085.712-.576.712z"/>
    </svg>
  )
}

function MaxIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 812 720" fill="currentColor">
      <path d="M350.4,9.6C141.8,20.5,4.1,184.1,12.8,390.4c3.8,90.3,40.1,168,48.7,253.7,2.2,22.2-4.2,49.6,21.4,59.3,31.5,11.9,79.8-8.1,106.2-26.4,9-6.1,17.6-13.2,24.2-22,27.3,18.1,53.2,35.6,85.7,43.4,143.1,34.3,299.9-44.2,369.6-170.3C799.6,291.2,622.5-4.6,350.4,9.6h0ZM269.4,504c-11.3,8.8-22.2,20.8-34.7,27.7-18.1,9.7-23.7-.4-30.5-16.4-21.4-50.9-24-137.6-11.5-190.9,16.8-72.5,72.9-136.3,150-143.1,78-6.9,150.4,32.7,183.1,104.2,72.4,159.1-112.9,316.2-256.4,218.6h0Z"/>
    </svg>
  )
}

const CONTACT_ICONS = { telegram: TelegramIcon, vk: VKIcon, max: MaxIcon }

// ── Чип варианта ──────────────────────────────────────────────────────────────
function VariantChip({ label, source, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-lg border px-3 py-1.5 text-sm font-medium transition-all',
        selected
          // синий = выбран
          ? 'border-blue-400 bg-blue-50 text-blue-700 dark:border-blue-500 dark:bg-blue-950/30 dark:text-blue-400'
          : source === 'in_stock'
            // зелёный = в наличии
            ? 'border-emerald-200 bg-emerald-50/50 text-emerald-700 hover:border-emerald-300 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400'
            // оранжевый = под заказ
            : 'border-amber-200 bg-amber-50/50 text-amber-700 hover:border-amber-300 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400'
      )}
      title={source === 'in_stock' ? 'В наличии' : 'Под заказ'}
    >
      {label}
    </button>
  )
}

// ── Основной компонент ─────────────────────────────────────────────────────────
export function ProductModal({ product, onClose }) {
  const overlayRef = useRef(null)
  const [selectedVariantKey, setSelectedVariantKey] = useState(null) // "source:index"
  const [copied, setCopied]                         = useState(false)

  // ── Строим плоский список вариантов ──────────────────────────────────────────
  const variants = useMemo(() => {
    if (!product) return []

    const stockItems = (product.sizes_in_stock || []).map((entry, i) => ({
      key:    `in_stock:${i}`,
      source: 'in_stock',
      index:  i,
      size:   entry.size,
      price:  entry.price,
      weight: entry.weight,
    }))

    const orderItems = (product.sizes_on_order || []).map((entry, i) => ({
      key:    `order:${i}`,
      source: 'order',
      index:  i,
      size:   entry.size,
      price:  entry.price,
      weight: entry.weight,
    }))

    // Сортируем: in_stock вперёд, потом по размеру
    const all = [...stockItems, ...orderItems].sort((a, b) => {
      if (a.source !== b.source) return a.source === 'in_stock' ? -1 : 1
      const na = parseFloat(a.size), nb = parseFloat(b.size)
      if (!isNaN(na) && !isNaN(nb)) return na - nb
      return 0
    })

    // Нумеруем варианты без размера (size === null)
    let noSizeN = 0
    return all.map(v => ({
      ...v,
      label: v.size != null ? v.size : `Вариант ${++noSizeN}`,
    }))
  }, [product])

  // Автовыбор первого варианта при открытии товара
  useEffect(() => {
    if (variants.length > 0) {
      setSelectedVariantKey(variants[0].key)
    } else {
      setSelectedVariantKey(null)
    }
  }, [variants])

  // Закрытие по Escape
  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  if (!product) return null

  // Выбранный вариант
  const selectedVariant = variants.find(v => v.key === selectedVariantKey) ?? null

  // Цена и вес выбранного варианта
  const variantArg  = selectedVariant
    ? { source: selectedVariant.source, index: selectedVariant.index }
    : null
  const { price, original, discount } = calcVariantPrice(product, variantArg)
  const weightVal = getVariantWeight(product, variantArg)
  const weight    = formatWeight(weightVal)

  // Показываем «Под заказ» если варианта нет или выбранный — order
  const isOnOrder = !selectedVariant || selectedVariant.source === 'order'

  const hasVariants = variants.length > 0
  const hasMixed    = variants.some(v => v.source === 'in_stock') &&
                      variants.some(v => v.source === 'order')

  const message = MESSAGE_TEMPLATE(product.article)

  function handleCopy() {
    navigator.clipboard.writeText(message).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function buildMessengerUrl(type, url) {
    if (type === 'telegram') return `${url}?text=${encodeURIComponent(message)}`
    return url
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-0 sm:p-4 animate-fade-in"
      onClick={e => { if (e.target === overlayRef.current) onClose() }}
    >
      {/* Оверлей */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Контент */}
      <div className="relative z-10 flex w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl dark:bg-stone-900 max-h-[92dvh] animate-slide-up">

        {/* Шапка */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div>
            <div className="flex items-center gap-2">
              {!isOnOrder
                ? <span className="badge-in-stock">● В наличии</span>
                : <span className="badge-on-order">○ Под заказ</span>
              }
              {discount && <span className="badge-discount">−{discount}%</span>}
            </div>
            <p className="mt-1 text-xs text-stone-400 dark:text-stone-500">арт. {product.article}</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-stone-100 dark:hover:bg-stone-800"
          >
            <X size={18} />
          </button>
        </div>

        {/* Скролл-зона */}
        <div className="overflow-y-auto">
          <div className="flex flex-col gap-5 px-5 pb-6 sm:flex-row">

            {/* Фото */}
            <div className="aspect-square w-full shrink-0 overflow-hidden rounded-2xl bg-stone-100 sm:w-56 dark:bg-stone-800">
              {product.image ? (
                <img
                  src={product.image}
                  alt={`${product.type} ${product.article}`}
                  className="h-full w-full object-cover"
                  onError={e => { e.currentTarget.src = '/images/placeholder.svg' }}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-stone-300 dark:text-stone-600">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="h-16 w-16">
                    <path d="M12 2l3 6h6l-5 4 2 6-6-4-6 4 2-6L3 8h6z" />
                  </svg>
                </div>
              )}
            </div>

            {/* Детали */}
            <div className="flex flex-1 flex-col gap-4">

              {/* Основные характеристики */}
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                <InfoRow label="Тип"    value={product.type} />
                <InfoRow label="Металл" value={product.metal_display} />
                {weight && <InfoRow label="Вес" value={weight} />}
                {product.inserts && product.inserts.trim() && (
                  <InfoRow label="Вставки" value={product.inserts} fullWidth />
                )}
              </dl>

              {/* Цена */}
              <div>
                {price != null ? (
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-stone-900 dark:text-stone-50">
                      {formatPrice(price)}
                    </span>
                    {original && original !== price && (
                      <span className="text-sm text-stone-400 line-through dark:text-stone-500">
                        {formatPrice(original)}
                      </span>
                    )}
                  </div>
                ) : (
                  <p className="text-base text-stone-400 dark:text-stone-500">Цена по запросу</p>
                )}
              </div>

              {/* Скидочный баннер */}
              {isOnOrder && discount && (
                <div className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
                  При заказе автоматически применяется скидка <strong>{discount}%</strong>
                </div>
              )}

              {/* Варианты (чипы) */}
              {hasVariants && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500">
                    {variants[0].size != null ? 'Размеры' : 'Варианты'}
                    {hasMixed && (
                      <span className="ml-2 normal-case font-normal text-stone-400">
                        (зелёный — в наличии, жёлтый — под заказ)
                      </span>
                    )}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {variants.map(v => (
                      <VariantChip
                        key={v.key}
                        label={v.label}
                        source={v.source}
                        selected={v.key === selectedVariantKey}
                        onClick={() => setSelectedVariantKey(v.key)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Блок связи */}
          <div className="border-t border-stone-100 px-5 pb-6 pt-4 dark:border-stone-800">
            <p className="mb-3 text-sm font-medium text-stone-700 dark:text-stone-300">
              Связаться с магазином
            </p>

            {/* Сообщение для копирования */}
            <div className="mb-3 flex items-start gap-2 rounded-xl bg-stone-50 p-3 text-sm text-stone-600 dark:bg-stone-800 dark:text-stone-300">
              <span className="flex-1 select-all">{message}</span>
              <button
                onClick={handleCopy}
                title="Скопировать"
                className="shrink-0 rounded-lg p-1 transition-colors hover:bg-stone-200 dark:hover:bg-stone-700"
              >
                {copied
                  ? <span className="text-xs text-emerald-600 dark:text-emerald-400">✓</span>
                  : <Send size={14} className="text-stone-400" />
                }
              </button>
            </div>

            {/* Кнопки мессенджеров */}
            <div className="flex gap-2">
              {Object.entries(CONTACTS).map(([key, contact]) => {
                const Icon = CONTACT_ICONS[key] ?? Send
                return (
                  <a
                    key={key}
                    href={buildMessengerUrl(key, contact.url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-stone-200 py-2.5 text-sm font-medium text-stone-600 transition-all hover:border-stone-300 hover:bg-stone-50 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
                  >
                    <Icon size={18} />
                    <span className="hidden sm:inline">{contact.label}</span>
                  </a>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ label, value, fullWidth = false }) {
  return (
    <div className={cn('flex flex-col gap-0.5', fullWidth && 'col-span-2')}>
      <dt className="text-xs text-stone-400 dark:text-stone-500">{label}</dt>
      <dd className="text-sm font-medium text-stone-800 dark:text-stone-200">{value}</dd>
    </div>
  )
}
