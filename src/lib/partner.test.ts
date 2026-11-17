import { describe, expect, it } from 'vitest'
import { createPayment } from './billing'
import { draftIsComplete, emptyDraft, isEmail, normalisePhone, toApplication, validateStep, type PartnerDraft } from './partner'

const complete = (): PartnerDraft => ({
  ...emptyDraft(),
  businessName: 'Chez Test', cuisine: 'Creole · Seafood', categories: ['creole'], brn: 'B1234567', island: 'Praslin', address: 'Grand Anse, Main Road',
  owner: 'Marie Hoareau', phone: '2 512 345', email: 'marie@test.sc',
  coverImage: 'data:image/jpeg;base64,xx', docs: { tradeLicense: 'tl.pdf', foodSafety: 'fs.pdf', bankDetails: 'bank.pdf' }, menuLater: true,
  tier: 'plus', agree: true,
})

describe('normalisePhone', () => {
  it('accepts 7-digit Seychelles numbers with or without +248', () => {
    expect(normalisePhone('2512345')).toBe('+248 2 512 345')
    expect(normalisePhone('+248 4 224 466')).toBe('+248 4 224 466')
  })
  it('rejects wrong lengths and prefixes', () => {
    expect(normalisePhone('251234')).toBeNull()
    expect(normalisePhone('9512345')).toBeNull()
  })
})

describe('isEmail', () => {
  it('validates simple addresses', () => {
    expect(isEmail('a@b.sc')).toBe(true)
    expect(isEmail('not-an-email')).toBe(false)
  })
})

describe('validateStep', () => {
  it('flags every missing business field on an empty draft', () => {
    const e = validateStep(0, emptyDraft())
    expect(Object.keys(e).sort()).toEqual(['address', 'brn', 'businessName', 'categories', 'cuisine'])
  })

  it('requires the legal documents and a cover photo, but the menu can come later', () => {
    const d = complete()
    expect(validateStep(2, d)).toEqual({})
    expect(validateStep(2, { ...d, menuLater: false })).toHaveProperty(['docs.menu'])
    expect(validateStep(2, { ...d, docs: { ...d.docs, foodSafety: undefined } })).toHaveProperty(['docs.foodSafety'])
    expect(validateStep(2, { ...d, coverImage: undefined })).toHaveProperty('coverImage')
  })

  it('requires accepting the terms', () => {
    expect(validateStep(3, { ...complete(), agree: false })).toHaveProperty('agree')
  })

  it('a fully filled draft is complete', () => {
    expect(draftIsComplete(complete())).toBe(true)
  })
})

describe('toApplication', () => {
  it('builds a pending application with the first payment attached', () => {
    const p = createPayment(200, 'card', 0, 0)
    const a = toApplication(complete(), 'APP-TEST01', '🐙', p, 1000)
    expect(a).toMatchObject({
      id: 'APP-TEST01', status: 'pending', tier: 'plus', businessName: 'Chez Test', area: 'Grand Anse, Main Road, Praslin',
      phone: '+248 2 512 345', categories: ['creole'], submittedAt: 1000,
      documents: { tradeLicense: true, foodSafety: true, bankDetails: true, menuUploaded: false },
    })
    expect(a.firstPayment?.amount).toBe(200)
  })
})
