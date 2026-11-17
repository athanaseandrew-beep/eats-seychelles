import type { FeeConfig, Order, PaymentMethod, Restaurant, Subscription, SubscriptionPayment } from '../types'
import { shortDate, uid } from './format'

// ─────────────────────────────────────────────────────────────
// Partner billing rules
//  • Every restaurant pays a monthly listing fee (FeeConfig.subscriptionFee, SCR 200).
//  • On every delivered trip the platform takes a flat commission
//    (FeeConfig.perTripCommission, SCR 15) out of the restaurant payout,
//    on top of the tier percentage commission on food sales.
// Move these to the server when a backend exists — the client copy is for display.
// ─────────────────────────────────────────────────────────────

export const BILLING_PERIOD_DAYS = 30
export const DUE_SOON_DAYS = 5
const DAY = 86_400_000

export const PAYMENT_METHODS: { key: PaymentMethod; label: string; hint: string }[] = [
  { key: 'card', label: 'Debit / credit card', hint: 'Visa or Mastercard through the bank’s secure payment page' },
  { key: 'mobile_banking', label: 'Mobile banking', hint: 'Approve the payment in your bank’s app' },
  { key: 'bank_transfer', label: 'Bank transfer', hint: 'Transfer with your reference; confirmed within 1 working day' },
]

export type SubscriptionState = 'active' | 'due_soon' | 'overdue' | 'none'

export function subscriptionState(sub: Subscription | undefined, now: number): SubscriptionState {
  if (!sub) return 'none'
  if (sub.paidUntil < now) return 'overdue'
  if (sub.paidUntil - now <= DUE_SOON_DAYS * DAY) return 'due_soon'
  return 'active'
}

/** Whole days until the paid period ends (negative when overdue). */
export const daysLeft = (sub: Subscription, now: number) => Math.ceil((sub.paidUntil - now) / DAY)

/** A payment covering one billing period that starts at `start`. */
export function createPayment(amount: number, method: PaymentMethod, start: number, now = Date.now()): SubscriptionPayment {
  return {
    id: uid('pay-'),
    amount,
    method,
    at: now,
    reference: `SUB-${uid().toUpperCase().slice(0, 6)}`,
    period: `${shortDate(start)} – ${shortDate(start + BILLING_PERIOD_DAYS * DAY)}`,
  }
}

/** When the next paid period would start: today if lapsed, otherwise when the current one ends. */
export const nextPeriodStart = (sub: Subscription | undefined, now: number) => Math.max(now, sub?.paidUntil ?? now)

/** Extends the listing by one billing period. */
export function applyPayment(sub: Subscription | undefined, payment: SubscriptionPayment, now: number): Subscription {
  const start = nextPeriodStart(sub, now)
  return {
    monthlyFee: payment.amount,
    paidUntil: start + BILLING_PERIOD_DAYS * DAY,
    payments: [payment, ...(sub?.payments ?? [])],
  }
}

/** Starts a plan when a store goes live, using the fee paid at registration. */
export function startSubscription(firstPayment: SubscriptionPayment, now: number): Subscription {
  return { monthlyFee: firstPayment.amount, paidUntil: now + BILLING_PERIOD_DAYS * DAY, payments: [firstPayment] }
}

// ── Per-order and per-store settlement ───────────────────────

export interface Settlement {
  /** Food sales (order subtotals) */
  sales: number
  /** Tier percentage commission on sales */
  percentCommission: number
  /** Flat commission × delivered trips */
  tripCommission: number
  /** What the restaurant receives */
  payout: number
}

/** Settlement for one order. Trip commission applies to delivered delivery orders only (pickup has no trip). */
export function orderSettlement(order: Pick<Order, 'fees' | 'mode' | 'status'>, commissionPct: number, config: Pick<FeeConfig, 'perTripCommission'>): Settlement {
  const sales = order.fees.subtotal
  const percentCommission = sales * (commissionPct / 100)
  const tripCommission = order.status === 'delivered' && order.mode === 'delivery' ? config.perTripCommission : 0
  return { sales, percentCommission, tripCommission, payout: Math.max(0, sales - percentCommission - tripCommission) }
}

export interface StoreStatement extends Settlement { delivered: number; trips: number }

/** Totals for a store's delivered orders. */
export function storeStatement(orders: Order[], r: Pick<Restaurant, 'id' | 'tier'>, config: FeeConfig): StoreStatement {
  const done = orders.filter((o) => o.restaurantId === r.id && o.status === 'delivered')
  const pct = config.commission[r.tier]
  const t = done.reduce<Settlement>((acc, o) => {
    const s = orderSettlement(o, pct, config)
    return { sales: acc.sales + s.sales, percentCommission: acc.percentCommission + s.percentCommission, tripCommission: acc.tripCommission + s.tripCommission, payout: acc.payout + s.payout }
  }, { sales: 0, percentCommission: 0, tripCommission: 0, payout: 0 })
  return { ...t, delivered: done.length, trips: done.filter((o) => o.mode === 'delivery').length }
}

export interface PlatformRevenue {
  /** Monthly recurring revenue from stores with a paid-up listing */
  mrr: number
  activeSubscriptions: number
  overdueSubscriptions: number
  /** Listing fees received (all recorded payments) */
  subscriptionCollected: number
  trips: number
  tripCommission: number
  percentCommission: number
}

/** What the platform owner earns: listing fees + per-trip commission + tier percentage. */
export function platformRevenue(restaurants: Restaurant[], orders: Order[], config: FeeConfig, now: number): PlatformRevenue {
  let mrr = 0, active = 0, overdue = 0, collected = 0, trips = 0, tripCommission = 0, percentCommission = 0
  for (const r of restaurants) {
    const st = subscriptionState(r.subscription, now)
    if (st === 'active' || st === 'due_soon') { active++; mrr += r.subscription!.monthlyFee }
    if (st === 'overdue') overdue++
    collected += r.subscription?.payments.reduce((s, p) => s + p.amount, 0) ?? 0
    const s = storeStatement(orders, r, config)
    trips += s.trips; tripCommission += s.tripCommission; percentCommission += s.percentCommission
  }
  return { mrr, activeSubscriptions: active, overdueSubscriptions: overdue, subscriptionCollected: collected, trips, tripCommission, percentCommission }
}
