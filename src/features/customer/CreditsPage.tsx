import { PHOTO_CREDITS } from '../../data/credits'
import { assetUrl } from '../../lib/format'

export function CreditsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 pt-6">
      <h1 className="text-3xl font-extrabold tracking-tight">Photo credits</h1>
      <p className="text-slate-500 mt-1 text-sm">Photos are from Wikimedia Commons and are used under the licences below. They are illustrative and do not show the listed businesses.</p>
      <ul className="mt-6 divide-y divide-slate-100">
        {PHOTO_CREDITS.map((c) => (
          <li key={c.file} className="py-3 flex items-center gap-4">
            <img src={assetUrl(`images/${c.file}`)} alt="" loading="lazy" className="w-20 h-14 rounded-lg object-cover bg-slate-100 shrink-0" onError={(e) => { e.currentTarget.style.visibility = 'hidden' }} />
            <div className="min-w-0 text-sm">
              <div className="font-semibold">{c.subject}</div>
              <div className="text-slate-500">
                <a href={c.source} target="_blank" rel="noreferrer" className="underline">Photo</a> by {c.author} ·{' '}
                <a href={c.licenseUrl} target="_blank" rel="noreferrer" className="underline">{c.license}</a>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
