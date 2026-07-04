// Smart Content — résolution automatique d'un lien collé par le créateur.
// Détecte le provider (YouTube, TikTok, Spotify, Instagram, Calendly…) puis
// récupère les métadonnées (titre, miniature, auteur) via oEmbed ou balises OG.
// → { kind, url, meta: { title, author, thumbnail } }
//
// Extensible : ajouter un provider = une entrée dans PROVIDERS (aucun changement
// d'architecture ailleurs).

const FETCH_TIMEOUT = 6000
const MAX_HTML = 300 * 1024 // 300 Ko suffisent pour le <head>

// ---------- Détection ----------
// Chaque provider : test hostname/chemin → kind + méthode de résolution.
const PROVIDERS = [
  { kind: 'youtube', test: (u) => /(^|\.)youtube\.com$/.test(u.hostname) || u.hostname === 'youtu.be', oembed: (url) => `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json` },
  { kind: 'tiktok', test: (u) => /(^|\.)tiktok\.com$/.test(u.hostname), oembed: (url) => `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}` },
  { kind: 'spotify', test: (u) => u.hostname === 'open.spotify.com', oembed: (url) => `https://open.spotify.com/oembed?url=${encodeURIComponent(url)}` },
  { kind: 'music', test: (u) => /(^|\.)(soundcloud\.com|music\.apple\.com|deezer\.com)$/.test(u.hostname), og: true },
  { kind: 'instagram', test: (u) => /(^|\.)instagram\.com$/.test(u.hostname) }, // pas d'oEmbed sans token → carte simple
  { kind: 'booking', test: (u) => /(^|\.)(calendly\.com|cal\.com|planity\.com|treatwell\.\w+|zcal\.co|youcanbook\.me)$/.test(u.hostname) },
  { kind: 'product', test: (u) => /(^|\.)(gumroad\.com|lemonsqueezy\.com|payhip\.com)$/.test(u.hostname) || /myshopify\.com$/.test(u.hostname) || /\/products?\//.test(u.pathname), og: true },
  { kind: 'blog', test: (u) => /(^|\.)(substack\.com|medium\.com|notion\.site|notion\.so)$/.test(u.hostname) || /\/(blog|article|post)s?\//.test(u.pathname), og: true },
]

export function detectKind(rawUrl) {
  let u
  try { u = new URL(rawUrl) } catch { return null }
  if (!/^https?:$/.test(u.protocol)) return null
  const p = PROVIDERS.find((x) => x.test(u))
  return { kind: p ? p.kind : 'generic', provider: p || null, parsed: u }
}

// ---------- Garde SSRF (pour le fetch OG générique) ----------
function isPrivateHost(hostname) {
  const h = hostname.toLowerCase()
  if (h === 'localhost' || h.endsWith('.local') || h.endsWith('.internal')) return true
  // IP littérales (v4) privées / loopback / link-local / metadata cloud
  const m = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)
  if (m) {
    const [a, b] = [Number(m[1]), Number(m[2])]
    if (a === 10 || a === 127 || a === 0 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 169 && b === 254)) return true
    return false // IP publique littérale : autorisée
  }
  if (h.includes(':')) return true // IPv6 littérale : on refuse (simplicité)
  return false
}

async function fetchWithLimit(url, asJson) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT)
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      redirect: 'follow',
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AavenBot/1.0; +https://www.aaven.fr)', Accept: asJson ? 'application/json' : 'text/html' },
    })
    if (!res.ok) return null
    if (asJson) return await res.json()
    // Lecture bornée du HTML (le <head> arrive en premier)
    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let html = ''
    while (html.length < MAX_HTML) {
      const { done, value } = await reader.read()
      if (done) break
      html += decoder.decode(value, { stream: true })
      if (html.includes('</head>')) break
    }
    reader.cancel().catch(() => {})
    return html
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

// ---------- Extraction OG ----------
const ogTag = (html, prop) => {
  const re = new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']*)["']`, 'i')
  const alt = new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${prop}["']`, 'i')
  const m = html.match(re) || html.match(alt)
  return m ? m[1].trim() : ''
}
const decodeEntities = (s) => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&#x27;/gi, "'")

// ---------- Résolution ----------
export async function resolveSmartLink(rawUrl) {
  const det = detectKind(rawUrl)
  if (!det) return null
  const { kind, provider, parsed } = det
  const meta = { title: '', author: '', thumbnail: '' }

  if (provider?.oembed) {
    const data = await fetchWithLimit(provider.oembed(rawUrl), true)
    if (data) {
      meta.title = String(data.title || '').slice(0, 160)
      meta.author = String(data.author_name || '').slice(0, 80)
      meta.thumbnail = String(data.thumbnail_url || '').slice(0, 500)
    }
    // YouTube : miniature HD directe si l'oEmbed n'a rien donné
    if (kind === 'youtube' && !meta.thumbnail) {
      const id = parsed.hostname === 'youtu.be' ? parsed.pathname.slice(1) : parsed.searchParams.get('v')
      if (id) meta.thumbnail = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`
    }
  } else if ((provider?.og || kind === 'generic') && !isPrivateHost(parsed.hostname)) {
    const html = await fetchWithLimit(rawUrl, false)
    if (html) {
      meta.title = decodeEntities(ogTag(html, 'og:title') || (html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] || '')).slice(0, 160)
      meta.author = decodeEntities(ogTag(html, 'og:site_name')).slice(0, 80)
      meta.thumbnail = ogTag(html, 'og:image').slice(0, 500)
    }
  }

  if (!meta.title) {
    // Repli lisible : nom de domaine sans www.
    meta.title = parsed.hostname.replace(/^www\./, '')
  }
  return { kind, url: rawUrl, meta }
}
