// Contenu des pages SEO dédiées (bilingue). Clé = slug d'URL.
export const SEO_PAGES = {
  'linktree-alternative': {
    fr: {
      h1: 'L’alternative à Linktree qui convertit',
      sub: 'Aaven transforme ton lien en bio en une vraie carte de visite digitale — vidéo, tips, réservations et ventes. Pas juste une liste de liens.',
      bullets: [
        { t: 'Plus qu’une liste de liens', d: 'Une page vivante (vidéo de fond, ambiance) pensée pour transformer tes visiteurs en clients.' },
        { t: 'Encaisse directement', d: 'Tips, produits digitaux et réservations intégrés, paiements Stripe sécurisés.' },
        { t: 'Gratuit pour démarrer', d: 'Tous les templates vidéo inclus en gratuit. Tu évolues quand tu veux.' },
      ],
      faq: [
        { q: 'Aaven est-il vraiment une alternative à Linktree ?', a: 'Oui : même simplicité, mais une page premium qui convertit (vidéo, tips, ventes, analytics) au lieu d’une simple liste de liens.' },
        { q: 'Puis-je migrer depuis Linktree ?', a: 'Tu recrées ta page en 30 secondes et tu remplaces ton lien en bio. Aucun engagement.' },
        { q: 'C’est payant ?', a: 'Gratuit pour démarrer, avec une petite commission sur les tips/ventes. Les abonnements suppriment le branding et débloquent l’upload vidéo.' },
      ],
    },
    en: {
      h1: 'The Linktree alternative that converts',
      sub: 'Aaven turns your link in bio into a real digital business card — video, tips, bookings and sales. Not just a list of links.',
      bullets: [
        { t: 'More than a link list', d: 'A living page (background video, ambiance) built to turn visitors into clients.' },
        { t: 'Get paid directly', d: 'Built-in tips, digital products and bookings, secure Stripe payments.' },
        { t: 'Free to start', d: 'All video templates included for free. Upgrade whenever you want.' },
      ],
      faq: [
        { q: 'Is Aaven really a Linktree alternative?', a: 'Yes: same simplicity, but a premium page that converts (video, tips, sales, analytics) instead of a plain list of links.' },
        { q: 'Can I migrate from Linktree?', a: 'Recreate your page in 30 seconds and swap your bio link. No commitment.' },
        { q: 'Is it paid?', a: 'Free to start, with a small fee on tips/sales. Paid plans remove branding and unlock video upload.' },
      ],
    },
  },
  'link-in-bio-with-video': {
    fr: {
      h1: 'Le link in bio avec vidéo de fond',
      sub: 'Une page bio cinématique : fond vidéo, ambiance et son. Capte l’attention dès la première seconde et démarque-toi.',
      bullets: [
        { t: 'Vidéo de fond immersive', d: 'Des templates vidéo premium gratuits, ou importe la tienne (Creator/Pro).' },
        { t: 'Ambiance & son', d: 'Le son de la vidéo crée une vraie atmosphère sur la page publique.' },
        { t: '100% mobile', d: 'Pensée pour Instagram, TikTok et les stories. QR code inclus.' },
      ],
      faq: [
        { q: 'Puis-je mettre une vidéo en fond gratuitement ?', a: 'Oui, tous les templates vidéo sont gratuits. L’upload de ta propre vidéo est réservé aux plans Creator/Pro.' },
        { q: 'La vidéo a-t-elle le son ?', a: 'Oui, le son se lance pour créer une ambiance (au premier geste du visiteur, règle des navigateurs).' },
        { q: 'Quelle durée pour ma vidéo ?', a: 'Jusqu’à 5 s en Creator, 30 s en Pro.' },
      ],
    },
    en: {
      h1: 'The link in bio with background video',
      sub: 'A cinematic bio page: background video, ambiance and sound. Grab attention from the first second and stand out.',
      bullets: [
        { t: 'Immersive background video', d: 'Free premium video templates, or upload your own (Creator/Pro).' },
        { t: 'Ambiance & sound', d: 'The video’s sound creates a real atmosphere on your public page.' },
        { t: '100% mobile', d: 'Built for Instagram, TikTok and stories. QR code included.' },
      ],
      faq: [
        { q: 'Can I add a background video for free?', a: 'Yes, all video templates are free. Uploading your own video is a Creator/Pro feature.' },
        { q: 'Does the video have sound?', a: 'Yes, sound starts to create ambiance (on the visitor’s first interaction, per browser rules).' },
        { q: 'How long can my video be?', a: 'Up to 5s on Creator, 30s on Pro.' },
      ],
    },
  },
  'bio-link-for-creators': {
    fr: {
      h1: 'La page bio pour créateurs',
      sub: 'Pensée pour les créateurs, coachs, DJs et freelances : monétise ton audience avec une page qui te ressemble.',
      bullets: [
        { t: 'Monétise ton audience', d: 'Tips, produits digitaux, réservations — tu encaisses directement.' },
        { t: 'Mur de supporters', d: 'Affiche tes soutiens et réponds-leur : preuve sociale qui rassure.' },
        { t: 'Analytics clairs', d: 'Vues, clics, recettes nettes — sache exactement ce qui convertit.' },
      ],
      faq: [
        { q: 'Pour quels créateurs ?', a: 'Créateurs de contenu, coachs, DJs/musiciens, restaurants et freelances — 3 modes adaptés.' },
        { q: 'Comment je gagne de l’argent ?', a: 'Tips, ventes de produits digitaux et réservations, encaissés via Stripe sur ton compte.' },
        { q: 'Combien de temps pour créer ma page ?', a: '30 secondes, sans carte bancaire ni engagement.' },
      ],
    },
    en: {
      h1: 'The bio link for creators',
      sub: 'Built for creators, coaches, DJs and freelancers: monetize your audience with a page that looks like you.',
      bullets: [
        { t: 'Monetize your audience', d: 'Tips, digital products, bookings — you get paid directly.' },
        { t: 'Supporter wall', d: 'Show your supporters and reply to them: social proof that reassures.' },
        { t: 'Clear analytics', d: 'Views, clicks, net revenue — know exactly what converts.' },
      ],
      faq: [
        { q: 'Which creators is it for?', a: 'Content creators, coaches, DJs/musicians, restaurants and freelancers — 3 tailored modes.' },
        { q: 'How do I make money?', a: 'Tips, digital product sales and bookings, collected via Stripe to your account.' },
        { q: 'How long to create my page?', a: '30 seconds, no credit card, no commitment.' },
      ],
    },
  },
}

// Meta (titre/description) — utilisé côté serveur ET client. FR par défaut.
export const SEO_META = {
  'linktree-alternative': {
    fr: { title: 'Alternative à Linktree qui convertit — Aaven', desc: 'Aaven : l’alternative premium à Linktree. Une carte de visite digitale avec vidéo, tips, réservations et ventes. Gratuit pour démarrer.' },
    en: { title: 'The Linktree alternative that converts — Aaven', desc: 'Aaven: the premium Linktree alternative. A digital business card with video, tips, bookings and sales. Free to start.' },
  },
  'link-in-bio-with-video': {
    fr: { title: 'Link in bio avec vidéo de fond — Aaven', desc: 'Crée une page bio cinématique avec vidéo de fond, ambiance et son. Templates vidéo gratuits, QR code, 100% mobile.' },
    en: { title: 'Link in bio with background video — Aaven', desc: 'Create a cinematic bio page with background video, ambiance and sound. Free video templates, QR code, 100% mobile.' },
  },
  'bio-link-for-creators': {
    fr: { title: 'Page bio pour créateurs — Aaven', desc: 'La page bio qui monétise ton audience : tips, produits digitaux, réservations et analytics. Pour créateurs, coachs, DJs et freelances.' },
    en: { title: 'Bio link for creators — Aaven', desc: 'The bio page that monetizes your audience: tips, digital products, bookings and analytics. For creators, coaches, DJs and freelancers.' },
  },
}

export const SEO_SLUGS = Object.keys(SEO_PAGES)
