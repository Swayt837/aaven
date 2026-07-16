// One-off : recompresse la vidéo de fond de flo-btt en 720p CRF24 (comme les templates).
// Nouvelle clé R2 (l'ancienne est en cache immutable) + thème mis à jour + nouveau poster.
//   R2_ACCOUNT_ID=... R2_ACCESS_KEY_ID=... R2_SECRET_ACCESS_KEY=... node scripts/compress-flobtt-video.mjs
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
console.log('source :', page.theme.bgVideo)

const res = await fetch(page.theme.bgVideo)
if (!res.ok) { console.error('❌ téléchargement échoué', res.status); process.exit(1) }
const src = Buffer.from(await res.arrayBuffer())
console.log('téléchargée :', (src.length / 1e6).toFixed(1), 'Mo')

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'flobtt-c-'))
const inPath = path.join(dir, 'in.mp4')
const outPath = path.join(dir, 'out.mp4')
const posterPath = path.join(dir, 'poster.jpg')
fs.writeFileSync(inPath, src)
// 720p CRF24 preset slow + audio 96k + faststart — même recette que les templates (-65%).
await run(ffmpegPath, [
  '-y', '-i', inPath,
  '-vf', "scale='min(720,iw)':-2",
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '24', '-pix_fmt', 'yuv420p',
  '-c:a', 'aac', '-b:a', '96k',
  '-movflags', '+faststart',
  outPath,
], { timeout: 240000 })
await run(ffmpegPath, ['-y', '-ss', '0.5', '-i', outPath, '-frames:v', '1', '-q:v', '3', posterPath])
const video = fs.readFileSync(outPath)
const poster = fs.readFileSync(posterPath)
console.log('compressée :', (video.length / 1e6).toFixed(1), 'Mo · poster', (poster.length / 1e3).toFixed(0), 'Ko')

const base = `${page.id}-herobg-720`
await s3.send(new PutObjectCommand({ Bucket: 'aaven-public', Key: `${base}.mp4`, Body: video, ContentType: 'video/mp4', CacheControl: CACHE }))
await s3.send(new PutObjectCommand({ Bucket: 'aaven-public', Key: `${base}.jpg`, Body: poster, ContentType: 'image/jpeg', CacheControl: CACHE }))
await Pages.update(page.id, { theme: { ...page.theme, bgVideo: `${PUBLIC_BASE}/${base}.mp4` } })
console.log('✅ thème mis à jour →', `${PUBLIC_BASE}/${base}.mp4`)
fs.rmSync(dir, { recursive: true, force: true })
process.exit(0)
