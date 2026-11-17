import { describe, expect, it } from 'vitest'
import { DEFAULT_FEE_CONFIG, MENU_ITEMS, MODIFIER_GROUPS, RESTAURANTS } from '../data/mock'
import type { CartLine } from '../types'
import { cartSubtotal, computeFees, unitPrice, validatePromo } from './pricing'

const line = (unitPrice: number, quantity = 1): CartLine => ({
  id: `l-${unitPrice}-${quantity}`, itemId: 'm1', restaurantId: 'r1', name: 'Test', emoji: '🍽️',
  quantity, selections: {}, selectionLabels: [], instructions: '', unitPrice,
})

const kazKreol = RESTAURANTS.find((r) => r.id === 'r1')! // free delivery
const lagoon = RESTAURANTS.find((r) => r.id === 'r2')! // SCR 30 delivery

const base = { config: DEFAULT_FEE_CONFIG, mode: 'delivery' as const, speed: 'standard' as const, tip: 0 }

describe('unitPrice', () => {
  const curry = MENU_ITEMS.find((m) => m.id === 'm1')!
  const groups = MODIFIER_GROUPS.filter((g) => curry.modifierGroupIds.includes(g.id))

  it('returns the base price with no selections', () => {
    expect(unitPrice(curry, groups, {})).toBe(245)
  })

  it('adds the price of each selected option', () => {
    // Large (+60), Extra rice (+25), Lentils (+30)
    expect(unitPrice(curry, groups, { 'g-portion': ['o-large-p'], 'g-kreol-sides': ['o-rice', 'o-lentils'] })).toBe(360)
  })

  it('ignores unknown option ids', () => {
    expect(unitPrice(curry, groups, { 'g-portion': ['nope'] })).toBe(245)
  })
})

describe('cartSubtotal', () => {
  it('sums unit price × quantity', () => {
    expect(cartSubtotal([line(100, 2), line(45, 3)])).toBe(335)
  })
  it('is 0 for an empty cart', () => {
    expect(cartSubtotal([])).toBe(0)
  })
})

describe('validatePromo', () => {
  it('accepts a valid code case-insensitively', () => {
    const r = validatePromo('  eats20 ', 300)
    expect(r.ok).toBe(true)
    expect(r.code).toBe('EATS20')
  })

  it('rejects an unknown code', () => {
    expect(validatePromo('BOGUS', 500).ok).toBe(false)
  })

  it('rejects a code below its minimum and says how much more is needed', () => {
    const r = validatePromo('WELCOME50', 200)
    expect(r.ok).toBe(false)
    expect(r.message).toContain('50.00')
  })
})

describe('computeFees', () => {
  it('charges nothing for an empty cart', () => {
    const f = computeFees({ ...base, lines: [], restaurant: kazKreol })
    expect(f.subtotal).toBe(0)
    expect(f.serviceFee).toBe(0)
    expect(f.smallOrderFee).toBe(0)
    expect(f.total).toBe(0)
  })

  it('clamps the service fee between min and max', () => {
    expect(computeFees({ ...base, lines: [line(100)], restaurant: kazKreol }).serviceFee).toBe(10) // 5% = 5 → min 10
    expect(computeFees({ ...base, lines: [line(400)], restaurant: kazKreol }).serviceFee).toBe(20) // 5% = 20
    expect(computeFees({ ...base, lines: [line(2000)], restaurant: kazKreol }).serviceFee).toBe(60) // 5% = 100 → max 60
  })

  it('adds a small-order fee under the threshold, for delivery only', () => {
    expect(computeFees({ ...base, lines: [line(100)], restaurant: kazKreol }).smallOrderFee).toBe(25)
    expect(computeFees({ ...base, lines: [line(150)], restaurant: kazKreol }).smallOrderFee).toBe(0)
    expect(computeFees({ ...base, mode: 'pickup', lines: [line(100)], restaurant: kazKreol }).smallOrderFee).toBe(0)
  })

  it('drops delivery fee, priority fee and tip for pickup', () => {
    const f = computeFees({ ...base, mode: 'pickup', speed: 'priority', tip: 40, lines: [line(300)], restaurant: lagoon })
    expect(f.deliveryFee).toBe(0)
    expect(f.priorityFee).toBe(0)
    expect(f.tip).toBe(0)
  })

  it('applies 15% VAT on the taxable amount and adds the tip after tax', () => {
    const f = computeFees({ ...base, tip: 25, lines: [line(400)], restaurant: lagoon })
    // subtotal 400 + delivery 30 + service 20 = 450 taxable
    expect(f.tax).toBeCloseTo(67.5)
    expect(f.total).toBeCloseTo(450 + 67.5 + 25)
  })

  it('applies the delivery-fee multiplier from the fee config', () => {
    const f = computeFees({ ...base, config: { ...DEFAULT_FEE_CONFIG, deliveryFeeMultiplier: 2 }, lines: [line(300)], restaurant: lagoon })
    expect(f.deliveryFee).toBe(60)
  })

  it('applies EATS20 as 20% capped at SCR 100', () => {
    expect(computeFees({ ...base, promoCode: 'EATS20', lines: [line(300)], restaurant: kazKreol }).discount).toBe(60)
    expect(computeFees({ ...base, promoCode: 'EATS20', lines: [line(1000)], restaurant: kazKreol }).discount).toBe(100)
  })

  it('FREEDEL refunds the delivery fee only above its minimum', () => {
    expect(computeFees({ ...base, promoCode: 'FREEDEL', lines: [line(250)], restaurant: lagoon }).discount).toBe(30)
    expect(computeFees({ ...base, promoCode: 'FREEDEL', lines: [line(150)], restaurant: lagoon }).discount).toBe(0)
  })

  it('never lets the taxable amount go negative', () => {
    const f = computeFees({ ...base, config: { ...DEFAULT_FEE_CONFIG, serviceFeeMin: 0, smallOrderFee: 0 }, promoCode: 'WELCOME50', lines: [line(250)], restaurant: kazKreol })
    expect(f.total).toBeGreaterThanOrEqual(0)
  })
})
