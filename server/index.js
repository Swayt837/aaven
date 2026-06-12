import 'dotenv/config'
import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import crypto from 'crypto'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import rateLimit from 'express-rate-limit'
import multer from 'multer'
import nodemailer from 'nodemailer'
import { nanoid } from 'nanoid'
import { Users, Pages, Buttons, Clicks, Tips, Messages, Products, Purchases } from './db.js'
import { BUTTON_TYPES_SERVER, PRESETS_SERVER } from './presets.js'
import { sanitizeUrl, sanitizeAsset, clampStr, sanitizeTheme, sanitizeButtonConfig } from './validate.js'
import { savePublic, saveProductFile, getProductDownload, deleteProductFile, deletePagePublicAssets, uploadsDir, storageMode } from './storage.js'
import { appleWalletConfigured, googleWalletConfigured, buildApplePass, buildGoogleSaveUrl } from './wallet.js'
import { buildStoryVideo } from './story.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = process.env.PORT || 3001
const APP_URL = process.env.APP_URL || 'http://localhost:5180'
const SECRET = process.env.SESSION_SECRET || 'dev-secret-change-me'
const googleConfigured = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
const isProd = process.env.NODE_ENV === 'production'

// Garde-fou prod : refuse de démarrer avec le secret de session par défaut.
if (isProd && SECRET === 'dev-secret-change-me') {
  console.error('\n  ✗ SESSION_SECRET non défini en production. Génère une clé aléatoire longue et relance.\n')
  process.exit(1)
}

// Commission Aaven selon le plan (points de base : 500 = 5%).
const FEE_BPS = { free: 500, creator: 100, pro: 0 }
const feeBps = (plan) => FEE_BPS[plan] ?? 500

// 1 template vidéo offert par catégorie (accessible aux comptes Free).
// URL canonique épinglée côté serveur (anti-contournement du gating premium).
const SUPA = 'https://pgizduxqqplakidyipdn.supabase.co/storage/v1/object/public/Templates%20Premium'
const FREE_VIDEO_TEMPLATES = {
  'neon-creator': `${SUPA}/Premium%20Createur/56d5bd7f-9154-414f-a051-5bb904c0f8a6-2-3.1-invideo-seedance_2_0.mp4`,
  'lounge-live': `${SUPA}/Premium%20Etablissement/ef55bbf3-68f2-4a2c-978d-4d39f7118ed6-2-2.1-invideo-seedance_2_0.mp4`,
  'office-live': `${SUPA}/Premium%20Freelance/b9861429-b87f-4c9d-bc04-0edc89cd21f3-1-1.1-invideo-seedance_2_0.mp4`,
}

// Prix d'abonnement Stripe (Billing).
const PRICE = { creator: process.env.STRIPE_PRICE_CREATOR, pro: process.env.STRIPE_PRICE_PRO }

const app = express()
app.set('trust proxy', 1) // derrière 1 reverse-proxy (Render/Fly/Nginx) → IP réelle pour le rate-limit
app.use(cors({ origin: APP_URL, credentials: true }))
app.use(cookieParser())

// ---------- Rate limiting ----------
const rl = (windowMs, max, message) =>
  rateLimit({ windowMs, max, standardHeaders: true, legacyHeaders: false, message: { error: message } })

const authLimiter = rl(15 * 60 * 1000, 50, 'Trop de tentatives, réessaie plus tard.')
const createLimiter = rl(60 * 60 * 1000, 30, 'Trop de pages créées, réessaie plus tard.')
const writeLimiter = rl(60 * 1000, 60, 'Trop de requêtes, ralentis un peu.')
const tipLimiter = rl(60 * 60 * 1000, 40, 'Trop de tentatives de paiement, réessaie plus tard.')
const clickLimiter = rl(60 * 1000, 100, 'Trop de clics, réessaie dans un instant.')
const contactLimiter = rl(60 * 60 * 1000, 20, 'Trop de messages envoyés, réessaie plus tard.')

// ---------- Uploads (mémoire → délégués à storage.js : Supabase ou disque) ----------
const ALLOWED_IMG = /^image\/(png|jpe?g|webp|gif|avif)$/
const ALLOWED_MEDIA = /^(image|video|audio)\/|^application\/pdf$/
// En mode local, les images sont servies en statique depuis le dossier uploads.
app.use('/uploads', express.static(uploadsDir, { maxAge: '7d' }))

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 Mo
  fileFilter: (req, file, cb) => cb(null, ALLOWED_IMG.test(file.mimetype)),
})
const productUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } })
function productUploadSingle(req, res, next) {
  productUpload.single('file')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.code === 'LIMIT_FILE_SIZE' ? 'Fichier trop lourd (max 50 Mo)' : 'Upload invalide' })
    next()
  })
}
const mediaUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 60 * 1024 * 1024 }, // 60 Mo
  fileFilter: (req, file, cb) => cb(null, ALLOWED_MEDIA.test(file.mimetype)),
})
function mediaUploadSingle(req, res, next) {
  mediaUpload.single('file')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.code === 'LIMIT_FILE_SIZE' ? 'Fichier trop lourd (max 60 Mo)' : 'Upload invalide' })
    next()
  })
}

// ---------- E-mail (notif des messages de contact) — optionnel ----------
let mailer = null
if (process.env.SMTP_HOST) {
  mailer = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  })
}
async function notifyOwner(page, msg) {
  if (!mailer) return // SMTP non configuré → on stocke seulement
  const owner = await Users.findById(page.userId)
  if (!owner?.email) return
  try {
    await mailer.sendMail({
      from: process.env.SMTP_FROM || 'Aaven <no-reply@aaven.app>',
      to: owner.email,
      replyTo: msg.email || undefined,
      subject: `📩 Nouveau message via ta page « ${page.title} »`,
      text: `${msg.subject ? `[${msg.subject}]\n` : ''}De : ${msg.name || 'Anonyme'} <${msg.email || 'sans e-mail'}>\n\n${msg.body}`,
    })
  } catch (e) {
    console.warn('  E-mail de notif non envoyé:', e.message)
  }
}

// Livraison d'un produit : envoie le lien de téléchargement à l'acheteur.
async function deliverProduct(purchase, product) {
  if (!mailer || !purchase?.email) return
  const url = `${APP_URL}/api/download/${purchase.token}`
  try {
    await mailer.sendMail({
      from: process.env.SMTP_FROM || 'Aaven <no-reply@aaven.app>',
      to: purchase.email,
      subject: `Ton téléchargement : ${product.title}`,
      text: `Merci pour ton achat ! 🎉\n\nTélécharge « ${product.title} » ici :\n${url}\n\n— Aaven`,
    })
  } catch (e) {
    console.warn('  E-mail de livraison non envoyé:', e.message)
  }
}

// Webhook Stripe : besoin du corps brut → monté AVANT express.json()
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), handleWebhook)

app.use(express.json())

// ---------- Session (cookie signé HMAC) ----------
function sign(userId) {
  const sig = crypto.createHmac('sha256', SECRET).update(userId).digest('hex')
  return `${userId}.${sig}`
}
function verify(token) {
  if (!token) return null
  const [userId, sig] = token.split('.')
  if (!userId || !sig) return null
  const expected = crypto.createHmac('sha256', SECRET).update(userId).digest('hex')
  return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected)) ? userId : null
}
const COOKIE_OPTS = { httpOnly: true, secure: isProd, sameSite: 'lax', path: '/' }
function setSession(res, userId) {
  res.cookie('bb_session', sign(userId), { ...COOKIE_OPTS, maxAge: 30 * 24 * 3600 * 1000 })
}
async function currentUser(req) {
  const id = verify(req.cookies?.bb_session)
  return id ? await Users.findById(id) : null
}
async function requireAuth(req, res, next) {
  try {
    const u = await currentUser(req)
    if (!u) return res.status(401).json({ error: 'Non authentifié' })
    req.user = u
    next()
  } catch (e) { next(e) }
}
async function ownPage(req, res, next) {
  try {
    const page = await Pages.bySlug(req.params.slug)
    if (!page) return res.status(404).json({ error: 'Page introuvable' })
    if (page.userId !== req.user.id) return res.status(403).json({ error: 'Accès refusé' })
    req.page = page
    next()
  } catch (e) { next(e) }
}

// ================= AUTH =================
app.get('/api/me', async (req, res) => {
  const u = await currentUser(req)
  if (!u) return res.json({ user: null })
  res.json({ user: { id: u.id, email: u.email, name: u.name, avatarUrl: u.avatarUrl, plan: u.plan } })
})

// Dev login : crée/retourne un compte de démo (utilisé quand Google non configuré)
app.post('/api/auth/dev-login', authLimiter, async (req, res) => {
  // Backdoor de DEV uniquement : désactivée dès que Google OAuth est configuré (prod).
  if (googleConfigured || isProd) return res.status(404).json({ error: 'Not found' })
  const u = await Users.upsertFromGoogle({
    googleId: 'dev-user',
    email: 'demo@aaven.app',
    name: 'Utilisateur démo',
    avatarUrl: '',
  })
  setSession(res, u.id)
  res.json({ user: { id: u.id, email: u.email, name: u.name } })
})

// Démarrage OAuth Google. Si non configuré → {dev:true} (le front bascule sur dev-login).
app.get('/api/auth/google', (req, res) => {
  if (!googleConfigured) return res.json({ dev: true })
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: `${APP_URL}/api/auth/google/callback`,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'select_account',
  })
  res.json({ url: `https://accounts.google.com/o/oauth2/v2/auth?${params}` })
})

app.get('/api/auth/google/callback', async (req, res) => {
  try {
    const { code } = req.query
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: `${APP_URL}/api/auth/google/callback`,
        grant_type: 'authorization_code',
      }),
    })
    const tokens = await tokenRes.json()
    const profRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })
    const prof = await profRes.json()
    const u = await Users.upsertFromGoogle({
      googleId: prof.id,
      email: prof.email,
      name: prof.name,
      avatarUrl: prof.picture,
    })
    setSession(res, u.id)
    res.redirect(`${APP_URL}/dashboard`)
  } catch (e) {
    res.redirect(`${APP_URL}/login?error=oauth`)
  }
})

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('bb_session', COOKIE_OPTS)
  res.json({ ok: true })
})

// ================= STRIPE CONNECT (Express) =================
// Démarre / reprend l'onboarding du compte créateur.
app.post('/api/connect/start', requireAuth, async (req, res) => {
  if (!stripe) return res.json({ demo: true })
  try {
    let acct = req.user.stripeAccountId
    if (!acct) {
      const a = await stripe.accounts.create({ type: 'express', email: req.user.email })
      acct = a.id
      await Users.setStripeAccount(req.user.id, acct)
    }
    const link = await stripe.accountLinks.create({
      account: acct,
      refresh_url: `${APP_URL}/dashboard?connect=refresh`,
      return_url: `${APP_URL}/dashboard?connect=done`,
      type: 'account_onboarding',
    })
    res.json({ url: link.url })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// État de connexion des paiements (rafraîchi depuis Stripe).
app.get('/api/connect/status', requireAuth, async (req, res) => {
  if (!stripe) return res.json({ demo: true, connected: true, payoutsEnabled: true })
  if (!req.user.stripeAccountId) return res.json({ connected: false, payoutsEnabled: false })
  let enabled = !!req.user.payoutsEnabled
  try {
    const a = await stripe.accounts.retrieve(req.user.stripeAccountId)
    enabled = !!a.charges_enabled
    await Users.setPayouts(req.user.stripeAccountId, enabled)
  } catch {
    /* garde la dernière valeur connue */
  }
  res.json({ connected: true, payoutsEnabled: enabled })
})

// ================= ABONNEMENTS (Stripe Billing) =================
// Passe à un plan payant (Checkout subscription) — ou bascule direct en démo.
app.post('/api/billing/checkout', requireAuth, async (req, res) => {
  const plan = req.body.plan
  if (!['creator', 'pro'].includes(plan)) return res.status(400).json({ error: 'Plan invalide' })
  if (!stripe || !PRICE[plan]) {
    // Démo (pas de Stripe Billing configuré) : applique le plan directement.
    await Users.setPlan(req.user.id, plan)
    return res.json({ demo: true, plan })
  }
  try {
    let customer = req.user.stripeCustomerId
    if (!customer) {
      const c = await stripe.customers.create({ email: req.user.email })
      customer = c.id
      await Users.setPlan(req.user.id, req.user.plan, customer)
    }
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer,
      line_items: [{ price: PRICE[plan], quantity: 1 }],
      success_url: `${APP_URL}/dashboard?upgraded=1`,
      cancel_url: `${APP_URL}/dashboard`,
      metadata: { type: 'subscription', userId: req.user.id, plan },
    })
    res.json({ url: session.url })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// Portail de gestion d'abonnement (changer/annuler).
app.post('/api/billing/portal', requireAuth, async (req, res) => {
  if (!stripe || !req.user.stripeCustomerId) return res.json({ demo: true })
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: req.user.stripeCustomerId,
      return_url: `${APP_URL}/dashboard`,
    })
    res.json({ url: session.url })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// Repasser en Free (démo : sans Stripe).
app.post('/api/billing/downgrade', requireAuth, async (req, res) => {
  if (stripe && req.user.stripeCustomerId) return res.json({ demo: false, portal: true })
  await Users.setPlan(req.user.id, 'free')
  res.json({ demo: true, plan: 'free' })
})

// ================= PAGES (privé) =================
app.get('/api/pages', requireAuth, async (req, res) => {
  res.json({ pages: await Pages.byUser(req.user.id) })
})

app.post('/api/pages', requireAuth, createLimiter, async (req, res) => {
  const title = clampStr(req.body.title, 80).trim()
  const bio = clampStr(req.body.bio, 280)
  const headline = clampStr(req.body.headline, 80)
  const { mode } = req.body
  if (!title || !['creator', 'bar', 'freelance'].includes(mode)) {
    return res.status(400).json({ error: 'Titre et mode requis' })
  }
  const page = await Pages.create({ userId: req.user.id, title, bio, headline, mode })
  // Pré-remplissage des boutons selon le preset du mode
  const preset = PRESETS_SERVER[mode] || []
  for (let i = 0; i < preset.length; i++) {
    const item = preset[i]
    const def = BUTTON_TYPES_SERVER[item.type]
    await Buttons.create(page.id, {
      type: item.type,
      label: def.label.fr,
      icon: def.icon,
      url: '',
      isActive: true,
      featured: !!item.featured,
      position: i,
    })
  }
  res.json({ page, buttons: await Buttons.byPage(page.id) })
})

app.get('/api/pages/:slug', requireAuth, ownPage, async (req, res) => {
  res.json({ page: req.page, buttons: await Buttons.byPage(req.page.id) })
})

app.put('/api/pages/:slug', requireAuth, ownPage, writeLimiter, async (req, res) => {
  const { title, slug, bio, headline, avatarUrl, emoji, buttons } = req.body
  // Slug : valide l'unicité si changé
  let newSlug = req.page.slug
  if (slug && slug !== req.page.slug) {
    const cleaned = slug.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/^-+|-+$/g, '')
    const taken = await Pages.bySlug(cleaned)
    if (taken && taken.id !== req.page.id) return res.status(409).json({ error: 'Slug déjà pris' })
    newSlug = cleaned || req.page.slug
  }
  const patch = {
    title: title != null ? clampStr(title, 80) : req.page.title,
    slug: newSlug,
    bio: bio != null ? clampStr(bio, 280) : req.page.bio,
    headline: headline != null ? clampStr(headline, 80) : req.page.headline,
    avatarUrl: avatarUrl != null ? sanitizeAsset(avatarUrl) : req.page.avatarUrl,
    emoji: emoji != null ? clampStr(emoji, 8) : req.page.emoji,
  }
  if (req.body.theme !== undefined) {
    const th = sanitizeTheme(req.body.theme)
    // Ambiance premium réservée aux abonnés Creator/Pro.
    // Exception : 1 template vidéo offert par catégorie reste accessible en Free.
    // On épingle l'URL canonique pour empêcher l'usage d'une autre vidéo premium.
    if ((req.user.plan || 'free') === 'free') {
      th.animation = 'none'
      th.introVideo = ''
      th.bgVideoOwn = false
      th.ambientAudio = ''
      th.bgVideo = FREE_VIDEO_TEMPLATES[th.template] || ''
    }
    patch.theme = th
  }
  const page = await Pages.update(req.page.id, patch)
  let nb = await Buttons.byPage(page.id)
  if (Array.isArray(buttons)) {
    // Assainit chaque bouton : URL filtrée (anti-XSS) + libellés bornés.
    const clean = buttons.slice(0, 50).map((b, i) => ({
      id: b.id,
      type: clampStr(b.type, 24),
      label: clampStr(b.label, 60),
      icon: clampStr(b.icon, 40),
      url: sanitizeUrl(b.url),
      isActive: b.isActive !== false,
      featured: !!b.featured,
      position: Number.isFinite(b.position) ? b.position : i,
      config: sanitizeButtonConfig(b.type, b.config),
    }))
    nb = await Buttons.sync(page.id, clean)
  }
  res.json({ page, buttons: nb })
})

// Upload d'une image de fond pour la page (multipart). ownPage avant multer → req.page.id dispo.
function uploadSingle(req, res, next) {
  upload.single('image')(req, res, (err) => {
    if (err) {
      const msg = err.code === 'LIMIT_FILE_SIZE' ? 'Image trop lourde (max 5 Mo)' : 'Upload invalide'
      return res.status(400).json({ error: msg })
    }
    next()
  })
}
app.post('/api/pages/:slug/upload', requireAuth, ownPage, writeLimiter, uploadSingle, async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Image invalide (formats : png, jpg, webp, gif, avif)' })
  try {
    const url = await savePublic(req.file.buffer, { mimetype: req.file.mimetype, originalname: req.file.originalname, pageId: req.page.id })
    res.json({ url })
  } catch (e) { res.status(500).json({ error: 'Upload échoué' }) }
})

// Upload média (vidéo/audio/image) pour l'ambiance.
app.post('/api/pages/:slug/upload-media', requireAuth, ownPage, writeLimiter, mediaUploadSingle, async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Fichier invalide (image, vidéo ou audio)' })
  try {
    const url = await savePublic(req.file.buffer, { mimetype: req.file.mimetype, originalname: req.file.originalname, pageId: req.page.id })
    res.json({ url })
  } catch (e) { res.status(500).json({ error: 'Upload échoué' }) }
})

app.delete('/api/pages/:slug', requireAuth, ownPage, async (req, res) => {
  await Pages.remove(req.page.id)
  await deletePagePublicAssets(req.page.id) // nettoie les assets de la page (Supabase ou disque)
  res.json({ ok: true })
})

app.get('/api/pages/:slug/stats', requireAuth, ownPage, async (req, res) => {
  const buttons = await Buttons.byPage(req.page.id)
  const totalClicks = buttons.reduce((s, b) => s + b.clicks, 0)
  const tipAgg = await Tips.sumPaid(req.page.id)
  const prodAgg = await Purchases.revenueByPage(req.page.id)
  // Net créateur = brut − commission Aaven (selon le plan). Les frais Stripe sont
  // prélevés sur la commission Aaven, donc le créateur touche bien brut × (1 − commission).
  const keep = 1 - feeBps(req.user.plan) / 10000
  const round2 = (n) => Math.round(n * 100) / 100
  res.json({
    views: req.page.views,
    totalClicks,
    messages: await Messages.countByPage(req.page.id),
    tipsRevenue: round2((tipAgg?.total || 0) * keep),
    tipsCount: tipAgg?.n || 0,
    productsRevenue: round2(((prodAgg?.cents || 0) / 100) * keep),
    productsCount: prodAgg?.n || 0,
    buttons: buttons.map((b) => ({ id: b.id, label: b.label, icon: b.icon, clicks: b.clicks })),
  })
})

// Messages reçus (owner uniquement).
app.get('/api/pages/:slug/messages', requireAuth, ownPage, async (req, res) => {
  res.json({ messages: await Messages.byPage(req.page.id) })
})

// Soutiens reçus (owner) + réponse du créateur.
app.get('/api/pages/:slug/tips', requireAuth, ownPage, async (req, res) => {
  res.json({ tips: await Tips.byPage(req.page.id) })
})
app.post('/api/pages/:slug/tips/:tipId/reply', requireAuth, ownPage, writeLimiter, async (req, res) => {
  const tip = await Tips.byId(req.params.tipId)
  if (!tip || tip.pageId !== req.page.id) return res.status(404).json({ error: 'Soutien introuvable' })
  res.json({ tip: await Tips.setReply(tip.id, clampStr(req.body.reply, 280)) })
})

// ================= PRODUITS DIGITAUX =================
const FREE_PRODUCT_LIMIT = 3
async function productQuota(req, res, next) {
  try {
    const plan = req.user.plan || 'free'
    if (plan === 'free' && (await Products.countByPage(req.page.id)) >= FREE_PRODUCT_LIMIT) {
      return res.status(403).json({ error: `Limite de ${FREE_PRODUCT_LIMIT} produits (passe Creator pour l'illimité)` })
    }
    next()
  } catch (e) { next(e) }
}

// Liste owner (avec nom de fichier).
app.get('/api/pages/:slug/products', requireAuth, ownPage, async (req, res) => {
  res.json({ products: (await Products.byPage(req.page.id)).map((p) => ({ ...p, filePath: undefined })) })
})

// Création (multipart : file + champs).
app.post('/api/pages/:slug/products', requireAuth, ownPage, writeLimiter, productQuota, productUploadSingle, async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Fichier requis' })
  const title = clampStr(req.body.title, 80).trim()
  if (!title) return res.status(400).json({ error: 'Titre requis' })
  const description = clampStr(req.body.description, 500)
  const priceCents = Math.max(100, Math.round((Number(req.body.price) || 0) * 100) || 100)
  const coverImage = sanitizeAsset(req.body.coverImage)
  let filePath
  try {
    filePath = await saveProductFile(req.file.buffer, { originalname: req.file.originalname, mimetype: req.file.mimetype, pageId: req.page.id })
  } catch (e) { return res.status(500).json({ error: 'Upload du fichier échoué' }) }
  const prod = await Products.create(req.page.id, { title, description, priceCents, coverImage, filePath, fileName: req.file.originalname })
  res.json({ product: { ...prod, filePath: undefined } })
})

// Mise à jour (sans changer le fichier).
app.put('/api/pages/:slug/products/:id', requireAuth, ownPage, writeLimiter, async (req, res) => {
  const prod = await Products.byId(req.params.id)
  if (!prod || prod.pageId !== req.page.id) return res.status(404).json({ error: 'Produit introuvable' })
  const patch = {}
  if (req.body.title != null) patch.title = clampStr(req.body.title, 80)
  if (req.body.description != null) patch.description = clampStr(req.body.description, 500)
  if (req.body.price != null) patch.priceCents = Math.max(100, Math.round((Number(req.body.price) || 0) * 100) || 100)
  if (req.body.active != null) patch.active = !!req.body.active
  if (req.body.coverImage != null) patch.coverImage = sanitizeAsset(req.body.coverImage)
  res.json({ product: { ...(await Products.update(prod.id, patch)), filePath: undefined } })
})

app.delete('/api/pages/:slug/products/:id', requireAuth, ownPage, async (req, res) => {
  const prod = await Products.byId(req.params.id)
  if (!prod || prod.pageId !== req.page.id) return res.status(404).json({ error: 'Produit introuvable' })
  await Products.remove(prod.id)
  await deleteProductFile(prod.filePath)
  res.json({ ok: true })
})

// Liste publique (produits actifs).
app.get('/api/public/:slug/products', async (req, res) => {
  const page = await Pages.bySlug(req.params.slug)
  if (!page) return res.status(404).json({ error: 'Page introuvable' })
  res.json({ products: await Products.publicByPage(page.id) })
})

// Achat d'un produit (Checkout via Connect, ou démo).
app.post('/api/public/:slug/products/:id/buy', tipLimiter, async (req, res) => {
  const page = await Pages.bySlug(req.params.slug)
  if (!page) return res.status(404).json({ error: 'Page introuvable' })
  const prod = await Products.byId(req.params.id)
  if (!prod || prod.pageId !== page.id || !prod.active) return res.status(404).json({ error: 'Produit indisponible' })
  const token = nanoid(24)

  if (!stripe) {
    // Démo : achat payé immédiatement
    const pu = await Purchases.create({ productId: prod.id, pageId: page.id, email: clampStr(req.body.email, 160), token, status: 'paid', stripeSessionId: `demo_${Date.now()}` })
    await Products.incSales(prod.id)
    deliverProduct(pu, prod)
    return res.json({ url: `${APP_URL}/buy-success?token=${token}` })
  }

  const owner = await Users.findById(page.userId)
  const params = {
    mode: 'payment',
    line_items: [{ price_data: { currency: 'eur', unit_amount: prod.priceCents, product_data: { name: prod.title, description: prod.description || undefined } }, quantity: 1 }],
    success_url: `${APP_URL}/buy-success?token=${token}`,
    cancel_url: `${APP_URL}/${page.slug}`,
    metadata: { type: 'product', productId: prod.id, token },
  }
  if (owner?.stripeAccountId && owner.payoutsEnabled) {
    const fee = Math.round(prod.priceCents * feeBps(owner.plan) / 10000)
    params.payment_intent_data = { transfer_data: { destination: owner.stripeAccountId }, ...(fee > 0 ? { application_fee_amount: fee } : {}) }
  }
  const session = await stripe.checkout.sessions.create(params)
  await Purchases.create({ productId: prod.id, pageId: page.id, token, stripeSessionId: session.id, status: 'pending' })
  res.json({ url: session.url })
})

// Statut d'un achat (pour la page de succès).
app.get('/api/purchase/:token', async (req, res) => {
  const pu = await Purchases.byToken(req.params.token)
  if (!pu) return res.status(404).json({ error: 'Achat introuvable' })
  const prod = await Products.byId(pu.productId)
  res.json({ status: pu.status, title: prod?.title || '', url: pu.status === 'paid' ? `/api/download/${pu.token}` : null })
})

// Téléchargement sécurisé (uniquement si payé).
app.get('/api/download/:token', async (req, res) => {
  const pu = await Purchases.byToken(req.params.token)
  if (!pu || pu.status !== 'paid') return res.status(403).json({ error: 'Téléchargement indisponible' })
  const prod = await Products.byId(pu.productId)
  if (!prod || !prod.filePath) return res.status(404).json({ error: 'Fichier introuvable' })
  const dl = await getProductDownload(prod.filePath)
  if (!dl) return res.status(404).json({ error: 'Fichier introuvable' })
  if (dl.redirect) return res.redirect(dl.redirect) // URL signée Supabase (privée, expire vite)
  res.download(dl.filePath, prod.fileName || 'telechargement')
})

// ================= PUBLIC =================
app.get('/api/public/:slug', async (req, res) => {
  const page = await Pages.bySlug(req.params.slug)
  if (!page) return res.status(404).json({ error: 'Page introuvable' })
  await Pages.incViews(page.id)
  const buttons = (await Buttons.byPage(page.id)).filter((b) => b.isActive)
  const owner = await Users.findById(page.userId)
  res.json({
    page: { title: page.title, slug: page.slug, bio: page.bio, headline: page.headline, avatarUrl: page.avatarUrl, emoji: page.emoji, mode: page.mode, theme: page.theme },
    buttons,
    branding: (owner?.plan || 'free') === 'free', // "Made with Aaven" visible en Free uniquement
    wallet: { apple: appleWalletConfigured, google: googleWalletConfigured },
  })
})

// ---------- Wallet (Apple .pkpass / Google "Save to Wallet") ----------
app.get('/api/wallet/apple/:slug', async (req, res) => {
  if (!appleWalletConfigured) return res.status(404).json({ error: 'Apple Wallet non configuré' })
  const page = await Pages.bySlug(req.params.slug)
  if (!page) return res.status(404).json({ error: 'Page introuvable' })
  try {
    const buf = await buildApplePass(page)
    res.set('Content-Type', 'application/vnd.apple.pkpass')
    res.set('Content-Disposition', `attachment; filename="aaven-${page.slug}.pkpass"`)
    res.send(buf)
  } catch (e) {
    console.error('  Apple Wallet:', e.message)
    res.status(500).json({ error: 'Génération du pass échouée' })
  }
})

app.get('/api/wallet/google/:slug', async (req, res) => {
  if (!googleWalletConfigured) return res.status(404).json({ error: 'Google Wallet non configuré' })
  const page = await Pages.bySlug(req.params.slug)
  if (!page) return res.status(404).json({ error: 'Page introuvable' })
  try {
    res.redirect(buildGoogleSaveUrl(page))
  } catch (e) {
    console.error('  Google Wallet:', e.message)
    res.status(500).json({ error: 'Lien Google Wallet échoué' })
  }
})

// Story vidéo : reçoit l'overlay (PNG transparent rendu côté client) et le superpose
// sur la vidéo de fond de la page → mp4 9:16 partageable en story.
const storyUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 6 * 1024 * 1024 } })
app.post('/api/story/:slug', writeLimiter, storyUpload.single('overlay'), async (req, res) => {
  try {
    const page = await Pages.bySlug(req.params.slug)
    if (!page) return res.status(404).json({ error: 'Page introuvable' })
    const theme = typeof page.theme === 'string' ? JSON.parse(page.theme || '{}') : (page.theme || {})
    const videoUrl = theme.introVideo || theme.bgVideo
    if (!videoUrl) return res.status(400).json({ error: 'Pas de vidéo de fond' })
    if (!req.file) return res.status(400).json({ error: 'Overlay manquant' })
    const mp4 = await buildStoryVideo(videoUrl, req.file.buffer)
    res.set('Content-Type', 'video/mp4')
    res.set('Content-Disposition', `inline; filename="aaven-${page.slug}.mp4"`)
    res.send(mp4)
  } catch (e) {
    console.error('  Story vidéo:', e.message)
    res.status(500).json({ error: 'Génération vidéo échouée' })
  }
})

app.post('/api/public/:slug/click/:buttonId', clickLimiter, async (req, res) => {
  const page = await Pages.bySlug(req.params.slug)
  if (!page) return res.status(404).json({ error: 'Page introuvable' })
  const btn = await Buttons.byId(req.params.buttonId)
  if (!btn || btn.pageId !== page.id) return res.status(404).json({ error: 'Bouton introuvable' })
  await Buttons.incClicks(btn.id)
  await Clicks.create(page.id, btn.id)
  res.json({ ok: true, url: btn.url })
})

// Formulaire de contact (public). Stocke + notifie l'owner par e-mail si SMTP configuré.
app.post('/api/public/:slug/contact', contactLimiter, async (req, res) => {
  const page = await Pages.bySlug(req.params.slug)
  if (!page) return res.status(404).json({ error: 'Page introuvable' })
  const name = clampStr(req.body.name, 80).trim()
  const email = clampStr(req.body.email, 160).trim()
  const body = clampStr(req.body.message, 2000).trim()
  const subject = clampStr(req.body.subject, 80)
  if (!body) return res.status(400).json({ error: 'Message vide' })
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return res.status(400).json({ error: 'E-mail invalide' })
  const msg = await Messages.create({ pageId: page.id, name, email, body, subject })
  notifyOwner(page, msg) // fire-and-forget
  res.json({ ok: true })
})

// Réservation de table (public, mini-formulaire). Stocke comme message + notifie l'owner.
app.post('/api/public/:slug/reserve', contactLimiter, async (req, res) => {
  const page = await Pages.bySlug(req.params.slug)
  if (!page) return res.status(404).json({ error: 'Page introuvable' })
  const name = clampStr(req.body.name, 80).trim()
  const phone = clampStr(req.body.phone, 40).trim()
  const date = clampStr(req.body.date, 20).trim()
  const time = clampStr(req.body.time, 10).trim()
  const guests = clampStr(String(req.body.guests ?? ''), 6).trim()
  const note = clampStr(req.body.note, 300).trim()
  if (!name || !phone || !date) return res.status(400).json({ error: 'Champs requis manquants' })
  const body = [
    `📅 Date : ${date}${time ? ` à ${time}` : ''}`,
    `👥 Couverts : ${guests || '—'}`,
    `🙋 Nom : ${name}`,
    `📞 Téléphone : ${phone}`,
    note ? `📝 Note : ${note}` : null,
  ].filter(Boolean).join('\n')
  const msg = await Messages.create({ pageId: page.id, name, email: '', body, subject: 'Réservation de table' })
  notifyOwner(page, msg) // fire-and-forget
  res.json({ ok: true })
})

// Mur de supporters (public) : compteur + soutiens récents (prénom, message, réponse).
app.get('/api/public/:slug/supporters', async (req, res) => {
  const page = await Pages.bySlug(req.params.slug)
  if (!page) return res.status(404).json({ error: 'Page introuvable' })
  const recent = (await Tips.recentPaid(page.id, 12)).filter((t) => t.name || t.message)
  res.json({ count: await Tips.countPaid(page.id), supporters: recent })
})

// ================= TIPS / STRIPE =================
let stripe = null
if (process.env.STRIPE_SECRET_KEY) {
  const Stripe = (await import('stripe')).default
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
}

app.post('/api/public/:slug/tip', tipLimiter, async (req, res) => {
  const page = await Pages.bySlug(req.params.slug)
  if (!page) return res.status(404).json({ error: 'Page introuvable' })
  const amount = Math.max(1, Math.round(Number(req.body.amount) || 0))
  const message = (req.body.message || '').slice(0, 500)
  const supporterName = clampStr(req.body.name, 60).trim()

  if (!stripe) {
    // Mode démo : simule un tip payé et renvoie vers la page de succès
    await Tips.create({ pageId: page.id, amount, message, supporterName, status: 'paid', stripeSessionId: `demo_${Date.now()}` })
    return res.json({ url: `${APP_URL}/tip-success?slug=${page.slug}&demo=1` })
  }

  const owner = await Users.findById(page.userId)
  const params = {
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: 'eur',
          unit_amount: amount * 100,
          product_data: { name: `Soutien à ${page.title}`, description: message || undefined },
        },
        quantity: 1,
      },
    ],
    success_url: `${APP_URL}/tip-success?slug=${page.slug}`,
    cancel_url: `${APP_URL}/${page.slug}`,
    metadata: { type: 'tip', pageId: page.id, message },
  }
  // Si le créateur a connecté ses paiements → l'argent va chez lui, commission à Aaven.
  if (owner?.stripeAccountId && owner.payoutsEnabled) {
    const fee = Math.round(amount * 100 * feeBps(owner.plan) / 10000)
    params.payment_intent_data = {
      transfer_data: { destination: owner.stripeAccountId },
      ...(fee > 0 ? { application_fee_amount: fee } : {}),
    }
  }
  const session = await stripe.checkout.sessions.create(params)
  await Tips.create({ pageId: page.id, amount, message, supporterName, stripeSessionId: session.id, status: 'pending' })
  res.json({ url: session.url })
})

async function handleWebhook(req, res) {
  if (!stripe) return res.json({ received: true })
  let event = req.body
  const sig = req.headers['stripe-signature']
  const whSecret = process.env.STRIPE_WEBHOOK_SECRET
  try {
    if (whSecret) event = stripe.webhooks.constructEvent(req.body, sig, whSecret)
    else event = JSON.parse(req.body)
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }
  try {
    if (event.type === 'checkout.session.completed') {
      const s = event.data.object
      if (s.metadata?.type === 'subscription') {
        await Users.setPlan(s.metadata.userId, s.metadata.plan, s.customer)
      } else if (s.metadata?.type === 'product') {
        const email = s.customer_details?.email || s.customer_email || ''
        const pu = await Purchases.markPaid(s.id, email)
        if (pu) {
          const prod = await Products.byId(pu.productId)
          if (prod) {
            await Products.incSales(prod.id)
            deliverProduct(pu, prod)
          }
        }
      } else {
        await Tips.markPaid(s.id)
      }
    }
    // Abonnement modifié / annulé → recalcule le plan.
    if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
      const sub = event.data.object
      const u = await Users.findByStripeCustomer(sub.customer)
      if (u) {
        let plan = 'free'
        if (event.type !== 'customer.subscription.deleted' && sub.status === 'active') {
          const priceId = sub.items?.data?.[0]?.price?.id
          if (priceId && priceId === PRICE.pro) plan = 'pro'
          else if (priceId && priceId === PRICE.creator) plan = 'creator'
        }
        await Users.setPlan(u.id, plan)
      }
    }
    // Compte Connect mis à jour → met à jour l'état des versements.
    if (event.type === 'account.updated') {
      const acct = event.data.object
      await Users.setPayouts(acct.id, !!acct.charges_enabled)
    }
  } catch (e) {
    console.error('  Webhook handler error:', e.message)
    return res.status(500).json({ error: 'handler' })
  }
  res.json({ received: true })
}

// ================= STATIC (production) =================
const dist = path.join(__dirname, '..', 'dist')

// Échappe le HTML pour injecter du contenu utilisateur dans les balises meta.
const escapeHtml = (s) =>
  String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

// Routes de l'app (SPA) à NE PAS traiter comme des slugs de page publique.
const RESERVED_SLUGS = new Set(['login', 'dashboard', 'onboarding', 'edit', 'stats', 'buy-success', 'tip-success', 'api', 'assets'])

// Injecte des balises meta (OG/Twitter/title) spécifiques au profil → aperçus de partage corrects.
function renderPublicMeta(template, page) {
  const title = `${page.title || page.slug} · Aaven`
  const desc = page.headline || page.bio || `La page de ${page.title || page.slug} sur Aaven.`
  let image = page.avatarUrl || page.theme?.bgImage || '/og-image.png'
  if (image.startsWith('/')) image = `${APP_URL}${image}`
  const url = `${APP_URL}/${page.slug}`

  let html = template
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(title)}</title>`)
  const set = (attr, key, val) => {
    const re = new RegExp(`(<meta ${attr}="${key}" content=")[^"]*(")`)
    html = re.test(html) ? html.replace(re, `$1${escapeHtml(val)}$2`) : html
  }
  set('name', 'description', desc)
  set('property', 'og:type', 'profile')
  set('property', 'og:title', title)
  set('property', 'og:description', desc)
  set('property', 'og:image', image)
  set('name', 'twitter:title', title)
  set('name', 'twitter:description', desc)
  set('name', 'twitter:image', image)
  set('property', 'og:url', url)
  // canonical → URL du profil (remplace la home par défaut)
  html = html.replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${escapeHtml(url)}$2`)
  // Données structurées (rich results) : page de profil
  const jsonld = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    mainEntity: {
      '@type': 'Person',
      name: page.title || page.slug,
      url,
      ...(page.avatarUrl ? { image: page.avatarUrl } : {}),
      ...((page.headline || page.bio) ? { description: page.headline || page.bio } : {}),
    },
  }
  html = html.replace('</head>', `    <script type="application/ld+json">${JSON.stringify(jsonld)}</script>\n  </head>`)
  return html
}

if (fs.existsSync(dist)) {
  app.use(express.static(dist))

  // Pages publiques : on sert index.html enrichi des meta du profil (aperçus sociaux).
  let indexTemplate = ''
  try { indexTemplate = fs.readFileSync(path.join(dist, 'index.html'), 'utf8') } catch { /* build absent */ }
  app.get('/:slug', async (req, res, next) => {
    try {
      const { slug } = req.params
      if (!indexTemplate || RESERVED_SLUGS.has(slug) || slug.includes('.')) return next()
      const page = await Pages.bySlug(slug)
      if (!page) return next()
      res.set('Content-Type', 'text/html; charset=utf-8').send(renderPublicMeta(indexTemplate, page))
    } catch (e) { next(e) }
  })

  app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) return res.status(404).json({ error: 'Not found' })
    res.sendFile(path.join(dist, 'index.html'))
  })
}

// Gestionnaire d'erreurs global : toute erreur async non rattrapée → 500 JSON propre.
app.use((err, req, res, next) => {
  console.error('  Erreur serveur:', err?.message || err)
  if (res.headersSent) return next(err)
  res.status(500).json({ error: 'Erreur serveur' })
})

app.listen(PORT, () => {
  console.log(`\n  Aaven API → http://localhost:${PORT}`)
  console.log(`  Base données : ${process.env.DATABASE_URL ? 'PostgreSQL (Supabase) ✓' : 'SQLite (dev local)'}`)
  console.log(`  Stockage     : ${storageMode === 'supabase' ? 'Supabase Storage ✓' : 'disque local (dev)'}`)
  console.log(`  Google OAuth : ${googleConfigured ? 'configuré ✓' : 'mode démo (dev-login)'}`)
  console.log(`  Stripe       : ${stripe ? 'configuré ✓' : 'mode démo (paiement simulé)'}`)
  console.log(`  Email (SMTP) : ${mailer ? 'configuré ✓' : 'désactivé (messages seulement stockés)'}\n`)
})
