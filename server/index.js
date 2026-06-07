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
import { sanitizeUrl, sanitizeAsset, clampStr, sanitizeTheme } from './validate.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = process.env.PORT || 3001
const APP_URL = process.env.APP_URL || 'http://localhost:5180'
const SECRET = process.env.SESSION_SECRET || 'dev-secret-change-me'
const googleConfigured = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)

// Commission BioBoost selon le plan (points de base : 500 = 5%).
const FEE_BPS = { free: 500, creator: 100, pro: 0 }
const feeBps = (plan) => FEE_BPS[plan] ?? 500

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

// ---------- Upload d'images (fonds de page) ----------
const uploadsDir = path.join(__dirname, 'uploads')
fs.mkdirSync(uploadsDir, { recursive: true })
const ALLOWED_IMG = /^image\/(png|jpe?g|webp|gif|avif)$/
const EXT = { 'image/png': '.png', 'image/jpeg': '.jpg', 'image/jpg': '.jpg', 'image/webp': '.webp', 'image/gif': '.gif', 'image/avif': '.avif' }
const upload = multer({
  storage: multer.diskStorage({
    destination: uploadsDir,
    filename: (req, file, cb) => cb(null, `${req.page.id}-${nanoid(8)}${EXT[file.mimetype] || '.img'}`),
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 Mo
  fileFilter: (req, file, cb) => cb(null, ALLOWED_IMG.test(file.mimetype)),
})
app.use('/uploads', express.static(uploadsDir, { maxAge: '7d' }))

// ---------- Fichiers produits (privés, jamais servis en statique) ----------
const productFilesDir = path.join(__dirname, 'product-files')
fs.mkdirSync(productFilesDir, { recursive: true })
const productUpload = multer({
  storage: multer.diskStorage({
    destination: productFilesDir,
    filename: (req, file, cb) => {
      const ext = (path.extname(file.originalname) || '').replace(/[^.a-z0-9]/gi, '').slice(0, 10)
      cb(null, `${req.page.id}-${nanoid(10)}${ext}`)
    },
  }),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 Mo
})
function productUploadSingle(req, res, next) {
  productUpload.single('file')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.code === 'LIMIT_FILE_SIZE' ? 'Fichier trop lourd (max 50 Mo)' : 'Upload invalide' })
    next()
  })
}

// ---------- Médias d'ambiance (vidéo/audio/image) — servis en statique ----------
const ALLOWED_MEDIA = /^(image|video|audio)\//
const mediaUpload = multer({
  storage: multer.diskStorage({
    destination: uploadsDir,
    filename: (req, file, cb) => {
      const ext = (path.extname(file.originalname) || '').replace(/[^.a-z0-9]/gi, '').slice(0, 12)
      cb(null, `${req.page.id}-${nanoid(8)}${ext}`)
    },
  }),
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
  const owner = Users.findById(page.userId)
  if (!owner?.email) return
  try {
    await mailer.sendMail({
      from: process.env.SMTP_FROM || 'BioBoost <no-reply@bioboost.app>',
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
      from: process.env.SMTP_FROM || 'BioBoost <no-reply@bioboost.app>',
      to: purchase.email,
      subject: `Ton téléchargement : ${product.title}`,
      text: `Merci pour ton achat ! 🎉\n\nTélécharge « ${product.title} » ici :\n${url}\n\n— BioBoost`,
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
function setSession(res, userId) {
  res.cookie('bb_session', sign(userId), {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 30 * 24 * 3600 * 1000,
  })
}
function currentUser(req) {
  const id = verify(req.cookies?.bb_session)
  return id ? Users.findById(id) : null
}
function requireAuth(req, res, next) {
  const u = currentUser(req)
  if (!u) return res.status(401).json({ error: 'Non authentifié' })
  req.user = u
  next()
}
function ownPage(req, res, next) {
  const page = Pages.bySlug(req.params.slug)
  if (!page) return res.status(404).json({ error: 'Page introuvable' })
  if (page.userId !== req.user.id) return res.status(403).json({ error: 'Accès refusé' })
  req.page = page
  next()
}

// ================= AUTH =================
app.get('/api/me', (req, res) => {
  const u = currentUser(req)
  if (!u) return res.json({ user: null })
  res.json({ user: { id: u.id, email: u.email, name: u.name, avatarUrl: u.avatarUrl, plan: u.plan } })
})

// Dev login : crée/retourne un compte de démo (utilisé quand Google non configuré)
app.post('/api/auth/dev-login', authLimiter, (req, res) => {
  const u = Users.upsertFromGoogle({
    googleId: 'dev-user',
    email: 'demo@bioboost.app',
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
    const u = Users.upsertFromGoogle({
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
  res.clearCookie('bb_session')
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
      Users.setStripeAccount(req.user.id, acct)
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
    Users.setPayouts(req.user.stripeAccountId, enabled)
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
    Users.setPlan(req.user.id, plan)
    return res.json({ demo: true, plan })
  }
  try {
    let customer = req.user.stripeCustomerId
    if (!customer) {
      const c = await stripe.customers.create({ email: req.user.email })
      customer = c.id
      Users.setPlan(req.user.id, req.user.plan, customer)
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
app.post('/api/billing/downgrade', requireAuth, (req, res) => {
  if (stripe && req.user.stripeCustomerId) return res.json({ demo: false, portal: true })
  Users.setPlan(req.user.id, 'free')
  res.json({ demo: true, plan: 'free' })
})

// ================= PAGES (privé) =================
app.get('/api/pages', requireAuth, (req, res) => {
  res.json({ pages: Pages.byUser(req.user.id) })
})

app.post('/api/pages', requireAuth, createLimiter, (req, res) => {
  const title = clampStr(req.body.title, 80).trim()
  const bio = clampStr(req.body.bio, 280)
  const headline = clampStr(req.body.headline, 80)
  const { mode } = req.body
  if (!title || !['creator', 'bar', 'freelance'].includes(mode)) {
    return res.status(400).json({ error: 'Titre et mode requis' })
  }
  const page = Pages.create({ userId: req.user.id, title, bio, headline, mode })
  // Pré-remplissage des boutons selon le preset du mode
  const preset = PRESETS_SERVER[mode] || []
  preset.forEach((item, i) => {
    const def = BUTTON_TYPES_SERVER[item.type]
    Buttons.create(page.id, {
      type: item.type,
      label: def.label.fr,
      icon: def.icon,
      url: '',
      isActive: true,
      featured: !!item.featured,
      position: i,
    })
  })
  res.json({ page, buttons: Buttons.byPage(page.id) })
})

app.get('/api/pages/:slug', requireAuth, ownPage, (req, res) => {
  res.json({ page: req.page, buttons: Buttons.byPage(req.page.id) })
})

app.put('/api/pages/:slug', requireAuth, ownPage, writeLimiter, (req, res) => {
  const { title, slug, bio, headline, avatarUrl, emoji, buttons } = req.body
  // Slug : valide l'unicité si changé
  let newSlug = req.page.slug
  if (slug && slug !== req.page.slug) {
    const cleaned = slug.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/^-+|-+$/g, '')
    const taken = Pages.bySlug(cleaned)
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
    if ((req.user.plan || 'free') === 'free') {
      th.animation = 'none'
      th.introVideo = ''
      th.bgVideo = ''
      th.bgVideoOwn = false
      th.ambientAudio = ''
    }
    patch.theme = th
  }
  const page = Pages.update(req.page.id, patch)
  let nb = Buttons.byPage(page.id)
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
    }))
    nb = Buttons.sync(page.id, clean)
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
app.post('/api/pages/:slug/upload', requireAuth, ownPage, writeLimiter, uploadSingle, (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Image invalide (formats : png, jpg, webp, gif, avif)' })
  res.json({ url: `/uploads/${req.file.filename}` })
})

// Upload média (vidéo/audio/image) pour l'ambiance.
app.post('/api/pages/:slug/upload-media', requireAuth, ownPage, writeLimiter, mediaUploadSingle, (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Fichier invalide (image, vidéo ou audio)' })
  res.json({ url: `/uploads/${req.file.filename}` })
})

app.delete('/api/pages/:slug', requireAuth, ownPage, (req, res) => {
  Pages.remove(req.page.id)
  // Nettoie les images uploadées de cette page (préfixées par son id).
  try {
    for (const f of fs.readdirSync(uploadsDir)) {
      if (f.startsWith(`${req.page.id}-`)) fs.unlinkSync(path.join(uploadsDir, f))
    }
  } catch {
    /* non bloquant */
  }
  res.json({ ok: true })
})

app.get('/api/pages/:slug/stats', requireAuth, ownPage, (req, res) => {
  const buttons = Buttons.byPage(req.page.id)
  const totalClicks = buttons.reduce((s, b) => s + b.clicks, 0)
  res.json({
    views: req.page.views,
    totalClicks,
    messages: Messages.countByPage(req.page.id),
    buttons: buttons.map((b) => ({ id: b.id, label: b.label, icon: b.icon, clicks: b.clicks })),
  })
})

// Messages reçus (owner uniquement).
app.get('/api/pages/:slug/messages', requireAuth, ownPage, (req, res) => {
  res.json({ messages: Messages.byPage(req.page.id) })
})

// Soutiens reçus (owner) + réponse du créateur.
app.get('/api/pages/:slug/tips', requireAuth, ownPage, (req, res) => {
  res.json({ tips: Tips.byPage(req.page.id) })
})
app.post('/api/pages/:slug/tips/:tipId/reply', requireAuth, ownPage, writeLimiter, (req, res) => {
  const tip = Tips.byId(req.params.tipId)
  if (!tip || tip.pageId !== req.page.id) return res.status(404).json({ error: 'Soutien introuvable' })
  res.json({ tip: Tips.setReply(tip.id, clampStr(req.body.reply, 280)) })
})

// ================= PRODUITS DIGITAUX =================
const FREE_PRODUCT_LIMIT = 3
function productQuota(req, res, next) {
  const plan = req.user.plan || 'free'
  if (plan === 'free' && Products.countByPage(req.page.id) >= FREE_PRODUCT_LIMIT) {
    return res.status(403).json({ error: `Limite de ${FREE_PRODUCT_LIMIT} produits (passe Creator pour l'illimité)` })
  }
  next()
}

// Liste owner (avec nom de fichier).
app.get('/api/pages/:slug/products', requireAuth, ownPage, (req, res) => {
  res.json({ products: Products.byPage(req.page.id).map((p) => ({ ...p, filePath: undefined })) })
})

// Création (multipart : file + champs).
app.post('/api/pages/:slug/products', requireAuth, ownPage, writeLimiter, productQuota, productUploadSingle, (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Fichier requis' })
  const title = clampStr(req.body.title, 80).trim()
  if (!title) return res.status(400).json({ error: 'Titre requis' })
  const description = clampStr(req.body.description, 500)
  const priceCents = Math.max(100, Math.round((Number(req.body.price) || 0) * 100) || 100)
  const coverImage = sanitizeAsset(req.body.coverImage)
  const prod = Products.create(req.page.id, { title, description, priceCents, coverImage, filePath: req.file.filename, fileName: req.file.originalname })
  res.json({ product: { ...prod, filePath: undefined } })
})

// Mise à jour (sans changer le fichier).
app.put('/api/pages/:slug/products/:id', requireAuth, ownPage, writeLimiter, (req, res) => {
  const prod = Products.byId(req.params.id)
  if (!prod || prod.pageId !== req.page.id) return res.status(404).json({ error: 'Produit introuvable' })
  const patch = {}
  if (req.body.title != null) patch.title = clampStr(req.body.title, 80)
  if (req.body.description != null) patch.description = clampStr(req.body.description, 500)
  if (req.body.price != null) patch.priceCents = Math.max(100, Math.round((Number(req.body.price) || 0) * 100) || 100)
  if (req.body.active != null) patch.active = !!req.body.active
  if (req.body.coverImage != null) patch.coverImage = sanitizeAsset(req.body.coverImage)
  res.json({ product: { ...Products.update(prod.id, patch), filePath: undefined } })
})

app.delete('/api/pages/:slug/products/:id', requireAuth, ownPage, (req, res) => {
  const prod = Products.byId(req.params.id)
  if (!prod || prod.pageId !== req.page.id) return res.status(404).json({ error: 'Produit introuvable' })
  Products.remove(prod.id)
  try {
    if (prod.filePath) fs.unlinkSync(path.join(productFilesDir, prod.filePath))
  } catch {
    /* non bloquant */
  }
  res.json({ ok: true })
})

// Liste publique (produits actifs).
app.get('/api/public/:slug/products', (req, res) => {
  const page = Pages.bySlug(req.params.slug)
  if (!page) return res.status(404).json({ error: 'Page introuvable' })
  res.json({ products: Products.publicByPage(page.id) })
})

// Achat d'un produit (Checkout via Connect, ou démo).
app.post('/api/public/:slug/products/:id/buy', tipLimiter, async (req, res) => {
  const page = Pages.bySlug(req.params.slug)
  if (!page) return res.status(404).json({ error: 'Page introuvable' })
  const prod = Products.byId(req.params.id)
  if (!prod || prod.pageId !== page.id || !prod.active) return res.status(404).json({ error: 'Produit indisponible' })
  const token = nanoid(24)

  if (!stripe) {
    // Démo : achat payé immédiatement
    const pu = Purchases.create({ productId: prod.id, pageId: page.id, email: clampStr(req.body.email, 160), token, status: 'paid', stripeSessionId: `demo_${Date.now()}` })
    Products.incSales(prod.id)
    deliverProduct(pu, prod)
    return res.json({ url: `${APP_URL}/buy-success?token=${token}` })
  }

  const owner = Users.findById(page.userId)
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
  Purchases.create({ productId: prod.id, pageId: page.id, token, stripeSessionId: session.id, status: 'pending' })
  res.json({ url: session.url })
})

// Statut d'un achat (pour la page de succès).
app.get('/api/purchase/:token', (req, res) => {
  const pu = Purchases.byToken(req.params.token)
  if (!pu) return res.status(404).json({ error: 'Achat introuvable' })
  const prod = Products.byId(pu.productId)
  res.json({ status: pu.status, title: prod?.title || '', url: pu.status === 'paid' ? `/api/download/${pu.token}` : null })
})

// Téléchargement sécurisé (uniquement si payé).
app.get('/api/download/:token', (req, res) => {
  const pu = Purchases.byToken(req.params.token)
  if (!pu || pu.status !== 'paid') return res.status(403).json({ error: 'Téléchargement indisponible' })
  const prod = Products.byId(pu.productId)
  if (!prod || !prod.filePath) return res.status(404).json({ error: 'Fichier introuvable' })
  const full = path.join(productFilesDir, prod.filePath)
  if (!fs.existsSync(full)) return res.status(404).json({ error: 'Fichier introuvable' })
  res.download(full, prod.fileName || 'telechargement')
})

// ================= PUBLIC =================
app.get('/api/public/:slug', (req, res) => {
  const page = Pages.bySlug(req.params.slug)
  if (!page) return res.status(404).json({ error: 'Page introuvable' })
  Pages.incViews(page.id)
  const buttons = Buttons.byPage(page.id).filter((b) => b.isActive)
  const owner = Users.findById(page.userId)
  res.json({
    page: { title: page.title, slug: page.slug, bio: page.bio, headline: page.headline, avatarUrl: page.avatarUrl, emoji: page.emoji, mode: page.mode, theme: page.theme },
    buttons,
    branding: (owner?.plan || 'free') === 'free', // "Made with BioBoost" visible en Free uniquement
  })
})

app.post('/api/public/:slug/click/:buttonId', clickLimiter, (req, res) => {
  const page = Pages.bySlug(req.params.slug)
  if (!page) return res.status(404).json({ error: 'Page introuvable' })
  const btn = Buttons.byId(req.params.buttonId)
  if (!btn || btn.pageId !== page.id) return res.status(404).json({ error: 'Bouton introuvable' })
  Buttons.incClicks(btn.id)
  Clicks.create(page.id, btn.id)
  res.json({ ok: true, url: btn.url })
})

// Formulaire de contact (public). Stocke + notifie l'owner par e-mail si SMTP configuré.
app.post('/api/public/:slug/contact', contactLimiter, async (req, res) => {
  const page = Pages.bySlug(req.params.slug)
  if (!page) return res.status(404).json({ error: 'Page introuvable' })
  const name = clampStr(req.body.name, 80).trim()
  const email = clampStr(req.body.email, 160).trim()
  const body = clampStr(req.body.message, 2000).trim()
  const subject = clampStr(req.body.subject, 80)
  if (!body) return res.status(400).json({ error: 'Message vide' })
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return res.status(400).json({ error: 'E-mail invalide' })
  const msg = Messages.create({ pageId: page.id, name, email, body, subject })
  notifyOwner(page, msg) // fire-and-forget
  res.json({ ok: true })
})

// Mur de supporters (public) : compteur + soutiens récents (prénom, message, réponse).
app.get('/api/public/:slug/supporters', (req, res) => {
  const page = Pages.bySlug(req.params.slug)
  if (!page) return res.status(404).json({ error: 'Page introuvable' })
  const recent = Tips.recentPaid(page.id, 12).filter((t) => t.name || t.message)
  res.json({ count: Tips.countPaid(page.id), supporters: recent })
})

// ================= TIPS / STRIPE =================
let stripe = null
if (process.env.STRIPE_SECRET_KEY) {
  const Stripe = (await import('stripe')).default
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
}

app.post('/api/public/:slug/tip', tipLimiter, async (req, res) => {
  const page = Pages.bySlug(req.params.slug)
  if (!page) return res.status(404).json({ error: 'Page introuvable' })
  const amount = Math.max(1, Math.round(Number(req.body.amount) || 0))
  const message = (req.body.message || '').slice(0, 500)
  const supporterName = clampStr(req.body.name, 60).trim()

  if (!stripe) {
    // Mode démo : simule un tip payé et renvoie vers la page de succès
    Tips.create({ pageId: page.id, amount, message, supporterName, status: 'paid', stripeSessionId: `demo_${Date.now()}` })
    return res.json({ url: `${APP_URL}/tip-success?slug=${page.slug}&demo=1` })
  }

  const owner = Users.findById(page.userId)
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
  // Si le créateur a connecté ses paiements → l'argent va chez lui, commission à BioBoost.
  if (owner?.stripeAccountId && owner.payoutsEnabled) {
    const fee = Math.round(amount * 100 * feeBps(owner.plan) / 10000)
    params.payment_intent_data = {
      transfer_data: { destination: owner.stripeAccountId },
      ...(fee > 0 ? { application_fee_amount: fee } : {}),
    }
  }
  const session = await stripe.checkout.sessions.create(params)
  Tips.create({ pageId: page.id, amount, message, supporterName, stripeSessionId: session.id, status: 'pending' })
  res.json({ url: session.url })
})

function handleWebhook(req, res) {
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
  if (event.type === 'checkout.session.completed') {
    const s = event.data.object
    if (s.metadata?.type === 'subscription') {
      Users.setPlan(s.metadata.userId, s.metadata.plan, s.customer)
    } else if (s.metadata?.type === 'product') {
      const email = s.customer_details?.email || s.customer_email || ''
      const pu = Purchases.markPaid(s.id, email)
      if (pu) {
        const prod = Products.byId(pu.productId)
        if (prod) {
          Products.incSales(prod.id)
          deliverProduct(pu, prod)
        }
      }
    } else {
      Tips.markPaid(s.id)
    }
  }
  // Abonnement modifié / annulé → recalcule le plan.
  if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
    const sub = event.data.object
    const u = Users.findByStripeCustomer(sub.customer)
    if (u) {
      let plan = 'free'
      if (event.type !== 'customer.subscription.deleted' && sub.status === 'active') {
        const priceId = sub.items?.data?.[0]?.price?.id
        if (priceId && priceId === PRICE.pro) plan = 'pro'
        else if (priceId && priceId === PRICE.creator) plan = 'creator'
      }
      Users.setPlan(u.id, plan)
    }
  }
  // Compte Connect mis à jour → met à jour l'état des versements.
  if (event.type === 'account.updated') {
    const acct = event.data.object
    Users.setPayouts(acct.id, !!acct.charges_enabled)
  }
  res.json({ received: true })
}

// ================= STATIC (production) =================
const dist = path.join(__dirname, '..', 'dist')
if (fs.existsSync(dist)) {
  app.use(express.static(dist))
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) return res.status(404).json({ error: 'Not found' })
    res.sendFile(path.join(dist, 'index.html'))
  })
}

app.listen(PORT, () => {
  console.log(`\n  BioBoost API → http://localhost:${PORT}`)
  console.log(`  Google OAuth : ${googleConfigured ? 'configuré ✓' : 'mode démo (dev-login)'}`)
  console.log(`  Stripe       : ${stripe ? 'configuré ✓' : 'mode démo (paiement simulé)'}\n`)
})
