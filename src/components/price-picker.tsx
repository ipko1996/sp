interface PricePickerProps {
  options: { id: string; name: string; price: number }[]
  onPick: (price: number) => void
}

/**
 * The recurring prices, offered where the price is written.
 *
 * Laid out as one horizontal row anchored to the row it belongs to, rather than as a drop-down.
 * A drop-down near the bottom of the page would open past the edge, and the poster clips its
 * overflow, so it would need measuring and flipping; a single row is always the height of the
 * row it sits on and can never fall off the page.
 */
export function PricePicker({ options, onPick }: PricePickerProps) {
  if (options.length === 0) return null

  return (
    <div className="edit-only price-picker">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          className="price-pill"
          title={`${option.name || 'Névtelen'} — ${String(option.price)} Ft`}
          onClick={() => {
            onPick(option.price)
          }}
        >
          <span className="price-pill-name">{option.name || '—'}</span>
          <span className="price-pill-value">{option.price}</span>
        </button>
      ))}
    </div>
  )
}
