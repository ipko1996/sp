/**
 * Shrinks a picked photo to just big enough to fill its slot at 2x, and returns it as a data URI.
 *
 * This copy exists only so PNG export works. The poster renders the photo from its path beside
 * the HTML, but Chrome taints the canvas for anything loaded off file://, so the exporter can
 * never read that file — it needs the bytes handed to it while the file picker still has them.
 * Keeping it slot-sized rather than full-resolution is what keeps it inside the storage quota.
 */
export async function downscaleToDataUri(
  file: File,
  slotWidth: number,
  slotHeight: number,
  pixelRatio = 2,
): Promise<string> {
  const bitmap = await createImageBitmap(file)
  try {
    const targetW = slotWidth * pixelRatio
    const targetH = slotHeight * pixelRatio

    // `cover` crops to fill, so the copy only has to be large enough to cover the slot. Never
    // scale up: a small photo gains nothing but bytes.
    const scale = Math.min(1, Math.max(targetW / bitmap.width, targetH / bitmap.height))
    const width = Math.max(1, Math.round(bitmap.width * scale))
    const height = Math.max(1, Math.round(bitmap.height * scale))

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height

    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('2D canvas unavailable')
    ctx.drawImage(bitmap, 0, 0, width, height)

    return canvas.toDataURL('image/jpeg', 0.85)
  } finally {
    bitmap.close()
  }
}
