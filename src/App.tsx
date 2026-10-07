import { useEffect, useRef, useState } from 'react'

import { Toolbar } from './components/toolbar.tsx'
import { usePng } from './features/export/use-png.ts'
import { usePrint } from './features/export/use-print.ts'
import { DishTypesPanel } from './features/menu/dish-types-panel.tsx'
import { useMenu } from './features/menu/use-menu.ts'
import { storageAvailable } from './features/menu/storage.ts'
import { Poster } from './features/poster/poster.tsx'
import { POSTER_HEIGHT, POSTER_WIDTH } from './types/menu.ts'

const STAGE_PADDING = 64
const NOTICE_MS = 6000

export default function App() {
  const { menu, actions } = useMenu()
  const posterRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)

  const [notice, setNotice] = useState<string | null>(null)
  const [fitZoom, setFitZoom] = useState(1)
  // null means "keep following the window"; a number is a zoom the user chose.
  const [chosenZoom, setChosenZoom] = useState<number | null>(null)
  const zoom = chosenZoom ?? fitZoom

  const print = usePrint(posterRef)
  const { save, busy } = usePng(posterRef, menu, setNotice)

  useEffect(() => {
    const el = stageRef.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return
      const available = entry.contentRect.width - STAGE_PADDING
      setFitZoom(Math.min(1, Math.max(0.2, available / POSTER_WIDTH)))
    })
    observer.observe(el)
    return () => {
      observer.disconnect()
    }
  }, [])

  useEffect(() => {
    if (notice === null) return
    const timer = setTimeout(() => {
      setNotice(null)
    }, NOTICE_MS)
    return () => {
      clearTimeout(timer)
    }
  }, [notice])

  return (
    <div className="app">
      <Toolbar
        zoom={zoom}
        fitZoom={fitZoom}
        onZoom={(next) => {
          setChosenZoom(Math.abs(next - fitZoom) < 0.005 ? null : next)
        }}
        onPrint={print}
        onSavePng={() => void save()}
        onNewWeek={actions.startNewWeek}
        onReset={actions.reset}
        pngBusy={busy}
        storageAvailable={storageAvailable}
      />

      {notice !== null && (
        <div className="notice" role="status">
          {notice}
        </div>
      )}

      <div className="workspace">
        <DishTypesPanel menu={menu} actions={actions} />

        <div className="stage" ref={stageRef}>
          {/* A transform does not affect layout, so the frame has to carry the scaled size
              itself or the poster would still reserve its full 842x1264 footprint. */}
          <div
            className="sheet-frame"
            style={{ width: POSTER_WIDTH * zoom, height: POSTER_HEIGHT * zoom }}
          >
            <div className="sheet" style={{ transform: `scale(${String(zoom)})` }}>
              <Poster menu={menu} actions={actions} onNotice={setNotice} posterRef={posterRef} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
