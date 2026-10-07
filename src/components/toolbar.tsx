import { useEffect, useState } from 'react'

type Confirmable = 'newWeek' | 'reset'

interface ToolbarProps {
  zoom: number
  fitZoom: number
  onZoom: (zoom: number) => void
  onPrint: () => void
  onSavePng: () => void
  onNewWeek: () => void
  onReset: () => void
  pngBusy: boolean
  storageAvailable: boolean
}

export function Toolbar({
  zoom,
  fitZoom,
  onZoom,
  onPrint,
  onSavePng,
  onNewWeek,
  onReset,
  pngBusy,
  storageAvailable,
}: ToolbarProps) {
  // Two clicks rather than a confirm(): a modal dialog blocks the page, and throwing away a
  // week of work deserves more than a single stray click. Only one can be pending at a time.
  const [pending, setPending] = useState<Confirmable | null>(null)

  useEffect(() => {
    if (!pending) return
    const timer = setTimeout(() => {
      setPending(null)
    }, 4000)
    return () => {
      clearTimeout(timer)
    }
  }, [pending])

  const confirm = (key: Confirmable, action: () => void) => () => {
    if (pending !== key) return setPending(key)
    action()
    setPending(null)
  }

  // The poster is 842px wide. In a window wider than that, fitting and full size are the same
  // thing and the controls do nothing at all — so they are only offered when they would.
  const canZoom = fitZoom < 0.995

  return (
    <header className="toolbar">
      <span className="toolbar-title">Heti ajánlat</span>

      {canZoom && (
        <>
          <div className="toolbar-group">
            <button
              type="button"
              title="A poszter az ablak szélességéhez igazítva"
              className={Math.abs(zoom - fitZoom) < 0.005 ? 'is-active' : ''}
              onClick={() => {
                onZoom(fitZoom)
              }}
            >
              Ablakhoz
            </button>
            <button
              type="button"
              title="Valós méret — 842 × 1264 képpont"
              className={Math.abs(zoom - 1) < 0.005 ? 'is-active' : ''}
              onClick={() => {
                onZoom(1)
              }}
            >
              Teljes méret
            </button>
          </div>
          <span className="toolbar-zoom">{Math.round(zoom * 100)}%</span>
        </>
      )}

      <div className="toolbar-spacer" />

      {!storageAvailable && (
        <span className="toolbar-warning" title="A böngésző nem enged menteni ebben az ablakban">
          Mentés nem elérhető
        </span>
      )}

      <button
        type="button"
        title="A jövő hét dátuma, üres ételsorok — az árak megmaradnak"
        className={pending === 'newWeek' ? 'toolbar-danger' : ''}
        onClick={confirm('newWeek', onNewWeek)}
      >
        {pending === 'newWeek' ? 'Biztos? Az ételek törlődnek' : 'Új hét'}
      </button>
      <button
        type="button"
        className={pending === 'reset' ? 'toolbar-danger' : 'toolbar-ghost'}
        onClick={confirm('reset', onReset)}
      >
        {pending === 'reset' ? 'Biztos? Minden edit elvész' : 'Alaphelyzet'}
      </button>
      <button type="button" onClick={onPrint} className="toolbar-primary">
        Nyomtatás
      </button>
      <button type="button" onClick={onSavePng} className="toolbar-primary" disabled={pngBusy}>
        {pngBusy ? 'Mentés…' : 'PNG mentése'}
      </button>
    </header>
  )
}
