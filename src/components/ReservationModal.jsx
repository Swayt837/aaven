import { useState } from 'react'
import { X, CheckCircle2 } from 'lucide-react'
import { Button, Input } from './ui'
import { useI18n } from '../lib/i18n'
import { api } from '../lib/api'

// Bottom-sheet de réservation de table (mini-formulaire : date / heure / couverts / nom / tél).
export function ReservationModal({ slug, title, accent = '#EF5A4C', onClose }) {
  const { t } = useI18n()
  const [f, setF] = useState({ date: '', time: '', guests: '2', name: '', phone: '', note: '' })
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [err, setErr] = useState('')
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }))
  const valid = f.date && f.name.trim() && f.phone.trim()

  async function send() {
    setErr('')
    if (!valid) return
    setLoading(true)
    try {
      await api.reserve(slug, f)
      setSent(true)
    } catch (e) {
      setErr(e.message || t('contact.error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40" onClick={onClose}>
      <div className="w-full max-w-md rounded-t-[28px] border-2 border-ink bg-white p-6 shadow-hard-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-extrabold">{title || t('reserve.title')}</h2>
          <button onClick={onClose} aria-label={t('contact.close')} className="press rounded-full border-2 border-ink p-1.5"><X size={18} /></button>
        </div>

        {sent ? (
          <div className="py-8 text-center">
            <CheckCircle2 size={48} className="mx-auto" style={{ color: accent }} strokeWidth={2.5} />
            <p className="font-display mt-3 text-xl font-extrabold">{t('reserve.sent')}</p>
            <p className="mt-1 text-sm font-medium text-ink/70">{t('reserve.sentSub')}</p>
            <Button className="mt-5 w-full" onClick={onClose}>{t('contact.close')}</Button>
          </div>
        ) : (
          <>
            <p className="mt-1 text-sm font-medium text-ink/70">{t('reserve.sub')}</p>
            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-[10px] font-extrabold uppercase tracking-wide text-ink/50">{t('reserve.date')}</label>
                  <Input type="date" value={f.date} onChange={set('date')} />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-extrabold uppercase tracking-wide text-ink/50">{t('reserve.time')}</label>
                  <Input type="time" value={f.time} onChange={set('time')} />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-extrabold uppercase tracking-wide text-ink/50">{t('reserve.guests')}</label>
                <Input type="number" min="1" max="50" value={f.guests} onChange={set('guests')} />
              </div>
              <Input value={f.name} onChange={set('name')} placeholder={t('reserve.namePh')} maxLength={80} />
              <Input type="tel" value={f.phone} onChange={set('phone')} placeholder={t('reserve.phonePh')} maxLength={40} />
              <Input value={f.note} onChange={set('note')} placeholder={t('reserve.notePh')} maxLength={300} />
            </div>
            {err && <p className="mt-2 text-sm font-bold text-coral">{err}</p>}
            <Button className="mt-4 w-full" onClick={send} disabled={loading || !valid}>
              {loading ? t('contact.sending') : t('reserve.submit')}
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
