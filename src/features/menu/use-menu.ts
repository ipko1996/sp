import { useCallback, useEffect, useRef, useState } from 'react'

import { currentWeek, shiftWeek } from '../../lib/week.ts'
import { MAX_DISHES, MIN_DISHES, type Menu } from '../../types/menu.ts'
import { defaultMenu } from './default-menu.ts'
import { clearMenu, loadMenu, saveMenu } from './storage.ts'

export interface MenuActions {
  /** Edits the menu through a mutable draft. Only ever called on commit, never per keystroke. */
  update: (mutate: (draft: Menu) => void) => void
  addDish: (dayId: string) => void
  removeDish: (dayId: string, index: number) => void
  toggleClosed: (dayId: string) => void
  closeForHoliday: (dayId: string, note: string) => void
  addDishType: () => void
  removeDishType: (id: string) => void
  startNewWeek: () => void
  reset: () => void
}

// A menu saved before a field existed is missing it entirely, and the app would read undefined
// where it expects a list. Filling the gaps from the defaults keeps an old save working.
const withDefaults = (saved: Menu | null): Menu =>
  saved ? { ...structuredClone(defaultMenu), ...saved } : structuredClone(defaultMenu)

export function useMenu(): { menu: Menu; actions: MenuActions } {
  const [menu, setMenu] = useState<Menu>(() => withDefaults(loadMenu()))

  // The first render is the load, which is already what is on disk — saving it back would be a
  // pointless write on every startup.
  const loaded = useRef(false)
  useEffect(() => {
    if (loaded.current) saveMenu(menu)
    loaded.current = true
  }, [menu])

  const update = useCallback((mutate: (draft: Menu) => void) => {
    setMenu((current) => {
      const draft = structuredClone(current)
      mutate(draft)
      return draft
    })
  }, [])

  const actions: MenuActions = {
    update,

    addDish: useCallback(
      (dayId: string) => {
        update((draft) => {
          const day = draft.days.find((d) => d.id === dayId)
          if (!day || day.dishes.length >= MAX_DISHES) return
          day.dishes.push({ name: '', price: 0 })
        })
      },
      [update],
    ),

    removeDish: useCallback(
      (dayId: string, index: number) => {
        update((draft) => {
          const day = draft.days.find((d) => d.id === dayId)
          if (!day || day.dishes.length <= MIN_DISHES) return
          day.dishes.splice(index, 1)
        })
      },
      [update],
    ),

    // The dishes stay in the draft while a day is shut, so turning ZÁRVA back off brings the
    // week back exactly as it was rather than handing back an empty day.
    toggleClosed: useCallback(
      (dayId: string) => {
        update((draft) => {
          const day = draft.days.find((d) => d.id === dayId)
          if (day) day.closed = !day.closed
        })
      },
      [update],
    ),

    // A suggestion, accepted. It may replace wording it wrote itself — otherwise a note left over
    // from a previous week would block the suggestion for this one — but never a reason typed by
    // hand, because the holiday is a guess about the calendar and the typed text is a statement
    // about the shop. The two are told apart by value.
    closeForHoliday: useCallback(
      (dayId: string, note: string) => {
        update((draft) => {
          const day = draft.days.find((d) => d.id === dayId)
          if (!day) return

          day.closed = true
          const byHand = day.closedNote !== undefined && day.closedNote !== day.closedNoteSuggested
          if (byHand) return

          day.closedNote = note
          day.closedNoteSuggested = note
        })
      },
      [update],
    ),

    addDishType: useCallback(() => {
      update((draft) => {
        draft.dishTypes.push({
          id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
          name: '',
          price: 0,
        })
      })
    }, [update]),

    removeDishType: useCallback(
      (id: string) => {
        update((draft) => {
          draft.dishTypes = draft.dishTypes.filter((type) => type.id !== id)
        })
      },
      [update],
    ),

    /**
     * Clears the board for next week's menu: the dates move on, every day reopens and the dish
     * names empty out.
     *
     * Prices are deliberately kept. They track the kind of dish rather than the dish itself —
     * 1700 for a főzelék, 2000 for a main, 1400 for a tészta — and are the same most weeks, so
     * clearing them would mean retyping eighteen numbers to get back where you started. The
     * restaurant's own details, the side prices, the footer and the photos are not menu content
     * and are left alone.
     */
    startNewWeek: useCallback(() => {
      update((draft) => {
        draft.dateRange = shiftWeek(currentWeek(), 1)

        for (const day of draft.days) {
          day.closed = false
          day.closedNote = undefined
          day.closedNoteSuggested = undefined
          for (const dish of day.dishes) dish.name = ''
          day.menu.name = ''
        }
      })
    }, [update]),

    reset: useCallback(() => {
      clearMenu()
      setMenu(structuredClone(defaultMenu))
    }, []),
  }

  return { menu, actions }
}
