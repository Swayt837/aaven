import { Instagram, Youtube, Linkedin, Facebook, Globe, Music2, MessageCircle, Twitter, Pin } from 'lucide-react'
import { useI18n } from '../lib/i18n'

// Éditeur du rang Smart Socials : un champ URL (+ stat optionnelle) par réseau,
// et les réglages d'apparence (forme, stats, taille, animations).
// Seuls les réseaux renseignés apparaissent sur la page.

const NETWORKS = [
  { key: 'instagram', label: 'Instagram', icon: Instagram, ph: 'https://instagram.com/...' },
  { key: 'tiktok', label: 'TikTok', icon: Music2, ph: 'https://tiktok.com/@...' },
  { key: 'youtube', label: 'YouTube', icon: Youtube, ph: 'https://youtube.com/@...' },
  { key: 'spotify', label: 'Spotify', icon: Music2, ph: 'https://open.spotify.com/...' },
  { key: 'x', label: 'X', icon: Twitter, ph: 'https://x.com/...' },
  { key: 'linkedin', label: 'LinkedIn', icon: Linkedin, ph: 'https://linkedin.com/in/...' },
  { key: 'pinterest', label: 'Pinterest', icon: Pin, ph: 'https://pinterest.com/...' },
  { key: 'discord', label: 'Discord', icon: MessageCircle, ph: 'https://discord.gg/...' },
  { key: 'facebook', label: 'Facebook', icon: Facebook, ph: 'https://facebook.com/...' },
  { key: 'website', label: 'Site web', icon: Globe, ph: 'https://...' },
]

function Seg({ options, value, onChange, t }) {
  return (
    <div className="flex gap-1.5">
      {options.map(([val, key]) => (
        <button
          key={val}
          type="button"
          onClick={() => onChange(val)}
          className={`press flex-1 rounded-lg border-2 border-ink px-2 py-1.5 text-xs font-bold ${value === val ? 'bg-ink text-white' : 'bg-white'}`}
        >
          {t(key)}
        </button>
      ))}
    </div>
  )
}

export function SmartSocialsEditor({ theme, onChange }) {
  const { t } = useI18n()
  const socials = theme.socials || []
  const cfg = theme.socialsCfg || { stats: 'peek', shape: 'squircle', size: 'md', animations: true }

  const byNetwork = Object.fromEntries(socials.map((s) => [s.network, s]))
  function setNetwork(network, patch) {
    const cur = byNetwork[network] || { network, url: '', stat: '' }
    const next = { ...cur, ...patch }
    const rest = socials.filter((s) => s.network !== network)
    // Réseau vidé → retiré ; sinon on préserve l'ordre d'origine.
    onChange({ socials: next.url ? [...rest, next].sort((a, b) => NETWORKS.findIndex((n) => n.key === a.network) - NETWORKS.findIndex((n) => n.key === b.network)) : rest })
  }
  const setCfg = (patch) => onChange({ socialsCfg: { ...cfg, ...patch } })

  return (
    <div className="space-y-4">
      <p className="text-xs font-medium text-ink/55">{t('edit.socials.hint')}</p>

      {/* Réseaux */}
      <div className="space-y-2">
        {NETWORKS.map(({ key, label, icon: Ic, ph }) => {
          const cur = byNetwork[key]
          return (
            <div key={key} className="flex items-center gap-2">
              <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg border-2 ${cur?.url ? 'border-ink bg-ink text-white' : 'border-ink/20 text-ink/40'}`} title={label}>
                <Ic size={15} />
              </span>
              <input
                value={cur?.url || ''}
                onChange={(e) => setNetwork(key, { url: e.target.value })}
                placeholder={ph}
                className="min-w-0 flex-1 rounded-lg border-2 border-ink/25 px-2 py-1.5 text-sm"
              />
              <input
                value={cur?.stat || ''}
                onChange={(e) => setNetwork(key, { stat: e.target.value })}
                placeholder={t('edit.socials.statPh')}
                disabled={!cur?.url}
                className="w-16 shrink-0 rounded-lg border-2 border-ink/25 px-2 py-1.5 text-center text-sm disabled:opacity-40"
                maxLength={12}
              />
            </div>
          )
        })}
      </div>

      {/* Réglages */}
      <div className="space-y-2.5 border-t-2 border-ink/10 pt-3">
        <div>
          <p className="mb-1 text-[10px] font-extrabold uppercase tracking-wide text-ink/40">{t('edit.socials.stats')}</p>
          <Seg t={t} value={cfg.stats} onChange={(v) => setCfg({ stats: v })} options={[['peek', 'edit.socials.statsPeek'], ['always', 'edit.socials.statsAlways'], ['off', 'edit.socials.statsOff']]} />
        </div>
        <div>
          <p className="mb-1 text-[10px] font-extrabold uppercase tracking-wide text-ink/40">{t('edit.socials.shape')}</p>
          <Seg t={t} value={cfg.shape} onChange={(v) => setCfg({ shape: v })} options={[['squircle', 'edit.socials.shapeSquircle'], ['round', 'edit.socials.shapeRound'], ['square', 'edit.socials.shapeSquare']]} />
        </div>
        <div>
          <p className="mb-1 text-[10px] font-extrabold uppercase tracking-wide text-ink/40">{t('edit.socials.size')}</p>
          <Seg t={t} value={cfg.size} onChange={(v) => setCfg({ size: v })} options={[['sm', 'edit.socials.sizeS'], ['md', 'edit.socials.sizeM'], ['lg', 'edit.socials.sizeL']]} />
        </div>
        <button
          type="button"
          onClick={() => setCfg({ animations: cfg.animations === false })}
          className="flex w-full items-center justify-between gap-3 rounded-lg border-2 border-ink/20 bg-cream/60 px-2.5 py-2 text-left"
        >
          <span className="text-xs font-extrabold">{t('edit.socials.animations')}</span>
          <span className={`relative h-5 w-9 shrink-0 rounded-full border-2 border-ink transition ${cfg.animations !== false ? 'bg-coral' : 'bg-white'}`}>
            <span className={`absolute top-0.5 h-3 w-3 rounded-full border-2 border-ink bg-white transition-all ${cfg.animations !== false ? 'left-4' : 'left-0.5'}`} />
          </span>
        </button>
      </div>
    </div>
  )
}
