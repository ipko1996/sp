import { useLayoutEffect, useRef } from 'react'

import { useFontsReady } from './fonts-ready.ts'

const DAY_FONT_SIZE = 31
const DAY_MIN_FONT_SIZE = 22
const DAY_LABEL_WIDTH = 140

/**
 * Steps a day name down only when it would outgrow its brush label and run into the divider.
 *
 * The Handlebars build had to estimate this from a table of per-character advance widths, because
 * a template has no access to what it rendered. Here the element can simply be measured, so an
 * unusual name is sized from what it actually is rather than from a guess about its letters.
 *
 * The size is written straight to the node rather than held in state: it is derived from the
 * rendered result, so routing it back through a render would only buy an extra pass.
 */
export function useFitText(text: string, maxWidth = DAY_LABEL_WIDTH) {
  const ref = useRef<HTMLElement>(null)
  const fontsReady = useFontsReady()

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return

    el.style.fontSize = `${String(DAY_FONT_SIZE)}px`

    // The label is stretched edge to edge so the name can centre on the brush, which means the
    // element's own width is the brush's, not the text's. Only a range over the contents gives
    // the advance width the fitting actually depends on.
    const range = document.createRange()
    range.selectNodeContents(el)
    const natural = range.getBoundingClientRect().width
    if (natural === 0 || natural <= maxWidth) return

    const fitted = DAY_FONT_SIZE * (maxWidth / natural)
    const size = Math.round(Math.max(DAY_MIN_FONT_SIZE, fitted) * 10) / 10
    el.style.fontSize = `${String(size)}px`
  }, [text, maxWidth, fontsReady])

  return ref
}
