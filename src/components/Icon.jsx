import {
  Heart, Instagram, Youtube, ShoppingBag, GraduationCap, BookOpen, Phone,
  MapPin, Star, CalendarClock, CalendarCheck, FileText, Briefcase, Mail,
  LayoutGrid, Link as LinkIcon, ExternalLink,
} from 'lucide-react'

const MAP = {
  Heart, Instagram, Youtube, ShoppingBag, GraduationCap, BookOpen, Phone,
  MapPin, Star, CalendarClock, CalendarCheck, FileText, Briefcase, Mail,
  LayoutGrid, Link: LinkIcon, ExternalLink,
}

// Rend une icône lucide à partir de son nom (string), avec fallback.
export function Icon({ name, ...props }) {
  const Cmp = MAP[name] || LinkIcon
  return <Cmp {...props} />
}
