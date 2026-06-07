import { useState } from 'react'
import { X } from 'lucide-react'
import { Button, Textarea } from './ui'
import { useI18n } from '../lib/i18n'
import { api } from '../lib/api'

const DEFAULT_PRESETS = [3, 5, 10, 20]

// Bottom-sheet de soutien (tips). `amounts` = montants suggérés par le créateur.
export function TipModal({ slug, amounts, onClose }) {
  const { t } = useI18n()
  const PRESETS = Array.isArray(amounts) && amounts.length ? amounts : DEFAULT_PRESETS
  const [amount, setAmount] = useState(PRESETS[1] || PRESETS[0] || 5)
  const [custom, setCustom] = useState('')
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const finalAmount = custom ? Math.max(1, Math.round(parseFloat(custom) || 0)) : amount

  async function pay() {
    setLoading(true)
    try {
      const res = await api.createTip(slug, { amount: finalAmount, message, name })
      if (res.url) {
        window.location.href = res.url // Stripe Checkout (réel) ou page de succès simulée
      }
    } catch (e) {
      alert(e.message)
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-t-[28px] border-2 border-ink bg-white p-6 shadow-hard-lg animate-[slideUp_.2s_ease]"
        onClick={(e) => e.stopPropagation()}
        style={{ animationName: 'none' }}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-extrabold">{t('tip.title')}</h2>
          <button onClick={onClose} aria-label="Fermer" className="press rounded-full border-2 border-ink p-1.5">
            <X size={18} />
          </button>
        </div>
        <p className="mt-1 text-sm font-medium text-ink/70">{t('tip.sub')}</p>

        <div className="mt-4 grid grid-cols-4 gap-2">
          {PRESETS.map((a) => {
            const sel = !custom && amount === a
            return (
              <button
                key={a}
                onClick={() => { setAmount(a); setCustom('') }}
                className="press rounded-brutal border-2 border-ink py-3 font-display text-lg font-extrabold shadow-hard-sm"
                style={sel ? { background: '#F0426B', color: '#fff' } : { background: '#fff' }}
              >
                {a}€
              </button>
            )
          })}
        </div>

        <div className="mt-3">
          <label className="mb-1 block text-xs font-extrabold uppercase tracking-wide text-ink/70">
            {t('tip.custom')}
          </label>
          <input
            type="number"
            min="1"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            placeholder="—"
            className="w-full rounded-brutal border-2 border-ink px-4 py-3"
          />
        </div>

        <div className="mt-3">
          <label className="mb-1 block text-xs font-extrabold uppercase tracking-wide text-ink/70">
            {t('tip.name')}
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('tip.namePh')}
            maxLength={60}
            className="w-full rounded-brutal border-2 border-ink px-4 py-3"
          />
        </div>

        <div className="mt-3">
          <label className="mb-1 block text-xs font-extrabold uppercase tracking-wide text-ink/70">
            {t('tip.message')}
          </label>
          <Textarea rows={2} value={message} onChange={(e) => setMessage(e.target.value)} placeholder={t('tip.messagePh')} />
        </div>

        <Button variant="pink" className="mt-4 w-full" onClick={pay} disabled={loading || finalAmount < 1}>
          {loading ? t('common.loading') : t('tip.pay', { amount: finalAmount })}
        </Button>
        <p className="mt-2 text-center text-xs text-ink/50">{t('tip.secured')}</p>
      </div>
    </div>
  )
}
