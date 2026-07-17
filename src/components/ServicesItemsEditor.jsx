import { Trash2, Plus } from 'lucide-react'
import { Button, Input } from './ui'
import { useI18n } from '../lib/i18n'

// Éditeur de la liste « Services & tarifs » (nom + prix + desc + CTA optionnel).
export function ServicesItemsEditor({ items, onChange }) {
  const { t } = useI18n()
  const list = items || []
  const update = (i, patch) => onChange(list.map((it, idx) => (idx === i ? { ...it, ...patch } : it)))
  const add = () => onChange([...list, { name: '', price: '', desc: '', ctaUrl: '', ctaLabel: '' }])
  const remove = (i) => onChange(list.filter((_, idx) => idx !== i))

  return (
    <div className="mt-2">
      <p className="mb-1 text-[10px] font-extrabold uppercase tracking-wide text-ink/40">{t('edit.svc.title')}</p>
      <div className="space-y-2">
        {list.map((it, i) => (
          <div key={i} className="space-y-1.5 rounded-lg border border-ink/15 p-2">
            <div className="flex gap-1.5">
              <Input value={it.name || ''} onChange={(e) => update(i, { name: e.target.value })} placeholder={t('edit.svc.name')} maxLength={80} />
              <input value={it.price || ''} onChange={(e) => update(i, { price: e.target.value })} placeholder={t('edit.svc.price')} maxLength={24} className="w-24 shrink-0 rounded-brutal border border-ink/15 bg-white px-2 text-sm" />
              <button type="button" onClick={() => remove(i)} aria-label={t('common.delete')} className="press shrink-0 text-coral"><Trash2 size={15} /></button>
            </div>
            <Input value={it.desc || ''} onChange={(e) => update(i, { desc: e.target.value })} placeholder={t('edit.svc.desc')} maxLength={160} />
            <div className="flex gap-1.5">
              <Input value={it.ctaUrl || ''} onChange={(e) => update(i, { ctaUrl: e.target.value })} placeholder={t('edit.svc.ctaUrl')} />
              <input value={it.ctaLabel || ''} onChange={(e) => update(i, { ctaLabel: e.target.value })} placeholder={t('edit.svc.ctaLabel')} maxLength={40} className="w-28 shrink-0 rounded-brutal border border-ink/15 bg-white px-2 text-sm" />
            </div>
          </div>
        ))}
      </div>
      <Button variant="secondary" size="sm" className="mt-2 w-full" onClick={add}><Plus size={14} /> {t('edit.svc.add')}</Button>
    </div>
  )
}
