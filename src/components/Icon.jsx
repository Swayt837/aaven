import {
  Heart, Instagram, Youtube, ShoppingBag, GraduationCap, BookOpen, Phone,
  MapPin, Star, CalendarClock, CalendarCheck, FileText, Briefcase, Mail,
  LayoutGrid, Twitter, Linkedin, Facebook, Twitch, MessageCircle, Music, Ghost,
  Link as LinkIcon, ExternalLink,
} from 'lucide-react'

// Icône TikTok (absente de lucide) — glyphe maison, suit la couleur courante.
function TikTok({ size = 24, ...props }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M16.6 3c.27 2.2 1.5 3.85 3.65 4.05v2.62c-1.25.12-2.43-.26-3.62-.96v6.02c0 3.42-2.72 5.78-5.92 5.28-2.55-.4-4.33-2.62-4.18-5.2.15-2.52 2.33-4.55 4.95-4.45.4.01.78.07 1.16.17v2.74a2.3 2.3 0 0 0-1.2-.27 2.16 2.16 0 0 0-2.06 2.2 2.16 2.16 0 0 0 4.32.07V3h2.9z" />
    </svg>
  )
}

const MAP = {
  Heart, Instagram, Youtube, ShoppingBag, GraduationCap, BookOpen, Phone,
  MapPin, Star, CalendarClock, CalendarCheck, FileText, Briefcase, Mail,
  LayoutGrid, Twitter, Linkedin, Facebook, Twitch, MessageCircle, Music, Ghost, TikTok,
  Link: LinkIcon, ExternalLink,
}

// Rend une icône lucide (ou custom) à partir de son nom (string), avec fallback.
export function Icon({ name, ...props }) {
  const Cmp = MAP[name] || LinkIcon
  return <Cmp {...props} />
}
