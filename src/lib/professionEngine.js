// Profession Engine — logique partagée client/serveur (aucun React, aucun contenu
// métier codé en dur : tout le contenu vient de src/lib/professions.js, généré
// depuis l'Excel). Ici uniquement des règles GÉNÉRIQUES de mapping.
import { TEMPLATES } from './templates.js'

// ---------- category → mode de page (les 3 modes existants) ----------
const CATEGORY_MODE = {
  Food: 'bar',
  Beauty: 'freelance',
  Sport: 'freelance',
  Business: 'freelance',
  Art: 'creator',
  Creator: 'creator',
  Social: 'creator',
}
export const modeForCategory = (category) => CATEGORY_MODE[category] || 'creator'

// ---------- nom de bloc (template_blocks) → type de bouton existant ----------
// Règles par mots-clés, évaluées dans l'ordre ; la première qui matche gagne.
// Un bloc non reconnu devient un bouton `link` qui garde son nom (toujours valide).
const BLOCK_RULES = [
  // Réseaux / plateformes
  { re: /\binstagram\b/i, type: 'instagram' },
  { re: /\btiktok\b/i, type: 'tiktok' },
  { re: /\byoutube\b/i, type: 'youtube' },
  { re: /\blinkedin\b/i, type: 'linkedin' },
  { re: /\b(watch live|twitch)\b/i, type: 'twitch' },
  { re: /\b(listen|spotify|mixes)\b/i, type: 'spotify' },
  // Argent / soutien
  { re: /\b(tips?|support|donate)\b/i, type: 'tip' },
  // Nourriture / lieu
  { re: /\bmenu\b/i, type: 'menu' },
  { re: /\breservations?\b/i, type: 'reserve' },
  { re: /(today'?s location|my caf)/i, type: 'directions' },
  // Réservation (générique, après les cas spécifiques)
  { re: /\bbook(ing)? request\b/i, type: 'quote' },
  { re: /\bbook\b/i, type: 'bookcall' },
  // Formulaires / demandes
  { re: /\b(commissions?|custom orders?|free valuation|quote)\b/i, type: 'quote' },
  { re: /\b(contact|hire me|work with me|collabs?|brand deals?)\b/i, type: 'contact' },
  // Offre / tarifs
  { re: /\b(services|pricing|prices?|price list|treatments|programs?|training plans?)\b/i, type: 'services' },
  // Vente / vitrine
  { re: /\b(shop|merch|storefront)\b/i, type: 'products' },
  { re: /\b(portfolio|gallery|showreel|my work|projects|films|videos|latest content)\b/i, type: 'products' },
  // Formation
  { re: /\b(online courses?|courses?)\b/i, type: 'course' },
  // Téléphone
  { re: /\bcall\b/i, type: 'call' },
]

// → { type, label } ; label = nom du bloc (le contenu vient des données, pas du code).
export function blockToButton(blockName) {
  const name = String(blockName || '').trim()
  for (const rule of BLOCK_RULES) {
    if (rule.re.test(name)) return { type: rule.type, label: name }
  }
  return { type: 'link', label: name }
}

// Types gérés par le rang Smart Socials (theme.socials) → ne deviennent pas des
// boutons à la création de page ; le créateur remplit ses réseaux dans l'éditeur.
export const SOCIAL_BUTTON_TYPES = new Set(['instagram', 'tiktok', 'youtube', 'spotify', 'x', 'linkedin', 'facebook', 'snapchat'])

// ---------- thème de page depuis les couleurs du métier ----------
const luminance = (hex) => {
  const m = String(hex || '').match(/^#?([0-9a-f]{6})$/i)
  if (!m) return 0
  const n = parseInt(m[1], 16)
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
}

// Chaque catégorie hérite d'un template vidéo curé (fond vivant dès la création,
// jamais de page « vide moche »). Les accents/typos du template sont conservés
// car accordés à sa vidéo. Repli : dégradé aux couleurs du métier.
const CATEGORY_TEMPLATE = {
  Food: 'lounge-live', // ambiance restaurant chaleureuse
  Beauty: 'studio-live', // créatif doux
  Art: 'focus-live', // immersif artiste
  Creator: 'fanhub-live', // concert vivant
  Sport: 'neon-creator', // énergie néon
  Business: 'office-live', // corporate premium
  Social: 'aura-live', // dégradé abstrait qui respire
}

export function themeForProfession(p) {
  const key = CATEGORY_TEMPLATE[p.category]
  const tpl = key && TEMPLATES.find((t) => t.key === key)
  if (tpl?.apply) return { ...tpl.apply }

  // Repli (catégorie inconnue) : dégradé aux couleurs du métier.
  const from = p.color_primary || '#0A0A0A'
  const to = p.color_accent || '#444444'
  const text = (luminance(from) + luminance(to)) / 2 < 0.55 ? 'light' : 'dark'
  return {
    bgType: 'gradient',
    gradFrom: from,
    gradTo: to,
    gradAngle: 160,
    accent: luminance(from) < 0.85 ? from : to, // l'accent doit rester lisible
    text,
  }
}
