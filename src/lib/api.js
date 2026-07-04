// Petit client HTTP pour l'API REST. Les cookies de session sont inclus.

async function req(method, path, body) {
  const opts = {
    method,
    credentials: 'include',
    headers: {},
  }
  if (body !== undefined) {
    opts.headers['Content-Type'] = 'application/json'
    opts.body = JSON.stringify(body)
  }
  const res = await fetch(`/api${path}`, opts)
  const text = await res.text()
  const data = text ? JSON.parse(text) : null
  if (!res.ok) {
    const err = new Error((data && data.error) || res.statusText)
    err.status = res.status
    err.data = data
    throw err
  }
  return data
}

export const api = {
  get: (p) => req('GET', p),
  post: (p, b) => req('POST', p, b),
  put: (p, b) => req('PUT', p, b),
  del: (p) => req('DELETE', p),

  // Auth
  me: () => req('GET', '/me'),

  // Stripe Connect
  connectStart: () => req('POST', '/connect/start'),
  connectStatus: () => req('GET', '/connect/status'),

  // Abonnements (Billing)
  billingCheckout: (plan) => req('POST', '/billing/checkout', { plan }),
  billingPortal: () => req('POST', '/billing/portal'),
  billingDowngrade: () => req('POST', '/billing/downgrade'),
  devLogin: () => req('POST', '/auth/dev-login'),
  logout: () => req('POST', '/auth/logout'),

  // Pages
  myPages: () => req('GET', '/pages'),
  createPage: (b) => req('POST', '/pages', b),
  smartResolve: (url) => req('POST', '/smart/resolve', { url }),
  socialStat: (network, url) => req('POST', '/socials/stat', { network, url }),
  getPage: (slug) => req('GET', `/pages/${slug}`),
  updatePage: (slug, b) => req('PUT', `/pages/${slug}`, b),
  deletePage: (slug) => req('DELETE', `/pages/${slug}`),
  stats: (slug) => req('GET', `/pages/${slug}/stats`),
  messages: (slug) => req('GET', `/pages/${slug}/messages`),
  tips: (slug) => req('GET', `/pages/${slug}/tips`),
  replyTip: (slug, tipId, reply) => req('POST', `/pages/${slug}/tips/${tipId}/reply`, { reply }),

  // Produits digitaux (owner)
  products: (slug) => req('GET', `/pages/${slug}/products`),
  createProduct: async (slug, fields, file) => {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('title', fields.title || '')
    fd.append('description', fields.description || '')
    fd.append('price', fields.price ?? '')
    if (fields.coverImage) fd.append('coverImage', fields.coverImage)
    const res = await fetch(`/api/pages/${slug}/products`, { method: 'POST', credentials: 'include', body: fd })
    const text = await res.text()
    const data = text ? JSON.parse(text) : null
    if (!res.ok) {
      const err = new Error((data && data.error) || res.statusText)
      err.status = res.status
      throw err
    }
    return data
  },
  uploadMedia: async (slug, file) => {
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch(`/api/pages/${slug}/upload-media`, { method: 'POST', credentials: 'include', body: fd })
    const text = await res.text()
    const data = text ? JSON.parse(text) : null
    if (!res.ok) {
      const err = new Error((data && data.error) || res.statusText)
      err.status = res.status
      throw err
    }
    return data
  },
  updateProduct: (slug, id, b) => req('PUT', `/pages/${slug}/products/${id}`, b),
  deleteProduct: (slug, id) => req('DELETE', `/pages/${slug}/products/${id}`),

  // Upload d'image (fond de page) — multipart, renvoie { url }
  uploadImage: async (slug, file) => {
    const fd = new FormData()
    fd.append('image', file)
    const res = await fetch(`/api/pages/${slug}/upload`, { method: 'POST', credentials: 'include', body: fd })
    const text = await res.text()
    const data = text ? JSON.parse(text) : null
    if (!res.ok) {
      const err = new Error((data && data.error) || res.statusText)
      err.status = res.status
      throw err
    }
    return data
  },

  // Public
  publicPage: (slug) => req('GET', `/public/${slug}`),
  trackClick: (slug, buttonId) => req('POST', `/public/${slug}/click/${buttonId}`),
  sendMessage: (slug, b) => req('POST', `/public/${slug}/contact`, b),
  reserve: (slug, b) => req('POST', `/public/${slug}/reserve`, b),
  supporters: (slug) => req('GET', `/public/${slug}/supporters`),
  publicProducts: (slug) => req('GET', `/public/${slug}/products`),
  buyProduct: (slug, id) => req('POST', `/public/${slug}/products/${id}/buy`, {}),
  purchaseStatus: (token) => req('GET', `/purchase/${token}`),

  // Tips
  createTip: (slug, b) => req('POST', `/public/${slug}/tip`, b),
}
