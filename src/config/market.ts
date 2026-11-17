// ─────────────────────────────────────────────────────────────
// Market configuration — Seychelles.
// Everything country-specific lives here (plus the mock catalogue
// in data/mock.ts). To launch another market, copy this file.
// ─────────────────────────────────────────────────────────────

export const MARKET = {
  country: 'Seychelles',
  countryCode: 'SC',
  /** Seychelles Rupee */
  currency: 'SCR',
  locale: 'en-SC',
  timeZone: 'Indian/Mahe', // UTC+4
  /** Standard VAT rate administered by the Seychelles Revenue Commission */
  vatPct: 15,
  phonePrefix: '+248',
  islands: ['Mahé', 'Praslin', 'La Digue'],
  defaultRegionLabel: 'Seychelles · Mahé',
  opsEmail: 'ops@eats.sc',
} as const
