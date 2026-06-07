// Configuration des 3 modes : couleurs, accent, presets de boutons.

export const MODES = {
  creator: {
    key: 'creator',
    emoji: '🎥',
    cardBg: '#FCE7EF', // rose pâle
    accent: '#F0426B', // rose vif pour le CTA principal (tips)
    badgeBg: '#FCE7EF',
    label: { fr: 'CRÉATEUR', en: 'CREATOR' },
  },
  bar: {
    key: 'bar',
    emoji: '🍽️',
    cardBg: '#EFEDE6', // beige
    accent: '#EF5A4C', // corail
    badgeBg: '#EFEDE6',
    label: { fr: 'ÉTABLISSEMENT', en: 'VENUE' },
  },
  freelance: {
    key: 'freelance',
    emoji: '💼',
    cardBg: '#E8EDFC', // bleu lavande
    accent: '#2547D0', // bleu foncé
    badgeBg: '#E8EDFC',
    label: { fr: 'FREELANCE', en: 'FREELANCE' },
  },
}

// Catalogue des types de boutons : icône lucide (nom) + comportement par défaut.
export const BUTTON_TYPES = {
  tip: { icon: 'Heart', label: { fr: 'Me soutenir', en: 'Support me' }, action: 'tip', urlPh: '' },
  instagram: { icon: 'Instagram', label: { fr: 'Instagram', en: 'Instagram' }, urlPh: 'https://instagram.com/...' },
  youtube: { icon: 'Youtube', label: { fr: 'YouTube', en: 'YouTube' }, urlPh: 'https://youtube.com/@...' },
  products: { icon: 'ShoppingBag', label: { fr: 'Mes produits', en: 'My products' }, urlPh: 'https://...' },
  course: { icon: 'GraduationCap', label: { fr: 'Ma formation', en: 'My course' }, urlPh: 'https://...' },
  menu: { icon: 'BookOpen', label: { fr: 'Menu en 1 clic', en: 'Menu in 1 tap' }, urlPh: 'https://...' },
  call: { icon: 'Phone', label: { fr: 'Appeler', en: 'Call' }, urlPh: 'tel:+33...' },
  directions: { icon: 'MapPin', label: { fr: 'Itinéraire', en: 'Directions' }, urlPh: 'https://maps.google.com/?q=...' },
  reviews: { icon: 'Star', label: { fr: 'Avis Google', en: 'Google reviews' }, urlPh: 'https://g.page/...' },
  bookcall: { icon: 'CalendarClock', label: { fr: 'Réserver un call', en: 'Book a call' }, urlPh: 'https://calendly.com/...' },
  reserve: { icon: 'CalendarCheck', label: { fr: 'Réserver une table', en: 'Book a table' }, urlPh: 'https://...' },
  quote: { icon: 'FileText', label: { fr: 'Devis express', en: 'Quick quote' }, action: 'contact', urlPh: '' },
  services: { icon: 'Briefcase', label: { fr: 'Services & tarifs', en: 'Services & pricing' }, action: 'services', urlPh: 'https://...' },
  contact: { icon: 'Mail', label: { fr: 'Me contacter', en: 'Contact me' }, action: 'contact', urlPh: '' },
  link: { icon: 'Link', label: { fr: 'Lien personnalisé', en: 'Custom link' }, urlPh: 'https://...' },
}

// Presets : liste de boutons créés à l'ouverture d'une page selon le mode.
// `featured` = bouton mis en avant (fond plein accent).
export const PRESETS = {
  creator: [
    { type: 'tip', featured: true },
    { type: 'instagram' },
    { type: 'youtube' },
    { type: 'products' },
    { type: 'course' },
    { type: 'contact' },
  ],
  bar: [
    { type: 'reserve', featured: true },
    { type: 'menu' },
    { type: 'call' },
    { type: 'directions' },
    { type: 'reviews' },
  ],
  freelance: [
    { type: 'services', featured: true },
    { type: 'bookcall' },
    { type: 'quote' },
    { type: 'contact' },
  ],
}

export function modeOf(mode) {
  return MODES[mode] || MODES.creator
}

// Favicon (petit logo) d'un lien, via le service Google. Renvoie null si URL invalide.
export function faviconUrl(u) {
  try {
    const host = new URL(/^https?:\/\//.test(u) ? u : `https://${u}`).hostname
    if (!host) return null
    return `https://www.google.com/s/favicons?sz=64&domain=${host}`
  } catch {
    return null
  }
}
