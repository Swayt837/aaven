// Médias locaux pour le mode invité : les uploads serveur exigent un compte,
// alors les images de l'invité vivent en data-URL compressées dans son brouillon
// (localStorage ~5 Mo → compression canvas obligatoire), puis sont réellement
// uploadées au moment de la mise en ligne (replay post-login).

// Fichier image → data-URL JPEG redimensionnée (côté long ≤ maxDim).
export function fileToDataUrl(file, maxDim = 1280, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(img.width * scale))
      canvas.height = Math.max(1, Math.round(img.height * scale))
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image illisible')) }
    img.src = url
  })
}

// data-URL → File (pour l'upload réel au replay post-login).
export async function dataUrlToFile(dataUrl, name = 'image.jpg') {
  const blob = await (await fetch(dataUrl)).blob()
  return new File([blob], name, { type: blob.type || 'image/jpeg' })
}

export const isDataUrl = (v) => typeof v === 'string' && v.startsWith('data:')
