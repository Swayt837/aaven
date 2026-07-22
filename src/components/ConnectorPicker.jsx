import { useMemo, useState } from 'react'
import { X, Check, AlertCircle } from 'lucide-react'
import { Button } from './ui'
import { useI18n } from '../lib/i18n'
import {
  sortedConnectors, connectorOf, connectorPlaceholder, connectorButton, connectorHost,
} from '../lib/connectors'

// ============================ Galerie de connecteurs ============================
// Le chemin simple pour brancher une plateforme : une grille de logos dans le
// picker « Ajouter un bouton » (triée selon le métier), clic → modale « Connecter X »
// avec un seul champ et validation en direct → bouton pré-configuré, zéro réglage.

// Logo d'un connecteur : favicon du domaine sur pastille blanche ; repli = initiale
// sur la couleur de marque (si le service de favicons ne répond pas).
export function ConnectorLogo({ conn, size = 34 }) {
  const [err, setErr] = useState(false)
  const host = connectorHost(conn)
  if (err || !host) {
    return (
      <span
        className="grid shrink-0 place-items-center rounded-xl font-display font-extrabold text-white"
        style={{ width: size, height: size, background: conn.color, fontSize: size * 0.42 }}
        aria-hidden
      >
        {conn.name[0]}
      </span>
    )
  }
  return (
    <span className="grid shrink-0 place-items-center rounded-xl border border-ink/10 bg-white" style={{ width: size, height: size }} aria-hidden>
      <img
        src={`https://icons.duckduckgo.com/ip3/${host}.ico`}
        alt=""
        width={size - 14}
        height={size - 14}
        className="rounded"
        onError={() => setErr(true)}
      />
    </span>
  )
}

// Grille de logos : les 8 plus pertinents pour le métier, extensible à tous.
export function ConnectorGrid({ profCategory, mode, onPick }) {
  const { t } = useI18n()
  const [all, setAll] = useState(false)
  const list = useMemo(() => sortedConnectors(profCategory, mode), [profCategory, mode])
  const shown = all ? list : list.slice(0, 8)
  return (
    <div>
      <div className="grid grid-cols-4 gap-1.5">
        {shown.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => onPick(c)}
            title={t('edit.conn.connect', { name: c.name })}
            className="press flex flex-col items-center gap-1 rounded-xl border border-ink/10 bg-white px-1 py-2 shadow-soft"
          >
            <ConnectorLogo conn={c} />
            <span className="w-full truncate text-center text-[10px] font-bold text-ink/70">{c.name}</span>
          </button>
        ))}
      </div>
      <button type="button" onClick={() => setAll((a) => !a)} className="press mt-2 w-full text-center text-xs font-bold text-ink/50 underline">
        {all ? t('edit.conn.less') : t('edit.conn.all', { n: list.length })}
      </button>
    </div>
  )
}

// Modale « Connecter X » : en-tête aux couleurs de la marque, un champ, validation
// en direct (le lien collé doit appartenir à la plateforme), ajout pré-configuré.
export function ConnectModal({ conn, onAdd, onClose }) {
  const { t, lang } = useI18n()
  const [url, setUrl] = useState('')
  const trimmed = url.trim()
  const valid = !!trimmed && connectorOf(trimmed)?.key === conn.key
  const wrong = !!trimmed && !valid

  // Mobile : pas d'autofocus (le clavier surgirait sur le bottom-sheet) ; desktop : confort.
  const desktop = typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/40 lg:items-center" onClick={onClose}>
      <div
        className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-[28px] border-2 border-ink bg-white pb-[env(safe-area-inset-bottom)] shadow-hard-lg lg:rounded-[28px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 rounded-t-[26px] px-5 py-4" style={{ background: `${conn.color}14` }}>
          <ConnectorLogo conn={conn} size={44} />
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-xl font-extrabold leading-tight">{t('conn.title', { name: conn.name })}</h2>
            <p className="mt-0.5 text-xs font-semibold text-ink/55">{t(conn.embed ? 'conn.embedDesc' : 'conn.linkDesc', { name: conn.name })}</p>
          </div>
          <button onClick={onClose} aria-label={t('contact.close')} className="press shrink-0 rounded-full border-2 border-ink p-1.5"><X size={16} /></button>
        </div>

        <div className="p-5">
          <label className="mb-1 block text-[10px] font-extrabold uppercase tracking-wide text-ink/50">
            {t('conn.urlLabel', { name: conn.name })}
          </label>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={connectorPlaceholder(conn)}
            autoFocus={desktop}
            inputMode="url"
            className="w-full rounded-xl border-2 px-3 py-2.5 text-sm font-medium transition focus:outline-none"
            style={{ borderColor: valid ? '#15803D' : wrong ? '#EF5A4C' : 'rgba(10,10,10,0.15)' }}
          />
          {valid && (
            <p className="mt-1.5 flex items-center gap-1.5 text-xs font-bold text-green-700">
              <Check size={13} strokeWidth={3} /> {t('conn.valid', { name: conn.name })}
            </p>
          )}
          {wrong && (
            <p className="mt-1.5 flex items-center gap-1.5 text-xs font-bold text-coral">
              <AlertCircle size={13} /> {t('conn.invalid', { name: conn.name })}
            </p>
          )}
          <Button className="mt-4 w-full" disabled={!valid} onClick={() => onAdd(conn, trimmed, connectorButton(conn, lang))}>
            {t('conn.add')}
          </Button>
        </div>
      </div>
    </div>
  )
}
