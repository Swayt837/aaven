// Profession Engine — séquence d'emails d'onboarding par métier.
// Contenu 100% data-driven : email_sequence de la profession (3 entrées).
// Timing cible : J0 (welcome, envoyé à la création de page), J2 (case study),
// J5 (tip actionnable).
//
// ⚠️ Seul l'email J0 est envoyé automatiquement (au signup, si SMTP configuré).
// J2 et J5 nécessitent un scheduler (cron Render, ou provider type Resend/Loops
// avec audiences par profession) — les templates sont prêts ci-dessous, il ne
// reste qu'à brancher le déclencheur.

// "1) Welcome — upload your portfolio" → { subject: 'Welcome', body: 'upload your portfolio' }
function parseSequenceItem(item) {
  const cleaned = String(item || '').replace(/^\s*\d+\)\s*/, '').trim()
  const [subject, ...rest] = cleaned.split('—')
  return { subject: (subject || cleaned).trim(), hint: rest.join('—').trim() }
}

// Construit les 3 emails d'une profession. `urls` = { page, edit }.
export function buildProfessionEmails(prof, urls) {
  const days = [0, 2, 5]
  return (prof.email_sequence || []).slice(0, 3).map((item, i) => {
    const { subject, hint } = parseSequenceItem(item)
    return {
      day: days[i] ?? 0,
      subject: `${prof.emoji} ${subject} — Aaven`,
      text:
        `${hint ? hint[0].toUpperCase() + hint.slice(1) + '.\n\n' : ''}` +
        `Your ${prof.profession_en} page is live:\n${urls.page}\n\n` +
        `Customize it here:\n${urls.edit}\n\n— Aaven`,
    }
  })
}
