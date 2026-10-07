import { useCallback, useState, type RefObject } from 'react'
import { toBlob } from 'html-to-image'

import { POSTER_HEIGHT, POSTER_WIDTH, type Menu } from '../../types/menu.ts'

const SCALE = 2

const fileName = (menu: Menu): string => {
  const slug = menu.dateRange
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
  return `etlap-${slug || 'heti-ajanlat'}.png`
}

/**
 * Swaps each photo to its cached copy for the duration of the capture.
 *
 * A photo rendered from a path beside the HTML taints the canvas in Chrome, so `toDataURL`
 * throws and no PNG comes out at all. The cache holds the same image as a data URI, which the
 * exporter can read. Returns a restore function, and the slots it could not cover.
 */
async function withCachedPhotos(poster: HTMLElement): Promise<{
  restore: () => void
  uncached: string[]
}> {
  const images = [...poster.querySelectorAll<HTMLImageElement>('img[data-slot]')]
  const original = images.map((img) => img.getAttribute('src') ?? '')
  const uncached: string[] = []

  await Promise.all(
    images.map(async (img, i) => {
      const src = original[i] ?? ''
      if (src.startsWith('data:')) return

      const cached = img.dataset.exportSrc
      if (!cached) {
        uncached.push(img.dataset.slot ?? '')
        return
      }
      img.src = cached
      await img.decode().catch(() => null)
    }),
  )

  return {
    uncached,
    restore: () => {
      images.forEach((img, i) => {
        const src = original[i]
        if (src !== undefined) img.src = src
      })
    },
  }
}

// Chrome reports an empty `cssText` for SVG elements, which is the fast path html-to-image uses
// to copy styles onto the clone. The paint properties therefore never arrive and everything falls
// back to its initial value: black fills, and `currentColor` resolving to black. Writing the
// resolved values on as inline styles for the duration of the capture keeps the palette in CSS,
// where the whole poster can still be recoloured from one place.
const PAINT: readonly string[] = ['color', 'fill', 'stroke', 'stop-color']
const STOP_PAINT: readonly string[] = ['stop-color']

function withInlinedSvgPaint(poster: HTMLElement): () => void {
  const nodes = [...poster.querySelectorAll<SVGElement>('svg, svg *')]
  const original = nodes.map((node) => node.getAttribute('style'))

  for (const node of nodes) {
    // Shapes inside <defs> are templates that each <use> paints from its own context — the olive
    // blades are drawn by inheriting `fill: none` from the branch they are placed in. Pinning a
    // resolved value onto the template would override that and fill every instance solid black.
    // Gradient stops are the exception: they carry their own colour and inherit nothing.
    const properties = node.closest('defs') ? (node.tagName === 'stop' ? STOP_PAINT : []) : PAINT

    const computed = getComputedStyle(node)
    for (const property of properties) {
      const value = computed.getPropertyValue(property)
      if (value) node.style.setProperty(property, value)
    }
  }

  return () => {
    nodes.forEach((node, i) => {
      const style = original[i]
      if (style === null || style === undefined) node.removeAttribute('style')
      else node.setAttribute('style', style)
    })
  }
}

export function usePng(
  posterRef: RefObject<HTMLDivElement | null>,
  menu: Menu,
  onNotice: (message: string) => void,
) {
  const [busy, setBusy] = useState(false)

  const save = useCallback(async () => {
    const poster = posterRef.current
    if (!poster || busy) return

    if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
    setBusy(true)

    // Attribute, not state: the chrome has to be gone before the very next line runs, and a
    // React re-render would not have happened yet.
    poster.dataset.mode = 'export'
    const restorePaint = withInlinedSvgPaint(poster)
    const photos = await withCachedPhotos(poster)

    try {
      const blob = await toBlob(poster, {
        pixelRatio: SCALE,
        width: POSTER_WIDTH,
        height: POSTER_HEIGHT,
        // The CSS already hides these; excluding them from the clone too means a stray control
        // can never ride along on a mis-scoped selector.
        filter: (node) => !(node instanceof Element && node.classList.contains('edit-only')),
      })
      if (!blob) throw new Error('empty image')

      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName(menu)
      link.click()
      setTimeout(() => {
        URL.revokeObjectURL(url)
      }, 10_000)

      onNotice(
        photos.uncached.length > 0
          ? `PNG kész, de a kép(ek) kimaradtak: ${photos.uncached.join(', ')}. Válaszd ki őket újra.`
          : `PNG mentve (${String(POSTER_WIDTH * SCALE)}×${String(POSTER_HEIGHT * SCALE)}).`,
      )
    } catch (error) {
      onNotice(
        photos.uncached.length > 0
          ? 'A PNG nem készült el: válaszd ki újra a fényképeket, utána próbáld újra.'
          : `A PNG nem készült el: ${error instanceof Error ? error.message : String(error)}`,
      )
    } finally {
      photos.restore()
      restorePaint()
      poster.dataset.mode = 'edit'
      setBusy(false)
    }
  }, [posterRef, menu, busy, onNotice])

  return { save, busy }
}
