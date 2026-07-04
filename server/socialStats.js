// Smart Socials — récupération automatique des compteurs d'abonnés.
// Supporté sans validation d'app tierce :
//   - YouTube : YouTube Data API v3 (clé simple, quota gratuit) → abonnés de la chaîne
//   - Spotify : Client Credentials (app Spotify gratuite)       → followers d'un artiste
// Instagram / TikTok : leurs API exigent une app validée (review Meta/TikTok, compte
// business) — pas faisable en code seul ; le champ reste manuel pour ces réseaux.

const YT_KEY = process.env.YOUTUBE_API_KEY
const SP_ID = process.env.SPOTIFY_CLIENT_ID
const SP_SECRET = process.env.SPOTIFY_CLIENT_SECRET

// 12345 → « 12.3k », 1 234 567 → « 1.2M » (format court affiché sous l'icône).
export function formatCount(n) {
  if (!Number.isFinite(n)) return ''
  if (n >= 1e6) return `${(n / 1e6).toFixed(n >= 1e7 ? 0 : 1).replace('.0', '')}M`
  if (n >= 1e3) return `${(n / 1e3).toFixed(n >= 1e4 ? 0 : 1).replace('.0', '')}k`
  return String(n)
}

async function getJson(url, opts) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 6000)
  try {
    const res = await fetch(url, { ...opts, signal: ctrl.signal })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

// --- YouTube : /channel/UC…, /@handle, /user/… ---
async function youtubeSubscribers(rawUrl) {
  if (!YT_KEY) return null
  let u
  try { u = new URL(rawUrl) } catch { return null }
  const base = 'https://www.googleapis.com/youtube/v3/channels?part=statistics'
  let q = null
  const chan = u.pathname.match(/\/channel\/(UC[\w-]+)/)
  const handle = u.pathname.match(/\/@([\w.-]+)/)
  const user = u.pathname.match(/\/user\/([\w-]+)/)
  if (chan) q = `id=${chan[1]}`
  else if (handle) q = `forHandle=@${handle[1]}`
  else if (user) q = `forUsername=${user[1]}`
  if (!q) return null
  const data = await getJson(`${base}&${q}&key=${YT_KEY}`)
  const n = Number(data?.items?.[0]?.statistics?.subscriberCount)
  return Number.isFinite(n) ? n : null
}

// --- Spotify : followers d'un artiste (open.spotify.com/artist/{id}) ---
let spToken = null // { value, exp }
async function spotifyToken() {
  if (spToken && spToken.exp > Date.now()) return spToken.value
  const data = await getJson('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${SP_ID}:${SP_SECRET}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })
  if (!data?.access_token) return null
  spToken = { value: data.access_token, exp: Date.now() + (data.expires_in - 60) * 1000 }
  return spToken.value
}
async function spotifyFollowers(rawUrl) {
  if (!SP_ID || !SP_SECRET) return null
  const m = String(rawUrl).match(/open\.spotify\.com\/(?:intl-\w+\/)?artist\/([A-Za-z0-9]+)/)
  if (!m) return null
  const token = await spotifyToken()
  if (!token) return null
  const data = await getJson(`https://api.spotify.com/v1/artists/${m[1]}`, { headers: { Authorization: `Bearer ${token}` } })
  const n = Number(data?.followers?.total)
  return Number.isFinite(n) ? n : null
}

// → { stat: '82k' } ou { stat: null } (réseau non supporté / clé absente / introuvable).
export async function fetchSocialStat(network, url) {
  let n = null
  if (network === 'youtube') n = await youtubeSubscribers(url)
  else if (network === 'spotify') n = await spotifyFollowers(url)
  return { stat: n == null ? null : formatCount(n) }
}
