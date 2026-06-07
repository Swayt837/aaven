// Sélecteur de backend de données :
//  - DATABASE_URL défini  → PostgreSQL (Supabase)  [prod]
//  - sinon                → SQLite (better-sqlite3) [dev local]
// L'API exportée est identique dans les deux cas ; côté serveur tous les appels
// sont `await`és (await sur une valeur synchrone = la valeur → SQLite reste OK).

const impl = process.env.DATABASE_URL
  ? await import('./db.postgres.js')
  : await import('./db.sqlite.js')

export const Users = impl.Users
export const Pages = impl.Pages
export const Buttons = impl.Buttons
export const Clicks = impl.Clicks
export const Tips = impl.Tips
export const Messages = impl.Messages
export const Products = impl.Products
export const Purchases = impl.Purchases
export const slugify = impl.slugify
export const uniqueSlug = impl.uniqueSlug
