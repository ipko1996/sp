import { useLayoutEffect, useRef, type CSSProperties, type RefObject } from 'react'

export type EditableTag = 'span' | 'div' | 'h1' | 'p'

interface EditableTextProps {
  value: string
  onCommit: (next: string) => void
  as?: EditableTag
  className?: string
  style?: CSSProperties
  /** Shown through CSS when the field is empty, so a blank line is still clickable. */
  placeholder?: string
  /** Supplied by callers that also measure the text, such as the auto-fitting day label. */
  innerRef?: RefObject<HTMLElement | null>
}

/**
 * A field you type into directly on the poster.
 *
 * Deliberately uncontrolled: React writes the text into the node once and then leaves it alone
 * while it has focus. Feeding `value` back as children on every keystroke would rebuild the text
 * node under the caret and send it back to position 0, which is the usual reason contentEditable
 * fields feel broken. Nothing reaches React state until blur, so typing costs no renders at all.
 */
export function EditableText({
  value,
  onCommit,
  as: Tag = 'span',
  className,
  style,
  placeholder,
  innerRef,
}: EditableTextProps) {
  const fallback = useRef<HTMLElement>(null)
  const ref = innerRef ?? fallback

  // Only push a change in from outside — an undo, a reset, a reload. Never while typing.
  useLayoutEffect(() => {
    const el = ref.current
    if (el && document.activeElement !== el && el.textContent !== value) el.textContent = value
  }, [ref, value])

  const commit = () => {
    const el = ref.current
    if (!el) return
    const next = (el.textContent ?? '').replace(/\s+/g, ' ').trim()
    // Rewrite the node when the text is unchanged, to normalise pasted whitespace — and whenever
    // it ends up empty, because a field cleared by hand is often left holding a <br>, which has
    // no text but does stop the element matching :empty.
    if (next === '' || next === value) el.textContent = next
    if (next !== value) onCommit(next)
  }

  return (
    <Tag
      ref={ref as RefObject<HTMLHeadingElement | null>}
      className={className}
      style={style}
      contentEditable
      suppressContentEditableWarning
      spellCheck={false}
      data-editable=""
      data-placeholder={placeholder}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          e.currentTarget.blur()
        } else if (e.key === 'Escape') {
          e.preventDefault()
          e.currentTarget.textContent = value
          e.currentTarget.blur()
        }
      }}
      // Keep pasted text plain; a paste carrying markup would smuggle styling onto the poster.
      onPaste={(e) => {
        e.preventDefault()
        const text = e.clipboardData.getData('text/plain').replace(/\s+/g, ' ')
        document.execCommand('insertText', false, text)
      }}
    />
  )
}
