// Statut « en direct » des Smart Socials — connecteurs niveau 3.
// Supporté sans validation d'app tierce :
//   - Twitch  : Helix (app client credentials gratuite)         → stream en cours ?
//   - YouTube : Data API v3 (même clé que les stats d'abonnés)  → live en cours ?
// Sans clés : renvoie false silencieusement (aucun impact sur la page).
// Cache serveur par chaîne : les pages publiques peuvent être très vues, on ne
// frappe les API qu'une fois par TTL (le search YouTube coûte 100 unités de quota).

const TW_ID = process.env.TWITCH_CLIENT_ID
const TW_SECRET = process.env.TWITCH_CLIENT_SECRET
const YT_KEY = process.env.YOUTUBE_API_KEY

const TTL = 120 * 1000 // 2 min : un badge LIVE peut arriver/partir vite
const cache = new Map() // « réseau:url » → { live, exp }

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

// --- Twitch : token d'app (client credentials), renouvelé avant expiration ---
let twToken = null // { value, exp }
async function twitchToken() {
  if (twToken && twToken.exp > Date.now()) return twToken.value
  const data = await getJson(
    `https://id.twitch.tv/oauth2/token?client_id=${TW_ID}&client_secret=${TW_SECRET}&grant_type=client_credentials`,
    { method: 'POST' }
  )
  if (!data?.access_token) return null
  twToken = { value: data.access_token, exp: Date.now() + (data.expires_in - 60) * 1000 }
  return twToken.value
}

// twitch.tv/<login> → login (les chemins réservés type /videos ne sont pas des chaînes).
function twitchLogin(rawUrl) {
  let u
  try { u = new URL(rawUrl) } catch { return null }
  if (!/(^|\.)twitch\.tv$/.test(u.hostname)) return null
  const m = u.pathname.match(/^\/([A-Za-z0-9_]{3,25})\/?$/)
  return m ? m[1] : null
}

async function twitchLive(rawUrl) {
  if (!TW_ID || !TW_SECRET) return null
  const login = twitchLogin(rawUrl)
  if (!login) return null
  const token = await twitchToken()
  if (!token) return null
  const data = await getJson(`https://api.twitch.tv/helix/streams?user_login=${encodeURIComponent(login)}`, {
    headers: { 'Client-Id': TW_ID, Authorization: `Bearer ${token}` },
  })
  return data ? (data.data?.length || 0) > 0 : null
}

// --- YouTube : /channel/UC… direct, /@handle résolu via l'API channels ---
async function youtubeChannelId(u) {
  const chan = u.pathname.match(/\/channel\/(UC[\w-]+)/)
  if (chan) return chan[1]
  const handle = u.pathname.match(/\/@([\w.-]+)/)
  if (!handle) return null
  const data = await getJson(`https://www.googleapis.com/youtube/v3/channels?part=id&forHandle=@${handle[1]}&key=${YT_KEY}`)
  return data?.items?.[0]?.id || null
}

async function youtubeLive(rawUrl) {
  if (!YT_KEY) return null
  let u
  try { u = new URL(rawUrl) } catch { return null }
  const channelId = await youtubeChannelId(u)
  if (!channelId) return null
  const data = await getJson(
    `https://www.googleapis.com/youtube/v3/search?part=id&channelId=${channelId}&eventType=live&type=video&maxResults=1&key=${YT_KEY}`
  )
  return data ? (data.items?.length || 0) > 0 : null
}

export const liveConfigured = {
  twitch: !!(TW_ID && TW_SECRET),
  youtube: !!YT_KEY,
}

// → true / false (false aussi quand clés absentes, URL invalide ou API muette).
export async function fetchLiveStatus(network, url) {
  const key = `${network}:${url}`
  const hit = cache.get(key)
  if (hit && hit.exp > Date.now()) return hit.live
  let live = null
  if (network === 'twitch') live = await twitchLive(url)
  else if (network === 'youtube') live = await youtubeLive(url)
  live = live === true
  if (cache.size > 500) cache.delete(cache.keys().next().value) // borne mémoire
  cache.set(key, { live, exp: Date.now() + TTL })
  return live
}
