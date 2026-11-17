import { describe, expect, it } from 'vitest'
import { DEFAULT_FEE_CONFIG, RESTAURANTS } from '../data/mock'
import type { Order, Restaurant } from '../types'
import { applyPayment, createPayment, daysLeft, orderSettlement, platformRevenue, startSubscription, storeStatement, subscriptionState } from './billing'

const DAY = 86_400_000
const NOW = new Date('2026-11-17T10:00:00Z').getTime()

const order = (id: string, restaurantId: string, subtotal: number, status: Order['status'] = 'delivered', mode: Order['mode'] = 'delivery'): Order => ({
  id, restaurantId, restaurantName: '', restaurantEmoji: '', customerName: '', address: '', lines: [],
  fees: { subtotal, deliveryFee: 0, serviceFee: 0, smallOrderFee: 0, priorityFee: 0, tax: 0, tip: 0, discount: 0, total: subtotal },
  status, placedAt: NOW, acceptDeadline: NOW, prepMinutes: 10, dropoff: 'door', instructions: '', speed: 'standard', mode, timeline: {},
})

describe('default partner plan', () => {
  it('is SCR 200 per month and SCR 15 per trip', () => {
    expect(DEFAULT_FEE_CONFIG.subscriptionFee).toBe(200)
    expect(DEFAULT_FEE_CONFIG.perTripCommission).toBe(15)
  })
})

describe('subscriptionState', () => {
  it('reports none / active / due soon / overdue', () => {
    expect(subscriptionState(undefined, NOW)).toBe('none')
    expect(subscriptionState({ monthlyFee: 200, paidUntil: NOW + 20 * DAY, payments: [] }, NOW)).toBe('active')
    expect(subscriptionState({ monthlyFee: 200, paidUntil: NOW + 3 * DAY, payments: [] }, NOW)).toBe('due_soon')
    expect(subscriptionState({ monthlyFee: 200, paidUntil: NOW - 1, payments: [] }, NOW)).toBe('overdue')
  })
})

describe('applyPayment', () => {
  it('adds 30 days to the end of a plan that is still running', () => {
    const sub = { monthlyFee: 200, paidUntil: NOW + 10 * DAY, payments: [] }
    const next = applyPayment(sub, createPayment(200, 'card', sub.paidUntil, NOW), NOW)
    expect(next.paidUntil).toBe(NOW + 40 * DAY)
    expect(next.payments).toHaveLength(1)
  })

  it('restarts from today when the plan has lapsed (no paying for the gap)', () => {
    const sub = { monthlyFee: 200, paidUntil: NOW - 5 * DAY, payments: [] }
    expect(applyPayment(sub, createPayment(200, 'card', NOW, NOW), NOW).paidUntil).toBe(NOW + 30 * DAY)
  })

  it('starts a new plan for a store with none', () => {
    const next = applyPayment(undefined, createPayment(200, 'bank_transfer', NOW, NOW), NOW)
    expect(daysLeft(next, NOW)).toBe(30)
  })

  it('startSubscription begins 30 days at go-live', () => {
    const p = createPayment(200, 'mobile_banking', NOW, NOW - 2 * DAY)
    expect(startSubscription(p, NOW).paidUntil).toBe(NOW + 30 * DAY)
  })
})

describe('orderSettlement', () => {
  it('deducts the tier % and SCR 15 from a delivered delivery order', () => {
    const s = orderSettlement(order('o1', 'r1', 400), 30, DEFAULT_FEE_CONFIG)
    expect(s.percentCommission).toBe(120)
    expect(s.tripCommission).toBe(15)
    expect(s.payout).toBe(265)
  })

  it('charges no trip fee on pickup orders or undelivered orders', () => {
    expect(orderSettlement(order('o2', 'r1', 400, 'delivered', 'pickup'), 30, DEFAULT_FEE_CONFIG).tripCommission).toBe(0)
    expect(orderSettlement(order('o3', 'r1', 400, 'preparing'), 30, DEFAULT_FEE_CONFIG).tripCommission).toBe(0)
  })
})

describe('storeStatement / platformRevenue', () => {
  const orders = [
    order('a', 'r1', 400), order('b', 'r1', 200), order('c', 'r1', 300, 'delivered', 'pickup'),
    order('d', 'r1', 999, 'cancelled'), order('e', 'r3', 100),
  ]

  it('sums a store’s delivered orders', () => {
    const r1 = RESTAURANTS.find((r) => r.id === 'r1')! // premium, 20%
    const s = storeStatement(orders, r1, DEFAULT_FEE_CONFIG)
    expect(s.delivered).toBe(3)
    expect(s.trips).toBe(2)
    expect(s.tripCommission).toBe(30)
    expect(s.sales).toBe(900)
    expect(s.percentCommission).toBeCloseTo(180)
  })

  it('counts paid-up listings, overdue stores and trip commission', () => {
    const stores: Restaurant[] = [
      { ...RESTAURANTS[0], id: 'r1', subscription: { monthlyFee: 200, paidUntil: NOW + 10 * DAY, payments: [createPayment(200, 'card', NOW, NOW)] } },
      { ...RESTAURANTS[2], id: 'r3', subscription: { monthlyFee: 200, paidUntil: NOW - DAY, payments: [] } },
    ]
    const rev = platformRevenue(stores, orders, DEFAULT_FEE_CONFIG, NOW)
    expect(rev.mrr).toBe(200)
    expect(rev.activeSubscriptions).toBe(1)
    expect(rev.overdueSubscriptions).toBe(1)
    expect(rev.subscriptionCollected).toBe(200)
    expect(rev.trips).toBe(3)
    expect(rev.tripCommission).toBe(45)
  })
})
