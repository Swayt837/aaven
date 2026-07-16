// Compression d'image côté client avant upload.
// Les photos de téléphone (8-12 Mo, 4000px+) dépassent la limite serveur (5 Mo) :
// on les redimensionne (max 1920px) et on les ré-encode en WebP/JPEG (~300-500 Ko),
// SANS perte visible à l'écran. L'orientation EXIF est appliquée au passage.
// Gracieux : en cas d'échec (format exotique), le fichier original est renvoyé tel quel.

const MAX_SIDE = 1920
const QUALITY = 0.82

export async function compressImage(file) {
  // GIF (animation) et SVG (vectoriel) : intacts. Non-images : intactes.
  if (!file?.type?.startsWith('image/') || /gif|svg/.test(file.type)) return file

  try {
    // 'from-image' applique la rotation EXIF (photos prises en portrait).
    const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' })
    const scale = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height))
    const w = Math.max(1, Math.round(bmp.width * scale))
    const h = Math.max(1, Math.round(bmp.height * scale))

    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    canvas.getContext('2d').drawImage(bmp, 0, 0, w, h)
    bmp.close?.()

    // WebP si le navigateur sait l'encoder, sinon JPEG.
    let blob = await new Promise((r) => canvas.toBlob(r, 'image/webp', QUALITY))
    let ext = '.webp'
    if (!blob || blob.type !== 'image/webp') {
      blob = await new Promise((r) => canvas.toBlob(r, 'image/jpeg', QUALITY))
      ext = '.jpg'
    }
    if (!blob) return file

    // On ne garde la version compressée que si elle est réellement plus légère.
    if (blob.size >= file.size) return file
    const name = (file.name || 'image').replace(/\.\w+$/, '') + ext
    return new File([blob], name, { type: blob.type })
  } catch {
    return file // décodage impossible (ex. HEIC hors Safari) → on tente l'original
  }
}
