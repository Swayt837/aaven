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

// Exemple de lien par connecteur (placeholder de la modale de connexion).
const PLACEHOLDERS = {
  calendly: 'https://calendly.com/ton-nom/30min',
  calcom: 'https://cal.com/ton-nom',
  zcal: 'https://zcal.co/ton-nom',
  youcanbookme: 'https://ton-nom.youcanbook.me',
  zenchef: 'https://bookings.zenchef.com/results?rid=...',
  thefork: 'https://www.thefork.fr/restaurant/ton-resto',
  sevenrooms: 'https://www.sevenrooms.com/reservations/ton-resto',
  guestonline: 'https://reservation.guestonline.fr/...',
  ubereats: 'https://www.ubereats.com/fr/store/ton-resto',
  deliveroo: 'https://deliveroo.fr/fr/menu/ville/ton-resto',
  justeat: 'https://www.just-eat.fr/menu/ton-resto',
  tripadvisor: 'https://www.tripadvisor.fr/Restaurant_Review-...',
  planity: 'https://www.planity.com/ton-salon',
  treatwell: 'https://www.treatwell.fr/salon/ton-salon',
  fresha: 'https://www.fresha.com/fr/a/ton-salon',
  booksy: 'https://booksy.com/fr-fr/ton-salon',
  wecasa: 'https://www.wecasa.fr/pro/ton-profil',
  strava: 'https://www.strava.com/athletes/ton-profil',
  eversports: 'https://www.eversports.fr/s/ton-studio',
  shotgun: 'https://shotgun.live/artists/ton-nom',
  dice: 'https://dice.fm/artist/ton-nom',
  billetweb: 'https://www.billetweb.fr/ton-event',
  eventbrite: 'https://www.eventbrite.fr/o/ton-orga',
  malt: 'https://www.malt.fr/profile/ton-nom',
  behance: 'https://www.behance.net/ton-nom',
  dribbble: 'https://dribbble.com/ton-nom',
  github: 'https://github.com/ton-nom',
  notion: 'https://ton-nom.notion.site/portfolio',
  patreon: 'https://www.patreon.com/ton-nom',
  kofi: 'https://ko-fi.com/ton-nom',
  discord: 'https://discord.gg/ton-invitation',
  substack: 'https://ta-newsletter.substack.com',
  beehiiv: 'https://ta-newsletter.beehiiv.com',
  bandcamp: 'https://ton-nom.bandcamp.com',
  beatport: 'https://www.beatport.com/artist/ton-nom/...',
  gumroad: 'https://ton-nom.gumroad.com',
  etsy: 'https://www.etsy.com/shop/ta-boutique',
  amazon: 'https://www.amazon.fr/shop/ton-nom',
}
export const connectorPlaceholder = (conn) => PLACEHOLDERS[conn.key] || 'https://...'

// Bouton pré-configuré créé quand on « connecte » une plateforme depuis la
// galerie de l'éditeur : type + libellé (fr/en, même convention que BUTTON_TYPES)
// + config éventuelle. Dérivé de la catégorie, avec quelques cas particuliers.
export function connectorButton(conn, lang = 'fr') {
  const L = (fr, en) => (lang === 'en' ? en : fr)
  if (conn.cat === 'booking') return { type: 'bookcall', label: L(`Prendre RDV via ${conn.name}`, `Book via ${conn.name}`) }
  if (conn.key === 'tripadvisor') return { type: 'reviews', label: L('Nos avis Tripadvisor', 'Our Tripadvisor reviews') }
  if (['ubereats', 'deliveroo', 'justeat'].includes(conn.key)) return { type: 'link', label: L(`Commander sur ${conn.name}`, `Order on ${conn.name}`) }
  if (conn.cat === 'food' || conn.cat === 'beauty') return { type: 'reserve', label: L(`Réserver via ${conn.name}`, `Book via ${conn.name}`) }
  if (conn.cat === 'sport') {
    if (conn.key === 'strava') return { type: 'link', label: L('Me suivre sur Strava', 'Follow me on Strava') }
    return { type: 'bookcall', label: L(`Réserver un cours via ${conn.name}`, `Book a class via ${conn.name}`) }
  }
  if (conn.cat === 'events') return { type: 'link', label: L(`Billets sur ${conn.name}`, `Tickets on ${conn.name}`) }
  if (conn.cat === 'newsletter') return { type: 'newsletter', label: L('Ma newsletter', 'My newsletter'), config: { mode: 'link' } }
  if (conn.key === 'discord') return { type: 'link', label: L('Rejoindre mon Discord', 'Join my Discord') }
  if (conn.key === 'patreon' || conn.key === 'kofi') return { type: 'link', label: L(`Me soutenir sur ${conn.name}`, `Support me on ${conn.name}`) }
  if (conn.cat === 'music') return { type: 'link', label: L(`Ma musique sur ${conn.name}`, `My music on ${conn.name}`) }
  if (conn.cat === 'shop') return { type: 'link', label: L(`Ma boutique ${conn.name}`, `My ${conn.name} shop`) }
  return { type: 'link', label: L(`Mon profil ${conn.name}`, `My ${conn.name} profile`) }
}

// Catégories de connecteurs pertinentes par catégorie MÉTIER (Profession Engine),
// avec repli sur le mode de la page. Sert à trier la galerie : le barbier voit
// Planity/Booksy en premier, le resto voit ZenChef/TheFork.
const PROFESSION_CATS = {
  Food: ['food', 'events', 'booking'],
  Beauty: ['beauty', 'booking'],
  Sport: ['sport', 'booking', 'events'],
  Business: ['work', 'booking', 'newsletter'],
  Creator: ['creator', 'newsletter', 'music', 'shop', 'events'],
  Social: ['creator', 'newsletter', 'shop', 'events'],
  Art: ['shop', 'work', 'creator', 'events'],
}
const MODE_CATS = {
  bar: ['food', 'events', 'booking'],
  freelance: ['work', 'booking', 'newsletter'],
  creator: ['creator', 'newsletter', 'music', 'shop', 'events'],
}

// Galerie triée : les connecteurs du métier d'abord (dans l'ordre de pertinence),
// puis tous les autres. `profCategory` = catégorie Profession Engine (« Beauty »…).
export function sortedConnectors(profCategory, mode) {
  const prio = PROFESSION_CATS[profCategory] || MODE_CATS[mode] || []
  const rank = (c) => {
    const i = prio.indexOf(c.cat)
    return i === -1 ? 99 : i
  }
  return [...CONNECTORS].sort((a, b) => rank(a) - rank(b))
}

// Domaine « propre » d'un connecteur (pour son logo via le service de favicons).
// Les placeholders en sous-domaine fictif (ta-newsletter.substack.com…) sont
// ramenés au domaine de la marque, sinon le favicon ne serait pas trouvé.
const LOGO_HOSTS = {
  substack: 'substack.com',
  beehiiv: 'beehiiv.com',
  gumroad: 'gumroad.com',
  bandcamp: 'bandcamp.com',
  youcanbookme: 'youcanbook.me',
  zenchef: 'zenchef.com',
  guestonline: 'guestonline.fr',
  notion: 'notion.so',
}
export function connectorHost(conn) {
  if (LOGO_HOSTS[conn.key]) return LOGO_HOSTS[conn.key]
  try {
    return new URL(connectorPlaceholder(conn)).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

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
