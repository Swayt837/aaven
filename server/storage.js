// Couche de stockage des fichiers — multi-backend (priorité décroissante) :
//  1. Cloudflare R2 (S3-compatible) — si R2_* définis           [prod recommandé : egress gratuit]
//  2. Supabase Storage           — si SUPABASE_URL/SERVICE_KEY  [fallback]
//  3. Disque local               — sinon                        [dev]
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

const USE_R2 = !!(process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY)
const USE_SUPABASE = !USE_R2 && !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY)
export const storageMode = USE_R2 ? 'r2' : USE_SUPABASE ? 'supabase' : 'local'

// --- R2 (S3) ---
const R2_PUBLIC_BUCKET = process.env.R2_PUBLIC_BUCKET || 'aaven-public'
const R2_PRIVATE_BUCKET = process.env.R2_PRIVATE_BUCKET || 'aaven-private'
const R2_PUBLIC_BASE = (process.env.R2_PUBLIC_BASE_URL || '').replace(/\/$/, '') // ex. https://cdn.aaven.fr
// --- Supabase ---
const PUBLIC_BUCKET = process.env.SUPABASE_BUCKET || 'uploads'
const PRIVATE_BUCKET = process.env.SUPABASE_PRIVATE_BUCKET || 'product-files'

let supa = null
let r2 = null
if (USE_R2) {
  const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, DeleteObjectsCommand, ListObjectsV2Command } = await import('@aws-sdk/client-s3')
  const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner')
  const client = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    // Path-style obligatoire pour R2 : sinon le SDK vise bucket.<account>.r2.cloudflarestorage.com
    // (2 niveaux) que le certif *.r2.cloudflarestorage.com ne couvre pas → TLS handshake failure.
    forcePathStyle: true,
    credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY },
  })
  r2 = { client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, DeleteObjectsCommand, ListObjectsV2Command, getSignedUrl }
} else if (USE_SUPABASE) {
  const { createClient } = await import('@supabase/supabase-js')
  supa = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, { auth: { persistSession: false } })
}

const EXT = { 'image/png': '.png', 'image/jpeg': '.jpg', 'image/webp': '.webp', 'image/gif': '.gif', 'image/avif': '.avif' }
const extFromName = (name) => ((path.extname(name || '') || '').replace(/[^.a-z0-9]/gi, '').slice(0, 12))

// Les assets publics ont une clé unique par upload (jamais réécrite) → immuables :
// on les cache 30 jours côté navigateur ET edge. Si le créateur change son média,
// l'URL change → aucune version périmée possible.
const PUBLIC_CACHE = 'public, max-age=2592000, immutable'

// Asset public (image de fond / avatar / média d'ambiance). Renvoie l'URL à stocker.
export async function savePublic(buffer, { mimetype, originalname, pageId }) {
  const key = `${pageId}-${nanoid(8)}${EXT[mimetype] || extFromName(originalname) || ''}`
  if (USE_R2) {
    await r2.client.send(new r2.PutObjectCommand({ Bucket: R2_PUBLIC_BUCKET, Key: key, Body: buffer, ContentType: mimetype, CacheControl: PUBLIC_CACHE }))
    return `${R2_PUBLIC_BASE}/${key}`
  }
  if (USE_SUPABASE) {
    const { error } = await supa.storage.from(PUBLIC_BUCKET).upload(key, buffer, { contentType: mimetype, upsert: false, cacheControl: '2592000' })
    if (error) throw new Error(error.message)
    return supa.storage.from(PUBLIC_BUCKET).getPublicUrl(key).data.publicUrl
  }
  fs.writeFileSync(path.join(uploadsDir, key), buffer)
  return `/uploads/${key}`
}

// Fichier produit (privé, jamais public). Renvoie la clé à stocker dans filePath.
export async function saveProductFile(buffer, { originalname, mimetype, pageId }) {
  const key = `${pageId}-${nanoid(10)}${extFromName(originalname)}`
  if (USE_R2) {
    await r2.client.send(new r2.PutObjectCommand({ Bucket: R2_PRIVATE_BUCKET, Key: key, Body: buffer, ContentType: mimetype || 'application/octet-stream' }))
    return key
  }
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
  if (USE_R2) {
    try {
      const cmd = new r2.GetObjectCommand({ Bucket: R2_PRIVATE_BUCKET, Key: filePath, ResponseContentDisposition: 'attachment' })
      const url = await r2.getSignedUrl(r2.client, cmd, { expiresIn: 120 })
      return { redirect: url }
    } catch { return null }
  }
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
  if (USE_R2) {
    try { await r2.client.send(new r2.DeleteObjectCommand({ Bucket: R2_PRIVATE_BUCKET, Key: filePath })) } catch { /* non bloquant */ }
    return
  }
  if (USE_SUPABASE) {
    try { await supa.storage.from(PRIVATE_BUCKET).remove([filePath]) } catch { /* non bloquant */ }
    return
  }
  try { fs.unlinkSync(path.join(productFilesDir, filePath)) } catch { /* non bloquant */ }
}

// Supprime tous les assets publics d'une page (préfixe `${pageId}-`).
export async function deletePagePublicAssets(pageId) {
  if (USE_R2) {
    try {
      const out = await r2.client.send(new r2.ListObjectsV2Command({ Bucket: R2_PUBLIC_BUCKET, Prefix: `${pageId}-` }))
      const objects = (out.Contents || []).map((o) => ({ Key: o.Key }))
      if (objects.length) await r2.client.send(new r2.DeleteObjectsCommand({ Bucket: R2_PUBLIC_BUCKET, Delete: { Objects: objects } }))
    } catch { /* non bloquant */ }
    return
  }
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
