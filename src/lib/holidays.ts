/**
 * Hungarian public holidays, computed rather than tabulated.
 *
 * The fixed dates are a list; the four moveable ones all hang off Easter, which is exact
 * arithmetic. That means no data file to ship and nothing to update each year — which matters
 * for something that is handed over as a single file and then left alone.
 *
 * Deliberately NOT covered: `munkanap-áthelyezés`, the swapped working days that bridge a
 * holiday to the weekend. Those are set by decree each year and cannot be derived, so they would
 * need a hand-maintained table per year. Missing one costs a single click on the Zárva toggle.
 */

export interface Holiday {
  /** Short name, for the hint in the editor. */
  label: string
  /** Written the way a closure is written on the poster: "ÁLLAMI ÜNNEP · AUGUSZTUS 20." */
  note: string
}

const MONTHS = [
  'JANUÁR',
  'FEBRUÁR',
  'MÁRCIUS',
  'ÁPRILIS',
  'MÁJUS',
  'JÚNIUS',
  'JÚLIUS',
  'AUGUSZTUS',
  'SZEPTEMBER',
  'OKTÓBER',
  'NOVEMBER',
  'DECEMBER',
]

const FIXED = new Map<string, Holiday>([
  ['01-01', { label: 'Újév', note: 'ÚJÉV' }],
  ['03-15', { label: 'Nemzeti ünnep', note: 'NEMZETI ÜNNEP' }],
  ['05-01', { label: 'A munka ünnepe', note: 'A MUNKA ÜNNEPE' }],
  ['08-20', { label: 'Államalapítás ünnepe', note: 'ÁLLAMI ÜNNEP' }],
  ['10-23', { label: 'Nemzeti ünnep', note: 'NEMZETI ÜNNEP' }],
  ['11-01', { label: 'Mindenszentek', note: 'MINDENSZENTEK' }],
  ['12-25', { label: 'Karácsony', note: 'KARÁCSONY' }],
  ['12-26', { label: 'Karácsony másnapja', note: 'KARÁCSONY' }],
])

const MOVEABLE: { offset: number; holiday: Holiday }[] = [
  { offset: -2, holiday: { label: 'Nagypéntek', note: 'NAGYPÉNTEK' } },
  { offset: 1, holiday: { label: 'Húsvéthétfő', note: 'HÚSVÉTHÉTFŐ' } },
  { offset: 50, holiday: { label: 'Pünkösdhétfő', note: 'PÜNKÖSDHÉTFŐ' } },
]

const pad = (value: number): string => String(value).padStart(2, '0')

/** Easter Sunday, by the Anonymous Gregorian algorithm (Meeus/Jones/Butcher). */
export function easterSunday(year: number): Date {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(year, month - 1, day)
}

const addDays = (date: Date, days: number): Date => {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

const sameDay = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate()

export function holidayOn(date: Date): Holiday | null {
  const written = `${MONTHS[date.getMonth()] ?? ''} ${String(date.getDate())}.`

  const fixed = FIXED.get(`${pad(date.getMonth() + 1)}-${pad(date.getDate())}`)
  if (fixed) return { label: fixed.label, note: `${fixed.note} · ${written}` }

  const easter = easterSunday(date.getFullYear())
  for (const { offset, holiday } of MOVEABLE) {
    if (sameDay(date, addDays(easter, offset))) {
      return { label: holiday.label, note: `${holiday.note} · ${written}` }
    }
  }

  return null
}
