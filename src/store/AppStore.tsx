import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react'
import {
  COURIERS, DEFAULT_FEE_CONFIG, ME_COURIER, MENU_ITEMS, MODIFIER_GROUPS, RESTAURANTS,
  SAVED_ADDRESSES, SEED_APPLICATIONS, SEED_DISPUTES, SEED_ORDERS,
} from '../data/mock'
import type {
  CartLine, ChatMessage, Courier, Dispute, DisputeStatus, FeeConfig, FulfillmentMode, MenuItem,
  ModifierGroup, OnboardingApplication, Order, OrderStatus, Restaurant, Subscription, SubscriptionPayment,
} from '../types'
import { applyPayment, startSubscription } from '../lib/billing'
import { uid } from '../lib/format'

// ─────────────────────────────────────────────────────────────
// Single client-side store shared by all four roles.
// Swap the reducer actions for API calls / websockets later;
// components only talk to `useStore()` + action helpers.
// ─────────────────────────────────────────────────────────────

export type Address = (typeof SAVED_ADDRESSES)[number]

export interface CourierSession {
  online: boolean
  onlineSince?: number
  activeOrderId?: string
  earningsToday: number
  tripsToday: number
  declinedIds: string[]
}

export interface State {
  restaurants: Restaurant[]
  menuItems: MenuItem[]
  modifierGroups: ModifierGroup[]
  orders: Order[]
  couriers: Courier[]
  feeConfig: FeeConfig
  applications: OnboardingApplication[]
  disputes: Dispute[]
  cart: { restaurantId?: string; lines: CartLine[] }
  mode: FulfillmentMode
  address: Address
  favorites: string[]
  chats: Record<string, ChatMessage[]>
  courier: CourierSession
  cartOpen: boolean
}

const initial: State = {
  restaurants: RESTAURANTS,
  menuItems: MENU_ITEMS,
  modifierGroups: MODIFIER_GROUPS,
  orders: SEED_ORDERS,
  couriers: COURIERS,
  feeConfig: DEFAULT_FEE_CONFIG,
  applications: SEED_APPLICATIONS,
  disputes: SEED_DISPUTES,
  cart: { lines: [] },
  mode: 'delivery',
  address: SAVED_ADDRESSES[0],
  favorites: ['r4'],
  chats: {},
  courier: { online: false, earningsToday: 745, tripsToday: 9, declinedIds: [] },
  cartOpen: false,
}

export const STATUS_FLOW: OrderStatus[] = ['placed', 'preparing', 'ready', 'courier_at_store', 'on_the_way', 'delivered']

type Action =
  // customer
  | { type: 'cart/add'; line: CartLine; replace?: boolean }
  | { type: 'cart/qty'; lineId: string; delta: number }
  | { type: 'cart/remove'; lineId: string }
  | { type: 'cart/clear' }
  | { type: 'cart/open'; open: boolean }
  | { type: 'mode/set'; mode: FulfillmentMode }
  | { type: 'address/set'; address: Address }
  | { type: 'favorite/toggle'; id: string }
  | { type: 'order/place'; order: Order }
  | { type: 'chat/send'; orderId: string; message: ChatMessage }
  // order lifecycle (merchant + courier + simulation)
  | { type: 'order/status'; id: string; status: OrderStatus; patch?: Partial<Order> }
  | { type: 'order/patch'; id: string; patch: Partial<Order> }
  | { type: 'order/advance'; id: string }
  | { type: 'order/inject'; order: Order }
  // merchant
  | { type: 'restaurant/patch'; id: string; patch: Partial<Restaurant> }
  | { type: 'menu/upsert'; item: MenuItem }
  | { type: 'menu/delete'; id: string }
  | { type: 'modgroup/upsert'; group: ModifierGroup }
  | { type: 'modgroup/delete'; id: string }
  // courier
  | { type: 'courier/online'; online: boolean }
  | { type: 'courier/accept'; orderId: string }
  | { type: 'courier/decline'; orderId: string }
  | { type: 'courier/complete'; orderId: string; payout: number; photo?: string }
  // admin
  | { type: 'fees/set'; config: FeeConfig }
  | { type: 'application/decide'; id: string; status: OnboardingApplication['status'] }
  | { type: 'dispute/resolve'; id: string; status: DisputeStatus; refundAmount?: number }
  // partner registration + billing
  | { type: 'application/submit'; application: OnboardingApplication }
  | { type: 'subscription/pay'; restaurantId: string; payment: SubscriptionPayment }

function patchOrder(orders: Order[], id: string, fn: (o: Order) => Order) {
  return orders.map((o) => (o.id === id ? fn(o) : o))
}

function withStatus(o: Order, status: OrderStatus, patch: Partial<Order> = {}): Order {
  const extra: Partial<Order> = {}
  if (status === 'preparing' && !o.acceptedAt) extra.acceptedAt = Date.now()
  // A courier must exist once the order reaches the store hand-off.
  if ((status === 'ready' || status === 'courier_at_store' || status === 'on_the_way') && !o.courierId && o.mode === 'delivery') {
    const c = COURIERS[1]
    extra.courierId = c.id
    extra.courierName = c.name
  }
  return { ...o, ...extra, ...patch, status, timeline: { ...o.timeline, [status]: Date.now() } }
}

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case 'cart/add': {
      const base = a.replace || s.cart.restaurantId !== a.line.restaurantId ? [] : s.cart.lines
      return { ...s, cart: { restaurantId: a.line.restaurantId, lines: [...base, a.line] } }
    }
    case 'cart/qty': {
      const lines = s.cart.lines
        .map((l) => (l.id === a.lineId ? { ...l, quantity: l.quantity + a.delta } : l))
        .filter((l) => l.quantity > 0)
      return { ...s, cart: { restaurantId: lines.length ? s.cart.restaurantId : undefined, lines } }
    }
    case 'cart/remove': {
      const lines = s.cart.lines.filter((l) => l.id !== a.lineId)
      return { ...s, cart: { restaurantId: lines.length ? s.cart.restaurantId : undefined, lines } }
    }
    case 'cart/clear': return { ...s, cart: { lines: [] } }
    case 'cart/open': return { ...s, cartOpen: a.open }
    case 'mode/set': return { ...s, mode: a.mode }
    case 'address/set': return { ...s, address: a.address }
    case 'favorite/toggle':
      return { ...s, favorites: s.favorites.includes(a.id) ? s.favorites.filter((f) => f !== a.id) : [...s.favorites, a.id] }
    case 'order/place':
      return { ...s, orders: [a.order, ...s.orders], cart: { lines: [] }, cartOpen: false }
    case 'order/inject':
      return { ...s, orders: [a.order, ...s.orders] }
    case 'chat/send':
      return { ...s, chats: { ...s.chats, [a.orderId]: [...(s.chats[a.orderId] ?? []), a.message] } }

    case 'order/status':
      return { ...s, orders: patchOrder(s.orders, a.id, (o) => withStatus(o, a.status, a.patch)) }
    case 'order/patch':
      return { ...s, orders: patchOrder(s.orders, a.id, (o) => ({ ...o, ...a.patch })) }
    case 'order/advance':
      return {
        ...s,
        orders: patchOrder(s.orders, a.id, (o) => {
          const i = STATUS_FLOW.indexOf(o.status)
          if (i < 0 || i >= STATUS_FLOW.length - 1) return o
          return withStatus(o, STATUS_FLOW[i + 1])
        }),
      }

    case 'restaurant/patch':
      return { ...s, restaurants: s.restaurants.map((r) => (r.id === a.id ? { ...r, ...a.patch } : r)) }
    case 'menu/upsert': {
      const exists = s.menuItems.some((m) => m.id === a.item.id)
      return { ...s, menuItems: exists ? s.menuItems.map((m) => (m.id === a.item.id ? a.item : m)) : [...s.menuItems, a.item] }
    }
    case 'menu/delete': return { ...s, menuItems: s.menuItems.filter((m) => m.id !== a.id) }
    case 'modgroup/upsert': {
      const exists = s.modifierGroups.some((g) => g.id === a.group.id)
      return { ...s, modifierGroups: exists ? s.modifierGroups.map((g) => (g.id === a.group.id ? a.group : g)) : [...s.modifierGroups, a.group] }
    }
    case 'modgroup/delete':
      return {
        ...s,
        modifierGroups: s.modifierGroups.filter((g) => g.id !== a.id),
        menuItems: s.menuItems.map((m) => ({ ...m, modifierGroupIds: m.modifierGroupIds.filter((g) => g !== a.id) })),
      }

    case 'courier/online':
      return { ...s, courier: { ...s.courier, online: a.online, onlineSince: a.online ? Date.now() : undefined } }
    case 'courier/accept':
      return {
        ...s,
        courier: { ...s.courier, activeOrderId: a.orderId },
        orders: patchOrder(s.orders, a.orderId, (o) => ({ ...o, courierId: ME_COURIER.id, courierName: ME_COURIER.name, courierEtaToStore: 5 })),
      }
    case 'courier/decline':
      return { ...s, courier: { ...s.courier, declinedIds: [...s.courier.declinedIds, a.orderId] } }
    case 'courier/complete':
      return {
        ...s,
        courier: { ...s.courier, activeOrderId: undefined, earningsToday: s.courier.earningsToday + a.payout, tripsToday: s.courier.tripsToday + 1 },
        orders: patchOrder(s.orders, a.orderId, (o) => withStatus(o, 'delivered', { proofPhoto: a.photo })),
      }

    case 'fees/set': return { ...s, feeConfig: a.config }
    case 'application/decide': {
      const app = s.applications.find((x) => x.id === a.id)
      let restaurants = s.restaurants
      if (app && a.status === 'approved' && !s.restaurants.some((r) => r.id === `new-${app.id}`)) {
        const now = Date.now()
        restaurants = [...restaurants, {
          id: `new-${app.id}`, name: app.businessName, cuisine: app.cuisine, categories: app.categories?.length ? app.categories : ['deals'], rating: 5, ratingCount: 0,
          etaMin: 20, etaMax: 30, deliveryFee: 0, priceLevel: 2, distanceKm: 2.4, emoji: app.emoji,
          gradient: 'from-violet-300 via-purple-400 to-indigo-500', promo: 'New on Eats', online: true, busyMode: false,
          dietary: [], address: app.address ? `${app.address}, ${app.island ?? ''}`.replace(/, $/, '') : app.area, menuCategories: ['Popular'], tier: app.tier,
          image: app.coverImage,
          // The first month paid at registration starts counting when the store goes live.
          subscription: app.firstPayment ? startSubscription(app.firstPayment, now) : undefined,
        }]
      }
      return { ...s, restaurants, applications: s.applications.map((x) => (x.id === a.id ? { ...x, status: a.status } : x)) }
    }
    case 'dispute/resolve':
      return { ...s, disputes: s.disputes.map((d) => (d.id === a.id ? { ...d, status: a.status, refundAmount: a.refundAmount ?? d.refundAmount } : d)) }
    case 'application/submit':
      return { ...s, applications: [a.application, ...s.applications.filter((x) => x.id !== a.application.id)] }
    case 'subscription/pay':
      return { ...s, restaurants: s.restaurants.map((r) => (r.id === a.restaurantId ? { ...r, subscription: applyPayment(r.subscription, a.payment, Date.now()) } : r)) }
    default:
      return s
  }
}

// ── Local persistence ────────────────────────────────────────
// There is no backend yet, so partner registrations, approved stores, subscription payments
// and fee settings are kept in this browser's localStorage. They survive a refresh but are
// not shared with other devices. Replace with API calls when a backend exists.

export const STORAGE_KEY = 'eats-seychelles:v1'

interface Persisted {
  applications: OnboardingApplication[]
  newRestaurants: Restaurant[]
  subscriptions: Record<string, Subscription | undefined>
  feeConfig: Partial<FeeConfig>
}

function hydrate(base: State): State {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return base
    const p = JSON.parse(raw) as Partial<Persisted>
    const seeded = base.restaurants.map((r) => (p.subscriptions && r.id in p.subscriptions ? { ...r, subscription: p.subscriptions[r.id] } : r))
    return {
      ...base,
      applications: p.applications ?? base.applications,
      restaurants: [...seeded, ...(p.newRestaurants ?? []).filter((n) => !seeded.some((r) => r.id === n.id))],
      feeConfig: { ...base.feeConfig, ...p.feeConfig, commission: { ...base.feeConfig.commission, ...p.feeConfig?.commission } },
    }
  } catch {
    return base
  }
}

function persist(s: State) {
  const data: Persisted = {
    applications: s.applications,
    newRestaurants: s.restaurants.filter((r) => r.id.startsWith('new-')),
    subscriptions: Object.fromEntries(s.restaurants.filter((r) => !r.id.startsWith('new-')).map((r) => [r.id, r.subscription])),
    feeConfig: s.feeConfig,
  }
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)) } catch { /* storage full or blocked: keep working in memory */ }
}

/** Clears saved registrations/payments and reloads with the seed data. */
export function resetDemoData() {
  try { localStorage.removeItem(STORAGE_KEY) } catch { /* ignore */ }
  window.location.reload()
}

const Ctx = createContext<{ state: State; dispatch: React.Dispatch<Action> } | null>(null)

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initial, hydrate)
  useEffect(() => { persist(state) }, [state.applications, state.restaurants, state.feeConfig]) // eslint-disable-line react-hooks/exhaustive-deps
  const value = useMemo(() => ({ state, dispatch }), [state])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useStore() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useStore must be used inside <AppStoreProvider>')
  return v
}

// ── Selectors ────────────────────────────────────────────────
export const selectRestaurant = (s: State, id?: string) => s.restaurants.find((r) => r.id === id)
export const selectMenu = (s: State, restaurantId: string) => s.menuItems.filter((m) => m.restaurantId === restaurantId)
export const selectGroups = (s: State, ids: string[]) => ids.map((id) => s.modifierGroups.find((g) => g.id === id)).filter(Boolean) as ModifierGroup[]
export const cartCount = (s: State) => s.cart.lines.reduce((n, l) => n + l.quantity, 0)

export const newMessage = (from: ChatMessage['from'], text: string): ChatMessage => ({ id: uid('msg'), from, text, at: Date.now() })
