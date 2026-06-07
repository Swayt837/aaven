import { useRef, useState } from 'react'
import { Trash2, Plus, Upload, X } from 'lucide-react'
import { Button, Input, Textarea, Label } from './ui'
import { useI18n } from '../lib/i18n'
import { api } from '../lib/api'

// Gestion des produits digitaux d'une page (liste + ajout + suppression + actif).
export function ProductsEditor({ slug, products, onReload }) {
  const { t } = useI18n()
  const fileRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [price, setPrice] = useState('')
  const [description, setDescription] = useState('')
  const [coverImage, setCoverImage] = useState('')
  const [file, setFile] = useState(null)
  const [busy, setBusy] = useState(false)
  const [coverBusy, setCoverBusy] = useState(false)
  const [err, setErr] = useState('')
  const coverRef = useRef(null)

  async function onCoverFile(e) {
    const f = e.target.files?.[0]
    if (!f) return
    setCoverBusy(true)
    try {
      const { url } = await api.uploadImage(slug, f)
      setCoverImage(url)
    } catch (ex) {
      setErr(ex.message)
    } finally {
      setCoverBusy(false)
      if (coverRef.current) coverRef.current.value = ''
    }
  }

  async function add() {
    setErr('')
    if (!title.trim() || !file) {
      setErr(!file ? t('edit.prodFile') : t('edit.prodTitle'))
      return
    }
    setBusy(true)
    try {
      await api.createProduct(slug, { title: title.trim(), description, price, coverImage }, file)
      setTitle(''); setPrice(''); setDescription(''); setCoverImage(''); setFile(null); setOpen(false)
      if (fileRef.current) fileRef.current.value = ''
      onReload()
    } catch (e) {
      setErr(e.message)
    } finally {
      setBusy(false)
    }
  }

  async function toggle(p) {
    await api.updateProduct(slug, p.id, { active: !p.active })
    onReload()
  }
  async function remove(p) {
    if (!confirm(`${t('common.delete')} « ${p.title} » ?`)) return
    await api.deleteProduct(slug, p.id)
    onReload()
  }

  return (
    <div>
      <div className="space-y-2">
        {products.map((p) => (
          <div key={p.id} className={`flex items-center gap-2 rounded-brutal border-2 border-ink bg-white p-2.5 ${p.active ? '' : 'opacity-50'}`}>
            {p.coverImage ? (
              <img src={p.coverImage} alt="" className="h-10 w-10 shrink-0 rounded-lg border-2 border-ink object-cover" />
            ) : (
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border-2 border-ink bg-cream">📦</span>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-sm font-extrabold">{p.title}</p>
              <p className="text-xs font-bold text-ink/60">{(p.priceCents / 100).toFixed(2)}€ · {p.sales} {t('edit.prodSales')}</p>
            </div>
            <button
              onClick={() => toggle(p)}
              className={`relative h-6 w-10 shrink-0 rounded-full border-2 border-ink transition ${p.active ? 'bg-coral' : 'bg-white'}`}
              aria-label="actif"
            >
              <span className={`absolute top-0.5 h-4 w-4 rounded-full border-2 border-ink bg-white transition-all ${p.active ? 'left-4' : 'left-0.5'}`} />
            </button>
            <button onClick={() => remove(p)} aria-label={t('common.delete')} className="press shrink-0 text-coral"><Trash2 size={16} /></button>
          </div>
        ))}
      </div>

      {open ? (
        <div className="mt-3 rounded-brutal border-2 border-ink bg-cream p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-display text-xs font-extrabold uppercase text-ink/60">{t('edit.addProduct')}</span>
            <button onClick={() => setOpen(false)}><X size={16} /></button>
          </div>
          <div className="space-y-2">
            <div className="flex gap-2">
              <div className="flex-1"><Label>{t('edit.prodTitle')}</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} /></div>
              <div className="w-24"><Label>{t('edit.prodPrice')}</Label><Input type="number" min="1" value={price} onChange={(e) => setPrice(e.target.value)} /></div>
            </div>
            <div><Label>{t('edit.prodDesc')}</Label><Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} /></div>
            <div>
              <Label>{t('edit.prodCover')}</Label>
              <div className="flex gap-2">
                <Input value={coverImage} onChange={(e) => setCoverImage(e.target.value)} placeholder="https://…" />
                <button type="button" onClick={() => coverRef.current?.click()} disabled={coverBusy} title={t('edit.uploadCover')} className="press grid shrink-0 place-items-center rounded-brutal border-2 border-ink bg-white px-3 shadow-hard-sm disabled:opacity-50">
                  <Upload size={16} />
                </button>
                <input ref={coverRef} type="file" accept="image/*" onChange={onCoverFile} className="hidden" />
              </div>
              {coverImage ? <img src={coverImage} alt="" className="mt-2 h-14 w-14 rounded-lg border-2 border-ink object-cover" /> : null}
            </div>
            <div>
              <Label>{t('edit.prodFile')}</Label>
              <button type="button" onClick={() => fileRef.current?.click()} className="press flex w-full items-center justify-center gap-2 rounded-brutal border-2 border-ink bg-white py-2.5 text-sm font-extrabold shadow-hard-sm">
                <Upload size={16} /> {file ? file.name : t('edit.prodFile')}
              </button>
              <input ref={fileRef} type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="hidden" />
            </div>
            {err && <p className="text-sm font-bold text-coral">{err}</p>}
            <Button className="w-full" onClick={add} disabled={busy}>{busy ? t('edit.uploading') : t('edit.prodAdd')}</Button>
          </div>
        </div>
      ) : (
        <Button variant="secondary" className="mt-3 w-full" onClick={() => setOpen(true)}>
          <Plus size={16} /> {t('edit.addProduct')}
        </Button>
      )}
      <p className="mt-2 text-[11px] font-semibold text-ink/50">{t('edit.prodLimitFree')}</p>
    </div>
  )
}
