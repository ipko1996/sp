import type { Menu } from '../../types/menu.ts'
import type { MenuActions } from './use-menu.ts'

interface DishTypesPanelProps {
  menu: Menu
  actions: MenuActions
}

const digits = (value: string): number => {
  const cleaned = value.replace(/\D/g, '')
  return cleaned === '' ? 0 : Number(cleaned)
}

/**
 * The recurring prices, kept beside the poster rather than on it.
 *
 * Fields are uncontrolled and commit on blur, like everything else here, so typing a price does
 * not re-render the poster on every keystroke. The key carries the committed value, so a change
 * from outside — Alaphelyzet, or a reload — replaces the field rather than leaving a stale one
 * behind. Keys are per input, not per row, so tabbing from a name to its price is not interrupted.
 */
export function DishTypesPanel({ menu, actions }: DishTypesPanelProps) {
  const { update, addDishType, removeDishType } = actions

  return (
    <aside className="types-panel">
      <h2 className="types-title">Ártípusok</h2>
      <p className="types-hint">Vidd az egeret egy ár fölé a poszteren, és válassz a listából.</p>

      <ul className="types-list">
        {menu.dishTypes.map((type) => (
          <li className="types-row" key={type.id}>
            <input
              key={`${type.id}:name:${type.name}`}
              className="types-name"
              defaultValue={type.name}
              placeholder="Típus neve"
              onBlur={(e) => {
                const next = e.target.value.trim()
                if (next === type.name) return
                update((m) => {
                  const target = m.dishTypes.find((t) => t.id === type.id)
                  if (target) target.name = next
                })
              }}
            />
            <input
              key={`${type.id}:price:${String(type.price)}`}
              className="types-price"
              inputMode="numeric"
              defaultValue={String(type.price)}
              onBlur={(e) => {
                const next = digits(e.target.value)
                if (next === type.price) return
                update((m) => {
                  const target = m.dishTypes.find((t) => t.id === type.id)
                  if (target) target.price = next
                })
              }}
            />
            <button
              type="button"
              className="types-remove"
              title="Típus törlése"
              onClick={() => {
                removeDishType(type.id)
              }}
            >
              ×
            </button>
          </li>
        ))}
      </ul>

      <button type="button" className="types-add" onClick={addDishType}>
        + Típus
      </button>

      {/* The MENÜ row's price is permanent: every day has one, so it cannot be removed. */}
      <div className="types-row types-row--fixed">
        <span className="types-name types-name--fixed">{menu.menuLabel}</span>
        <input
          key={`menu:price:${String(menu.menuPrice)}`}
          className="types-price"
          inputMode="numeric"
          defaultValue={String(menu.menuPrice)}
          onBlur={(e) => {
            const next = digits(e.target.value)
            if (next === menu.menuPrice) return
            update((m) => {
              m.menuPrice = next
            })
          }}
        />
      </div>
    </aside>
  )
}
