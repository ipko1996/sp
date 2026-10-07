import { EditableText } from './editable-text.tsx'

interface EditablePriceProps {
  value: number
  onCommit: (next: number) => void
  className?: string
}

/**
 * Prices are numbers in the data and `1700 Ft` on the poster. Only the digits are editable; the
 * unit is an inert sibling, so there is nothing to type around and no suffix to parse back out.
 */
export function EditablePrice({ value, onCommit, className }: EditablePriceProps) {
  return (
    <span className={className}>
      <EditableText
        value={String(value)}
        placeholder="0"
        onCommit={(next) => {
          const digits = next.replace(/\D/g, '')
          onCommit(digits === '' ? 0 : Number(digits))
        }}
      />
      <span contentEditable={false}> Ft</span>
    </span>
  )
}
