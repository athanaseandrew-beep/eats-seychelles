import { AlertCircle, Check } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { Modal } from '../../components/ui/Modal'
import { Badge, QtyStepper } from '../../components/ui/primitives'
import { cn, money, uid } from '../../lib/format'
import { unitPrice } from '../../lib/pricing'
import { selectGroups, selectRestaurant, useStore } from '../../store/AppStore'
import type { MenuItem, Restaurant } from '../../types'

export function ItemModal({ item, restaurant, onClose }: { item: MenuItem; restaurant: Restaurant; onClose: () => void }) {
  const { state, dispatch } = useStore()
  const groups = useMemo(() => selectGroups(state, item.modifierGroupIds), [state, item])
  const [sel, setSel] = useState<Record<string, string[]>>({})
  const [qty, setQty] = useState(1)
  const [notes, setNotes] = useState('')
  const [showErrors, setShowErrors] = useState(false)
  const [conflict, setConflict] = useState(false)
  const groupRefs = useRef<Record<string, HTMLDivElement | null>>({})

  const missing = groups.filter((g) => g.required && !(sel[g.id]?.length))
  const price = unitPrice(item, groups, sel)
  const otherStore = state.cart.lines.length > 0 && state.cart.restaurantId !== restaurant.id
  const otherStoreName = selectRestaurant(state, state.cart.restaurantId)?.name

  const toggle = (gid: string, oid: string, type: 'single' | 'multi', max?: number) => {
    setSel((s) => {
      const cur = s[gid] ?? []
      if (type === 'single') return { ...s, [gid]: [oid] }
      if (cur.includes(oid)) return { ...s, [gid]: cur.filter((x) => x !== oid) }
      if (max && cur.length >= max) return s
      return { ...s, [gid]: [...cur, oid] }
    })
  }

  const add = (replace = false) => {
    if (missing.length) {
      setShowErrors(true)
      groupRefs.current[missing[0].id]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    if (otherStore && !replace) { setConflict(true); return }
    const labels = groups.flatMap((g) => (sel[g.id] ?? []).map((oid) => g.options.find((o) => o.id === oid)!.name))
    dispatch({
      type: 'cart/add', replace,
      line: { id: uid('line'), itemId: item.id, restaurantId: restaurant.id, name: item.name, emoji: item.emoji, quantity: qty, selections: sel, selectionLabels: labels, instructions: notes.trim(), unitPrice: price },
    })
    onClose()
  }

  return (
    <>
      <Modal open onClose={onClose} size="md"
        footer={
          <div className="flex items-center gap-3">
            <QtyStepper value={qty} onChange={(v) => setQty(Math.max(1, v))} />
            <button className="btn-primary flex-1" disabled={!restaurant.online} onClick={() => add()}>
              {restaurant.online ? <span className="whitespace-nowrap">Add {qty}<span className="hidden sm:inline"> to order</span> · <span className="tabular">{money(price * qty)}</span></span> : 'Store paused'}
            </button>
          </div>
        }>
        <div className="-mx-5 -mt-2 mb-4 h-48 md:h-56 bg-gradient-to-br from-slate-100 to-slate-200 grid place-items-center text-[96px]">{item.emoji}</div>
        <h2 className="text-2xl font-bold">{item.name}</h2>
        <div className="text-lg font-semibold mt-1">{money(item.price)}</div>
        <p className="text-slate-600 mt-2">{item.description}</p>
        {item.calories && <p className="text-sm text-slate-400 mt-1">{item.calories} cal</p>}

        {groups.map((g) => {
          const chosen = sel[g.id] ?? []
          const err = showErrors && g.required && chosen.length === 0
          return (
            <div key={g.id} ref={(el) => { groupRefs.current[g.id] = el }} className={cn('mt-6 rounded-2xl transition', err && 'ring-2 ring-red-500 ring-offset-4')}>
              <div className="flex items-center justify-between bg-slate-50 -mx-5 px-5 py-3">
                <div>
                  <div className="font-bold">{g.name}</div>
                  <div className="text-xs text-slate-500">{g.type === 'single' ? 'Choose 1' : `Choose up to ${g.max ?? g.options.length}`}</div>
                </div>
                {g.required ? (
                  chosen.length ? <Badge tone="green"><Check size={12} />Done</Badge> : <Badge tone={err ? 'red' : 'black'}>Required</Badge>
                ) : <Badge>Optional</Badge>}
              </div>
              {err && <div className="flex items-center gap-1.5 text-sm text-red-600 mt-2"><AlertCircle size={14} />Please make a selection</div>}
              <div className="divide-y divide-slate-100">
                {g.options.map((o) => {
                  const on = chosen.includes(o.id)
                  const atMax = g.type === 'multi' && !on && g.max !== undefined && chosen.length >= g.max
                  return (
                    <label key={o.id} className={cn('flex items-center gap-3 py-3.5 cursor-pointer', atMax && 'opacity-40 cursor-not-allowed')}>
                      <input type={g.type === 'single' ? 'radio' : 'checkbox'} name={g.id} checked={on} disabled={atMax}
                        onChange={() => toggle(g.id, o.id, g.type, g.max)} className="sr-only" />
                      <span className={cn('w-5 h-5 grid place-items-center border-2 transition shrink-0', g.type === 'single' ? 'rounded-full' : 'rounded-md', on ? 'border-black bg-black' : 'border-slate-300')}>
                        {on && (g.type === 'single' ? <span className="w-2 h-2 rounded-full bg-white" /> : <Check size={13} className="text-white" strokeWidth={3} />)}
                      </span>
                      <span className="flex-1 font-medium">{o.name}</span>
                      {o.price > 0 && <span className="text-sm text-slate-600 tabular">+{money(o.price)}</span>}
                    </label>
                  )
                })}
              </div>
            </div>
          )
        })}

        <div className="mt-6">
          <label className="font-bold block mb-2" htmlFor="notes">Special instructions</label>
          <textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value.slice(0, 200))} rows={3} placeholder="e.g. no onions, sauce on the side"
            className="input h-auto py-3 resize-none" />
          <div className="text-xs text-slate-400 text-right mt-1">{notes.length}/200</div>
        </div>
      </Modal>

      <Modal open={conflict} onClose={() => setConflict(false)} title="Start a new order?" size="sm"
        footer={<div className="flex gap-2"><button className="btn-secondary h-12 flex-1" onClick={() => setConflict(false)}>Cancel</button><button className="btn-primary flex-1" onClick={() => add(true)}>New order</button></div>}>
        <p className="text-slate-600">Your cart has items from <b>{otherStoreName}</b>. Carts can contain items from one store at a time — starting a new order will clear it.</p>
      </Modal>
    </>
  )
}
