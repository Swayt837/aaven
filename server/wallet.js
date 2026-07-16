// Génération des passes Wallet (Apple .pkpass + lien "Save to Google Wallet").
// Tout est OPTIONNEL : si les clés ne sont pas configurées, les fonctions renvoient
// null et les boutons sont masqués côté client (comme Stripe/Google OAuth en démo).
import crypto from 'crypto'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ASSETS = path.join(__dirname, 'wallet-assets')
const APP_URL = process.env.APP_URL || 'http://localhost:5180'

const fromB64 = (v) => (v ? Buffer.from(v, 'base64').toString('utf8') : undefined)

// ---------- Apple Wallet ----------
const apple = {
  passTypeId: process.env.APPLE_PASS_TYPE_ID,
  teamId: process.env.APPLE_TEAM_ID,
  orgName: process.env.APPLE_ORG_NAME || 'Aaven',
  signerCert: fromB64(process.env.APPLE_CERT_SIGNER_B64),
  signerKey: fromB64(process.env.APPLE_CERT_KEY_B64),
  wwdr: fromB64(process.env.APPLE_CERT_WWDR_B64),
  keyPassword: process.env.APPLE_CERT_KEY_PASSWORD || undefined,
}
export const appleWalletConfigured = !!(apple.passTypeId && apple.teamId && apple.signerCert && apple.signerKey && apple.wwdr)

// ---------- Google Wallet ----------
const google = {
  issuerId: process.env.GOOGLE_WALLET_ISSUER_ID,
  saEmail: process.env.GOOGLE_WALLET_SA_EMAIL,
  saKey: fromB64(process.env.GOOGLE_WALLET_SA_KEY_B64),
}
export const googleWalletConfigured = !!(google.issuerId && google.saEmail && google.saKey)

const publicUrl = (slug) => `${APP_URL}/${slug}`
const handle = (page) => `@${page.slug}`

// #RRGGBB → 'rgb(r,g,b)' (format exigé par pass.json). Repli si invalide.
function hexToRgb(hex, fallback) {
  const m = /^#([0-9a-fA-F]{6})$/.exec(hex || '')
  if (!m) return fallback
  const n = parseInt(m[1], 16)
  return `rgb(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255})`
}

// Avatar → thumbnails PNG carrés (90/180/270 px) affichés à droite de la carte.
// Gracieux : null si pas d'avatar http(s), ffmpeg absent ou conversion impossible.
async function avatarThumbnails(avatarUrl) {
  if (!/^https?:\/\//.test(avatarUrl || '')) return null
  let ffmpegPath = null
  try { ffmpegPath = (await import('ffmpeg-static')).default } catch { return null }
  if (!ffmpegPath) return null
  const { execFile } = await import('child_process')
  const { promisify } = await import('util')
  const os = await import('os')
  const run = promisify(execFile)

  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 6000)
  let src
  try {
    const res = await fetch(avatarUrl, { signal: ctrl.signal })
    if (!res.ok) return null
    src = Buffer.from(await res.arrayBuffer())
  } catch { return null } finally { clearTimeout(timer) }

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'passthumb-'))
  try {
    const inPath = path.join(dir, 'in.img')
    fs.writeFileSync(inPath, src)
    const out = {}
    for (const [name, size] of [['thumbnail.png', 90], ['thumbnail@2x.png', 180], ['thumbnail@3x.png', 270]]) {
      const outPath = path.join(dir, name)
      await run(ffmpegPath, ['-y', '-i', inPath, '-vf', `crop=min(iw\\,ih):min(iw\\,ih),scale=${size}:${size}`, outPath], { timeout: 15000 })
      out[name] = fs.readFileSync(outPath)
    }
    return out
  } catch {
    return null
  } finally {
    try { fs.rmSync(dir, { recursive: true, force: true }) } catch { /* ignore */ }
  }
}

// Fond de carte depuis le thème du créateur : son image de fond, ou le POSTER de sa
// vidéo de fond (1re frame, générée à l'upload). iOS l'affiche flouté derrière la carte.
// → PNG 180x220 (+@2x/@3x). null si aucun fond http(s) exploitable.
async function backgroundImages(theme) {
  let src = /^https?:\/\//.test(theme.bgImage || '') ? theme.bgImage : null
  if (!src && /^https?:\/\/.+\.(mp4|mov|webm)($|\?)/i.test(theme.bgVideo || '')) {
    src = theme.bgVideo.replace(/\.(mp4|mov|webm)(\?.*)?$/i, '.jpg') // poster de la vidéo
  }
  if (!src) return null
  let ffmpegPath = null
  try { ffmpegPath = (await import('ffmpeg-static')).default } catch { return null }
  if (!ffmpegPath) return null
  const { execFile } = await import('child_process')
  const { promisify } = await import('util')
  const os = await import('os')
  const run = promisify(execFile)

  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 6000)
  let buf
  try {
    const res = await fetch(src, { signal: ctrl.signal })
    if (!res.ok) return null
    buf = Buffer.from(await res.arrayBuffer())
  } catch { return null } finally { clearTimeout(timer) }

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'passbg-'))
  try {
    const inPath = path.join(dir, 'in.img')
    fs.writeFileSync(inPath, buf)
    const out = {}
    for (const [name, w, h] of [['background.png', 180, 220], ['background@2x.png', 360, 440], ['background@3x.png', 540, 660]]) {
      const outPath = path.join(dir, name)
      // Couvre le cadre 180x220 (crop central) — iOS floute de toute façon.
      await run(ffmpegPath, ['-y', '-i', inPath, '-vf', `scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h}`, outPath], { timeout: 15000 })
      out[name] = fs.readFileSync(outPath)
    }
    return out
  } catch {
    return null
  } finally {
    try { fs.rmSync(dir, { recursive: true, force: true }) } catch { /* ignore */ }
  }
}

// Construit le .pkpass (Buffer) pour une page.
// Avec fond (image du thème ou poster vidéo) → style "eventTicket" : iOS l'affiche
// flouté derrière la carte + photo de profil. Sans fond → "generic" sombre élégant.
export async function buildApplePass(page) {
  if (!appleWalletConfigured) return null
  const { PKPass } = await import('passkit-generator')

  const theme = page.theme || {}
  const buffers = {}
  for (const f of ['icon.png', 'icon@2x.png', 'icon@3x.png', 'logo.png', 'logo@2x.png']) {
    const p = path.join(ASSETS, f)
    if (fs.existsSync(p)) buffers[f] = fs.readFileSync(p)
  }
  // Photo de profil sur la carte (comme une vraie carte de visite).
  const thumbs = await avatarThumbnails(page.avatarUrl)
  if (thumbs) Object.assign(buffers, thumbs)
  // Fond personnalisé (flouté par iOS) — seul le style eventTicket le supporte.
  const bg = await backgroundImages(theme)
  if (bg) Object.assign(buffers, bg)
  const pass = new PKPass(
    buffers,
    {
      wwdr: apple.wwdr,
      signerCert: apple.signerCert,
      signerKey: apple.signerKey,
      signerKeyPassphrase: apple.keyPassword,
    },
    {
      formatVersion: 1,
      passTypeIdentifier: apple.passTypeId,
      teamIdentifier: apple.teamId,
      organizationName: apple.orgName,
      description: `Carte de visite ${page.title || page.slug}`,
      serialNumber: `aaven-${page.slug}`,
      backgroundColor: 'rgb(21,22,26)',
      foregroundColor: 'rgb(255,255,255)',
      // Les labels prennent la couleur d'accent du thème du créateur.
      labelColor: hexToRgb(theme.accent, 'rgb(154,161,168)'),
    }
  )

  pass.type = bg ? 'eventTicket' : 'generic'
  pass.primaryFields.push({ key: 'name', value: page.title || page.slug })
  pass.secondaryFields.push({ key: 'handle', label: 'PROFIL', value: handle(page) })
  if (page.headline) pass.secondaryFields.push({ key: 'tagline', label: 'MÉTIER', value: page.headline })
  // Dos de la carte : lien cliquable + bio + localisation.
  pass.backFields.push({ key: 'url', label: 'Ma page', value: publicUrl(page.slug) })
  if (page.bio) pass.backFields.push({ key: 'bio', label: 'À propos', value: page.bio })
  if (theme.location) pass.backFields.push({ key: 'loc', label: 'Localisation', value: theme.location })
  pass.setBarcodes({ message: publicUrl(page.slug), format: 'PKBarcodeFormatQR', messageEncoding: 'iso-8859-1' })

  return pass.getAsBuffer()
}

// JWT signé (RS256) avec la clé du compte de service → lien "Save to Google Wallet".
function signGoogleJwt(payload) {
  const enc = (o) => Buffer.from(JSON.stringify(o)).toString('base64url')
  const data = `${enc({ alg: 'RS256', typ: 'JWT' })}.${enc(payload)}`
  const sig = crypto.createSign('RSA-SHA256').update(data).sign(google.saKey, 'base64url')
  return `${data}.${sig}`
}

// Renvoie l'URL "Enregistrer dans Google Wallet" (classe + objet en ligne).
export function buildGoogleSaveUrl(page) {
  if (!googleWalletConfigured) return null
  const classId = `${google.issuerId}.aaven_bio`
  const objectId = `${google.issuerId}.${page.slug}`.replace(/[^a-zA-Z0-9._-]/g, '_')

  const genericObject = {
    id: objectId,
    classId,
    state: 'ACTIVE',
    hexBackgroundColor: '#15161A',
    logo: { sourceUri: { uri: `${APP_URL}/logo-mark.png` } },
    cardTitle: { defaultValue: { language: 'fr', value: 'Aaven' } },
    header: { defaultValue: { language: 'fr', value: page.title || page.slug } },
    subheader: { defaultValue: { language: 'fr', value: handle(page) } },
    barcode: { type: 'QR_CODE', value: publicUrl(page.slug) },
    linksModuleData: {
      uris: [{ uri: publicUrl(page.slug), description: 'Voir le profil' }],
    },
  }

  const payload = {
    iss: google.saEmail,
    aud: 'google',
    typ: 'savetowallet',
    iat: Math.floor(Date.now() / 1000),
    payload: {
      genericClasses: [{ id: classId }],
      genericObjects: [genericObject],
    },
  }
  return `https://pay.google.com/gp/v/save/${signGoogleJwt(payload)}`
}
