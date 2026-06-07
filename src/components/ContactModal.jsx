import { useState } from 'react'
import { X, CheckCircle2 } from 'lucide-react'
import { Button, Input, Textarea } from './ui'
import { useI18n } from '../lib/i18n'
import { api } from '../lib/api'

// Bottom-sheet formulaire de contact (3e type d'action : formulaire simple).
// `subject` = libellé du bouton (ex. "Devis express") pour contextualiser le message.
export function ContactModal({ slug, subject, onClose }) {
  const { t } = useI18n()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [err, setErr] = useState('')

  async function send() {
    setErr('')
    if (!message.trim()) return
    setLoading(true)
    try {
      await api.sendMessage(slug, { name, email, message, subject })
      setSent(true)
    } catch (e) {
      setErr(e.message || t('contact.error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-t-[28px] border-2 border-ink bg-white p-6 shadow-hard-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-extrabold">{subject || t('contact.title')}</h2>
          <button onClick={onClose} aria-label={t('contact.close')} className="press rounded-full border-2 border-ink p-1.5">
            <X size={18} />
          </button>
        </div>

        {sent ? (
          <div className="py-8 text-center">
            <CheckCircle2 size={48} className="mx-auto text-coral" strokeWidth={2.5} />
            <p className="font-display mt-3 text-xl font-extrabold">{t('contact.sent')}</p>
            <p className="mt-1 text-sm font-medium text-ink/70">{t('contact.sentSub')}</p>
            <Button className="mt-5 w-full" onClick={onClose}>{t('contact.close')}</Button>
          </div>
        ) : (
          <>
            <p className="mt-1 text-sm font-medium text-ink/70">{t('contact.sub')}</p>
            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('contact.namePh')} maxLength={80} />
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('contact.emailPh')} maxLength={160} />
              </div>
              <Textarea rows={4} value={message} onChange={(e) => setMessage(e.target.value)} placeholder={t('contact.messagePh')} maxLength={2000} />
            </div>
            {err && <p className="mt-2 text-sm font-bold text-coral">{err}</p>}
            <Button className="mt-4 w-full" onClick={send} disabled={loading || !message.trim()}>
              {loading ? t('contact.sending') : t('contact.send')}
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
