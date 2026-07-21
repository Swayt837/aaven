import { useState } from 'react'
import { X, CheckCircle2 } from 'lucide-react'
import { Button, Input } from './ui'
import { useI18n } from '../lib/i18n'
import { api } from '../lib/api'

// Bottom-sheet de capture newsletter : le visiteur laisse son e-mail directement
// sur la page (aucun outil externe requis). Les abonnés sont consultables et
// exportables par le créateur dans Stats.
export function NewsletterModal({ slug, title, accent = '#EF5A4C', onClose }) {
  const { t } = useI18n()
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [err, setErr] = useState('')
  const valid = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())

  async function send() {
    setErr('')
    if (!valid) return
    setLoading(true)
    try {
      await api.subscribe(slug, { email: email.trim(), name: name.trim() })
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
          <h2 className="font-display text-2xl font-extrabold">{title || t('nl.title')}</h2>
          <button onClick={onClose} aria-label={t('contact.close')} className="press rounded-full border-2 border-ink p-1.5"><X size={18} /></button>
        </div>

        {sent ? (
          <div className="py-8 text-center">
            <CheckCircle2 size={48} className="mx-auto" style={{ color: accent }} strokeWidth={2.5} />
            <p className="font-display mt-3 text-xl font-extrabold">{t('nl.sent')}</p>
            <p className="mt-1 text-sm font-medium text-ink/70">{t('nl.sentSub')}</p>
            <Button className="mt-5 w-full" onClick={onClose}>{t('contact.close')}</Button>
          </div>
        ) : (
          <>
            <p className="mt-1 text-sm font-medium text-ink/70">{t('nl.sub')}</p>
            <div className="mt-4 space-y-3">
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('nl.emailPh')} maxLength={160} />
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('nl.namePh')} maxLength={80} />
            </div>
            {err && <p className="mt-2 text-sm font-bold text-coral">{err}</p>}
            <Button className="mt-4 w-full" onClick={send} disabled={loading || !valid}>
              {loading ? t('contact.sending') : t('nl.submit')}
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
