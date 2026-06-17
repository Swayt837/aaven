// Pose un Cache-Control long (30 jours) sur les vidéos de templates + leurs posters.
// Utilise CopyObject (MetadataDirective REPLACE) : réécrit seulement les métadonnées,
// sans re-télécharger/ré-uploader les octets.
//
//   R2_ACCOUNT_ID=... R2_ACCESS_KEY_ID=... R2_SECRET_ACCESS_KEY=... R2_PUBLIC_BUCKET=aaven-public \
//   node scripts/set-template-cache-r2.mjs
import { S3Client, CopyObjectCommand } from '@aws-sdk/client-s3'

const VIDEO_KEYS = [
  'templates/createur/fd226439-0e1f-4889-a6f7-cecba77e771a-1-1.1-invideo-kling_25.mp4',
  'templates/createur/ef55bbf3-68f2-4a2c-978d-4d39f7118ed6-4-4.1-invideo-seedance_2_0.mp4',
  'templates/createur/56d5bd7f-9154-414f-a051-5bb904c0f8a6-2-3.1-invideo-seedance_2_0.mp4',
  'templates/etablissement/fd226439-0e1f-4889-a6f7-cecba77e771a-2-2.1-invideo-kling_v3_video.mp4',
  'templates/etablissement/4fd81e08-facb-4b26-84a9-c82c8b532be2-2-1.2-invideo-seedance_2_0.mp4',
  'templates/etablissement/ef55bbf3-68f2-4a2c-978d-4d39f7118ed6-2-2.1-invideo-seedance_2_0.mp4',
  'templates/freelance/ef55bbf3-68f2-4a2c-978d-4d39f7118ed6-1-1.1-invideo-seedance_2_0.mp4',
  'templates/freelance/b9861429-b87f-4c9d-bc04-0edc89cd21f3-1-1.1-invideo-seedance_2_0.mp4',
  'templates/freelance/ef55bbf3-68f2-4a2c-978d-4d39f7118ed6-3-3.1-invideo-seedance_2_0.mp4',
]
// Chaque vidéo a un poster .jpg à la même clé.
const ITEMS = [
  ...VIDEO_KEYS.map((k) => ({ key: k, type: 'video/mp4' })),
  ...VIDEO_KEYS.map((k) => ({ key: k.replace(/\.mp4$/, '.jpg'), type: 'image/jpeg' })),
]

const CACHE = 'public, max-age=2592000' // 30 jours (revalidable, pas immutable)
const bucket = process.env.R2_PUBLIC_BUCKET || 'aaven-public'
const account = process.env.R2_ACCOUNT_ID
const accessKeyId = process.env.R2_ACCESS_KEY_ID
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
if (!account || !accessKeyId || !secretAccessKey) { console.error('❌ Variables R2 manquantes.'); process.exit(1) }

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${account}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId, secretAccessKey },
})

let ok = 0
for (const { key, type } of ITEMS) {
  try {
    await s3.send(new CopyObjectCommand({
      Bucket: bucket,
      Key: key,
      CopySource: `${bucket}/${key}`,
      MetadataDirective: 'REPLACE',
      ContentType: type,
      CacheControl: CACHE,
    }))
    console.log('✅', key)
    ok++
  } catch (e) {
    console.error('❌', key, '→', e.message)
  }
}
console.log(`\nTerminé : ${ok}/${ITEMS.length} objets avec Cache-Control « ${CACHE} ».`)
