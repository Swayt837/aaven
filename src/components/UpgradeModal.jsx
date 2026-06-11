import { useState } from 'react'
import { X, Check, Sparkles, ArrowRight } from 'lucide-react'
import { api } from '../lib/api'
import { useI18n } from '../lib/i18n'

const CONTENT = {
  fr: {
    eyebrow: 'Fonctionnalité premium',
    title: 'Donne une autre dimension à ta page',
    sub: 'Tes visiteurs ressentent la différence. Débloque l’expérience complète Aaven.',
    benefits: [
      'Templates vidéo premium — une page vivante et cinématique',
      'Importe ta propre vidéo / GIF en fond',
      'Sans branding « Made with Aaven »',
      'Produits digitaux illimités',
      'Ton lien pro personnalisé',
    ],
    popular: 'Populaire',
    perMo: '/mois',
    choose: 'Choisir',
    later: 'Plus tard',
  },
  en: {
    eyebrow: 'Premium feature',
    title: 'Take your page to the next level',
    sub: 'Your visitors feel the difference. Unlock the full Aaven experience.',
    benefits: [
      'Premium video templates — a living, cinematic page',
      'Upload your own background video / GIF',
      'No “Made with Aaven” branding',
      'Unlimited digital products',
      'Your custom pro link',
    ],
    popular: 'Popular',
    perMo: '/mo',
    choose: 'Choose',
    later: 'Maybe later',
  },
}

const PLANS = [
  { key: 'creator', name: 'Creator', price: '7€', highlight: true },
  { key: 'pro', name: 'Pro', price: '15€', highlight: false },
]

// Modale premium affichée quand on touche une fonctionnalité réservée Creator/Pro.
export function UpgradeModal({ open, onClose }) {
  const { lang } = useI18n()
  const c = CONTENT[lang] || CONTENT.fr
  const [loading, setLoading] = useState(null)

  if (!open) return null

  async function choose(plan) {
    setLoading(plan)
    try {
      const r = await api.billingCheckout(plan)
      if (r && r.url) window.location.href = r.url // Stripe Checkout
      else window.location.reload() // mode démo : plan appliqué directement
    } catch (e) {
      alert(e.message)
      setLoading(null)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-lg overflow-hidden rounded-[26px] border-2 border-ink bg-white shadow-hard-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête premium */}
        <div className="relative overflow-hidden bg-ink px-7 py-7 text-white">
          <div aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-coral/40 blur-[60px]" />
          <div aria-hidden className="pointer-events-none absolute -bottom-12 left-10 h-40 w-40 rounded-full bg-pink/30 blur-[60px]" />
          <button onClick={onClose} aria-label="Fermer" className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full border border-white/25 text-white/80 transition hover:bg-white/10">
            <X size={18} />
          </button>
          <span className="relative inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.18em]">
            <Sparkles size={13} /> {c.eyebrow}
          </span>
          <h2 className="relative mt-4 font-display text-3xl font-extrabold leading-[1.05] tracking-[-0.02em]">{c.title}</h2>
          <p className="relative mt-2 text-sm text-white/70">{c.sub}</p>
        </div>

        {/* Avantages */}
        <div className="px-7 pt-6">
          <ul className="space-y-2.5">
            {c.benefits.map((b) => (
              <li key={b} className="flex items-start gap-2.5 text-sm font-semibold text-ink">
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-coral text-white"><Check size={13} strokeWidth={3} /></span>
                {b}
              </li>
            ))}
          </ul>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-2 gap-3 px-7 pb-7 pt-6">
          {PLANS.map((p) => (
            <button
              key={p.key}
              type="button"
              disabled={loading}
              onClick={() => choose(p.key)}
              className={`group relative flex flex-col items-start gap-1 rounded-2xl border-2 border-ink p-4 text-left transition hover:-translate-y-0.5 disabled:opacity-60 ${p.highlight ? 'bg-coral text-white shadow-[5px_5px_0_#0A0A0A]' : 'bg-white text-ink shadow-hard-sm'}`}
            >
              {p.highlight && <span className="absolute right-3 top-3 rounded-full bg-white px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-coral">{c.popular}</span>}
              <span className="font-display text-sm font-extrabold uppercase tracking-wide">{p.name}</span>
              <span className="font-display text-2xl font-extrabold">{p.price}<span className={`text-sm font-bold ${p.highlight ? 'text-white/70' : 'text-ink/50'}`}>{c.perMo}</span></span>
              <span className={`mt-1 inline-flex items-center gap-1 text-xs font-extrabold ${p.highlight ? 'text-white' : 'text-coral'}`}>
                {loading === p.key ? '…' : c.choose} <ArrowRight size={13} strokeWidth={3} className="transition-transform group-hover:translate-x-0.5" />
              </span>
            </button>
          ))}
        </div>

        <button onClick={onClose} className="w-full border-t-2 border-ink/10 py-3 text-center text-xs font-bold text-ink/50 transition hover:text-ink">
          {c.later}
        </button>
      </div>
    </div>
  )
}
