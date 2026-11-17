import { ArrowLeft, ArrowRight, BadgeCheck, Building2, Camera, Check, CheckCircle2, Clock, CreditCard, FileText, Landmark, Loader2, Receipt, ShieldCheck, Smartphone, Store, Upload, X } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import { Badge } from '../../components/ui/primitives'
import { MARKET } from '../../config/market'
import { CATEGORIES } from '../../data/mock'
import { createPayment, PAYMENT_METHODS } from '../../lib/billing'
import { assetUrl, cn, money, shortDate, uid } from '../../lib/format'
import { draftIsComplete, emptyDraft, readImageFile, STEPS, toApplication, validateStep, type DraftErrors, type PartnerDraft } from '../../lib/partner'
import { useStore } from '../../store/AppStore'
import type { PartnerTier, PaymentMethod } from '../../types'
import { Logo } from '../customer/CustomerLayout'

const TIERS: { key: PartnerTier; name: string; perks: string }[] = [
  { key: 'standard', name: 'Standard', perks: 'Basic listing in search and categories' },
  { key: 'plus', name: 'Plus', perks: 'Featured placement on the home feed' },
  { key: 'premium', name: 'Premium', perks: 'Exclusive partner badge and marketing boost' },
]

export function PartnerPortal() {
  return (
    <div className="min-h-[calc(100vh-44px)] bg-slate-50">
      <header className="sticky top-11 z-30 bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 md:px-6 h-14 flex items-center gap-3">
          <Link to="/partner" aria-label="Partner home"><Logo suffix="Partners" /></Link>
          <Link to="/" className="ml-auto btn-ghost text-sm"><ArrowLeft size={16} />Back to ordering</Link>
        </div>
      </header>
      <Routes>
        <Route index element={<Landing />} />
        <Route path="apply" element={<RegisterWizard />} />
        <Route path="status/:id" element={<StatusPage />} />
      </Routes>
    </div>
  )
}

// ── Landing ──────────────────────────────────────────────────

function Landing() {
  const { state } = useStore()
  const navigate = useNavigate()
  const [lookup, setLookup] = useState('')
  const fc = state.feeConfig
  const example = 400
  const keep = example - example * (fc.commission.standard / 100) - fc.perTripCommission

  return (
    <>
      <section className="relative overflow-hidden bg-slate-900 text-white">
        <img src={assetUrl('images/partner-praslin-dinner.jpg')} alt="" className="absolute inset-0 w-full h-full object-cover opacity-55" onError={(e) => { e.currentTarget.style.display = 'none' }} />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/10" />
        <div className="relative max-w-5xl mx-auto px-4 md:px-6 py-14 md:py-20">
          <Badge tone="green" className="mb-3">For restaurants, cafés, groceries & pharmacies</Badge>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight max-w-2xl">Grow your business with Eats Seychelles</h1>
          <p className="mt-3 text-lg text-white/85 max-w-xl">Reach hungry customers across {MARKET.islands.slice(0, -1).join(', ')} and {MARKET.islands.at(-1)}. We bring the orders and the couriers — you cook.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/partner/apply" className="btn-brand text-base">Start registration<ArrowRight size={18} /></Link>
            <a href="#pricing" className="btn h-12 px-5 bg-white/15 hover:bg-white/25 text-white">See pricing</a>
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 md:px-6 py-10 space-y-10">
        <section>
          <h2 className="section-title">How it works</h2>
          <ol className="mt-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { icon: FileText, t: 'Register online', b: 'Business details, documents and a cover photo. About 10 minutes.' },
              { icon: CreditCard, t: `Pay ${money(fc.subscriptionFee)}`, b: 'Your first month’s listing fee, paid securely at sign-up.' },
              { icon: ShieldCheck, t: 'We review', b: 'Our team checks your documents within 1–2 working days.' },
              { icon: Store, t: 'Go live', b: 'Your store appears in the app and orders start coming in.' },
            ].map((s, i) => (
              <li key={s.t} className="card p-4">
                <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">STEP {i + 1}</div>
                <s.icon className="mt-2" size={22} />
                <div className="font-bold mt-2">{s.t}</div>
                <p className="text-sm text-slate-600 mt-1">{s.b}</p>
              </li>
            ))}
          </ol>
        </section>

        <section id="pricing" className="grid lg:grid-cols-[1fr_360px] gap-4 scroll-mt-28">
          <div className="card p-5 md:p-6">
            <h2 className="section-title">Simple pricing</h2>
            <div className="mt-4 grid sm:grid-cols-2 gap-3">
              <div className="rounded-2xl bg-black text-white p-5">
                <div className="text-sm text-white/70">Monthly listing</div>
                <div className="text-3xl font-extrabold mt-1">{money(fc.subscriptionFee)}<span className="text-base font-semibold text-white/70"> / month</span></div>
                <p className="text-sm text-white/70 mt-2">Keeps your store listed. Renew from the Merchant portal.</p>
              </div>
              <div className="rounded-2xl bg-emerald-50 text-emerald-950 p-5">
                <div className="text-sm text-emerald-800">Per delivered trip</div>
                <div className="text-3xl font-extrabold mt-1">{money(fc.perTripCommission)}<span className="text-base font-semibold text-emerald-800"> / trip</span></div>
                <p className="text-sm text-emerald-800 mt-2">Deducted from your payout. Pickup orders have no trip fee.</p>
              </div>
            </div>
            <div className="mt-5">
              <div className="font-bold">Plus a commission on food sales, by partner tier</div>
              <div className="mt-2 grid sm:grid-cols-3 gap-2">
                {TIERS.map((t) => (
                  <div key={t.key} className="rounded-xl border border-slate-200 p-3">
                    <div className="flex items-center justify-between"><span className="font-semibold">{t.name}</span><span className="font-extrabold">{fc.commission[t.key]}%</span></div>
                    <p className="text-xs text-slate-500 mt-1">{t.perks}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="card p-5 h-fit">
            <div className="font-bold">Example: a {money(example)} delivery order</div>
            <div className="text-xs text-slate-500">Standard tier</div>
            <dl className="mt-3 space-y-2 text-sm">
              <Row label="Food sales" value={money(example)} />
              <Row label={`Commission (${fc.commission.standard}%)`} value={`− ${money(example * fc.commission.standard / 100)}`} />
              <Row label="Trip commission" value={`− ${money(fc.perTripCommission)}`} />
              <div className="border-t border-slate-200 pt-2"><Row label={<b>You receive</b>} value={<b>{money(keep)}</b>} /></div>
            </dl>
            <p className="text-xs text-slate-500 mt-3">Delivery and service fees are paid by the customer. The monthly listing fee is billed separately.</p>
          </div>
        </section>

        <section className="grid md:grid-cols-2 gap-4">
          <div className="card p-5">
            <h2 className="font-bold text-lg">What you’ll need</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {['Business registration number', 'Trade licence', 'Food hygiene certificate from the Public Health Authority', 'Proof of a Seychelles bank account for payouts', 'Your menu (or add it later)', 'A cover photo of your food or restaurant'].map((x) => (
                <li key={x} className="flex gap-2"><Check size={16} className="text-brand shrink-0 mt-0.5" />{x}</li>
              ))}
            </ul>
          </div>
          <div className="card p-5">
            <h2 className="font-bold text-lg">Already applied?</h2>
            <p className="text-sm text-slate-600 mt-1">Enter your application number to check its status.</p>
            <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (lookup.trim()) navigate(`/partner/status/${lookup.trim().toUpperCase()}`) }}>
              <input className="input" placeholder="e.g. APP-K3X9QZ" value={lookup} onChange={(e) => setLookup(e.target.value)} aria-label="Application number" />
              <button className="btn-primary h-11">Check</button>
            </form>
          </div>
        </section>
        <p className="text-xs text-slate-400">Photos: Wikimedia Commons contributors · <Link to="/credits" className="underline">Photo credits</Link></p>
      </div>
    </>
  )
}

function Row({ label, value }: { label: ReactNode; value: ReactNode }) {
  return <div className="flex justify-between gap-3"><dt className="text-slate-600">{label}</dt><dd className="tabular">{value}</dd></div>
}

// ── Registration wizard ──────────────────────────────────────

function RegisterWizard() {
  const { state, dispatch } = useStore()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [d, setD] = useState<PartnerDraft>(emptyDraft)
  const [errors, setErrors] = useState<DraftErrors>({})
  const [method, setMethod] = useState<PaymentMethod>('card')
  const [paying, setPaying] = useState(false)
  const [reference] = useState(() => `EATS-${uid().toUpperCase().slice(0, 6)}`)
  const fee = state.feeConfig.subscriptionFee

  const set = <K extends keyof PartnerDraft>(k: K, v: PartnerDraft[K]) => { setD((x) => ({ ...x, [k]: v })); setErrors((e) => ({ ...e, [k]: undefined })) }
  const next = () => {
    const e = validateStep(step, d)
    setErrors(e)
    if (Object.keys(e).length === 0) { setStep(step + 1); window.scrollTo(0, 0) }
  }
  const back = () => { setErrors({}); setStep(step - 1); window.scrollTo(0, 0) }

  const pay = () => {
    if (!draftIsComplete(d)) return
    setPaying(true)
    // Demo: simulates the gateway round-trip. A real integration redirects to the bank's
    // hosted payment page and confirms the payment on the server before submitting.
    setTimeout(() => {
      const id = `APP-${uid().toUpperCase().slice(0, 6)}`
      const emoji = CATEGORIES.find((c) => c.key === d.categories[0])?.emoji ?? '🍽️'
      const payment = { ...createPayment(fee, method, Date.now()), reference: method === 'bank_transfer' ? reference : `SUB-${id.slice(4)}` }
      dispatch({ type: 'application/submit', application: toApplication(d, id, emoji, payment) })
      setPaying(false)
      navigate(`/partner/status/${id}`, { replace: true, state: { justSubmitted: true } })
    }, 1200)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-6 py-6 md:py-10">
      <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Register your business</h1>
      <p className="text-slate-500 mt-1">{money(fee)}/month listing · {money(state.feeConfig.perTripCommission)} per delivered trip</p>

      <ol className="mt-5 grid grid-cols-5 gap-1.5" aria-label="Registration progress">
        {STEPS.map((s, i) => (
          <li key={s} className="min-w-0">
            <div className={cn('h-1.5 rounded-full', i <= step ? 'bg-black' : 'bg-slate-200')} />
            <div className={cn('mt-1.5 text-[11px] sm:text-xs font-semibold truncate', i === step ? 'text-black' : 'text-slate-400')} aria-current={i === step ? 'step' : undefined}>{s}</div>
          </li>
        ))}
      </ol>

      <div className="card p-5 md:p-6 mt-5">
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="font-bold text-lg flex items-center gap-2"><Building2 size={20} />Business details</h2>
            <Field label="Business name" error={errors.businessName}>
              <input className="input" value={d.businessName} onChange={(e) => set('businessName', e.target.value)} placeholder="e.g. Chez Batista" />
            </Field>
            <Field label="What do you serve?" error={errors.cuisine} hint="Shown under your name in the app">
              <input className="input" value={d.cuisine} onChange={(e) => set('cuisine', e.target.value)} placeholder="e.g. Creole · Seafood" />
            </Field>
            <Field label="Categories" error={errors.categories} hint="Customers find you through these">
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.filter((c) => c.key !== 'deals').map((c) => {
                  const on = d.categories.includes(c.key)
                  return <button type="button" key={c.key} onClick={() => set('categories', on ? d.categories.filter((x) => x !== c.key) : [...d.categories, c.key])} className={on ? 'pill-on' : 'pill-off'} aria-pressed={on}>{c.emoji} {c.label}</button>
                })}
              </div>
            </Field>
            <Field label="Short description (optional)">
              <textarea className="input h-auto py-3 resize-none" rows={2} maxLength={160} value={d.description} onChange={(e) => set('description', e.target.value)} placeholder="Family-run Creole kitchen by the beach since 1998" />
            </Field>
            <Field label="Business registration number" error={errors.brn} hint="From the Registration Division certificate">
              <input className="input uppercase" value={d.brn} onChange={(e) => set('brn', e.target.value)} placeholder="e.g. B8412345" />
            </Field>
            <div className="grid sm:grid-cols-[180px_1fr] gap-4">
              <Field label="Island" error={errors.island}>
                <select className="input" value={d.island} onChange={(e) => set('island', e.target.value)}>
                  {MARKET.islands.map((i) => <option key={i}>{i}</option>)}
                </select>
              </Field>
              <Field label="District & street" error={errors.address}>
                <input className="input" value={d.address} onChange={(e) => set('address', e.target.value)} placeholder="e.g. Takamaka, Coastal Road" />
              </Field>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <h2 className="font-bold text-lg">Owner & contact</h2>
            <Field label="Owner’s full name" error={errors.owner}>
              <input className="input" value={d.owner} onChange={(e) => set('owner', e.target.value)} placeholder="e.g. Marc Batista" autoComplete="name" />
            </Field>
            <Field label="Phone" error={errors.phone} hint="We’ll call to confirm your details">
              <div className="flex">
                <span className="h-11 px-3 grid place-items-center rounded-l-xl bg-slate-200 text-sm font-semibold">{MARKET.phonePrefix}</span>
                <input className="input rounded-l-none" inputMode="tel" value={d.phone} onChange={(e) => set('phone', e.target.value)} placeholder="2 512 345" autoComplete="tel-national" />
              </div>
            </Field>
            <Field label="Email" error={errors.email} hint="For receipts and your monthly statement">
              <input className="input" type="email" value={d.email} onChange={(e) => set('email', e.target.value)} placeholder="you@business.sc" autoComplete="email" />
            </Field>
          </div>
        )}

        {step === 2 && <DocumentsStep d={d} set={set} errors={errors} />}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="font-bold text-lg">Choose your plan</h2>
            <div className="space-y-2" role="radiogroup" aria-label="Partner tier">
              {TIERS.map((t) => (
                <button type="button" role="radio" aria-checked={d.tier === t.key} key={t.key} onClick={() => set('tier', t.key)}
                  className={cn('w-full p-4 rounded-2xl border-2 text-left flex items-center gap-3 transition', d.tier === t.key ? 'border-black' : 'border-slate-200 hover:border-slate-300')}>
                  <span className={cn('w-5 h-5 rounded-full border-2 grid place-items-center shrink-0', d.tier === t.key ? 'border-black' : 'border-slate-300')}>{d.tier === t.key && <span className="w-2.5 h-2.5 rounded-full bg-black" />}</span>
                  <span className="flex-1"><span className="font-bold">{t.name}</span><span className="block text-sm text-slate-500">{t.perks}</span></span>
                  <span className="font-extrabold">{state.feeConfig.commission[t.key]}%</span>
                </button>
              ))}
            </div>
            <div className="rounded-2xl bg-slate-50 p-4 text-sm space-y-1.5">
              <Row label="Monthly listing fee" value={money(fee)} />
              <Row label="Per delivered trip" value={money(state.feeConfig.perTripCommission)} />
              <Row label="Commission on food sales" value={`${state.feeConfig.commission[d.tier]}%`} />
            </div>
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" className="mt-1 w-4 h-4 accent-black" checked={d.agree} onChange={(e) => set('agree', e.target.checked)} />
              <span className="text-sm">I agree to the partner terms: a {money(fee)} listing fee every 30 days, {money(state.feeConfig.perTripCommission)} per delivered trip and {state.feeConfig.commission[d.tier]}% commission on food sales, deducted from payouts.</span>
            </label>
            {errors.agree && <p className="text-sm text-red-600">{errors.agree}</p>}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h2 className="font-bold text-lg">Pay your first month</h2>
            <div className="rounded-2xl bg-black text-white p-4 flex items-center justify-between">
              <div><div className="text-sm text-white/70">Listing fee · 30 days</div><div className="text-xs text-white/60">Your 30 days start when your store goes live</div></div>
              <div className="text-2xl font-extrabold tabular">{money(fee)}</div>
            </div>
            <div className="space-y-2" role="radiogroup" aria-label="Payment method">
              {PAYMENT_METHODS.map((m) => {
                const Icon = m.key === 'card' ? CreditCard : m.key === 'mobile_banking' ? Smartphone : Landmark
                return (
                  <button type="button" role="radio" aria-checked={method === m.key} key={m.key} onClick={() => setMethod(m.key)}
                    className={cn('w-full p-3.5 rounded-xl border-2 flex items-center gap-3 text-left transition', method === m.key ? 'border-black' : 'border-slate-200')}>
                    <Icon size={20} />
                    <span className="flex-1"><span className="font-semibold text-sm block">{m.label}</span><span className="text-xs text-slate-500">{m.hint}</span></span>
                    {method === m.key && <Check size={18} />}
                  </button>
                )
              })}
            </div>
            {method === 'bank_transfer' && (
              <div className="rounded-xl border border-dashed border-slate-300 p-4 text-sm">
                Use this reference on your transfer: <b className="font-mono">{reference}</b>
                <p className="text-xs text-slate-500 mt-1">The platform’s bank account details will appear here once they are configured.</p>
              </div>
            )}
            <div className="rounded-xl bg-amber-50 text-amber-900 text-sm p-3 flex gap-2">
              <ShieldCheck size={18} className="shrink-0 mt-0.5" />
              <span><b>Demo mode — no money is taken</b> and no card details are collected here. When a payment gateway is connected, this button opens the bank’s secure payment page.</span>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 flex gap-3">
        {step > 0 && <button className="btn-secondary h-12 px-5" onClick={back} disabled={paying}><ArrowLeft size={16} />Back</button>}
        {step < 4 && <button className="btn-primary flex-1" onClick={next}>Continue<ArrowRight size={16} /></button>}
        {step === 4 && (
          <button className="btn-brand flex-1" onClick={pay} disabled={paying}>
            {paying ? <><Loader2 size={18} className="animate-spin" />Processing…</> : method === 'bank_transfer' ? <>I’ve made the transfer · submit</> : <>Pay {money(fee)} & submit</>}
          </button>
        )}
      </div>
    </div>
  )
}

function Field({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <div className="label">{label}</div>
      {children}
      {error ? <p className="text-sm text-red-600 mt-1" role="alert">{error}</p> : hint ? <p className="text-xs text-slate-500 mt-1">{hint}</p> : null}
    </div>
  )
}

function DocumentsStep({ d, set, errors }: { d: PartnerDraft; set: <K extends keyof PartnerDraft>(k: K, v: PartnerDraft[K]) => void; errors: DraftErrors }) {
  const [photoError, setPhotoError] = useState('')
  const docs: { key: keyof PartnerDraft['docs']; label: string; hint: string }[] = [
    { key: 'tradeLicense', label: 'Trade licence', hint: 'PDF or photo' },
    { key: 'foodSafety', label: 'Food hygiene certificate', hint: 'Issued by the Public Health Authority' },
    { key: 'bankDetails', label: 'Proof of bank account', hint: 'Bank letter or statement header showing account name' },
    { key: 'menu', label: 'Menu', hint: 'PDF or photos — you can also build it in the Merchant portal' },
  ]
  return (
    <div className="space-y-5">
      <h2 className="font-bold text-lg">Documents & photo</h2>

      <div>
        <div className="label">Cover photo</div>
        <label className={cn('relative block aspect-[16/9] rounded-2xl border-2 border-dashed overflow-hidden cursor-pointer transition', errors.coverImage || photoError ? 'border-red-400' : 'border-slate-300 hover:border-slate-500')}>
          {d.coverImage ? (
            <>
              <img src={d.coverImage} alt="Cover preview" className="absolute inset-0 w-full h-full object-cover" />
              <span className="absolute bottom-3 right-3 btn-secondary h-9 text-sm bg-white"><Camera size={15} />Change</span>
            </>
          ) : (
            <span className="absolute inset-0 grid place-items-center text-center text-slate-500 p-4">
              <span><Camera className="mx-auto" size={28} /><span className="block font-semibold mt-2">Add a cover photo</span><span className="block text-xs">A bright photo of your best dish works well · JPG or PNG</span></span>
            </span>
          )}
          <input type="file" accept="image/*" className="sr-only" aria-label="Cover photo"
            onChange={async (e) => {
              const f = e.target.files?.[0]
              if (!f) return
              try { setPhotoError(''); set('coverImage', await readImageFile(f)) } catch (err) { setPhotoError((err as Error).message) }
            }} />
        </label>
        {(photoError || errors.coverImage) && <p className="text-sm text-red-600 mt-1" role="alert">{photoError || errors.coverImage}</p>}
      </div>

      <div className="space-y-2">
        {docs.map((doc) => {
          const file = d.docs[doc.key]
          const err = errors[`docs.${doc.key}` as keyof DraftErrors]
          return (
            <div key={doc.key}>
              <div className={cn('flex items-center gap-3 p-3 rounded-xl border', file ? 'border-emerald-300 bg-emerald-50' : err ? 'border-red-300' : 'border-slate-200')}>
                {file ? <CheckCircle2 className="text-emerald-600 shrink-0" size={20} /> : <FileText className="text-slate-400 shrink-0" size={20} />}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">{doc.label}</div>
                  <div className="text-xs text-slate-500 truncate">{file ?? doc.hint}</div>
                </div>
                {file ? (
                  <button type="button" className="icon-btn w-8 h-8" aria-label={`Remove ${doc.label}`} onClick={() => set('docs', { ...d.docs, [doc.key]: undefined })}><X size={16} /></button>
                ) : (
                  <label className="btn-secondary h-9 text-sm cursor-pointer"><Upload size={14} />Upload
                    <input type="file" accept="image/*,application/pdf" className="sr-only" aria-label={`Upload ${doc.label}`}
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) set('docs', { ...d.docs, [doc.key]: f.name }) }} />
                  </label>
                )}
              </div>
              {err && <p className="text-sm text-red-600 mt-1" role="alert">{err}</p>}
            </div>
          )
        })}
        <label className="flex items-center gap-2 text-sm pt-1 cursor-pointer">
          <input type="checkbox" className="w-4 h-4 accent-black" checked={d.menuLater} onChange={(e) => set('menuLater', e.target.checked)} />
          I’ll add my menu later in the Merchant portal
        </label>
      </div>
      <p className="text-xs text-slate-500">Documents are only used to verify your business. In this prototype only the file names are kept.</p>
    </div>
  )
}

// ── Status ───────────────────────────────────────────────────

function StatusPage() {
  const { id = '' } = useParams()
  const { state } = useStore()
  const app = state.applications.find((a) => a.id.toUpperCase() === id.toUpperCase())

  if (!app) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="text-4xl">🔎</div>
        <h1 className="text-2xl font-extrabold mt-3">Application not found</h1>
        <p className="text-slate-500 mt-1">Check the number and try again. Applications are saved in the browser they were made in.</p>
        <Link to="/partner" className="btn-primary mt-6">Back to partner home</Link>
      </div>
    )
  }

  const restaurant = state.restaurants.find((r) => r.id === `new-${app.id}`)
  const steps = [
    { label: 'Application submitted', done: true, at: app.submittedAt },
    { label: app.firstPayment ? `First month paid · ${money(app.firstPayment.amount)}` : 'Payment', done: !!app.firstPayment, at: app.firstPayment?.at },
    { label: app.status === 'rejected' ? 'Application declined' : app.status === 'info_requested' ? 'More information needed' : 'Documents reviewed', done: app.status !== 'pending', at: undefined },
    { label: 'Store live on Eats', done: app.status === 'approved', at: undefined },
  ]

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-6 py-8 md:py-12">
      <div className="flex items-center gap-2 text-sm text-slate-500"><Receipt size={16} />Application <b className="text-black font-mono">{app.id}</b></div>
      <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-1">
        {app.status === 'approved' ? `${app.businessName} is live!` : app.status === 'rejected' ? 'Application declined' : app.status === 'info_requested' ? 'We need a bit more information' : 'Thanks — we’re reviewing your application'}
      </h1>
      <p className="text-slate-500 mt-1">
        {app.status === 'pending' && 'Our team checks documents within 1–2 working days. Keep your application number to check back here.'}
        {app.status === 'info_requested' && `We’ll contact you on ${app.phone ?? 'your phone'}${app.email ? ` or ${app.email}` : ''}.`}
        {app.status === 'rejected' && 'Your first month’s fee will be refunded to the original payment method.'}
        {app.status === 'approved' && 'Your 30-day listing has started. Add your menu and start taking orders.'}
      </p>

      <div className="card mt-6 overflow-hidden">
        {app.coverImage && <img src={app.coverImage} alt={`${app.businessName} cover`} className="w-full aspect-[16/7] object-cover" />}
        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div><div className="font-bold text-lg">{app.businessName}</div><div className="text-sm text-slate-500">{app.cuisine} · {app.area}</div></div>
            <Badge tone={app.status === 'approved' ? 'green' : app.status === 'rejected' ? 'red' : app.status === 'info_requested' ? 'amber' : 'slate'} className="capitalize">{app.status.replace('_', ' ')}</Badge>
          </div>
          <ol className="mt-5 space-y-3">
            {steps.map((s) => (
              <li key={s.label} className="flex items-center gap-3 text-sm">
                <span className={cn('w-6 h-6 rounded-full grid place-items-center shrink-0', s.done ? 'bg-brand text-white' : 'bg-slate-100 text-slate-400')}>{s.done ? <Check size={14} /> : <Clock size={13} />}</span>
                <span className={cn('flex-1', !s.done && 'text-slate-500')}>{s.label}</span>
                {s.at && <span className="text-xs text-slate-400">{shortDate(s.at)}</span>}
              </li>
            ))}
          </ol>
        </div>
      </div>

      {app.firstPayment && (
        <div className="card mt-4 p-5 text-sm">
          <div className="font-bold mb-2 flex items-center gap-2"><BadgeCheck size={18} />Receipt</div>
          <dl className="space-y-1.5">
            <Row label="Listing fee (30 days)" value={money(app.firstPayment.amount)} />
            <Row label="Method" value={PAYMENT_METHODS.find((m) => m.key === app.firstPayment!.method)?.label} />
            <Row label="Reference" value={<span className="font-mono">{app.firstPayment.reference}</span>} />
            <Row label="Paid" value={shortDate(app.firstPayment.at)} />
          </dl>
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        {restaurant ? (
          <>
            <Link to={`/merchant?store=${restaurant.id}`} className="btn-primary">Open Merchant portal</Link>
            <Link to={`/store/${restaurant.id}`} className="btn-secondary h-12 px-5">View your store</Link>
          </>
        ) : (
          <Link to="/partner" className="btn-secondary h-12 px-5">Partner home</Link>
        )}
      </div>
      {app.status === 'pending' && <p className="text-xs text-slate-400 mt-6">Prototype tip: approve it under Platform Admin → Onboarding.</p>}
    </div>
  )
}
