// Couche de données — PostgreSQL (Supabase) via `pg`.
// Implémentation ASYNC, API identique à db.sqlite.js (Users/Pages/Buttons/…).
// Activée automatiquement quand DATABASE_URL est défini (voir db.js).
//
// Choix de portage :
//  - colonnes camelCase conservées via identifiants quotés ("userId", "isActive"…)
//    → les objets renvoyés gardent exactement les mêmes clés que la version SQLite.
//  - booléens stockés en INTEGER 0/1 (comme SQLite) → mappers `!!r.isActive` inchangés.
//  - theme/config stockés en TEXT JSON → mappers JSON.parse inchangés.
//  - timestamps en TEXT ISO → tri lexicographique identique.

import pg from 'pg'
import { nanoid } from 'nanoid'

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  // Supabase exige TLS. PGSSL=disable pour un Postgres local sans TLS.
  ssl: process.env.PGSSL === 'disable' ? false : { rejectUnauthorized: false },
  max: Number(process.env.PG_POOL_MAX || 10),
})

const all = async (text, params) => (await pool.query(text, params)).rows
const one = async (text, params) => (await pool.query(text, params)).rows[0] || null
const run = async (text, params) => { await pool.query(text, params) }

const now = () => new Date().toISOString()

// ---------- Schéma ----------
await pool.query(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT,
    name TEXT,
    "avatarUrl" TEXT DEFAULT '',
    "googleId" TEXT,
    plan TEXT DEFAULT 'free',
    "createdAt" TEXT,
    "stripeAccountId" TEXT DEFAULT '',
    "payoutsEnabled" INTEGER DEFAULT 0,
    "stripeCustomerId" TEXT DEFAULT ''
  );
  CREATE TABLE IF NOT EXISTS pages (
    id TEXT PRIMARY KEY,
    "userId" TEXT,
    title TEXT,
    slug TEXT UNIQUE,
    bio TEXT DEFAULT '',
    "avatarUrl" TEXT DEFAULT '',
    emoji TEXT DEFAULT '',
    mode TEXT,
    views INTEGER DEFAULT 0,
    "createdAt" TEXT,
    "updatedAt" TEXT,
    theme TEXT,
    headline TEXT DEFAULT ''
  );
  CREATE TABLE IF NOT EXISTS buttons (
    id TEXT PRIMARY KEY,
    "pageId" TEXT,
    type TEXT,
    label TEXT,
    icon TEXT,
    url TEXT DEFAULT '',
    "isActive" INTEGER DEFAULT 1,
    featured INTEGER DEFAULT 0,
    position INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    config TEXT
  );
  CREATE TABLE IF NOT EXISTS tips (
    id TEXT PRIMARY KEY,
    "pageId" TEXT,
    amount INTEGER,
    currency TEXT DEFAULT 'eur',
    message TEXT DEFAULT '',
    "stripeSessionId" TEXT DEFAULT '',
    status TEXT DEFAULT 'pending',
    "createdAt" TEXT,
    "supporterName" TEXT DEFAULT '',
    reply TEXT DEFAULT ''
  );
  CREATE TABLE IF NOT EXISTS clicks (
    id TEXT PRIMARY KEY,
    "pageId" TEXT,
    "buttonId" TEXT,
    "createdAt" TEXT
  );
  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    "pageId" TEXT,
    name TEXT DEFAULT '',
    email TEXT DEFAULT '',
    body TEXT DEFAULT '',
    subject TEXT DEFAULT '',
    "createdAt" TEXT
  );
  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    "pageId" TEXT,
    title TEXT DEFAULT '',
    description TEXT DEFAULT '',
    "priceCents" INTEGER DEFAULT 0,
    "filePath" TEXT DEFAULT '',
    "fileName" TEXT DEFAULT '',
    "coverImage" TEXT DEFAULT '',
    active INTEGER DEFAULT 1,
    sales INTEGER DEFAULT 0,
    "createdAt" TEXT
  );
  CREATE TABLE IF NOT EXISTS purchases (
    id TEXT PRIMARY KEY,
    "productId" TEXT,
    "pageId" TEXT,
    email TEXT DEFAULT '',
    token TEXT,
    status TEXT DEFAULT 'pending',
    "stripeSessionId" TEXT DEFAULT '',
    "createdAt" TEXT
  );
  CREATE TABLE IF NOT EXISTS subscribers (
    id TEXT PRIMARY KEY,
    "pageId" TEXT,
    email TEXT,
    name TEXT DEFAULT '',
    "createdAt" TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_pages_user ON pages("userId");
  CREATE INDEX IF NOT EXISTS idx_messages_page ON messages("pageId");
  CREATE INDEX IF NOT EXISTS idx_buttons_page ON buttons("pageId");
  CREATE INDEX IF NOT EXISTS idx_clicks_page ON clicks("pageId");
  CREATE INDEX IF NOT EXISTS idx_products_page ON products("pageId");
  CREATE INDEX IF NOT EXISTS idx_purchases_token ON purchases(token);
  CREATE INDEX IF NOT EXISTS idx_subscribers_page ON subscribers("pageId");
`)

// Migrations incrémentales (colonnes ajoutées après la création initiale du schéma).
await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS profession TEXT DEFAULT ''`)

// ---------- Mappers ----------
const mapPage = (r) => {
  if (!r) return r
  let theme = null
  if (r.theme) { try { theme = JSON.parse(r.theme) } catch { theme = null } }
  return { ...r, theme }
}
const mapButton = (r) => {
  if (!r) return r
  let config = null
  if (r.config) { try { config = JSON.parse(r.config) } catch { config = null } }
  return { ...r, isActive: !!r.isActive, featured: !!r.featured, config }
}

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
export async function uniqueSlug(base, ignoreId = null) {
  const slug = slugify(base)
  let candidate = slug
  let n = 1
  // `IS DISTINCT FROM` gère le cas ignoreId = null.
  while (await one('SELECT 1 FROM pages WHERE slug = $1 AND id IS DISTINCT FROM $2', [candidate, ignoreId])) {
    n += 1
    candidate = `${slug}-${n}`
  }
  return candidate
}

// ---------- Users ----------
export const Users = {
  findByGoogleId: (gid) => one('SELECT * FROM users WHERE "googleId" = $1', [gid]),
  findByEmail: (email) => one('SELECT * FROM users WHERE email = $1', [email]),
  findById: (id) => one('SELECT * FROM users WHERE id = $1', [id]),
  findByStripeAccount: (acct) => one('SELECT * FROM users WHERE "stripeAccountId" = $1', [acct]),
  findByStripeCustomer: (cus) => one('SELECT * FROM users WHERE "stripeCustomerId" = $1', [cus]),
  setStripeAccount: (userId, accountId) => run('UPDATE users SET "stripeAccountId" = $1 WHERE id = $2', [accountId, userId]),
  setPayouts: (accountId, enabled) => run('UPDATE users SET "payoutsEnabled" = $1 WHERE "stripeAccountId" = $2', [enabled ? 1 : 0, accountId]),
  setPlan: (userId, plan, customerId) =>
    run('UPDATE users SET plan = $1, "stripeCustomerId" = COALESCE($2, "stripeCustomerId") WHERE id = $3', [plan, customerId || null, userId]),
  setProfession: (userId, profession) => run('UPDATE users SET profession = $1 WHERE id = $2', [profession, userId]),
  async upsertFromGoogle({ googleId, email, name, avatarUrl }) {
    let u =
      (googleId && (await one('SELECT * FROM users WHERE "googleId" = $1', [googleId]))) ||
      (email && (await one('SELECT * FROM users WHERE email = $1', [email])))
    if (u) {
      await run('UPDATE users SET name = $1, "avatarUrl" = $2, "googleId" = $3 WHERE id = $4', [
        name || u.name,
        avatarUrl || u.avatarUrl,
        googleId || u.googleId,
        u.id,
      ])
      return Users.findById(u.id)
    }
    const user = { id: nanoid(12), email, name, avatarUrl: avatarUrl || '', googleId, plan: 'free', createdAt: now() }
    await run(
      'INSERT INTO users (id,email,name,"avatarUrl","googleId",plan,"createdAt") VALUES ($1,$2,$3,$4,$5,$6,$7)',
      [user.id, user.email, user.name, user.avatarUrl, user.googleId, user.plan, user.createdAt]
    )
    return user
  },
}

// ---------- Pages ----------
const PAGE_COLUMNS = ['title', 'slug', 'bio', 'headline', 'avatarUrl', 'emoji', 'mode', 'views']

export const Pages = {
  async byUser(userId) {
    return (await all('SELECT * FROM pages WHERE "userId" = $1 ORDER BY "createdAt" DESC', [userId])).map(mapPage)
  },
  async bySlug(slug) { return mapPage(await one('SELECT * FROM pages WHERE slug = $1', [slug])) },
  async byId(id) { return mapPage(await one('SELECT * FROM pages WHERE id = $1', [id])) },
  // Liste légère pour le sitemap (slug + date + flag noindex lu dans le thème JSON).
  async forSitemap() {
    const rows = await all('SELECT slug, "updatedAt", theme FROM pages ORDER BY "updatedAt" DESC')
    return rows.map((r) => {
      let noindex = false
      try { noindex = !!JSON.parse(r.theme || '{}').noindex } catch { /* noop */ }
      return { slug: r.slug, updatedAt: r.updatedAt, noindex }
    })
  },

  async create({ userId, title, bio, mode, headline }) {
    const page = {
      id: nanoid(12),
      userId,
      title,
      slug: await uniqueSlug(title),
      bio: bio || '',
      headline: headline || '',
      avatarUrl: '',
      emoji: '',
      mode,
      views: 0,
      createdAt: now(),
      updatedAt: now(),
    }
    await run(
      'INSERT INTO pages (id,"userId",title,slug,bio,headline,"avatarUrl",emoji,mode,views,"createdAt","updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)',
      [page.id, page.userId, page.title, page.slug, page.bio, page.headline, page.avatarUrl, page.emoji, page.mode, page.views, page.createdAt, page.updatedAt]
    )
    return page
  },

  async update(id, patch) {
    const fields = Object.keys(patch).filter((k) => PAGE_COLUMNS.includes(k))
    const sets = []
    const args = []
    let i = 1
    for (const k of fields) { sets.push(`"${k}" = $${i++}`); args.push(patch[k]) }
    if ('theme' in patch) { sets.push(`theme = $${i++}`); args.push(patch.theme == null ? null : JSON.stringify(patch.theme)) }
    if (sets.length) {
      sets.push(`"updatedAt" = $${i++}`); args.push(now())
      args.push(id)
      await run(`UPDATE pages SET ${sets.join(', ')} WHERE id = $${i}`, args)
    }
    return Pages.byId(id)
  },

  async remove(id) {
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      for (const t of ['clicks', 'tips', 'messages', 'purchases', 'products', 'subscribers', 'buttons']) {
        await client.query(`DELETE FROM ${t} WHERE "pageId" = $1`, [id])
      }
      await client.query('DELETE FROM pages WHERE id = $1', [id])
      await client.query('COMMIT')
    } catch (e) {
      await client.query('ROLLBACK')
      throw e
    } finally {
      client.release()
    }
  },

  incViews: (id) => run('UPDATE pages SET views = views + 1 WHERE id = $1', [id]),
}

// ---------- Buttons ----------
export const Buttons = {
  async byPage(pageId) {
    return (await all('SELECT * FROM buttons WHERE "pageId" = $1 ORDER BY position ASC', [pageId])).map(mapButton)
  },
  async byId(id) { return mapButton(await one('SELECT * FROM buttons WHERE id = $1', [id])) },

  async create(pageId, b) {
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
      config: b.config != null ? JSON.stringify(b.config) : null,
    }
    await run(
      'INSERT INTO buttons (id,"pageId",type,label,icon,url,"isActive",featured,position,clicks,config) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)',
      [btn.id, btn.pageId, btn.type, btn.label, btn.icon, btn.url, btn.isActive, btn.featured, btn.position, btn.clicks, btn.config]
    )
    return mapButton(btn)
  },

  async sync(pageId, incoming) {
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      const existing = (await client.query('SELECT id FROM buttons WHERE "pageId" = $1', [pageId])).rows.map((r) => r.id)
      const existingSet = new Set(existing)
      const keepIds = new Set()
      for (const item of incoming) {
        if (item.id && existingSet.has(item.id)) {
          await client.query(
            'UPDATE buttons SET type=$1,label=$2,icon=$3,url=$4,"isActive"=$5,featured=$6,position=$7,config=$8 WHERE id=$9',
            [item.type, item.label, item.icon, item.url || '', item.isActive !== false ? 1 : 0, item.featured ? 1 : 0, item.position ?? 0, item.config != null ? JSON.stringify(item.config) : null, item.id]
          )
          keepIds.add(item.id)
        } else {
          const id = nanoid(10)
          await client.query(
            'INSERT INTO buttons (id,"pageId",type,label,icon,url,"isActive",featured,position,clicks,config) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)',
            [id, pageId, item.type, item.label, item.icon, item.url || '', item.isActive !== false ? 1 : 0, item.featured ? 1 : 0, item.position ?? 0, 0, item.config != null ? JSON.stringify(item.config) : null]
          )
          keepIds.add(id)
        }
      }
      for (const id of existing) if (!keepIds.has(id)) await client.query('DELETE FROM buttons WHERE id = $1', [id])
      await client.query('COMMIT')
    } catch (e) {
      await client.query('ROLLBACK')
      throw e
    } finally {
      client.release()
    }
    return Buttons.byPage(pageId)
  },

  async incClicks(id) {
    await run('UPDATE buttons SET clicks = clicks + 1 WHERE id = $1', [id])
    return Buttons.byId(id)
  },
}

// ---------- Clicks ----------
export const Clicks = {
  create: (pageId, buttonId) =>
    run('INSERT INTO clicks (id,"pageId","buttonId","createdAt") VALUES ($1,$2,$3,$4)', [nanoid(10), pageId, buttonId, now()]),
}

// ---------- Tips ----------
export const Tips = {
  async create({ pageId, amount, currency, message, supporterName, stripeSessionId, status }) {
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
    await run(
      'INSERT INTO tips (id,"pageId",amount,currency,message,"supporterName",reply,"stripeSessionId",status,"createdAt") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',
      [tip.id, tip.pageId, tip.amount, tip.currency, tip.message, tip.supporterName, tip.reply, tip.stripeSessionId, tip.status, tip.createdAt]
    )
    return tip
  },
  async markPaid(stripeSessionId) {
    await run("UPDATE tips SET status = 'paid' WHERE \"stripeSessionId\" = $1", [stripeSessionId])
    return one('SELECT * FROM tips WHERE "stripeSessionId" = $1', [stripeSessionId])
  },
  recentPaid: (pageId, limit = 12) =>
    all('SELECT id, "supporterName" AS name, message, reply, "createdAt" FROM tips WHERE "pageId" = $1 AND status = \'paid\' ORDER BY "createdAt" DESC LIMIT $2', [pageId, limit]),
  async countPaid(pageId) {
    const r = await one('SELECT COUNT(*)::int AS n FROM tips WHERE "pageId" = $1 AND status = \'paid\'', [pageId])
    return r ? r.n : 0
  },
  async sumPaid(pageId) {
    const r = await one('SELECT COALESCE(SUM(amount),0)::int AS total, COUNT(*)::int AS n FROM tips WHERE "pageId" = $1 AND status = \'paid\'', [pageId])
    return r || { total: 0, n: 0 }
  },
  byPage: (pageId) =>
    all('SELECT id, amount, message, "supporterName" AS name, reply, "createdAt" FROM tips WHERE "pageId" = $1 AND status = \'paid\' ORDER BY "createdAt" DESC', [pageId]),
  byId: (id) => one('SELECT * FROM tips WHERE id = $1', [id]),
  async setReply(id, reply) {
    await run('UPDATE tips SET reply = $1 WHERE id = $2', [reply, id])
    return Tips.byId(id)
  },
}

// ---------- Messages ----------
export const Messages = {
  async create({ pageId, name, email, body, subject }) {
    const msg = { id: nanoid(12), pageId, name: name || '', email: email || '', body: body || '', subject: subject || '', createdAt: now() }
    await run(
      'INSERT INTO messages (id,"pageId",name,email,body,subject,"createdAt") VALUES ($1,$2,$3,$4,$5,$6,$7)',
      [msg.id, msg.pageId, msg.name, msg.email, msg.body, msg.subject, msg.createdAt]
    )
    return msg
  },
  byPage: (pageId) => all('SELECT * FROM messages WHERE "pageId" = $1 ORDER BY "createdAt" DESC', [pageId]),
  async countByPage(pageId) {
    const r = await one('SELECT COUNT(*)::int AS n FROM messages WHERE "pageId" = $1', [pageId])
    return r ? r.n : 0
  },
}

// ---------- Produits ----------
const PRODUCT_COLUMNS = ['title', 'description', 'priceCents', 'coverImage', 'active']
export const Products = {
  async byPage(pageId) {
    return (await all('SELECT * FROM products WHERE "pageId" = $1 ORDER BY "createdAt" DESC', [pageId])).map((p) => ({ ...p, active: !!p.active }))
  },
  publicByPage: (pageId) =>
    all('SELECT id, title, description, "priceCents", "coverImage", sales FROM products WHERE "pageId" = $1 AND active = 1 ORDER BY "createdAt" DESC', [pageId]),
  byId: (id) => one('SELECT * FROM products WHERE id = $1', [id]),
  async countByPage(pageId) {
    const r = await one('SELECT COUNT(*)::int AS n FROM products WHERE "pageId" = $1', [pageId])
    return r ? r.n : 0
  },
  async create(pageId, p) {
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
    await run(
      'INSERT INTO products (id,"pageId",title,description,"priceCents","filePath","fileName","coverImage",active,sales,"createdAt") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)',
      [prod.id, prod.pageId, prod.title, prod.description, prod.priceCents, prod.filePath, prod.fileName, prod.coverImage, prod.active, prod.sales, prod.createdAt]
    )
    return { ...prod, active: !!prod.active }
  },
  async update(id, patch) {
    const fields = Object.keys(patch).filter((k) => PRODUCT_COLUMNS.includes(k))
    if (!fields.length) return Products.byId(id)
    const sets = []
    const args = []
    let i = 1
    for (const k of fields) { sets.push(`"${k}" = $${i++}`); args.push(k === 'active' ? (patch[k] ? 1 : 0) : patch[k]) }
    args.push(id)
    await run(`UPDATE products SET ${sets.join(', ')} WHERE id = $${i}`, args)
    return Products.byId(id)
  },
  remove: (id) => run('DELETE FROM products WHERE id = $1', [id]),
  incSales: (id) => run('UPDATE products SET sales = sales + 1 WHERE id = $1', [id]),
}

// ---------- Abonnés newsletter ----------
export const Subscribers = {
  // Dédoublonné par e-mail (insensible à la casse) : ré-inscription = no-op.
  async create({ pageId, email, name }) {
    const clean = String(email || '').trim().toLowerCase()
    const existing = await one('SELECT * FROM subscribers WHERE "pageId" = $1 AND lower(email) = $2', [pageId, clean])
    if (existing) return existing
    const sub = { id: nanoid(12), pageId, email: clean, name: name || '', createdAt: now() }
    await run(
      'INSERT INTO subscribers (id,"pageId",email,name,"createdAt") VALUES ($1,$2,$3,$4,$5)',
      [sub.id, sub.pageId, sub.email, sub.name, sub.createdAt]
    )
    return sub
  },
  byPage: (pageId) => all('SELECT id, email, name, "createdAt" FROM subscribers WHERE "pageId" = $1 ORDER BY "createdAt" DESC', [pageId]),
  async countByPage(pageId) {
    const r = await one('SELECT COUNT(*)::int AS n FROM subscribers WHERE "pageId" = $1', [pageId])
    return r ? r.n : 0
  },
}

// ---------- Achats ----------
export const Purchases = {
  async create({ productId, pageId, email, token, stripeSessionId, status }) {
    const pu = { id: nanoid(12), productId, pageId, email: email || '', token, stripeSessionId: stripeSessionId || '', status: status || 'pending', createdAt: now() }
    await run(
      'INSERT INTO purchases (id,"productId","pageId",email,token,"stripeSessionId",status,"createdAt") VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
      [pu.id, pu.productId, pu.pageId, pu.email, pu.token, pu.stripeSessionId, pu.status, pu.createdAt]
    )
    return pu
  },
  byToken: (token) => one('SELECT * FROM purchases WHERE token = $1', [token]),
  byStripeSession: (sid) => one('SELECT * FROM purchases WHERE "stripeSessionId" = $1', [sid]),
  async markPaid(stripeSessionId, email) {
    await run(
      "UPDATE purchases SET status = 'paid', email = COALESCE(NULLIF($1, ''), email) WHERE \"stripeSessionId\" = $2",
      [email || '', stripeSessionId]
    )
    return Purchases.byStripeSession(stripeSessionId)
  },
  async revenueByPage(pageId) {
    const r = await one('SELECT COALESCE(SUM(p."priceCents"),0)::int AS cents, COUNT(*)::int AS n FROM purchases pu JOIN products p ON p.id = pu."productId" WHERE pu."pageId" = $1 AND pu.status = \'paid\'', [pageId])
    return r || { cents: 0, n: 0 }
  },
}

export { pool }
