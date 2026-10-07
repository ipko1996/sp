import { EditablePrice } from '../../components/editable-price.tsx'
import { EditableText } from '../../components/editable-text.tsx'
import { PricePicker } from '../../components/price-picker.tsx'
import { useFitText } from '../../lib/fit-text.ts'
import { holidayOn } from '../../lib/holidays.ts'
import {
  MAX_DISHES,
  MIN_DISHES,
  type Day as DayData,
  type DishType,
  type Menu,
} from '../../types/menu.ts'
import type { MenuActions } from '../menu/use-menu.ts'

interface DayProps {
  day: DayData
  /** The weekday this column falls on, read off the date line. Null if it cannot be parsed. */
  date: Date | null
  menuLabel: string
  closedLabel: string
  dishTypes: DishType[]
  menuPrice: number
  actions: MenuActions
}

export function Day({
  day,
  date,
  menuLabel,
  closedLabel,
  dishTypes,
  menuPrice,
  actions,
}: DayProps) {
  const { update, addDish, removeDish, toggleClosed, closeForHoliday } = actions
  const nameRef = useFitText(day.name)

  // Only offered on a day that is still open: once it is shut the control's job is to reopen it.
  const holiday = day.closed || !date ? null : holidayOn(date)

  const patchDish = (index: number, patch: Partial<Menu['days'][number]['dishes'][number]>) => {
    update((m) => {
      const target = m.days.find((d) => d.id === day.id)?.dishes[index]
      if (target) Object.assign(target, patch)
    })
  }

  return (
    <section
      className={`day${day.closed ? ' day--closed' : ''}`}
      id={`day-${day.id}`}
      data-day={day.id}
      data-closed={day.closed ? 'true' : 'false'}
    >
      <div className="day-rows">
        <div className="dishes">
          <div className="day-label">
            <svg
              className="day-brush"
              viewBox="0 0 160 58"
              aria-hidden="true"
              preserveAspectRatio="none"
            >
              {/* One washed stroke: long edges kept flat so it reads as a brush mark rather
                  than a pill, with uneven ends and a soft fade. */}
              <defs>
                <linearGradient id={`brush-wash-${day.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop className="wash-a" offset="0" />
                  <stop className="wash-b" offset=".55" />
                  <stop className="wash-c" offset="1" />
                </linearGradient>
              </defs>
              <path
                d="M5 19 C19 9 49 5 85 6 C109 7 135 6 151 11
                   C157 17 158 38 152 46
                   C137 54 105 57 71 56 C45 55 21 54 8 47
                   C1 40 0 26 5 19 Z"
                fill={`url(#brush-wash-${day.id})`}
              />
            </svg>
            <EditableText
              innerRef={nameRef}
              className="day-name"
              value={day.name}
              onCommit={(next) => {
                update((m) => {
                  const target = m.days.find((d) => d.id === day.id)
                  if (target) target.name = next
                })
              }}
            />
            <button
              type="button"
              className={`edit-only day-closed-toggle${holiday ? ' day-closed-toggle--holiday' : ''}`}
              aria-pressed={day.closed}
              data-holiday={holiday?.label}
              title={holiday ? `${holiday.label} — valószínűleg zárva` : undefined}
              onClick={() => {
                if (holiday) closeForHoliday(day.id, holiday.note)
                else toggleClosed(day.id)
              }}
            >
              {day.closed ? 'Nyitva' : holiday ? 'Ünnep · Zárva?' : 'Zárva'}
            </button>
          </div>

          {day.closed ? (
            /* Rules flanking the notice echo the date line in the header, so a closed day reads
               as part of the poster rather than a gap in it. */
            <div className="closed-panel">
              <p className="closed-headline">
                <span className="closed-rule" />
                <EditableText
                  className="closed-label"
                  value={closedLabel}
                  onCommit={(next) => {
                    update((m) => {
                      m.closedLabel = next
                    })
                  }}
                />
                <span className="closed-rule" />
              </p>
              <EditableText
                as="p"
                className="closed-note"
                value={day.closedNote ?? ''}
                placeholder="Zárás oka (nem kötelező)"
                onCommit={(next) => {
                  update((m) => {
                    const target = m.days.find((d) => d.id === day.id)
                    if (target) target.closedNote = next || undefined
                  })
                }}
              />
            </div>
          ) : (
            <>
              {day.dishes.map((dish, i) => (
                <div className="dish-row" key={i}>
                  <EditableText
                    className="dish-name"
                    value={dish.name}
                    placeholder="Étel neve"
                    onCommit={(next) => {
                      patchDish(i, { name: next })
                    }}
                  />
                  <EditablePrice
                    className="dish-price"
                    value={dish.price}
                    onCommit={(next) => {
                      patchDish(i, { price: next })
                    }}
                  />
                  <PricePicker
                    options={dishTypes}
                    onPick={(price) => {
                      patchDish(i, { price })
                    }}
                  />
                  <button
                    type="button"
                    className="edit-only dish-remove"
                    title="Sor törlése"
                    disabled={day.dishes.length <= MIN_DISHES}
                    onClick={() => {
                      removeDish(day.id, i)
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="edit-only dish-add"
                title="Új sor"
                disabled={day.dishes.length >= MAX_DISHES}
                onClick={() => {
                  addDish(day.id)
                }}
              >
                +
              </button>
            </>
          )}
        </div>

        {!day.closed && (
          <div className="menu-row">
            <EditableText
              className="menu-label"
              value={menuLabel}
              onCommit={(next) => {
                update((m) => {
                  m.menuLabel = next
                })
              }}
            />
            <EditableText
              className="dish-name"
              value={day.menu.name}
              placeholder="Menü"
              onCommit={(next) => {
                update((m) => {
                  const target = m.days.find((d) => d.id === day.id)
                  if (target) target.menu.name = next
                })
              }}
            />
            <EditablePrice
              className="dish-price"
              value={day.menu.price}
              onCommit={(next) => {
                update((m) => {
                  const target = m.days.find((d) => d.id === day.id)
                  if (target) target.menu.price = next
                })
              }}
            />
            {/* The MENÜ row has exactly one recurring price, so its picker offers exactly one. */}
            <PricePicker
              options={[{ id: 'menu', name: menuLabel, price: menuPrice }]}
              onPick={(price) => {
                update((m) => {
                  const target = m.days.find((d) => d.id === day.id)
                  if (target) target.menu.price = price
                })
              }}
            />
          </div>
        )}
      </div>
    </section>
  )
}
