import { useRef, useState } from 'react'

import { downscaleToDataUri } from '../lib/downscale.ts'
import type { Photo } from '../types/menu.ts'

export const PHOTO_FOLDER = 'images'

interface PhotoSlotProps {
  photo: Photo
  slot: 'left' | 'right'
  className: string
  width: number
  height: number
  placeholder: string
  onPick: (photo: Photo) => void
  onNotice: (message: string) => void
}

export function PhotoSlot({
  photo,
  slot,
  className,
  width,
  height,
  placeholder,
  onPick,
  onNotice,
}: PhotoSlotProps) {
  const input = useRef<HTMLInputElement>(null)
  const [broken, setBroken] = useState(false)

  const choose = async (file: File | undefined) => {
    if (!file) return
    const src = `${PHOTO_FOLDER}/${file.name}`
    try {
      const exportSrc = await downscaleToDataUri(file, width, height)
      onPick({ src, alt: photo.alt, exportSrc })
      setBroken(false)
      onNotice(`Másold ide a képet: ${src} — a HTML mellé, hogy legközelebb is betöltsön.`)
    } catch {
      onNotice(`Nem sikerült beolvasni: ${file.name}`)
    }
  }

  return (
    <>
      <img
        className={className}
        src={photo.src === '' ? placeholder : photo.src}
        alt={photo.alt}
        width={width}
        height={height}
        data-slot={slot}
        data-export-src={photo.exportSrc}
        data-broken={broken ? 'true' : 'false'}
        onError={() => {
          setBroken(true)
        }}
        onLoad={() => {
          setBroken(false)
        }}
      />
      <button
        type="button"
        className={`edit-only photo-pick photo-pick--${slot}`}
        onClick={() => input.current?.click()}
      >
        {broken ? 'Hiányzó kép — válassz' : 'Kép cseréje'}
      </button>
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="edit-only visually-hidden"
        onChange={(e) => {
          void choose(e.target.files?.[0])
          e.target.value = ''
        }}
      />
    </>
  )
}
