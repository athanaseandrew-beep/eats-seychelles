// ─────────────────────────────────────────────────────────────
// Domain model — shared by all four role views.
// When wiring a backend, these become your API contracts.
// ─────────────────────────────────────────────────────────────

export type Role = 'customer' | 'merchant' | 'courier' | 'admin'

export type Dietary = 'vegan' | 'vegetarian' | 'gluten-free' | 'halal'

export type CategoryKey =
  | 'deals' | 'creole' | 'seafood' | 'burgers' | 'sushi' | 'pizza' | 'healthy'
  | 'grocery' | 'pharmacy' | 'coffee' | 'desserts' | 'indian'

export interface ModifierOption {
  id: string
  name: string
  price: number
}

export interface ModifierGroup {
  id: string
  restaurantId: string
  name: string
  /** single = radio, multi = checkboxes */
  type: 'single' | 'multi'
  required: boolean
  /** max selections for multi groups */
  max?: number
  options: ModifierOption[]
}

export interface MenuItem {
  id: string
  restaurantId: string
  category: string
  name: string
  description: string
  price: number
  emoji: string
  popular?: boolean
  soldOut?: boolean
  calories?: number
  dietary?: Dietary[]
  modifierGroupIds: string[]
}

export type PartnerTier = 'standard' | 'plus' | 'premium'

export interface Restaurant {
  id: string
  name: string
  cuisine: string
  categories: CategoryKey[]
  rating: number
  ratingCount: number
  etaMin: number
  etaMax: number
  deliveryFee: number
  priceLevel: 1 | 2 | 3
  distanceKm: number
  emoji: string
  /** Tailwind gradient classes used as hero art (no remote images needed) */
  gradient: string
  promo?: string
  online: boolean
  busyMode: boolean
  dietary: Dietary[]
  address: string
  menuCategories: string[]
  tier: PartnerTier
  /** Cover photo: a path under public/ (e.g. "images/r1.jpg") or a data: URL uploaded at registration */
  image?: string
  /** Monthly listing plan. Missing = legacy/unbilled store. */
  subscription?: Subscription
}

// ── Partner billing ──────────────────────────────────────────
export type PaymentMethod = 'card' | 'bank_transfer' | 'mobile_banking'

export interface SubscriptionPayment {
  id: string
  amount: number
  method: PaymentMethod
  at: number
  /** Reference shown on receipts / bank transfer narrative */
  reference: string
  /** Billing period covered, e.g. "17 Nov – 17 Dec 2026" */
  period: string
}

export interface Subscription {
  monthlyFee: number
  /** Listing is paid up to this timestamp */
  paidUntil: number
  payments: SubscriptionPayment[]
}

export interface CartLine {
  id: string
  itemId: string
  restaurantId: string
  name: string
  emoji: string
  quantity: number
  /** groupId -> optionIds */
  selections: Record<string, string[]>
  selectionLabels: string[]
  instructions: string
  unitPrice: number
}

export type OrderStatus =
  | 'placed'           // waiting for merchant accept
  | 'preparing'        // merchant accepted
  | 'ready'            // food ready, waiting for courier
  | 'courier_at_store' // courier checked in
  | 'on_the_way'       // picked up
  | 'delivered'
  | 'cancelled'

export type DropoffOption = 'door' | 'meet'
export type FulfillmentMode = 'delivery' | 'pickup'
export type DeliverySpeed = 'priority' | 'standard' | 'scheduled'

export interface FeeBreakdown {
  subtotal: number
  deliveryFee: number
  serviceFee: number
  smallOrderFee: number
  priorityFee: number
  tax: number
  tip: number
  discount: number
  total: number
}

export interface Order {
  id: string
  restaurantId: string
  restaurantName: string
  restaurantEmoji: string
  customerName: string
  address: string
  lines: CartLine[]
  fees: FeeBreakdown
  status: OrderStatus
  placedAt: number
  /** merchant must accept before this timestamp */
  acceptDeadline: number
  prepMinutes: number
  acceptedAt?: number
  courierId?: string
  courierName?: string
  courierEtaToStore?: number
  dropoff: DropoffOption
  instructions: string
  speed: DeliverySpeed
  scheduledFor?: string
  mode: FulfillmentMode
  timeline: Partial<Record<OrderStatus, number>>
  proofPhoto?: string
  rejectReason?: string
}

export interface Courier {
  id: string
  name: string
  vehicle: string
  plate: string
  rating: number
  online: boolean
}

export interface FeeConfig {
  serviceFeePct: number
  serviceFeeMin: number
  serviceFeeMax: number
  smallOrderThreshold: number
  smallOrderFee: number
  priorityFee: number
  deliveryFeeMultiplier: number
  taxPct: number
  commission: Record<PartnerTier, number>
  /** Monthly listing fee every partner restaurant pays (SCR) */
  subscriptionFee: number
  /** Flat platform commission per delivered trip, deducted from the restaurant payout (SCR) */
  perTripCommission: number
}

export interface OnboardingApplication {
  id: string
  businessName: string
  cuisine: string
  owner: string
  area: string
  submittedAt: number
  emoji: string
  documents: { tradeLicense: boolean; foodSafety: boolean; bankDetails: boolean; menuUploaded: boolean }
  status: 'pending' | 'approved' | 'rejected' | 'info_requested'
  tier: PartnerTier
  // Self-serve registration fields (optional so seeded applications stay valid)
  categories?: CategoryKey[]
  description?: string
  island?: string
  address?: string
  phone?: string
  email?: string
  /** Seychelles business registration number */
  brn?: string
  coverImage?: string
  /** First month's listing fee, paid during registration */
  firstPayment?: SubscriptionPayment
}

export type DisputeStatus = 'open' | 'investigating' | 'refunded' | 'rejected'

export interface Dispute {
  id: string
  orderId: string
  customer: string
  restaurant: string
  type: 'Missing item' | 'Late delivery' | 'Wrong order' | 'Damaged / spilled' | 'Never arrived'
  amount: number
  status: DisputeStatus
  createdAt: number
  note: string
  refundAmount?: number
}

export interface ChatMessage {
  id: string
  from: 'customer' | 'courier'
  text: string
  at: number
}
