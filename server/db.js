// Couche de données : SQLite (better-sqlite3).
// Écritures atomiques + transactionnelles (mode WAL) → fini le risque de
// corruption du store JSON. L'API publique (Users/Pages/Buttons/Clicks/Tips)
// est identique à l'ancienne implémentation fichier : rien d'autre à changer.

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { nanoid } from 'nanoid'
import Database from 'better-sqlite3'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_FILE = path.join(__dirname, 'bioboost.db')
const JSON_FILE = path.join(__dirname, 'data.json')

const db = new Database(DB_FILE)
db.pragma('journal_mode = WAL') // durabilité + lectures concurrentes
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT,
    name TEXT,
    avatarUrl TEXT DEFAULT '',
    googleId TEXT,
    plan TEXT DEFAULT 'free',
    createdAt TEXT
  );
  CREATE TABLE IF NOT EXISTS pages (
    id TEXT PRIMARY KEY,
    userId TEXT,
    title TEXT,
    slug TEXT UNIQUE,
    bio TEXT DEFAULT '',
    avatarUrl TEXT DEFAULT '',
    emoji TEXT DEFAULT '',
    mode TEXT,
    views INTEGER DEFAULT 0,
    createdAt TEXT,
    updatedAt TEXT
  );
  CREATE TABLE IF NOT EXISTS buttons (
    id TEXT PRIMARY KEY,
    pageId TEXT,
    type TEXT,
    label TEXT,
    icon TEXT,
    url TEXT DEFAULT '',
    isActive INTEGER DEFAULT 1,
    featured INTEGER DEFAULT 0,
    position INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS tips (
    id TEXT PRIMARY KEY,
    pageId TEXT,
    amount INTEGER,
    currency TEXT DEFAULT 'eur',
    message TEXT DEFAULT '',
    stripeSessionId TEXT DEFAULT '',
    status TEXT DEFAULT 'pending',
    createdAt TEXT
  );
  CREATE TABLE IF NOT EXISTS clicks (
    id TEXT PRIMARY KEY,
    pageId TEXT,
    buttonId TEXT,
    createdAt TEXT
  );
  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    pageId TEXT,
    name TEXT DEFAULT '',
    email TEXT DEFAULT '',
    body TEXT DEFAULT '',
    subject TEXT DEFAULT '',
    createdAt TEXT
  );
  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    pageId TEXT,
    title TEXT DEFAULT '',
    description TEXT DEFAULT '',
    priceCents INTEGER DEFAULT 0,
    filePath TEXT DEFAULT '',
    fileName TEXT DEFAULT '',
    coverImage TEXT DEFAULT '',
    active INTEGER DEFAULT 1,
    sales INTEGER DEFAULT 0,
    createdAt TEXT
  );
  CREATE TABLE IF NOT EXISTS purchases (
    id TEXT PRIMARY KEY,
    productId TEXT,
    pageId TEXT,
    email TEXT DEFAULT '',
    token TEXT,
    status TEXT DEFAULT 'pending',
    stripeSessionId TEXT DEFAULT '',
    createdAt TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_pages_user ON pages(userId);
  CREATE INDEX IF NOT EXISTS idx_messages_page ON messages(pageId);
  CREATE INDEX IF NOT EXISTS idx_buttons_page ON buttons(pageId);
  CREATE INDEX IF NOT EXISTS idx_clicks_page ON clicks(pageId);
  CREATE INDEX IF NOT EXISTS idx_products_page ON products(pageId);
  CREATE INDEX IF NOT EXISTS idx_purchases_token ON purchases(token);
`)

// Migrations de schéma incrémentales (ajout de colonnes sans casser l'existant).
const pageCols = db.prepare('PRAGMA table_info(pages)').all().map((c) => c.name)
if (!pageCols.includes('theme')) db.exec('ALTER TABLE pages ADD COLUMN theme TEXT')
if (!pageCols.includes('headline')) db.exec("ALTER TABLE pages ADD COLUMN headline TEXT DEFAULT ''")

const tipCols = db.prepare('PRAGMA table_info(tips)').all().map((c) => c.name)
if (!tipCols.includes('supporterName')) db.exec("ALTER TABLE tips ADD COLUMN supporterName TEXT DEFAULT ''")
if (!tipCols.includes('reply')) db.exec("ALTER TABLE tips ADD COLUMN reply TEXT DEFAULT ''")

const userCols = db.prepare('PRAGMA table_info(users)').all().map((c) => c.name)
if (!userCols.includes('stripeAccountId')) db.exec("ALTER TABLE users ADD COLUMN stripeAccountId TEXT DEFAULT ''")
if (!userCols.includes('payoutsEnabled')) db.exec('ALTER TABLE users ADD COLUMN payoutsEnabled INTEGER DEFAULT 0')
if (!userCols.includes('stripeCustomerId')) db.exec("ALTER TABLE users ADD COLUMN stripeCustomerId TEXT DEFAULT ''")

const now = () => new Date().toISOString()

// Parse le thème JSON stocké en colonne TEXT.
const mapPage = (r) => {
  if (!r) return r
  let theme = null
  if (r.theme) {
    try {
      theme = JSON.parse(r.theme)
    } catch {
      theme = null
    }
  }
  return { ...r, theme }
}

// ---------- Migration unique depuis data.json (si présent et base vide) ----------
function migrateFromJsonIfNeeded() {
  const count = db.prepare('SELECT COUNT(*) AS n FROM users').get().n
  if (count > 0) return
  if (!fs.existsSync(JSON_FILE)) return
  let json
  try {
    json = JSON.parse(fs.readFileSync(JSON_FILE, 'utf8'))
  } catch {
    return
  }
  const tx = db.transaction((d) => {
    for (const u of d.users || [])
      db.prepare('INSERT OR IGNORE INTO users (id,email,name,avatarUrl,googleId,plan,createdAt) VALUES (@id,@email,@name,@avatarUrl,@googleId,@plan,@createdAt)')
        .run({ avatarUrl: '', plan: 'free', createdAt: now(), ...u })
    for (const p of d.pages || [])
      db.prepare('INSERT OR IGNORE INTO pages (id,userId,title,slug,bio,avatarUrl,emoji,mode,views,createdAt,updatedAt) VALUES (@id,@userId,@title,@slug,@bio,@avatarUrl,@emoji,@mode,@views,@createdAt,@updatedAt)')
        .run({ bio: '', avatarUrl: '', emoji: '', views: 0, createdAt: now(), updatedAt: now(), ...p })
    for (const b of d.buttons || [])
      db.prepare('INSERT OR IGNORE INTO buttons (id,pageId,type,label,icon,url,isActive,featured,position,clicks) VALUES (@id,@pageId,@type,@label,@icon,@url,@isActive,@featured,@position,@clicks)')
        .run({ url: '', isActive: 1, featured: 0, position: 0, clicks: 0, ...b, isActive: b.isActive === false ? 0 : 1, featured: b.featured ? 1 : 0 })
    for (const t of d.tips || [])
      db.prepare('INSERT OR IGNORE INTO tips (id,pageId,amount,currency,message,stripeSessionId,status,createdAt) VALUES (@id,@pageId,@amount,@currency,@message,@stripeSessionId,@status,@createdAt)')
        .run({ currency: 'eur', message: '', stripeSessionId: '', status: 'pending', createdAt: now(), ...t })
    for (const c of d.clicks || [])
      db.prepare('INSERT OR IGNORE INTO clicks (id,pageId,buttonId,createdAt) VALUES (@id,@pageId,@buttonId,@createdAt)')
        .run({ createdAt: now(), ...c })
  })
  tx(json)
  // Conserve l'ancien fichier en backup horodaté
  try {
    fs.renameSync(JSON_FILE, `${JSON_FILE}.migrated-${Date.now()}.bak`)
  } catch {
    /* non bloquant */
  }
  console.log('  Données migrées depuis data.json → SQLite ✓')
}
migrateFromJsonIfNeeded()

// ---------- Mappers (SQLite stocke les booléens en INTEGER) ----------
const mapButton = (r) => (r ? { ...r, isActive: !!r.isActive, featured: !!r.featured } : null)

// ---------- Slug ----------
export function slugify(s) {
  return (
    (s || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '') // accents
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'page'
  )
}
export function uniqueSlug(base, ignoreId = null) {
  const slug = slugify(base)
  const taken = (s) =>
    !!db.prepare('SELECT 1 FROM pages WHERE slug = ? AND id IS NOT ?').get(s, ignoreId)
  let candidate = slug
  let n = 1
  while (taken(candidate)) {
    n += 1
    candidate = `${slug}-${n}`
  }
  return candidate
}

// ---------- Users ----------
export const Users = {
  findByGoogleId: (gid) => db.prepare('SELECT * FROM users WHERE googleId = ?').get(gid),
  findByEmail: (email) => db.prepare('SELECT * FROM users WHERE email = ?').get(email),
  findById: (id) => db.prepare('SELECT * FROM users WHERE id = ?').get(id),
  findByStripeAccount: (acct) => db.prepare('SELECT * FROM users WHERE stripeAccountId = ?').get(acct),
  findByStripeCustomer: (cus) => db.prepare('SELECT * FROM users WHERE stripeCustomerId = ?').get(cus),
  setStripeAccount: (userId, accountId) => db.prepare('UPDATE users SET stripeAccountId = ? WHERE id = ?').run(accountId, userId),
  setPayouts: (accountId, enabled) => db.prepare('UPDATE users SET payoutsEnabled = ? WHERE stripeAccountId = ?').run(enabled ? 1 : 0, accountId),
  setPlan: (userId, plan, customerId) => db.prepare('UPDATE users SET plan = ?, stripeCustomerId = COALESCE(?, stripeCustomerId) WHERE id = ?').run(plan, customerId || null, userId),
  upsertFromGoogle({ googleId, email, name, avatarUrl }) {
    let u =
      (googleId && db.prepare('SELECT * FROM users WHERE googleId = ?').get(googleId)) ||
      (email && db.prepare('SELECT * FROM users WHERE email = ?').get(email))
    if (u) {
      db.prepare('UPDATE users SET name = ?, avatarUrl = ?, googleId = ? WHERE id = ?').run(
        name || u.name,
        avatarUrl || u.avatarUrl,
        googleId || u.googleId,
        u.id
      )
      return Users.findById(u.id)
    }
    const user = { id: nanoid(12), email, name, avatarUrl: avatarUrl || '', googleId, plan: 'free', createdAt: now() }
    db.prepare('INSERT INTO users (id,email,name,avatarUrl,googleId,plan,createdAt) VALUES (@id,@email,@name,@avatarUrl,@googleId,@plan,@createdAt)').run(user)
    return user
  },
}

// ---------- Pages ----------
const PAGE_COLUMNS = ['title', 'slug', 'bio', 'headline', 'avatarUrl', 'emoji', 'mode', 'views']

export const Pages = {
  byUser: (userId) =>
    db.prepare('SELECT * FROM pages WHERE userId = ? ORDER BY createdAt DESC').all(userId).map(mapPage),
  bySlug: (slug) => mapPage(db.prepare('SELECT * FROM pages WHERE slug = ?').get(slug)),
  byId: (id) => mapPage(db.prepare('SELECT * FROM pages WHERE id = ?').get(id)),

  create({ userId, title, bio, mode, headline }) {
    const page = {
      id: nanoid(12),
      userId,
      title,
      slug: uniqueSlug(title),
      bio: bio || '',
      headline: headline || '',
      avatarUrl: '',
      emoji: '',
      mode,
      views: 0,
      createdAt: now(),
      updatedAt: now(),
    }
    db.prepare('INSERT INTO pages (id,userId,title,slug,bio,headline,avatarUrl,emoji,mode,views,createdAt,updatedAt) VALUES (@id,@userId,@title,@slug,@bio,@headline,@avatarUrl,@emoji,@mode,@views,@createdAt,@updatedAt)').run(page)
    return page
  },

  update(id, patch) {
    const fields = Object.keys(patch).filter((k) => PAGE_COLUMNS.includes(k))
    const sets = fields.map((k) => `${k} = @${k}`)
    const args = {}
    for (const k of fields) args[k] = patch[k]
    // Le thème est stocké en JSON (colonne TEXT).
    if ('theme' in patch) {
      sets.push('theme = @theme')
      args.theme = patch.theme == null ? null : JSON.stringify(patch.theme)
    }
    if (sets.length) {
      args.id = id
      args.updatedAt = now()
      db.prepare(`UPDATE pages SET ${sets.join(', ')}, updatedAt = @updatedAt WHERE id = @id`).run(args)
    }
    return Pages.byId(id)
  },

  remove(id) {
    const tx = db.transaction((pageId) => {
      db.prepare('DELETE FROM clicks WHERE pageId = ?').run(pageId)
      db.prepare('DELETE FROM tips WHERE pageId = ?').run(pageId)
      db.prepare('DELETE FROM messages WHERE pageId = ?').run(pageId)
      db.prepare('DELETE FROM purchases WHERE pageId = ?').run(pageId)
      db.prepare('DELETE FROM products WHERE pageId = ?').run(pageId)
      db.prepare('DELETE FROM buttons WHERE pageId = ?').run(pageId)
      db.prepare('DELETE FROM pages WHERE id = ?').run(pageId)
    })
    tx(id)
  },

  incViews(id) {
    db.prepare('UPDATE pages SET views = views + 1 WHERE id = ?').run(id)
  },
}

// ---------- Buttons ----------
export const Buttons = {
  byPage: (pageId) =>
    db.prepare('SELECT * FROM buttons WHERE pageId = ? ORDER BY position ASC').all(pageId).map(mapButton),
  byId: (id) => mapButton(db.prepare('SELECT * FROM buttons WHERE id = ?').get(id)),

  create(pageId, b) {
    const btn = {
      id: nanoid(10),
      pageId,
      type: b.type,
      label: b.label,
      icon: b.icon,
      url: b.url || '',
      isActive: b.isActive !== false ? 1 : 0,
      featured: b.featured ? 1 : 0,
      position: b.position ?? 0,
      clicks: 0,
    }
    db.prepare('INSERT INTO buttons (id,pageId,type,label,icon,url,isActive,featured,position,clicks) VALUES (@id,@pageId,@type,@label,@icon,@url,@isActive,@featured,@position,@clicks)').run(btn)
    return mapButton(btn)
  },

  // Synchronise la liste de boutons d'une page (créations / maj / suppressions) — transactionnel.
  sync(pageId, incoming) {
    const tx = db.transaction((items) => {
      const existing = db.prepare('SELECT id FROM buttons WHERE pageId = ?').all(pageId).map((r) => r.id)
      const existingSet = new Set(existing)
      const keepIds = new Set()
      for (const item of items) {
        if (item.id && existingSet.has(item.id)) {
          db.prepare('UPDATE buttons SET type=@type,label=@label,icon=@icon,url=@url,isActive=@isActive,featured=@featured,position=@position WHERE id=@id').run({
            id: item.id,
            type: item.type,
            label: item.label,
            icon: item.icon,
            url: item.url || '',
            isActive: item.isActive !== false ? 1 : 0,
            featured: item.featured ? 1 : 0,
            position: item.position ?? 0,
          })
          keepIds.add(item.id)
        } else {
          const created = Buttons.create(pageId, item)
          keepIds.add(created.id)
        }
      }
      for (const id of existing) if (!keepIds.has(id)) db.prepare('DELETE FROM buttons WHERE id = ?').run(id)
    })
    tx(incoming)
    return Buttons.byPage(pageId)
  },

  incClicks(id) {
    db.prepare('UPDATE buttons SET clicks = clicks + 1 WHERE id = ?').run(id)
    return Buttons.byId(id)
  },
}

// ---------- Clicks ----------
export const Clicks = {
  create(pageId, buttonId) {
    db.prepare('INSERT INTO clicks (id,pageId,buttonId,createdAt) VALUES (?,?,?,?)').run(nanoid(10), pageId, buttonId, now())
  },
}

// ---------- Tips ----------
export const Tips = {
  create({ pageId, amount, currency, message, supporterName, stripeSessionId, status }) {
    const tip = {
      id: nanoid(12),
      pageId,
      amount,
      currency: currency || 'eur',
      message: message || '',
      supporterName: supporterName || '',
      reply: '',
      stripeSessionId: stripeSessionId || '',
      status: status || 'pending',
      createdAt: now(),
    }
    db.prepare('INSERT INTO tips (id,pageId,amount,currency,message,supporterName,reply,stripeSessionId,status,createdAt) VALUES (@id,@pageId,@amount,@currency,@message,@supporterName,@reply,@stripeSessionId,@status,@createdAt)').run(tip)
    return tip
  },
  markPaid(stripeSessionId) {
    db.prepare("UPDATE tips SET status = 'paid' WHERE stripeSessionId = ?").run(stripeSessionId)
    return db.prepare('SELECT * FROM tips WHERE stripeSessionId = ?').get(stripeSessionId)
  },
  // Mur de supporters (public) : tips payés récents.
  recentPaid: (pageId, limit = 12) =>
    db.prepare("SELECT id, supporterName AS name, message, reply, createdAt FROM tips WHERE pageId = ? AND status = 'paid' ORDER BY createdAt DESC LIMIT ?").all(pageId, limit),
  countPaid: (pageId) =>
    db.prepare("SELECT COUNT(*) AS n FROM tips WHERE pageId = ? AND status = 'paid'").get(pageId).n,
  // Liste owner (pour répondre).
  byPage: (pageId) =>
    db.prepare("SELECT id, amount, message, supporterName AS name, reply, createdAt FROM tips WHERE pageId = ? AND status = 'paid' ORDER BY createdAt DESC").all(pageId),
  byId: (id) => db.prepare('SELECT * FROM tips WHERE id = ?').get(id),
  setReply(id, reply) {
    db.prepare('UPDATE tips SET reply = ? WHERE id = ?').run(reply, id)
    return Tips.byId(id)
  },
}

// ---------- Messages (formulaire de contact) ----------
export const Messages = {
  create({ pageId, name, email, body, subject }) {
    const msg = {
      id: nanoid(12),
      pageId,
      name: name || '',
      email: email || '',
      body: body || '',
      subject: subject || '',
      createdAt: now(),
    }
    db.prepare('INSERT INTO messages (id,pageId,name,email,body,subject,createdAt) VALUES (@id,@pageId,@name,@email,@body,@subject,@createdAt)').run(msg)
    return msg
  },
  byPage: (pageId) => db.prepare('SELECT * FROM messages WHERE pageId = ? ORDER BY createdAt DESC').all(pageId),
  countByPage: (pageId) => db.prepare('SELECT COUNT(*) AS n FROM messages WHERE pageId = ?').get(pageId).n,
}

// ---------- Produits digitaux ----------
const PRODUCT_COLUMNS = ['title', 'description', 'priceCents', 'coverImage', 'active']
export const Products = {
  byPage: (pageId) =>
    db.prepare('SELECT * FROM products WHERE pageId = ? ORDER BY createdAt DESC').all(pageId).map((p) => ({ ...p, active: !!p.active })),
  // Public : seulement actifs, sans le chemin du fichier.
  publicByPage: (pageId) =>
    db.prepare('SELECT id, title, description, priceCents, coverImage, sales FROM products WHERE pageId = ? AND active = 1 ORDER BY createdAt DESC').all(pageId),
  byId: (id) => db.prepare('SELECT * FROM products WHERE id = ?').get(id),
  countByPage: (pageId) => db.prepare('SELECT COUNT(*) AS n FROM products WHERE pageId = ?').get(pageId).n,
  create(pageId, p) {
    const prod = {
      id: nanoid(12),
      pageId,
      title: p.title || '',
      description: p.description || '',
      priceCents: p.priceCents || 0,
      filePath: p.filePath || '',
      fileName: p.fileName || '',
      coverImage: p.coverImage || '',
      active: p.active === false ? 0 : 1,
      sales: 0,
      createdAt: now(),
    }
    db.prepare('INSERT INTO products (id,pageId,title,description,priceCents,filePath,fileName,coverImage,active,sales,createdAt) VALUES (@id,@pageId,@title,@description,@priceCents,@filePath,@fileName,@coverImage,@active,@sales,@createdAt)').run(prod)
    return { ...prod, active: !!prod.active }
  },
  update(id, patch) {
    const fields = Object.keys(patch).filter((k) => PRODUCT_COLUMNS.includes(k))
    if (!fields.length) return Products.byId(id)
    const set = fields.map((k) => `${k} = @${k}`).join(', ')
    const args = { id }
    for (const k of fields) args[k] = k === 'active' ? (patch[k] ? 1 : 0) : patch[k]
    db.prepare(`UPDATE products SET ${set} WHERE id = @id`).run(args)
    return Products.byId(id)
  },
  remove: (id) => db.prepare('DELETE FROM products WHERE id = ?').run(id),
  incSales: (id) => db.prepare('UPDATE products SET sales = sales + 1 WHERE id = ?').run(id),
}

// ---------- Achats ----------
export const Purchases = {
  create({ productId, pageId, email, token, stripeSessionId, status }) {
    const pu = { id: nanoid(12), productId, pageId, email: email || '', token, stripeSessionId: stripeSessionId || '', status: status || 'pending', createdAt: now() }
    db.prepare('INSERT INTO purchases (id,productId,pageId,email,token,stripeSessionId,status,createdAt) VALUES (@id,@productId,@pageId,@email,@token,@stripeSessionId,@status,@createdAt)').run(pu)
    return pu
  },
  byToken: (token) => db.prepare('SELECT * FROM purchases WHERE token = ?').get(token),
  byStripeSession: (sid) => db.prepare('SELECT * FROM purchases WHERE stripeSessionId = ?').get(sid),
  markPaid(stripeSessionId, email) {
    db.prepare("UPDATE purchases SET status = 'paid', email = COALESCE(NULLIF(?, ''), email) WHERE stripeSessionId = ?").run(email || '', stripeSessionId)
    return Purchases.byStripeSession(stripeSessionId)
  },
}

export { db }
