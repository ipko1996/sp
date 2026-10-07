import { useEffect, useState } from 'react'

// `document.fonts.ready` settles for whatever the page has asked for so far, which early on can
// be nothing at all — measuring then yields a fallback face's metrics, which for a condensed
// display face are wildly too wide. Requesting the two faces by name first is what makes the
// promise mean "the poster's own fonts are available".
const FACES = ['600 31px "Big Shoulders Display"', '600 18px Oswald']

let settled = false
const ready = Promise.allSettled(FACES.map((face) => document.fonts.load(face)))
  .then(() => document.fonts.ready)
  .then(() => {
    settled = true
  })

/** Anything that sizes itself from its own rendered width has to wait for this. */
export function useFontsReady(): boolean {
  const [loaded, setLoaded] = useState(settled)

  useEffect(() => {
    if (loaded) return
    let live = true
    void ready.then(() => {
      if (live) setLoaded(true)
    })
    return () => {
      live = false
    }
  }, [loaded])

  return loaded
}
