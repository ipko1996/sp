import type { Ref } from 'react'

import { weekdayDate } from '../../lib/week.ts'
import type { Menu } from '../../types/menu.ts'
import type { MenuActions } from '../menu/use-menu.ts'
import { Day } from './day.tsx'
import { Decor } from './decor.tsx'
import { Footer } from './footer.tsx'
import { Header } from './header.tsx'
import { SvgDefs } from './svg-defs.tsx'
import { Ticket } from './ticket.tsx'

import './poster.css'
import './editing.css'

interface PosterProps {
  menu: Menu
  actions: MenuActions
  onNotice: (message: string) => void
  posterRef: Ref<HTMLDivElement>
}

export function Poster({ menu, actions, onNotice, posterRef }: PosterProps) {
  return (
    <div className="poster" id="poster" ref={posterRef} data-mode="edit">
      <SvgDefs />
      <Decor />
      <Header menu={menu} actions={actions} />
      <Ticket menu={menu} actions={actions} />

      <main className="days" id="days">
        {menu.days.map((day, index) => (
          <Day
            key={day.id}
            day={day}
            date={weekdayDate(menu.dateRange, index)}
            menuLabel={menu.menuLabel}
            closedLabel={menu.closedLabel}
            dishTypes={menu.dishTypes}
            menuPrice={menu.menuPrice}
            actions={actions}
          />
        ))}
        <div className="days-divider" aria-hidden="true" />
      </main>

      <Footer menu={menu} actions={actions} onNotice={onNotice} />
    </div>
  )
}
