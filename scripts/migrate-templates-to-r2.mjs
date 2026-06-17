// Migration des vidéos de templates : Supabase → Cloudflare R2 (bucket public).
// Lancer une fois en local :
//   R2_ACCOUNT_ID=... R2_ACCESS_KEY_ID=... R2_SECRET_ACCESS_KEY=... R2_PUBLIC_BUCKET=aaven-public \
//   node scripts/migrate-templates-to-r2.mjs
// (PowerShell : définir $env:R2_ACCOUNT_ID=... etc. avant la commande.)
//
// Chaque vidéo est téléchargée depuis Supabase puis ré-uploadée sous la clé
// `templates/<même chemin>` → servie ensuite via https://cdn.aaven.fr/templates/...
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

const SRC = 'https://pgizduxqqplakidyipdn.supabase.co/storage/v1/object/public/Templates%20Premium'

// Chemins (encodés) des 9 vidéos référencées par les templates + la landing.
const PATHS = [
  '/Premium%20Createur/fd226439-0e1f-4889-a6f7-cecba77e771a-1-1.1-invideo-kling_25.mp4',
  '/Premium%20Createur/ef55bbf3-68f2-4a2c-978d-4d39f7118ed6-4-4.1-invideo-seedance_2_0.mp4',
  '/Premium%20Createur/56d5bd7f-9154-414f-a051-5bb904c0f8a6-2-3.1-invideo-seedance_2_0.mp4',
  '/Premium%20Etablissement/fd226439-0e1f-4889-a6f7-cecba77e771a-2-2.1-invideo-kling_v3_video.mp4',
  '/Premium%20Etablissement/4fd81e08-facb-4b26-84a9-c82c8b532be2-2-1.2-invideo-seedance_2_0.mp4',
  '/Premium%20Etablissement/ef55bbf3-68f2-4a2c-978d-4d39f7118ed6-2-2.1-invideo-seedance_2_0.mp4',
  '/Premium%20Freelance/ef55bbf3-68f2-4a2c-978d-4d39f7118ed6-1-1.1-invideo-seedance_2_0.mp4',
  '/Premium%20Freelance/b9861429-b87f-4c9d-bc04-0edc89cd21f3-1-1.1-invideo-seedance_2_0.mp4',
  '/Premium%20Freelance/ef55bbf3-68f2-4a2c-978d-4d39f7118ed6-3-3.1-invideo-seedance_2_0.mp4',
]

const bucket = process.env.R2_PUBLIC_BUCKET || 'aaven-public'
const account = process.env.R2_ACCOUNT_ID
const accessKeyId = process.env.R2_ACCESS_KEY_ID
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY

if (!account || !accessKeyId || !secretAccessKey) {
  console.error('❌ Variables R2 manquantes (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY).')
  process.exit(1)
}

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${account}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId, secretAccessKey },
})

let ok = 0
for (const p of PATHS) {
  const url = SRC + p
  try {
    const res = await fetch(url)
    if (!res.ok) { console.error('⚠️  skip', p, '→ HTTP', res.status); continue }
    const buf = Buffer.from(await res.arrayBuffer())
    const key = 'templates' + decodeURIComponent(p) // ex. templates/Premium Createur/xxx.mp4
    await s3.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: buf, ContentType: 'video/mp4' }))
    console.log('✅', key, `(${(buf.length / 1e6).toFixed(1)} Mo)`)
    ok++
  } catch (e) {
    console.error('❌', p, '→', e.message)
  }
}
console.log(`\nTerminé : ${ok}/${PATHS.length} vidéos migrées vers R2 (${bucket}).`)
