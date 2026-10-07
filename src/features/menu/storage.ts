import type { Menu } from '../../types/menu.ts'

const KEY = 'small-postrr:menu'

/**
 * localStorage survives a reload from file:// in both Chrome and Firefox, so it is the store.
 * It can still be missing — a private window, blocked site data — and writes can still hit the
 * quota, so nothing here is allowed to throw into the app.
 */
export const storageAvailable = ((): boolean => {
  try {
    localStorage.setItem(`${KEY}:probe`, '1')
    localStorage.removeItem(`${KEY}:probe`)
    return true
  } catch {
    return false
  }
})()

export function loadMenu(): Menu | null {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Menu) : null
  } catch {
    return null
  }
}

export function saveMenu(menu: Menu): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(menu))
  } catch {
    // Almost always the quota, and almost always the cached photo copies that filled it. The
    // menu text matters more than the export cache, so drop the cache and keep the words.
    try {
      const lean: Menu = {
        ...menu,
        photos: {
          left: { ...menu.photos.left, exportSrc: undefined },
          right: { ...menu.photos.right, exportSrc: undefined },
        },
      }
      localStorage.setItem(KEY, JSON.stringify(lean))
    } catch {
      /* nothing left to try; the session keeps working in memory */
    }
  }
}

export function clearMenu(): void {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
}
