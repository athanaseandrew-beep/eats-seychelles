import type { ReactNode } from 'react'

// ─────────────────────────────────────────────────────────────
// Stylised vector city map (no tile server / API key needed).
// Replace with Mapbox GL / Google Maps when wiring real GPS.
// Coordinates are in a 400×300 viewBox.
// ─────────────────────────────────────────────────────────────

export type Pt = [number, number]

export const DEFAULT_ROUTE: Pt[] = [[88, 214], [88, 150], [190, 150], [190, 92], [300, 92], [300, 70]]

/** Position at fraction t (0..1) along a polyline, plus heading in degrees. */
export function pointAlong(route: Pt[], t: number): { p: Pt; angle: number } {
  const segs = route.slice(1).map((p, i) => {
    const a = route[i]
    return { a, b: p, len: Math.hypot(p[0] - a[0], p[1] - a[1]) }
  })
  const total = segs.reduce((s, x) => s + x.len, 0)
  let d = Math.max(0, Math.min(1, t)) * total
  for (const s of segs) {
    if (d <= s.len) {
      const k = s.len ? d / s.len : 0
      return { p: [s.a[0] + (s.b[0] - s.a[0]) * k, s.a[1] + (s.b[1] - s.a[1]) * k], angle: (Math.atan2(s.b[1] - s.a[1], s.b[0] - s.a[0]) * 180) / Math.PI }
    }
    d -= s.len
  }
  const last = segs[segs.length - 1]
  return { p: last.b, angle: (Math.atan2(last.b[1] - last.a[1], last.b[0] - last.a[0]) * 180) / Math.PI }
}

export interface HeatZone { x: number; y: number; r: number; level: 1 | 2 | 3; label?: string }

export function CityMap({
  route = DEFAULT_ROUTE, courierAt, courierAngle = 0, showRoute = true, routeProgress = 0,
  heat, storeEmoji = '🍔', showStore = true, showHome = true, className, children,
}: {
  route?: Pt[]
  courierAt?: Pt
  courierAngle?: number
  showRoute?: boolean
  /** 0..1 portion of route already travelled (drawn muted) */
  routeProgress?: number
  heat?: HeatZone[]
  storeEmoji?: string
  showStore?: boolean
  showHome?: boolean
  className?: string
  children?: ReactNode
}) {
  const store = route[0]
  const home = route[route.length - 1]
  const d = 'M' + route.map((p) => p.join(',')).join(' L')
  return (
    <div className={className}>
      <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" className="w-full h-full block" role="img" aria-label="Delivery map">
        <defs>
          <radialGradient id="heat3"><stop offset="0" stopColor="#ef4444" stopOpacity=".55" /><stop offset="1" stopColor="#ef4444" stopOpacity="0" /></radialGradient>
          <radialGradient id="heat2"><stop offset="0" stopColor="#f97316" stopOpacity=".45" /><stop offset="1" stopColor="#f97316" stopOpacity="0" /></radialGradient>
          <radialGradient id="heat1"><stop offset="0" stopColor="#facc15" stopOpacity=".4" /><stop offset="1" stopColor="#facc15" stopOpacity="0" /></radialGradient>
          <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="0" dy="1.5" stdDeviation="2" floodOpacity=".25" /></filter>
        </defs>
        <rect width="400" height="300" fill="#eef1f4" />
        {/* water / coastline */}
        <path d="M0 240 C 60 225, 110 270, 170 262 S 260 300, 400 285 L400 300 L0 300 Z" fill="#cfe5f5" />
        <path d="M0 0 L60 0 C 50 40, 20 60, 0 70 Z" fill="#cfe5f5" />
        {/* parks */}
        <rect x="215" y="160" width="70" height="48" rx="8" fill="#d6ecd2" />
        <rect x="20" y="95" width="45" height="35" rx="6" fill="#d6ecd2" />
        <circle cx="345" cy="200" r="26" fill="#d6ecd2" />
        {/* city blocks */}
        {Array.from({ length: 8 }).map((_, i) =>
          Array.from({ length: 6 }).map((__, j) => (
            <rect key={`${i}-${j}`} x={i * 52 + 6} y={j * 52 + 6} width="40" height="40" rx="4" fill="#e3e7ec" opacity={((i * 7 + j * 3) % 5 === 0) ? 0 : 0.8} />
          )),
        )}
        {/* minor roads */}
        <g stroke="#ffffff" strokeWidth="6" strokeLinecap="round">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => <line key={'v' + i} x1={i * 52 - 3} y1="0" x2={i * 52 - 3} y2="300" />)}
          {[0, 1, 2, 3, 4, 5, 6].map((j) => <line key={'h' + j} x1="0" y1={j * 52 - 3} x2="400" y2={j * 52 - 3} />)}
        </g>
        {/* arterial */}
        <path d="M-10 150 L410 150" stroke="#fde9a8" strokeWidth="10" />
        <path d="M190 -10 L190 310" stroke="#fde9a8" strokeWidth="9" />
        <text x="320" y="146" fontSize="7" fill="#94a3b8" fontWeight="600">5th June Ave</text>

        {heat?.map((h, i) => (
          <g key={i}>
            <circle cx={h.x} cy={h.y} r={h.r} fill={`url(#heat${h.level})`} />
            {h.label && (
              <g transform={`translate(${h.x},${h.y})`}>
                <rect x="-17" y="-8" width="34" height="16" rx="8" fill="#fff" filter="url(#shadow)" />
                <text textAnchor="middle" y="3.5" fontSize="8.5" fontWeight="700" fill={h.level === 3 ? '#dc2626' : h.level === 2 ? '#ea580c' : '#a16207'}>{h.label}</text>
              </g>
            )}
          </g>
        ))}

        {showRoute && (
          <>
            <path d={d} fill="none" stroke="#0f172a" strokeWidth="5" strokeLinejoin="round" strokeLinecap="round" />
            <path d={d} fill="none" stroke="#06C167" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round"
              pathLength={1} strokeDasharray="1" strokeDashoffset={-routeProgress} opacity={0.95} />
          </>
        )}

        {showStore && (
          <g transform={`translate(${store[0]},${store[1]})`} filter="url(#shadow)">
            <circle r="12" fill="#000" />
            <text textAnchor="middle" y="4.5" fontSize="12">{storeEmoji}</text>
          </g>
        )}
        {showHome && (
          <g transform={`translate(${home[0]},${home[1]})`} filter="url(#shadow)">
            <path d="M0 6 C -9 -4, -10 -10, -10 -14 A10 10 0 1 1 10 -14 C 10 -10, 9 -4, 0 6 Z" fill="#06C167" />
            <circle cy="-14" r="4" fill="#fff" />
          </g>
        )}
        {courierAt && (
          <g transform={`translate(${courierAt[0]},${courierAt[1]})`} style={{ transition: 'transform 1s linear' }}>
            <circle r="14" fill="#06C167" opacity=".18"><animate attributeName="r" values="10;18;10" dur="2s" repeatCount="indefinite" /></circle>
            <g transform={`rotate(${courierAngle})`} filter="url(#shadow)">
              <circle r="9" fill="#fff" />
              <path d="M-4 -4 L6 0 L-4 4 L-2 0 Z" fill="#000" />
            </g>
          </g>
        )}
        {children}
      </svg>
    </div>
  )
}
