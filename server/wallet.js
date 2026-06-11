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

// Construit le .pkpass (Buffer) pour une page. Style "generic" : nom + handle + QR.
export async function buildApplePass(page) {
  if (!appleWalletConfigured) return null
  const { PKPass } = await import('passkit-generator')

  const buffers = {}
  for (const f of ['icon.png', 'icon@2x.png', 'icon@3x.png', 'logo.png', 'logo@2x.png']) {
    const p = path.join(ASSETS, f)
    if (fs.existsSync(p)) buffers[f] = fs.readFileSync(p)
  }

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
      labelColor: 'rgb(154,161,168)',
    }
  )

  pass.type = 'generic'
  pass.primaryFields.push({ key: 'name', label: 'AAVEN', value: page.title || page.slug })
  pass.secondaryFields.push({ key: 'handle', label: 'Profil', value: handle(page) })
  if (page.headline) pass.auxiliaryFields.push({ key: 'tagline', label: '', value: page.headline })
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
