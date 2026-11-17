import { Briefcase, Check, Dumbbell, Home, LocateFixed, MapPin, Search } from 'lucide-react'
import { useState } from 'react'
import { Modal } from '../../components/ui/Modal'
import { Segmented } from '../../components/ui/primitives'
import { ADDRESS_SUGGESTIONS, SAVED_ADDRESSES } from '../../data/mock'
import { cn } from '../../lib/format'
import { useStore } from '../../store/AppStore'

const SUGGESTIONS = ADDRESS_SUGGESTIONS
const ICONS = { Home, Work: Briefcase, Gym: Dumbbell } as Record<string, typeof Home>

export function AddressModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, dispatch } = useStore()
  const [q, setQ] = useState('')
  const results = q ? SUGGESTIONS.filter((s) => (s.line1 + s.line2).toLowerCase().includes(q.toLowerCase())) : []

  return (
    <Modal open={open} onClose={onClose} title="Delivery details" size="sm">
      <Segmented className="w-full mb-4" value={state.mode} onChange={(mode) => dispatch({ type: 'mode/set', mode })}
        options={[{ value: 'delivery', label: 'Delivery' }, { value: 'pickup', label: 'Pickup' }]} />
      <div className="flex items-center gap-2 h-12 px-4 rounded-xl bg-slate-100 focus-within:ring-2 focus-within:ring-black">
        <Search size={18} className="text-slate-500" />
        <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search Mahé, Praslin, La Digue…" className="bg-transparent outline-none flex-1" />
      </div>
      <button className="w-full flex items-center gap-3 py-4 border-b border-slate-100 text-left" onClick={() => { dispatch({ type: 'address/set', address: { id: 'gps', label: 'Current location', line1: 'Current location · Victoria', line2: 'Detected via GPS' } }); onClose() }}>
        <span className="w-10 h-10 rounded-full bg-slate-100 grid place-items-center"><LocateFixed size={18} /></span>
        <span className="font-semibold">Use current location</span>
      </button>
      {results.length > 0 && (
        <div className="py-2">
          {results.map((r) => (
            <button key={r.line1} className="w-full flex items-center gap-3 py-3 text-left hover:bg-slate-50 rounded-xl px-2"
              onClick={() => { dispatch({ type: 'address/set', address: { id: r.line1, label: 'New', ...r } }); setQ(''); onClose() }}>
              <MapPin size={18} className="text-slate-500" />
              <span><span className="block font-medium">{r.line1}</span><span className="block text-sm text-slate-500">{r.line2}</span></span>
            </button>
          ))}
        </div>
      )}
      <div className="label mt-4">Saved addresses</div>
      <div className="space-y-1">
        {SAVED_ADDRESSES.map((a) => {
          const Icon = ICONS[a.label] ?? MapPin
          const active = state.address.id === a.id
          return (
            <button key={a.id} onClick={() => { dispatch({ type: 'address/set', address: a }); onClose() }}
              className={cn('w-full flex items-center gap-3 p-3 rounded-2xl text-left transition', active ? 'bg-slate-100' : 'hover:bg-slate-50')}>
              <span className="w-10 h-10 rounded-full bg-white border border-slate-200 grid place-items-center"><Icon size={18} /></span>
              <span className="flex-1 min-w-0">
                <span className="block font-semibold">{a.label}</span>
                <span className="block text-sm text-slate-500 truncate">{a.line1}, {a.line2}</span>
              </span>
              {active && <Check size={20} className="text-brand" />}
            </button>
          )
        })}
      </div>
    </Modal>
  )
}
