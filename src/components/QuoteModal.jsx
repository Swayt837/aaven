import { useState } from 'react'
import { X, CheckCircle2 } from 'lucide-react'
import { Button, Input, Textarea } from './ui'
import { useI18n } from '../lib/i18n'
import { api } from '../lib/api'

// Bottom-sheet « Devis express » (mini-formulaire : nom / email / besoin / budget).
export function QuoteModal({ slug, title, accent = '#2547D0', onClose }) {
  const { t } = useI18n()
  const [f, setF] = useState({ name: '', email: '', need: '', budget: '' })
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [err, setErr] = useState('')
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }))
  const valid = f.need.trim() && (f.email.trim() || f.name.trim())

  async function send() {
    setErr('')
    if (!valid) return
    setLoading(true)
    const message = [`📋 Besoin : ${f.need}`, f.budget ? `💰 Budget : ${f.budget}` : null].filter(Boolean).join('\n')
    try {
      await api.sendMessage(slug, { name: f.name, email: f.email, message, subject: title || 'Devis express' })
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
          <h2 className="font-display text-2xl font-extrabold">{title || t('quote.title')}</h2>
          <button onClick={onClose} aria-label={t('contact.close')} className="press rounded-full border-2 border-ink p-1.5"><X size={18} /></button>
        </div>

        {sent ? (
          <div className="py-8 text-center">
            <CheckCircle2 size={48} className="mx-auto" style={{ color: accent }} strokeWidth={2.5} />
            <p className="font-display mt-3 text-xl font-extrabold">{t('quote.sent')}</p>
            <p className="mt-1 text-sm font-medium text-ink/70">{t('quote.sentSub')}</p>
            <Button className="mt-5 w-full" onClick={onClose}>{t('contact.close')}</Button>
          </div>
        ) : (
          <>
            <p className="mt-1 text-sm font-medium text-ink/70">{t('quote.sub')}</p>
            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <Input value={f.name} onChange={set('name')} placeholder={t('contact.namePh')} maxLength={80} />
                <Input type="email" value={f.email} onChange={set('email')} placeholder={t('contact.emailPh')} maxLength={160} />
              </div>
              <Textarea rows={3} value={f.need} onChange={set('need')} placeholder={t('quote.needPh')} maxLength={2000} />
              <Input value={f.budget} onChange={set('budget')} placeholder={t('quote.budgetPh')} maxLength={60} />
            </div>
            {err && <p className="mt-2 text-sm font-bold text-coral">{err}</p>}
            <Button className="mt-4 w-full" onClick={send} disabled={loading || !valid}>
              {loading ? t('contact.sending') : t('quote.submit')}
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
