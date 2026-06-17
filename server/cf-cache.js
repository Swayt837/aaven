// Purge ciblée du cache Cloudflare quand une page publique est modifiée.
// Optionnel & gracieux : actif seulement si CF_API_TOKEN + CF_ZONE_ID sont définis.
// Sans token, on ne purge pas → les modifs apparaissent au bout du s-maxage (ex. 5 min).
// Le token Cloudflare doit avoir la permission « Zone → Cache Purge ».
const CF_API_TOKEN = process.env.CF_API_TOKEN
const CF_ZONE_ID = process.env.CF_ZONE_ID
const APP_URL = (process.env.APP_URL || '').replace(/\/$/, '')
export const cachePurgeEnabled = !!(CF_API_TOKEN && CF_ZONE_ID && APP_URL)

// Domaine racine (sans www) pour purger aussi le sous-domaine vanity Pro.
let ROOT = ''
try { ROOT = new URL(APP_URL).hostname.replace(/^www\./, '') } catch { /* APP_URL absent */ }

// Purge la/les URL(s) publiques d'un slug de profil. N'attend pas (fire-and-forget).
export function purgePage(slug) {
  if (!cachePurgeEnabled || !slug) return
  const files = [`${APP_URL}/${slug}`]
  if (ROOT) files.push(`https://${slug}.${ROOT}/`) // version sous-domaine (Pro)
  fetch(`https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/purge_cache`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${CF_API_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ files }),
  })
    .then((r) => { if (!r.ok) console.warn('  Purge Cloudflare échouée:', r.status) })
    .catch((e) => console.warn('  Purge Cloudflare erreur:', e.message))
}
