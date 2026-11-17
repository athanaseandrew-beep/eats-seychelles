import { afterEach, describe, expect, it, vi } from 'vitest'
import { cn, mmss, money, orderId, timeAgo, uid } from './format'

describe('money', () => {
  it('formats in Seychelles Rupee with two decimals', () => {
    expect(money(245)).toBe('SCR 245.00')
    expect(money(1234.5)).toMatch(/^SCR 1[,\s]?234\.50$/)
  })
})

describe('mmss', () => {
  it('formats milliseconds as m:ss, rounding up', () => {
    expect(mmss(90_000)).toBe('1:30')
    expect(mmss(1)).toBe('0:01')
  })
  it('never goes below 0:00', () => {
    expect(mmss(-5000)).toBe('0:00')
  })
})

describe('timeAgo', () => {
  afterEach(() => { vi.useRealTimers() })

  it('describes elapsed time', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T12:00:00Z'))
    const now = Date.now()
    expect(timeAgo(now - 10_000)).toBe('just now')
    expect(timeAgo(now - 5 * 60_000)).toBe('5m ago')
    expect(timeAgo(now - 3 * 3600_000)).toBe('3h ago')
    expect(timeAgo(now - 2 * 86_400_000)).toBe('2d ago')
  })
})

describe('cn', () => {
  it('joins truthy class names', () => {
    expect(cn('a', false, null, undefined, 'b')).toBe('a b')
  })
})

describe('ids', () => {
  it('uid uses the prefix', () => {
    expect(uid('msg')).toMatch(/^msg[a-z0-9]+$/)
  })
  it('orderId looks like EAT-####', () => {
    expect(orderId()).toMatch(/^EAT-\d{4}$/)
  })
})
