// Couche de stockage des fichiers — dual-mode :
//  - SUPABASE_URL + SUPABASE_SERVICE_KEY définis → Supabase Storage [prod]
//  - sinon                                       → disque local       [dev]
// Les uploaders multer utilisent memoryStorage ; ce module décide où écrire.

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { nanoid } from 'nanoid'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const uploadsDir = path.join(__dirname, 'uploads')
export const productFilesDir = path.join(__dirname, 'product-files')
fs.mkdirSync(uploadsDir, { recursive: true })
fs.mkdirSync(productFilesDir, { recursive: true })

const USE_SUPABASE = !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY)
export const storageMode = USE_SUPABASE ? 'supabase' : 'local'
const PUBLIC_BUCKET = process.env.SUPABASE_BUCKET || 'uploads'
const PRIVATE_BUCKET = process.env.SUPABASE_PRIVATE_BUCKET || 'product-files'

let supa = null
if (USE_SUPABASE) {
  const { createClient } = await import('@supabase/supabase-js')
  supa = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, { auth: { persistSession: false } })
}

const EXT = { 'image/png': '.png', 'image/jpeg': '.jpg', 'image/webp': '.webp', 'image/gif': '.gif', 'image/avif': '.avif' }
const extFromName = (name) => ((path.extname(name || '') || '').replace(/[^.a-z0-9]/gi, '').slice(0, 12))

// Asset public (image de fond / avatar / média d'ambiance). Renvoie l'URL à stocker.
export async function savePublic(buffer, { mimetype, originalname, pageId }) {
  const key = `${pageId}-${nanoid(8)}${EXT[mimetype] || extFromName(originalname) || ''}`
  if (USE_SUPABASE) {
    const { error } = await supa.storage.from(PUBLIC_BUCKET).upload(key, buffer, { contentType: mimetype, upsert: false })
    if (error) throw new Error(error.message)
    return supa.storage.from(PUBLIC_BUCKET).getPublicUrl(key).data.publicUrl
  }
  fs.writeFileSync(path.join(uploadsDir, key), buffer)
  return `/uploads/${key}`
}

// Fichier produit (privé, jamais public). Renvoie la clé à stocker dans filePath.
export async function saveProductFile(buffer, { originalname, mimetype, pageId }) {
  const key = `${pageId}-${nanoid(10)}${extFromName(originalname)}`
  if (USE_SUPABASE) {
    const { error } = await supa.storage.from(PRIVATE_BUCKET).upload(key, buffer, { contentType: mimetype || 'application/octet-stream', upsert: false })
    if (error) throw new Error(error.message)
    return key
  }
  fs.writeFileSync(path.join(productFilesDir, key), buffer)
  return key
}

// Pour le téléchargement sécurisé : { redirect } (URL signée) OU { filePath } (chemin local).
export async function getProductDownload(filePath) {
  if (!filePath) return null
  if (USE_SUPABASE) {
    const { data, error } = await supa.storage.from(PRIVATE_BUCKET).createSignedUrl(filePath, 120, { download: true })
    if (error || !data) return null
    return { redirect: data.signedUrl }
  }
  const full = path.join(productFilesDir, filePath)
  if (!fs.existsSync(full)) return null
  return { filePath: full }
}

export async function deleteProductFile(filePath) {
  if (!filePath) return
  if (USE_SUPABASE) {
    try { await supa.storage.from(PRIVATE_BUCKET).remove([filePath]) } catch { /* non bloquant */ }
    return
  }
  try { fs.unlinkSync(path.join(productFilesDir, filePath)) } catch { /* non bloquant */ }
}

// Supprime tous les assets publics d'une page (préfixe `${pageId}-`).
export async function deletePagePublicAssets(pageId) {
  if (USE_SUPABASE) {
    try {
      const { data } = await supa.storage.from(PUBLIC_BUCKET).list('', { limit: 1000, search: `${pageId}-` })
      const keys = (data || []).filter((f) => f.name.startsWith(`${pageId}-`)).map((f) => f.name)
      if (keys.length) await supa.storage.from(PUBLIC_BUCKET).remove(keys)
    } catch { /* non bloquant */ }
    return
  }
  try {
    for (const f of fs.readdirSync(uploadsDir)) if (f.startsWith(`${pageId}-`)) fs.unlinkSync(path.join(uploadsDir, f))
  } catch { /* non bloquant */ }
}
