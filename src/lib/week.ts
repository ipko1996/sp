/**
 * The date line is a plain string on the poster, because that is what it is on paper. These
 * turn it into a week that can be stepped, so the owner never has to retype five date parts.
 *
 * The week is Monday to Friday — the poster carries five weekdays.
 */

const pad = (value: number): string => String(value).padStart(2, '0')

export function mondayOf(date: Date): Date {
  const monday = new Date(date)
  const weekday = monday.getDay()
  monday.setDate(monday.getDate() + (weekday === 0 ? -6 : 1 - weekday))
  monday.setHours(0, 0, 0, 0)
  return monday
}

export function formatWeek(monday: Date): string {
  const friday = new Date(monday)
  friday.setDate(monday.getDate() + 4)

  const start = `${String(monday.getFullYear())}. ${pad(monday.getMonth() + 1)}. ${pad(monday.getDate())}.`
  // The year is repeated only when the week straddles a new one, matching how it is written
  // by hand.
  const end =
    friday.getFullYear() === monday.getFullYear()
      ? `${pad(friday.getMonth() + 1)}. ${pad(friday.getDate())}.`
      : `${String(friday.getFullYear())}. ${pad(friday.getMonth() + 1)}. ${pad(friday.getDate())}.`

  return `${start} – ${end}`
}

/**
 * Reads the week's start out of whatever is written on the poster. Deliberately lenient: the
 * text is freely editable, and the separators have never been consistent.
 */
export function parseWeekStart(text: string): Date | null {
  const match = /(\d{4})\D+(\d{1,2})\D+(\d{1,2})/.exec(text)
  if (!match) return null

  const [, year, month, day] = match
  const date = new Date(Number(year), Number(month) - 1, Number(day))
  return Number.isNaN(date.getTime()) ? null : date
}

/** Steps the written week by whole weeks. Unreadable text falls back to the current one. */
export function shiftWeek(text: string, weeks: number): string {
  const parsed = parseWeekStart(text)
  const monday = mondayOf(parsed ?? new Date())
  monday.setDate(monday.getDate() + weeks * 7)
  return formatWeek(monday)
}

export function currentWeek(today = new Date()): string {
  return formatWeek(mondayOf(today))
}

/** The date of one weekday of the written week, Monday being index 0. */
export function weekdayDate(text: string, index: number): Date | null {
  const parsed = parseWeekStart(text)
  if (!parsed) return null

  const date = mondayOf(parsed)
  date.setDate(date.getDate() + index)
  return date
}
