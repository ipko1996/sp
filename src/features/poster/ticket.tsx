import { EditablePrice } from '../../components/editable-price.tsx'
import { EditableText } from '../../components/editable-text.tsx'
import type { MenuActions } from '../menu/use-menu.ts'
import type { Menu } from '../../types/menu.ts'

interface TicketProps {
  menu: Menu
  actions: MenuActions
}

/** The torn ticket of side prices. Rows are editable but not addable: the ticket is a fixed
 *  117px box and a fifth row would spill out of the artwork. */
export function Ticket({ menu, actions }: TicketProps) {
  const { update } = actions

  return (
    <aside className="ticket">
      <div className="ticket-inner">
        {menu.sidePrices.map((row, i) => (
          <div className="ticket-row" key={i}>
            <EditableText
              className="ticket-label"
              value={row.label}
              onCommit={(next) => {
                update((m) => {
                  const target = m.sidePrices[i]
                  if (target) target.label = next
                })
              }}
            />
            <EditablePrice
              className="ticket-price"
              value={row.price}
              onCommit={(next) => {
                update((m) => {
                  const target = m.sidePrices[i]
                  if (target) target.price = next
                })
              }}
            />
          </div>
        ))}
      </div>
    </aside>
  )
}
