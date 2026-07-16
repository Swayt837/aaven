// One-off : migre la vidéo de fond de flo-btt (.mov Supabase, sans faststart ni poster)
// vers R2 en mp4 faststart + poster jpg, puis met à jour le thème de la page en base.
//   R2_ACCOUNT_ID=... R2_ACCESS_KEY_ID=... R2_SECRET_ACCESS_KEY=... node scripts/migrate-flobtt-video.mjs
import 'dotenv/config'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { execFile } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'
import os from 'os'
import path from 'path'
import ffmpegPath from 'ffmpeg-static'
import { Pages } from '../server/db.js'

const run = promisify(execFile)
const SLUG = 'flo-btt'
const PUBLIC_BASE = 'https://cdn.aaven.fr'
const CACHE = 'public, max-age=2592000, immutable'

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  forcePathStyle: true,
  credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY },
})

const page = await Pages.bySlug(SLUG)
if (!page?.theme?.bgVideo) { console.error('❌ page ou bgVideo introuvable'); process.exit(1) }
console.log('bgVideo actuel :', page.theme.bgVideo)

// 1. Télécharge la vidéo actuelle
const res = await fetch(page.theme.bgVideo)
if (!res.ok) { console.error('❌ téléchargement échoué', res.status); process.exit(1) }
const src = Buffer.from(await res.arrayBuffer())
console.log('téléchargée :', (src.length / 1e6).toFixed(1), 'Mo')

// 2. Remux mp4 faststart (copie des flux, sans perte) + poster
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'flobtt-'))
const inPath = path.join(dir, 'in.mov')
const outPath = path.join(dir, 'out.mp4')
const posterPath = path.join(dir, 'poster.jpg')
fs.writeFileSync(inPath, src)
await run(ffmpegPath, ['-y', '-i', inPath, '-c', 'copy', '-movflags', '+faststart', outPath])
await run(ffmpegPath, ['-y', '-ss', '0.5', '-i', inPath, '-frames:v', '1', '-vf', 'scale=720:-2', '-q:v', '3', posterPath])
const video = fs.readFileSync(outPath)
const poster = fs.readFileSync(posterPath)
console.log('mp4 faststart :', (video.length / 1e6).toFixed(1), 'Mo · poster :', (poster.length / 1e3).toFixed(0), 'Ko')

// 3. Upload R2 (clé au format savePublic : <pageId>-<suffixe>)
const base = `${page.id}-herobg`
await s3.send(new PutObjectCommand({ Bucket: 'aaven-public', Key: `${base}.mp4`, Body: video, ContentType: 'video/mp4', CacheControl: CACHE }))
await s3.send(new PutObjectCommand({ Bucket: 'aaven-public', Key: `${base}.jpg`, Body: poster, ContentType: 'image/jpeg', CacheControl: CACHE }))
console.log('uploadés :', `${PUBLIC_BASE}/${base}.mp4`, '+ .jpg')

// 4. Met à jour le thème (la vidéo reste un upload perso → bgVideoOwn conservé)
await Pages.update(page.id, { theme: { ...page.theme, bgVideo: `${PUBLIC_BASE}/${base}.mp4` } })
console.log('✅ thème mis à jour — nouvelle bgVideo :', `${PUBLIC_BASE}/${base}.mp4`)
fs.rmSync(dir, { recursive: true, force: true })
process.exit(0)
