import { MARKET } from '../config/market'

/** Currency / locale come from the market config (Seychelles). */
export const CURRENCY = MARKET.currency
export const LOCALE = MARKET.locale

export const money = (n: number) =>
  `${CURRENCY} ${n.toLocaleString(LOCALE, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export const moneyShort = (n: number) =>
  `${CURRENCY} ${n.toLocaleString(LOCALE, { maximumFractionDigits: n >= 1000 ? 0 : 2 })}`

export const clockTime = (ts: number) =>
  new Date(ts).toLocaleTimeString(LOCALE, { hour: 'numeric', minute: '2-digit' })

export const mmss = (ms: number) => {
  const s = Math.max(0, Math.ceil(ms / 1000))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

export const timeAgo = (ts: number) => {
  const m = Math.round((Date.now() - ts) / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.round(m / 60)
  return h < 24 ? `${h}h ago` : `${Math.round(h / 24)}d ago`
}

/** Resolves a public/ asset path ("images/x.jpg") against the deploy base; data:/http(s) URLs pass through. */
export const assetUrl = (p: string) => (/^(data:|https?:|blob:)/.test(p) ? p : `${import.meta.env.BASE_URL}${p.replace(/^\//, '')}`)

export const shortDate = (ts: number) => new Date(ts).toLocaleDateString(LOCALE, { day: 'numeric', month: 'short', year: 'numeric' })

export const cn =(...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ')

export const uid = (prefix = '') => prefix + Math.random().toString(36).slice(2, 9)

export const orderId = () => `EAT-${Math.floor(4830 + Math.random() * 5000)}`
