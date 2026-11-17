import { MARKET } from '../config/market'
import type { CategoryKey, OnboardingApplication, PartnerTier, SubscriptionPayment } from '../types'

// Partner (restaurant) self-registration: draft model, validation, and conversion
// to an OnboardingApplication for the admin review queue.

export interface PartnerDraft {
  businessName: string
  cuisine: string
  categories: CategoryKey[]
  description: string
  brn: string
  island: string
  address: string
  owner: string
  phone: string
  email: string
  coverImage?: string
  /** File names of uploaded documents (the files themselves go to the backend once it exists) */
  docs: { tradeLicense?: string; foodSafety?: string; bankDetails?: string; menu?: string }
  menuLater: boolean
  tier: PartnerTier
  agree: boolean
}

export const emptyDraft = (): PartnerDraft => ({
  businessName: '', cuisine: '', categories: [], description: '', brn: '', island: MARKET.islands[0], address: '',
  owner: '', phone: '', email: '', docs: {}, menuLater: false, tier: 'standard', agree: false,
})

export type DraftErrors = Partial<Record<keyof PartnerDraft | 'docs.tradeLicense' | 'docs.foodSafety' | 'docs.bankDetails' | 'docs.menu', string>>

/** Seychelles numbers are 7 digits; mobiles start with 2, landlines with 4. Spaces and +248 are allowed. */
export function normalisePhone(input: string) {
  const digits = input.replace(/[^\d]/g, '').replace(/^248/, '')
  return /^[24]\d{6}$/.test(digits) ? `${MARKET.phonePrefix} ${digits.slice(0, 1)} ${digits.slice(1, 4)} ${digits.slice(4)}` : null
}

export const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s.trim())

export const STEPS = ['Business', 'Contact', 'Documents', 'Plan', 'Payment'] as const

/** Errors for one wizard step (empty object = step is valid). */
export function validateStep(step: number, d: PartnerDraft): DraftErrors {
  const e: DraftErrors = {}
  if (step === 0) {
    if (d.businessName.trim().length < 2) e.businessName = 'Enter your business name'
    if (!d.cuisine.trim()) e.cuisine = 'Describe your food, e.g. “Creole · Seafood”'
    if (d.categories.length === 0) e.categories = 'Pick at least one category'
    if (d.brn.trim().length < 4) e.brn = 'Enter your business registration number'
    if (!d.island) e.island = 'Choose an island'
    if (d.address.trim().length < 4) e.address = 'Enter the district and street'
  }
  if (step === 1) {
    if (d.owner.trim().split(/\s+/).length < 2) e.owner = 'Enter the owner’s full name'
    if (!normalisePhone(d.phone)) e.phone = 'Enter a 7-digit Seychelles number, e.g. 2 512 345'
    if (!isEmail(d.email)) e.email = 'Enter a valid email address'
  }
  if (step === 2) {
    if (!d.coverImage) e.coverImage = 'Add a cover photo of your food or restaurant'
    if (!d.docs.tradeLicense) e['docs.tradeLicense'] = 'Trade licence is required'
    if (!d.docs.foodSafety) e['docs.foodSafety'] = 'Food hygiene certificate is required'
    if (!d.docs.bankDetails) e['docs.bankDetails'] = 'Proof of bank account is required for payouts'
    if (!d.docs.menu && !d.menuLater) e['docs.menu'] = 'Upload your menu or choose to add it later'
  }
  if (step === 3) {
    if (!d.agree) e.agree = 'Please accept the partner terms'
  }
  return e
}

export const draftIsComplete = (d: PartnerDraft) => [0, 1, 2, 3].every((s) => Object.keys(validateStep(s, d)).length === 0)

/** Builds the application the admin reviews. */
export function toApplication(d: PartnerDraft, id: string, emoji: string, payment: SubscriptionPayment, now = Date.now()): OnboardingApplication {
  return {
    id,
    businessName: d.businessName.trim(),
    cuisine: d.cuisine.trim(),
    owner: d.owner.trim(),
    area: `${d.address.trim()}, ${d.island}`,
    submittedAt: now,
    emoji,
    documents: { tradeLicense: !!d.docs.tradeLicense, foodSafety: !!d.docs.foodSafety, bankDetails: !!d.docs.bankDetails, menuUploaded: !!d.docs.menu },
    status: 'pending',
    tier: d.tier,
    categories: d.categories,
    description: d.description.trim() || undefined,
    island: d.island,
    address: d.address.trim(),
    phone: normalisePhone(d.phone) ?? d.phone,
    email: d.email.trim(),
    brn: d.brn.trim(),
    coverImage: d.coverImage,
    firstPayment: payment,
  }
}

/** Reads an image file and shrinks it to a JPEG data URL (keeps localStorage small). */
export function readImageFile(file: File, maxWidth = 1000): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) return reject(new Error('Please choose an image file (JPG or PNG).'))
    if (file.size > 10 * 1024 * 1024) return reject(new Error('That image is over 10 MB. Please choose a smaller one.'))
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width)
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.8))
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not read that image.')) }
    img.src = url
  })
}
