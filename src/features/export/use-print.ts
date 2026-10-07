import { useCallback, useEffect, type RefObject } from 'react'

/**
 * Printing runs the poster through exactly the same switch as the PNG export.
 *
 * `print.css` hides the shell and scales the page, but everything that distinguishes an editable
 * poster from a finished one — the placeholders, the outline on a missing photo, an empty closure
 * reason still holding its line open — hangs off `data-mode` on the poster. Leaving it set to
 * `edit` while printing put all of that on paper. Driving it from the print events rather than
 * from the button means Ctrl+P is covered too.
 */
export function usePrint(posterRef: RefObject<HTMLDivElement | null>): () => void {
  useEffect(() => {
    const enter = () => {
      if (posterRef.current) posterRef.current.dataset.mode = 'export'
    }
    const leave = () => {
      if (posterRef.current) posterRef.current.dataset.mode = 'edit'
    }

    window.addEventListener('beforeprint', enter)
    window.addEventListener('afterprint', leave)
    return () => {
      window.removeEventListener('beforeprint', enter)
      window.removeEventListener('afterprint', leave)
    }
  }, [posterRef])

  return useCallback(() => {
    // A field left focused would otherwise carry its editing highlight onto the paper.
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
    window.print()
  }, [])
}
