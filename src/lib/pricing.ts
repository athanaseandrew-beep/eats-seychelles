import { CURRENCY } from './format'
import type { CartLine, DeliverySpeed, FeeBreakdown, FeeConfig, FulfillmentMode, MenuItem, ModifierGroup, Restaurant } from '../types'

export interface PromoResult { code: string; label: string; ok: boolean; message: string }

export const PROMO_CODES: Record<string, { label: string; minSubtotal: number; apply: (subtotal: number, deliveryFee: number) => number }> = {
  EATS20: { label: '20% off (max SCR 100)', minSubtotal: 0, apply: (s) => Math.min(100, s * 0.2) },
  FREEDEL: { label: 'Free delivery', minSubtotal: 200, apply: (_s, d) => d },
  WELCOME50: { label: 'SCR 50 off', minSubtotal: 250, apply: () => 50 },
}

export function validatePromo(code: string, subtotal: number): PromoResult {
  const key = code.trim().toUpperCase()
  const promo = PROMO_CODES[key]
  if (!promo) return { code: key, label: '', ok: false, message: 'That code isn’t valid.' }
  if (subtotal < promo.minSubtotal) return { code: key, label: promo.label, ok: false, message: `Add ${CURRENCY} ${(promo.minSubtotal - subtotal).toFixed(2)} more to use this code.` }
  return { code: key, label: promo.label, ok: true, message: `${promo.label} applied` }
}

/** Price of one unit of an item with the given modifier selections. */
export function unitPrice(item: MenuItem, groups: ModifierGroup[], selections: Record<string, string[]>) {
  let p = item.price
  for (const g of groups) {
    for (const optId of selections[g.id] ?? []) {
      p += g.options.find((o) => o.id === optId)?.price ?? 0
    }
  }
  return p
}

export const cartSubtotal = (lines: CartLine[]) => lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0)

export function computeFees(opts: {
  lines: CartLine[]
  restaurant?: Restaurant
  config: FeeConfig
  mode: FulfillmentMode
  speed: DeliverySpeed
  tip: number
  promoCode?: string
}): FeeBreakdown {
  const { lines, restaurant, config, mode, speed, tip, promoCode } = opts
  const subtotal = cartSubtotal(lines)
  const delivery = mode === 'delivery'
  const deliveryFee = delivery ? (restaurant?.deliveryFee ?? 0) * config.deliveryFeeMultiplier : 0
  const serviceFee = subtotal === 0 ? 0 : Math.min(config.serviceFeeMax, Math.max(config.serviceFeeMin, subtotal * (config.serviceFeePct / 100)))
  const smallOrderFee = delivery && subtotal > 0 && subtotal < config.smallOrderThreshold ? config.smallOrderFee : 0
  const priorityFee = delivery && speed === 'priority' ? config.priorityFee : 0
  let discount = 0
  if (promoCode) {
    const promo = PROMO_CODES[promoCode]
    if (promo && subtotal >= promo.minSubtotal) discount = promo.apply(subtotal, deliveryFee)
  }
  const taxable = Math.max(0, subtotal + deliveryFee + serviceFee + smallOrderFee + priorityFee - discount)
  const tax = taxable * (config.taxPct / 100)
  const t = delivery ? tip : 0
  return { subtotal, deliveryFee, serviceFee, smallOrderFee, priorityFee, tax, tip: t, discount, total: taxable + tax + t }
}
