# BioBoost 🚀

Un « link-in-bio » intelligent orienté conversion — l'alternative à Linktree qui s'adapte à ton métier via **3 modes** : Créateur, Bar / Business local, Freelance.

> _Une page bio qui te **rapporte** des clients ou de l'argent._

Style **néo-brutaliste** (bordures noires épaisses, ombres dures décalées, fond crème, accents corail / jaune / rose). Interface **100 % FR** avec bascule **EN**.

## ✨ Fonctionnalités

- Landing (hero + 3 modes + pricing)
- Connexion Google (avec **dev-login** de secours)
- Onboarding (choix du mode + détails) avec presets de boutons
- Dashboard « Mes pages »
- Éditeur : identité, boutons réordonnables (drag & drop + flèches), toggle actif, **aperçu live**, modale **QR code** téléchargeable
- Page publique rendue selon le mode, avec **tracking** vues + clics
- Modale de **tips Stripe** (mode créateur)
- Analytics : KPIs (vues, clics, taux de clic) + graphique clics par bouton

## 🧱 Stack

- **Front** : React + Vite + Tailwind CSS + react-router + lucide-react + qrcode.react
- **Back** : Node + Express (API REST) · rate-limiting (`express-rate-limit`) · validation/anti-XSS des URLs (`server/validate.js`)
- **Données** : **SQLite** (`better-sqlite3`, mode WAL) dans `server/bioboost.db` — écritures atomiques & transactionnelles, zéro setup. Migration automatique depuis un ancien `server/data.json` au 1er démarrage.
- **Auth** : Google OAuth (optionnel) · **Paiements** : Stripe Checkout (optionnel)

## ▶️ Démarrage

```bash
cd bioboost
npm install
npm run dev
```

- Front : http://localhost:5180
- API  : http://localhost:3001 (proxifiée via `/api`)

L'app **fonctionne immédiatement sans aucune clé** :
- Sans Google → bouton « Continue with Google » crée un compte de démo.
- Sans Stripe → les tips simulent un paiement réussi.

## 🔐 Configuration (optionnelle)

Copie `.env.example` en `.env` et remplis :

| Variable | Rôle |
|---|---|
| `SESSION_SECRET` | signe le cookie de session |
| `APP_URL` | URL publique (OAuth/Stripe/QR) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | active la vraie connexion Google. Redirect URI : `{APP_URL}/api/auth/google/callback` |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | active les vrais paiements Stripe |

## 📦 Production

```bash
npm run build   # génère dist/
npm start       # Express sert l'API + dist/
```

## 🗂️ Modèle de données

`User` · `Page` · `Button` · `Tip` · `Click` — voir `server/db.js`.
