// Registre des connecteurs — plateformes reconnues quand le créateur colle un lien.
// Niveau 1 (toutes) : bouton « à la marque » sur la page publique (favicon + « via X »)
//   et confirmation dans l'éditeur.
// Niveau 3 (embed: true) : le lien s'ouvre en widget intégré (iframe) sur la page
//   publique au lieu d'une redirection — voir EmbedModal + embedUrl().
// Ajouter un connecteur = une entrée ici, rien d'autre.

export const CONNECTORS = [
  // --- Réservation / rendez-vous ---
  { key: 'calendly', name: 'Calendly', color: '#006BFF', cat: 'booking', embed: true, match: /(^|\.)calendly\.com$/ },
  { key: 'calcom', name: 'Cal.com', color: '#292929', cat: 'booking', embed: true, match: /(^|\.)cal\.com$/ },
  { key: 'zcal', name: 'Zcal', color: '#6C5CE7', cat: 'booking', embed: true, match: /(^|\.)zcal\.co$/ },
  { key: 'youcanbookme', name: 'YouCanBookMe', color: '#3D5AFE', cat: 'booking', embed: true, match: /(^|\.)youcanbook\.me$/ },

  // --- Restauration ---
  { key: 'zenchef', name: 'ZenChef', color: '#1D1D1B', cat: 'food', embed: true, match: /(^|\.)zenchef\.com$/ },
  { key: 'thefork', name: 'TheFork', color: '#00645A', cat: 'food', match: /(^|\.)(thefork\.\w+|lafourchette\.com)$/ },
  { key: 'sevenrooms', name: 'SevenRooms', color: '#0A0A0A', cat: 'food', embed: true, match: /(^|\.)sevenrooms\.com$/ },
  { key: 'guestonline', name: 'Guestonline', color: '#2E5BFF', cat: 'food', embed: true, match: /(^|\.)guestonline\.(fr|io)$/ },
  { key: 'ubereats', name: 'Uber Eats', color: '#06C167', cat: 'food', match: /(^|\.)ubereats\.com$/ },
  { key: 'deliveroo', name: 'Deliveroo', color: '#00CCBC', cat: 'food', match: /(^|\.)deliveroo\.\w+$/ },
  { key: 'justeat', name: 'Just Eat', color: '#FF8000', cat: 'food', match: /(^|\.)just-eat\.\w+$/ },
  { key: 'tripadvisor', name: 'Tripadvisor', color: '#34E0A1', cat: 'food', match: /(^|\.)tripadvisor\.\w+$/ },

  // --- Beauté & bien-être ---
  { key: 'planity', name: 'Planity', color: '#16213E', cat: 'beauty', embed: true, match: /(^|\.)planity\.com$/ },
  { key: 'treatwell', name: 'Treatwell', color: '#FF6C36', cat: 'beauty', match: /(^|\.)treatwell\.\w+$/ },
  { key: 'fresha', name: 'Fresha', color: '#6950F3', cat: 'beauty', match: /(^|\.)fresha\.com$/ },
  { key: 'booksy', name: 'Booksy', color: '#00A3AD', cat: 'beauty', embed: true, match: /(^|\.)booksy\.com$/ },
  { key: 'wecasa', name: 'Wecasa', color: '#7B4DFF', cat: 'beauty', match: /(^|\.)wecasa\.fr$/ },

  // --- Sport & coaching ---
  { key: 'strava', name: 'Strava', color: '#FC4C02', cat: 'sport', match: /(^|\.)strava\.com$/ },
  { key: 'eversports', name: 'Eversports', color: '#00A5A2', cat: 'sport', embed: true, match: /(^|\.)eversports\.\w+$/ },

  // --- Billetterie / événements ---
  { key: 'shotgun', name: 'Shotgun', color: '#E8442E', cat: 'events', match: /(^|\.)shotgun\.live$/ },
  { key: 'dice', name: 'DICE', color: '#111111', cat: 'events', match: /(^|\.)dice\.fm$/ },
  { key: 'billetweb', name: 'Billetweb', color: '#2E6DA4', cat: 'events', embed: true, match: /(^|\.)billetweb\.fr$/ },
  { key: 'eventbrite', name: 'Eventbrite', color: '#F05537', cat: 'events', match: /(^|\.)eventbrite\.\w+$/ },

  // --- Freelance / business ---
  { key: 'malt', name: 'Malt', color: '#FC5757', cat: 'work', match: /(^|\.)malt\.\w+$/ },
  { key: 'behance', name: 'Behance', color: '#1769FF', cat: 'work', match: /(^|\.)behance\.net$/ },
  { key: 'dribbble', name: 'Dribbble', color: '#EA4C89', cat: 'work', match: /(^|\.)dribbble\.com$/ },
  { key: 'github', name: 'GitHub', color: '#181717', cat: 'work', match: /(^|\.)github\.com$/ },
  { key: 'notion', name: 'Notion', color: '#191919', cat: 'work', match: /(^|\.)notion\.(site|so)$/ },

  // --- Créateurs / communauté ---
  { key: 'patreon', name: 'Patreon', color: '#FF424D', cat: 'creator', match: /(^|\.)patreon\.com$/ },
  { key: 'kofi', name: 'Ko-fi', color: '#FF5E5B', cat: 'creator', match: /(^|\.)ko-fi\.com$/ },
  { key: 'discord', name: 'Discord', color: '#5865F2', cat: 'creator', match: /(^|\.)discord\.(gg|com)$/ },
  { key: 'substack', name: 'Substack', color: '#FF6719', cat: 'newsletter', match: /(^|\.)substack\.com$/ },
  { key: 'beehiiv', name: 'beehiiv', color: '#111111', cat: 'newsletter', match: /(^|\.)beehiiv\.com$/ },

  // --- Musique / DJs ---
  { key: 'bandcamp', name: 'Bandcamp', color: '#629AA9', cat: 'music', match: /(^|\.)bandcamp\.com$/ },
  { key: 'beatport', name: 'Beatport', color: '#01FF95', cat: 'music', match: /(^|\.)beatport\.com$/ },

  // --- Boutiques ---
  { key: 'gumroad', name: 'Gumroad', color: '#FF90E8', cat: 'shop', match: /(^|\.)gumroad\.com$/ },
  { key: 'etsy', name: 'Etsy', color: '#F1641E', cat: 'shop', match: /(^|\.)etsy\.com$/ },
  { key: 'amazon', name: 'Amazon', color: '#FF9900', cat: 'shop', match: /(^|\.)amazon\.\w+$/ },
]

// URL (ou host nu) → connecteur reconnu, sinon null.
export function connectorOf(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return null
  if (!/^https?:\/\//.test(rawUrl) && /^[a-z]+:/i.test(rawUrl)) return null // mailto:, tel:…
  let u
  try {
    u = new URL(/^https?:\/\//.test(rawUrl) ? rawUrl : `https://${rawUrl}`)
  } catch {
    return null
  }
  const host = u.hostname.toLowerCase()
  return CONNECTORS.find((c) => c.match.test(host)) || null
}

// URL chargée dans le widget intégré. Certains providers exigent des paramètres
// d'embed (Calendly) ; les autres passent tels quels.
export function embedUrl(conn, rawUrl) {
  try {
    const u = new URL(rawUrl)
    if (conn.key === 'calendly') {
      u.searchParams.set('embed_domain', typeof window !== 'undefined' ? window.location.hostname : 'aaven.fr')
      u.searchParams.set('embed_type', 'Inline')
      u.searchParams.set('hide_gdpr_banner', '1')
    }
    return u.href
  } catch {
    return rawUrl
  }
}
