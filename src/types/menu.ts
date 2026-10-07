export const POSTER_WIDTH = 842
export const POSTER_HEIGHT = 1264

// The day list is a fixed 810px box with a 28px row pitch; the leftover space is distributed
// between blocks, which is what absorbs a varying number of dishes without the page changing
// height. The MENÜ row is separate and does not count towards either bound.
export const MIN_DISHES = 2
export const MAX_DISHES = 5

export interface Dish {
  name: string
  price: number
}

/**
 * A named price that recurs week to week — a főzelék is 1700, a main is 2000. Editor
 * configuration rather than poster content: nothing here is ever rendered on the page, it only
 * feeds the picker that fills a price in.
 */
export interface DishType {
  id: string
  name: string
  price: number
}

export interface Photo {
  /** Relative path beside the HTML — this is what the page renders. */
  src: string
  alt: string
  /**
   * A downscaled copy of the same photo. Chrome taints the canvas for anything loaded off
   * file://, so `toDataURL` throws and the exporter cannot read `src` at all. This is swapped
   * in for the duration of a PNG export and is never rendered or printed.
   */
  exportSrc?: string
}

export interface Day {
  id: string
  name: string
  closed: boolean
  closedNote?: string
  /**
   * What the holiday suggestion last wrote into `closedNote`. Kept so a later suggestion can
   * replace its own wording — a reopened day keeps its note, so without this a note from one
   * week would block the suggestion for the next — while a reason typed by hand, which differs
   * from this by value, is never touched.
   */
  closedNoteSuggested?: string
  /** Kept while a day is closed, so toggling ZÁRVA back off restores what was there. */
  dishes: Dish[]
  menu: Dish
}

export interface Menu {
  restaurant: { name: string; city: string; address: string; phone: string }
  title: string
  dateRange: string
  badge: { small: string[]; large: string; medium: string }
  sidePrices: { label: string; price: number }[]
  menuLabel: string
  closedLabel: string
  dishTypes: DishType[]
  /** The MENÜ row's recurring price. Permanent, so it lives beside the list rather than in it. */
  menuPrice: number
  days: Day[]
  photos: { left: Photo; right: Photo }
  footer: { takeaway: string; facebook: string }
}
