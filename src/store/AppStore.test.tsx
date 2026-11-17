import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import type { CartLine, Order } from '../types'
import { AppStoreProvider, cartCount, selectMenu, useStore } from './AppStore'

const wrapper = ({ children }: { children: ReactNode }) => <AppStoreProvider>{children}</AppStoreProvider>
const setup = () => renderHook(() => useStore(), { wrapper })

const line = (id: string, restaurantId = 'r1', quantity = 1): CartLine => ({
  id, itemId: 'm1', restaurantId, name: 'Octopus Curry', emoji: '🐙', quantity,
  selections: {}, selectionLabels: [], instructions: '', unitPrice: 245,
})

const order = (id: string, restaurantId = 'r1'): Order => ({
  id, restaurantId, restaurantName: 'Kaz Kreol', restaurantEmoji: '🐙', customerName: 'You', address: 'Test',
  lines: [line('x')], fees: { subtotal: 245, deliveryFee: 0, serviceFee: 12.25, smallOrderFee: 0, priorityFee: 0, tax: 38.59, tip: 0, discount: 0, total: 295.84 },
  status: 'placed', placedAt: Date.now(), acceptDeadline: Date.now() + 90_000, prepMinutes: 12,
  dropoff: 'door', instructions: '', speed: 'standard', mode: 'delivery', timeline: { placed: Date.now() },
})

describe('AppStore', () => {
  it('throws a clear error outside the provider', () => {
    expect(() => renderHook(() => useStore())).toThrow(/AppStoreProvider/)
  })

  describe('cart', () => {
    it('adds lines and counts quantities', () => {
      const { result } = setup()
      act(() => result.current.dispatch({ type: 'cart/add', line: line('a', 'r1', 2) }))
      act(() => result.current.dispatch({ type: 'cart/add', line: line('b', 'r1', 1) }))
      expect(result.current.state.cart.restaurantId).toBe('r1')
      expect(cartCount(result.current.state)).toBe(3)
    })

    it('starts a fresh cart when adding from a different store', () => {
      const { result } = setup()
      act(() => result.current.dispatch({ type: 'cart/add', line: line('a', 'r1') }))
      act(() => result.current.dispatch({ type: 'cart/add', line: line('b', 'r2') }))
      expect(result.current.state.cart.restaurantId).toBe('r2')
      expect(result.current.state.cart.lines.map((l) => l.id)).toEqual(['b'])
    })

    it('removes a line when its quantity reaches 0 and clears the store', () => {
      const { result } = setup()
      act(() => result.current.dispatch({ type: 'cart/add', line: line('a') }))
      act(() => result.current.dispatch({ type: 'cart/qty', lineId: 'a', delta: -1 }))
      expect(result.current.state.cart.lines).toHaveLength(0)
      expect(result.current.state.cart.restaurantId).toBeUndefined()
    })
  })

  describe('order lifecycle', () => {
    it('placing an order empties and closes the cart', () => {
      const { result } = setup()
      act(() => result.current.dispatch({ type: 'cart/add', line: line('a') }))
      act(() => result.current.dispatch({ type: 'cart/open', open: true }))
      act(() => result.current.dispatch({ type: 'order/place', order: order('EAT-0001') }))
      expect(result.current.state.orders[0].id).toBe('EAT-0001')
      expect(result.current.state.cart.lines).toHaveLength(0)
      expect(result.current.state.cartOpen).toBe(false)
    })

    it('advances through the status flow and stops at delivered', () => {
      const { result } = setup()
      act(() => result.current.dispatch({ type: 'order/inject', order: order('EAT-0002') }))
      const seen: string[] = []
      for (let i = 0; i < 8; i++) {
        act(() => result.current.dispatch({ type: 'order/advance', id: 'EAT-0002' }))
        seen.push(result.current.state.orders.find((o) => o.id === 'EAT-0002')!.status)
      }
      expect(seen.slice(0, 5)).toEqual(['preparing', 'ready', 'courier_at_store', 'on_the_way', 'delivered'])
      expect(seen.at(-1)).toBe('delivered')
    })

    it('assigns a courier once a delivery order is ready', () => {
      const { result } = setup()
      act(() => result.current.dispatch({ type: 'order/inject', order: order('EAT-0003') }))
      act(() => result.current.dispatch({ type: 'order/status', id: 'EAT-0003', status: 'ready' }))
      const o = result.current.state.orders.find((x) => x.id === 'EAT-0003')!
      expect(o.courierId).toBeTruthy()
      expect(o.timeline.ready).toBeTypeOf('number')
    })

    it('courier completion records the payout and delivers the order', () => {
      const { result } = setup()
      const before = result.current.state.courier
      act(() => result.current.dispatch({ type: 'order/inject', order: order('EAT-0004') }))
      act(() => result.current.dispatch({ type: 'courier/accept', orderId: 'EAT-0004' }))
      expect(result.current.state.courier.activeOrderId).toBe('EAT-0004')
      act(() => result.current.dispatch({ type: 'courier/complete', orderId: 'EAT-0004', payout: 55 }))
      expect(result.current.state.courier.activeOrderId).toBeUndefined()
      expect(result.current.state.courier.earningsToday).toBe(before.earningsToday + 55)
      expect(result.current.state.courier.tripsToday).toBe(before.tripsToday + 1)
      expect(result.current.state.orders.find((o) => o.id === 'EAT-0004')!.status).toBe('delivered')
    })
  })

  describe('merchant and admin', () => {
    it('deleting a modifier group removes it from every menu item', () => {
      const { result } = setup()
      act(() => result.current.dispatch({ type: 'modgroup/delete', id: 'g-portion' }))
      const items = selectMenu(result.current.state, 'r1')
      expect(items.some((m) => m.modifierGroupIds.includes('g-portion'))).toBe(false)
    })

    it('approving an application adds the restaurant exactly once', () => {
      const { result } = setup()
      const count = result.current.state.restaurants.length
      act(() => result.current.dispatch({ type: 'application/decide', id: 'app1', status: 'approved' }))
      act(() => result.current.dispatch({ type: 'application/decide', id: 'app1', status: 'approved' }))
      expect(result.current.state.restaurants).toHaveLength(count + 1)
      expect(result.current.state.restaurants.at(-1)!.name).toBe('Chez Batista')
    })

    it('rejecting an application does not add a restaurant', () => {
      const { result } = setup()
      const count = result.current.state.restaurants.length
      act(() => result.current.dispatch({ type: 'application/decide', id: 'app2', status: 'rejected' }))
      expect(result.current.state.restaurants).toHaveLength(count)
    })
  })
})
