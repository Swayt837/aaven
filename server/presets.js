// Presets et types de boutons côté serveur (miroir de src/lib/modes.js, sans React).
// Utilisés pour pré-remplir les boutons à la création d'une page.

export const BUTTON_TYPES_SERVER = {
  tip: { icon: 'Heart', label: { fr: 'Me soutenir', en: 'Support me' } },
  instagram: { icon: 'Instagram', label: { fr: 'Instagram', en: 'Instagram' } },
  youtube: { icon: 'Youtube', label: { fr: 'YouTube', en: 'YouTube' } },
  products: { icon: 'ShoppingBag', label: { fr: 'Mes produits', en: 'My products' } },
  course: { icon: 'GraduationCap', label: { fr: 'Ma formation', en: 'My course' } },
  menu: { icon: 'BookOpen', label: { fr: 'Menu en 1 clic', en: 'Menu in 1 tap' } },
  call: { icon: 'Phone', label: { fr: 'Appeler', en: 'Call' } },
  directions: { icon: 'MapPin', label: { fr: 'Itinéraire', en: 'Directions' } },
  reviews: { icon: 'Star', label: { fr: 'Avis Google', en: 'Google reviews' } },
  bookcall: { icon: 'CalendarClock', label: { fr: 'Réserver un call', en: 'Book a call' } },
  reserve: { icon: 'CalendarCheck', label: { fr: 'Réserver une table', en: 'Book a table' } },
  quote: { icon: 'FileText', label: { fr: 'Devis express', en: 'Quick quote' } },
  services: { icon: 'Briefcase', label: { fr: 'Services & tarifs', en: 'Services & pricing' } },
  contact: { icon: 'Mail', label: { fr: 'Me contacter', en: 'Contact me' } },
  link: { icon: 'Link', label: { fr: 'Lien personnalisé', en: 'Custom link' } },
}

export const PRESETS_SERVER = {
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
