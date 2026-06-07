import { Link, useParams, Navigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Logo } from '../components/Logo'

// Date de dernière mise à jour (à actualiser si tu modifies un document).
const UPDATED = '8 juin 2026'

// ⚠️ Contenu TEMPLATE à compléter/faire valider. Les [CROCHETS] = à remplir.
const DOCS = {
  'mentions-legales': {
    title: 'Mentions légales',
    sections: [
      ['Éditeur du site', [
        'Le site BioBoost est édité par [RAISON SOCIALE / NOM PRÉNOM], [forme juridique : ex. auto-entrepreneur / SAS au capital de … €].',
        'Adresse : [ADRESSE COMPLÈTE]. SIRET : [N° SIRET]. [N° TVA intracommunautaire si applicable].',
        'Directeur de la publication : [NOM]. Contact : [EMAIL DE CONTACT].',
      ]],
      ['Hébergement', [
        'Application hébergée par Render Services, Inc. (525 Brannan Street, San Francisco, CA, USA) — render.com.',
        'Base de données et stockage des fichiers : Supabase (Supabase, Inc.) — supabase.com. Paiements : Stripe Payments Europe, Ltd.',
      ]],
      ['Propriété intellectuelle', [
        'La marque, le logo et l’interface de BioBoost sont protégés. Les contenus publiés par les utilisateurs (textes, images, liens) restent leur propriété et relèvent de leur seule responsabilité.',
      ]],
      ['Contact', ['Pour toute question : [EMAIL DE CONTACT].']],
    ],
  },
  cgu: {
    title: 'Conditions Générales d’Utilisation',
    sections: [
      ['1. Objet', ['Les présentes CGU régissent l’accès et l’utilisation du service BioBoost, qui permet de créer une page de profil (« link-in-bio ») regroupant liens, contenus et actions (soutien, réservation, contact, vente de produits numériques).']],
      ['2. Compte', ['La création d’un compte se fait via Google. Tu es responsable de l’exactitude de tes informations et de la confidentialité de l’accès à ton compte.']],
      ['3. Utilisation acceptable', [
        'Tu t’engages à ne pas publier de contenu illégal, trompeur, haineux, contrefaisant, ou portant atteinte aux droits de tiers.',
        'BioBoost peut suspendre ou supprimer un compte/une page en cas de manquement, sans préavis en cas d’abus grave.',
      ]],
      ['4. Disponibilité', ['Le service est fourni « en l’état ». Nous visons une disponibilité maximale sans garantie d’absence d’interruption. Des maintenances peuvent survenir.']],
      ['5. Responsabilité', ['L’utilisateur est seul responsable des contenus et des liens qu’il publie, ainsi que des produits/services qu’il propose via sa page.']],
      ['6. Résiliation', ['Tu peux supprimer ta page et ton compte à tout moment. La suppression entraîne l’effacement des données associées (voir Politique de confidentialité).']],
      ['7. Modifications', ['Les présentes CGU peuvent évoluer. La version applicable est celle en vigueur à la date d’utilisation.']],
    ],
  },
  cgv: {
    title: 'Conditions Générales de Vente',
    sections: [
      ['1. Champ d’application', [
        'Les présentes CGV s’appliquent (a) aux abonnements payants BioBoost (Creator, Pro) souscrits par les utilisateurs, et (b) au rôle de BioBoost en tant qu’intermédiaire technique pour les paiements reçus par les créateurs (soutiens/tips et ventes de produits numériques), encaissés via Stripe.',
      ]],
      ['2. Abonnements et prix', [
        'Creator : 7 €/mois. Pro : 15 €/mois. Plan Free : 0 €. Prix TTC le cas échéant ; la TVA applicable est calculée par Stripe.',
        'L’abonnement est mensuel, sans engagement, renouvelé automatiquement jusqu’à résiliation depuis l’espace client / le portail Stripe.',
      ]],
      ['3. Paiement', ['Les paiements sont traités par Stripe. BioBoost ne stocke aucune donnée de carte bancaire.']],
      ['4. Commissions', [
        'Sur les soutiens et ventes encaissés par les créateurs via Stripe Connect, BioBoost prélève une commission selon le plan (Free 5 %, Creator 1 %, Pro 0 %), en sus des frais Stripe. Les créateurs sont responsables de leurs obligations fiscales et, le cas échéant, de la conformité de leurs offres.',
      ]],
      ['5. Droit de rétractation', [
        'Abonnements : conformément au Code de la consommation, le service numérique débutant immédiatement, tu reconnais renoncer à ton droit de rétractation une fois l’accès activé.',
        'Produits numériques vendus par les créateurs : la fourniture d’un contenu numérique immédiat entraîne renonciation au droit de rétractation, sauf mention contraire du vendeur.',
      ]],
      ['6. Remboursements', ['Toute demande relative à un abonnement : [EMAIL DE CONTACT]. Les litiges relatifs à un produit vendu par un créateur relèvent en premier lieu du créateur concerné.']],
      ['7. Médiation', ['Conformément à la réglementation, tu peux recourir à un médiateur de la consommation : [NOM / URL DU MÉDIATEUR].']],
    ],
  },
  confidentialite: {
    title: 'Politique de confidentialité',
    sections: [
      ['Responsable du traitement', ['[RAISON SOCIALE / NOM], contact : [EMAIL DE CONTACT].']],
      ['Données collectées', [
        'Compte : nom, e-mail et photo fournis par Google lors de la connexion.',
        'Contenu : pages, liens, textes, images/fichiers que tu publies.',
        'Mesure d’audience : nombre de vues et de clics (données agrégées, sans cookie tiers).',
        'Messages & réservations : informations transmises via les formulaires de tes visiteurs.',
        'Paiements : gérés par Stripe (nous ne stockons aucune donnée bancaire).',
      ]],
      ['Finalités et base légale', [
        'Fournir le service et ton espace (exécution du contrat).',
        'Statistiques de performance de ta page (intérêt légitime).',
        'Notifications et e-mails liés au service (exécution du contrat).',
      ]],
      ['Sous-traitants', ['Google (authentification), Supabase (base de données & stockage), Render (hébergement), Stripe (paiements). Des transferts hors UE peuvent intervenir, encadrés par des garanties appropriées.']],
      ['Durée de conservation', ['Les données sont conservées tant que ton compte est actif, puis supprimées après clôture (sauf obligations légales, ex. comptables pour les factures).']],
      ['Tes droits', ['Accès, rectification, effacement, portabilité, opposition. Tu peux supprimer ta page/ton compte à tout moment, ou nous écrire à [EMAIL DE CONTACT]. Réclamation possible auprès de la CNIL (cnil.fr).']],
      ['Cookies', ['BioBoost n’utilise qu’un cookie strictement nécessaire (session de connexion). Aucun cookie publicitaire ni traceur tiers. La mesure d’audience est anonyme et côté serveur.']],
    ],
  },
}

export default function Legal() {
  const { doc } = useParams()
  const data = DOCS[doc]
  if (!data) return <Navigate to="/legal/mentions-legales" replace />

  const tabs = [
    ['mentions-legales', 'Mentions légales'],
    ['cgu', 'CGU'],
    ['cgv', 'CGV'],
    ['confidentialite', 'Confidentialité'],
  ]

  return (
    <div className="min-h-screen bg-cream">
      <header className="border-b-2 border-ink bg-cream/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Logo />
          <Link to="/" className="press flex items-center gap-1.5 rounded-brutal border-2 border-ink bg-white px-3 py-1.5 text-sm font-extrabold">
            <ArrowLeft size={15} /> Accueil
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10">
        <div className="mb-6 flex flex-wrap gap-2">
          {tabs.map(([key, label]) => (
            <Link
              key={key}
              to={`/legal/${key}`}
              className={`rounded-full border-2 border-ink px-3 py-1.5 text-xs font-extrabold ${doc === key ? 'bg-ink text-white' : 'bg-white'}`}
            >
              {label}
            </Link>
          ))}
        </div>

        <h1 className="font-display text-4xl">{data.title}</h1>
        <p className="mt-1 text-sm font-semibold text-ink/50">Dernière mise à jour : {UPDATED}</p>

        <div className="mt-8 space-y-7">
          {data.sections.map(([heading, body], i) => (
            <section key={i}>
              <h2 className="font-display text-xl font-extrabold">{heading}</h2>
              <div className="mt-2 space-y-2">
                {(Array.isArray(body) ? body : [body]).map((p, j) => (
                  <p key={j} className="text-sm font-medium leading-relaxed text-ink/75">{p}</p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <p className="mt-10 rounded-brutal border-2 border-dashed border-ink/30 p-4 text-xs font-semibold text-ink/50">
          ⚠️ Modèle à compléter (champs [entre crochets]) et à faire valider juridiquement avant le lancement public.
        </p>
      </main>
    </div>
  )
}
