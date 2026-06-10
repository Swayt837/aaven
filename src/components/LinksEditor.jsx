import { Trash2, Plus, Link as LinkIcon } from 'lucide-react'
import { Button, Input } from './ui'
import { useI18n } from '../lib/i18n'
import { faviconUrl } from '../lib/modes'

// Éditeur multi-liens pour un bouton « Lien personnalisé » (ou « Mes produits »).
// 1 lien → le bouton ouvre directement le lien (favicon affiché).
// Plusieurs → le bouton ouvre une modale listant les liens.
// `labelKeys` permet de réutiliser le composant avec d'autres libellés (ex. produits).
export function LinksEditor({ items, onChange, labelKeys = {} }) {
  const { t } = useI18n()
  const k = { title: 'edit.links.title', url: 'edit.links.url', label: 'edit.links.label', add: 'edit.links.add', ...labelKeys }
  const list = items && items.length ? items : [{ url: '', label: '' }]
  const update = (i, patch) => onChange(list.map((it, idx) => (idx === i ? { ...it, ...patch } : it)))
  const add = () => onChange([...list, { url: '', label: '' }])
  const remove = (i) => onChange(list.filter((_, idx) => idx !== i))

  return (
    <div className="mt-2">
      <p className="mb-1 text-[10px] font-extrabold uppercase tracking-wide text-ink/40">{t(k.title)}</p>
      <div className="space-y-2">
        {list.map((it, i) => {
          const fav = it.url ? faviconUrl(it.url) : null
          return (
            <div key={i} className="space-y-1.5 rounded-lg border-2 border-ink/20 p-2">
              <div className="flex items-center gap-1.5">
                <span className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-lg border-2 border-ink/15 bg-cream">
                  {fav ? <img src={fav} alt="" width={16} height={16} onError={(e) => { e.currentTarget.style.display = 'none' }} /> : <LinkIcon size={14} className="text-ink/40" />}
                </span>
                <Input value={it.url || ''} onChange={(e) => update(i, { url: e.target.value })} placeholder={t(k.url)} />
                <button type="button" onClick={() => remove(i)} aria-label={t('common.delete')} className="press shrink-0 text-coral"><Trash2 size={15} /></button>
              </div>
              <Input value={it.label || ''} onChange={(e) => update(i, { label: e.target.value })} placeholder={t(k.label)} maxLength={60} />
            </div>
          )
        })}
      </div>
      <Button variant="secondary" size="sm" className="mt-2 w-full" onClick={add}><Plus size={14} /> {t(k.add)}</Button>
    </div>
  )
}
