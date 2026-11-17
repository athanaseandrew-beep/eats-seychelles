import { Ban, Layers, Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Modal } from '../../components/ui/Modal'
import { Badge, EmptyState, Segmented, Toggle } from '../../components/ui/primitives'
import { cn, CURRENCY, money, uid } from '../../lib/format'
import { selectMenu, useStore } from '../../store/AppStore'
import type { Dietary, MenuItem, ModifierGroup } from '../../types'

const EMOJIS = ['🍔', '🍟', '🌭', '🍕', '🍣', '🥗', '🍛', '🍜', '🌮', '🥙', '🍗', '🥩', '🍰', '🍩', '☕', '🥤', '🍋', '🧀', '🌶️', '🥑']
const DIETS: Dietary[] = ['vegan', 'vegetarian', 'gluten-free', 'halal']

export function MenuManager({ restaurantId }: { restaurantId: string }) {
  const { state, dispatch } = useStore()
  const r = state.restaurants.find((x) => x.id === restaurantId)!
  const [tab, setTab] = useState<'items' | 'groups'>('items')
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('All')
  const [editing, setEditing] = useState<MenuItem | 'new' | null>(null)
  const [editingGroup, setEditingGroup] = useState<ModifierGroup | 'new' | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<MenuItem | null>(null)

  const items = selectMenu(state, restaurantId)
  const groups = state.modifierGroups.filter((g) => g.restaurantId === restaurantId)
  const categories = ['All', ...new Set([...r.menuCategories.filter((c) => c !== 'Popular'), ...items.map((i) => i.category)])]
  const filtered = items.filter((i) => (cat === 'All' || i.category === cat) && i.name.toLowerCase().includes(q.toLowerCase()))
  const soldOut = items.filter((i) => i.soldOut).length

  return (
    <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-5">
      {/* Store status cards */}
      <div className="grid sm:grid-cols-3 gap-3 mb-5">
        <div className="card p-4 flex items-center justify-between">
          <div><div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Store status</div><div className={cn('font-bold text-lg', r.online ? 'text-emerald-700' : 'text-red-600')}>{r.online ? 'Accepting orders' : 'Paused'}</div></div>
          <Toggle checked={r.online} onChange={(v) => dispatch({ type: 'restaurant/patch', id: r.id, patch: { online: v } })} label="Store online" srOnly />
        </div>
        <div className="card p-4"><div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Menu items</div><div className="font-bold text-lg">{items.length} <span className="text-sm font-medium text-slate-500">· {groups.length} modifier groups</span></div></div>
        <div className="card p-4"><div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">86’d today</div><div className={cn('font-bold text-lg', soldOut ? 'text-red-600' : '')}>{soldOut} sold out</div></div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <Segmented value={tab} onChange={setTab} options={[{ value: 'items', label: 'Items' }, { value: 'groups', label: 'Modifier groups' }]} />
        <div className="flex-1" />
        {tab === 'items' ? (
          <button className="btn-primary h-10 text-sm" onClick={() => setEditing('new')}><Plus size={16} />Add item</button>
        ) : (
          <button className="btn-primary h-10 text-sm" onClick={() => setEditingGroup('new')}><Plus size={16} />New group</button>
        )}
      </div>

      {tab === 'items' ? (
        <>
          <div className="flex flex-col sm:flex-row gap-3 mb-3">
            <div className="flex items-center gap-2 h-10 px-3 rounded-full bg-white border border-slate-200 sm:w-72">
              <Search size={16} className="text-slate-400" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search items" className="outline-none text-sm flex-1 bg-transparent" />
            </div>
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
              {categories.map((c) => <button key={c} onClick={() => setCat(c)} className={cn(cat === c ? 'pill-on' : 'pill-off', 'h-10 shrink-0')}>{c}</button>)}
            </div>
          </div>
          <div className="card overflow-hidden">
            <div className="hidden md:grid grid-cols-[1fr_120px_110px_150px_92px] gap-4 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500 border-b border-slate-200 bg-slate-50">
              <span>Item</span><span>Category</span><span className="text-right">Price</span><span className="text-center">Available</span><span />
            </div>
            {filtered.length === 0 && <EmptyState icon="🍽️" title="No items" />}
            {filtered.map((i) => (
              <div key={i.id} className={cn('grid grid-cols-[1fr_auto] md:grid-cols-[1fr_120px_110px_150px_92px] gap-x-4 gap-y-2 items-center px-4 py-3 border-b border-slate-100 last:border-0', i.soldOut && 'bg-red-50/40')}>
                <div className="flex items-center gap-3 min-w-0">
                  <span className={cn('w-12 h-12 rounded-xl bg-slate-100 grid place-items-center text-2xl shrink-0', i.soldOut && 'grayscale')}>{i.emoji}</span>
                  <div className="min-w-0">
                    <div className="font-semibold truncate flex items-center gap-2">{i.name}{i.soldOut && <Badge tone="red">86</Badge>}</div>
                    <div className="text-xs text-slate-500 truncate">{i.modifierGroupIds.length ? `${i.modifierGroupIds.length} modifier group${i.modifierGroupIds.length > 1 ? 's' : ''}` : 'No modifiers'}{i.dietary?.length ? ` · ${i.dietary.join(', ')}` : ''}</div>
                  </div>
                </div>
                <span className="hidden md:block text-sm text-slate-600">{i.category}</span>
                <span className="text-right font-semibold tabular text-sm">{money(i.price)}</span>
                <div className="col-span-2 md:col-span-1 flex md:justify-center">
                  <button onClick={() => dispatch({ type: 'menu/upsert', item: { ...i, soldOut: !i.soldOut } })}
                    className={cn('h-9 px-3 rounded-full text-xs font-bold inline-flex items-center gap-1.5 transition', i.soldOut ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100')}>
                    {i.soldOut ? <><Ban size={13} />Sold out · restore</> : <>● In stock · 86 it</>}
                  </button>
                </div>
                <div className="hidden md:flex justify-end gap-1">
                  <button className="icon-btn w-9 h-9" onClick={() => setEditing(i)} aria-label="Edit"><Pencil size={15} /></button>
                  <button className="icon-btn w-9 h-9 text-red-600" onClick={() => setConfirmDelete(i)} aria-label="Delete"><Trash2 size={15} /></button>
                </div>
                <div className="md:hidden col-span-2 flex gap-2 -mt-1">
                  <button className="btn-secondary h-8 text-xs" onClick={() => setEditing(i)}><Pencil size={13} />Edit</button>
                  <button className="btn-danger h-8 text-xs" onClick={() => setConfirmDelete(i)}><Trash2 size={13} />Delete</button>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {groups.length === 0 && <div className="md:col-span-2"><EmptyState icon={<Layers />} title="No modifier groups" body="Groups let customers pick sizes, spice levels and add-ons." /></div>}
          {groups.map((g) => {
            const usedBy = items.filter((i) => i.modifierGroupIds.includes(g.id)).length
            return (
              <div key={g.id} className="card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-bold">{g.name}</div>
                    <div className="flex gap-1.5 mt-1">
                      <Badge tone={g.required ? 'black' : 'slate'}>{g.required ? 'Required' : 'Optional'}</Badge>
                      <Badge>{g.type === 'single' ? 'Pick 1' : `Up to ${g.max ?? g.options.length}`}</Badge>
                      <Badge tone="blue">Used by {usedBy}</Badge>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button className="icon-btn w-9 h-9" onClick={() => setEditingGroup(g)} aria-label="Edit group"><Pencil size={15} /></button>
                    <button className="icon-btn w-9 h-9 text-red-600" onClick={() => dispatch({ type: 'modgroup/delete', id: g.id })} aria-label="Delete group"><Trash2 size={15} /></button>
                  </div>
                </div>
                <div className="mt-3 divide-y divide-slate-100 text-sm">
                  {g.options.map((o) => <div key={o.id} className="flex justify-between py-1.5"><span>{o.name}</span><span className="text-slate-500 tabular">{o.price ? `+${money(o.price)}` : 'Included'}</span></div>)}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {editing && <ItemEditor restaurantId={restaurantId} item={editing === 'new' ? null : editing} categories={categories.filter((c) => c !== 'All')} groups={groups} onClose={() => setEditing(null)} />}
      {editingGroup && <GroupEditor restaurantId={restaurantId} group={editingGroup === 'new' ? null : editingGroup} onClose={() => setEditingGroup(null)} />}
      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Delete item?" size="sm"
        footer={<div className="flex gap-2"><button className="btn-secondary h-12 flex-1" onClick={() => setConfirmDelete(null)}>Cancel</button><button className="btn h-12 flex-1 bg-red-600 text-white hover:bg-red-700" onClick={() => { dispatch({ type: 'menu/delete', id: confirmDelete!.id }); setConfirmDelete(null) }}>Delete</button></div>}>
        <p className="text-slate-600"><b>{confirmDelete?.name}</b> will be removed from your menu. Consider marking it sold out instead if it’s temporary.</p>
      </Modal>
    </div>
  )
}

function ItemEditor({ restaurantId, item, categories, groups, onClose }: { restaurantId: string; item: MenuItem | null; categories: string[]; groups: ModifierGroup[]; onClose: () => void }) {
  const { dispatch } = useStore()
  const [draft, setDraft] = useState<MenuItem>(() => item ?? {
    id: uid('m'), restaurantId, category: categories[0] ?? 'Mains', name: '', description: '', price: 0, emoji: '🍔', modifierGroupIds: [], dietary: [],
  })
  const [newCat, setNewCat] = useState('')
  const valid = draft.name.trim().length > 1 && draft.price > 0
  const set = <K extends keyof MenuItem>(k: K, v: MenuItem[K]) => setDraft((d) => ({ ...d, [k]: v }))
  const save = () => {
    const category = newCat.trim() || draft.category
    dispatch({ type: 'menu/upsert', item: { ...draft, category, name: draft.name.trim() } })
    onClose()
  }
  return (
    <Modal open onClose={onClose} title={item ? 'Edit item' : 'New item'} size="lg"
      footer={<div className="flex gap-2 justify-end"><button className="btn-secondary h-12" onClick={onClose}>Cancel</button><button className="btn-primary" disabled={!valid} onClick={save}>{item ? 'Save changes' : 'Add to menu'}</button></div>}>
      <div className="grid md:grid-cols-[1fr_220px] gap-5">
        <div className="space-y-4">
          <div><label className="label">Name</label><input className="input" value={draft.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Classic Smash" /></div>
          <div><label className="label">Description</label><textarea className="input h-auto py-3 resize-none" rows={3} value={draft.description} onChange={(e) => set('description', e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Price ({CURRENCY})</label><input className="input" inputMode="decimal" value={draft.price || ''} onChange={(e) => set('price', Number(e.target.value.replace(/[^\d.]/g, '')) || 0)} /></div>
            <div><label className="label">Category</label>
              <select className="input" value={draft.category} onChange={(e) => set('category', e.target.value)}>{categories.map((c) => <option key={c}>{c}</option>)}</select>
            </div>
          </div>
          <div><label className="label">…or new category</label><input className="input" value={newCat} onChange={(e) => setNewCat(e.target.value)} placeholder="e.g. Combos" /></div>
          <div>
            <label className="label">Modifier groups</label>
            <div className="flex flex-wrap gap-2">
              {groups.length === 0 && <span className="text-sm text-slate-500">No groups yet — create them in the Modifier groups tab.</span>}
              {groups.map((g) => {
                const on = draft.modifierGroupIds.includes(g.id)
                return <button key={g.id} onClick={() => set('modifierGroupIds', on ? draft.modifierGroupIds.filter((x) => x !== g.id) : [...draft.modifierGroupIds, g.id])} className={cn(on ? 'pill-on' : 'pill-off', 'h-8 text-xs')}>{g.name}{g.required && ' *'}</button>
              })}
            </div>
          </div>
          <div>
            <label className="label">Dietary tags</label>
            <div className="flex flex-wrap gap-2">
              {DIETS.map((d) => {
                const on = draft.dietary?.includes(d)
                return <button key={d} onClick={() => set('dietary', on ? draft.dietary!.filter((x) => x !== d) : [...(draft.dietary ?? []), d])} className={cn('pill h-8 text-xs', on ? 'bg-emerald-50 border-emerald-600 text-emerald-800' : 'bg-white border-slate-300')}>{d}</button>
              })}
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="label">Photo</label>
            <div className="aspect-square rounded-2xl bg-slate-100 grid place-items-center text-7xl">{draft.emoji}</div>
            <div className="grid grid-cols-5 gap-1 mt-2">{EMOJIS.map((e) => <button key={e} onClick={() => set('emoji', e)} className={cn('h-9 rounded-lg text-lg', draft.emoji === e ? 'bg-black' : 'hover:bg-slate-100')}>{e}</button>)}</div>
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50"><span className="text-sm font-semibold">Popular</span><Toggle size="sm" checked={!!draft.popular} onChange={(v) => set('popular', v)} /></div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50"><span className="text-sm font-semibold">Sold out (86)</span><Toggle size="sm" tone="red" checked={!!draft.soldOut} onChange={(v) => set('soldOut', v)} /></div>
        </div>
      </div>
    </Modal>
  )
}

function GroupEditor({ restaurantId, group, onClose }: { restaurantId: string; group: ModifierGroup | null; onClose: () => void }) {
  const { dispatch } = useStore()
  const [g, setG] = useState<ModifierGroup>(() => group ?? { id: uid('g'), restaurantId, name: '', type: 'single', required: true, options: [{ id: uid('o'), name: '', price: 0 }] })
  const valid = useMemo(() => g.name.trim() && g.options.length > 0 && g.options.every((o) => o.name.trim()), [g])
  const setOpt = (id: string, patch: Partial<ModifierGroup['options'][number]>) => setG({ ...g, options: g.options.map((o) => (o.id === id ? { ...o, ...patch } : o)) })
  return (
    <Modal open onClose={onClose} title={group ? 'Edit modifier group' : 'New modifier group'}
      footer={<div className="flex gap-2 justify-end"><button className="btn-secondary h-12" onClick={onClose}>Cancel</button><button className="btn-primary" disabled={!valid} onClick={() => { dispatch({ type: 'modgroup/upsert', group: g }); onClose() }}>Save group</button></div>}>
      <div className="space-y-4">
        <div><label className="label">Group name</label><input className="input" value={g.name} onChange={(e) => setG({ ...g, name: e.target.value })} placeholder="e.g. Choose your size" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Selection</label><Segmented className="w-full" value={g.type} onChange={(type) => setG({ ...g, type })} options={[{ value: 'single', label: 'Single' }, { value: 'multi', label: 'Multiple' }]} /></div>
          <div><label className="label">{g.type === 'multi' ? 'Max picks' : 'Rule'}</label>
            {g.type === 'multi' ? <input className="input" type="number" min={1} value={g.max ?? g.options.length} onChange={(e) => setG({ ...g, max: Number(e.target.value) || undefined })} />
              : <div className="h-11 flex items-center"><Toggle checked={g.required} onChange={(required) => setG({ ...g, required })} label="Required" /></div>}
          </div>
        </div>
        {g.type === 'multi' && <Toggle checked={g.required} onChange={(required) => setG({ ...g, required })} label="Required (at least one)" />}
        <div>
          <label className="label">Options</label>
          <div className="space-y-2">
            {g.options.map((o) => (
              <div key={o.id} className="flex gap-2">
                <input className="input flex-1" value={o.name} onChange={(e) => setOpt(o.id, { name: e.target.value })} placeholder="Option name" />
                <input className="input w-28" inputMode="decimal" value={o.price || ''} onChange={(e) => setOpt(o.id, { price: Number(e.target.value.replace(/[^\d.]/g, '')) || 0 })} placeholder={`+ ${CURRENCY}`} />
                <button className="icon-btn" onClick={() => setG({ ...g, options: g.options.filter((x) => x.id !== o.id) })} aria-label="Remove option"><X size={16} /></button>
              </div>
            ))}
          </div>
          <button className="btn-ghost text-sm mt-2" onClick={() => setG({ ...g, options: [...g.options, { id: uid('o'), name: '', price: 0 }] })}><Plus size={16} />Add option</button>
        </div>
      </div>
    </Modal>
  )
}
