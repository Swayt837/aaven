// Remux des 9 vidéos de templates en « faststart » (atome moov déplacé au début)
// pour permettre la lecture progressive / autoplay dans <video> (landing + éditeur).
// Copie des flux : AUCUN ré-encodage, AUCUNE perte de qualité.
//
//   R2_ACCOUNT_ID=... R2_ACCESS_KEY_ID=... R2_SECRET_ACCESS_KEY=... R2_PUBLIC_BUCKET=aaven-public \
//   node scripts/faststart-templates-r2.mjs
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { execFile } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'
import os from 'os'
import path from 'path'
import ffmpegPath from 'ffmpeg-static'

const run = promisify(execFile)

const KEYS = [
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

const bucket = process.env.R2_PUBLIC_BUCKET || 'aaven-public'
const account = process.env.R2_ACCOUNT_ID
const accessKeyId = process.env.R2_ACCESS_KEY_ID
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
if (!account || !accessKeyId || !secretAccessKey) {
  console.error('❌ Variables R2 manquantes.'); process.exit(1)
}

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${account}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId, secretAccessKey },
})

const streamToBuffer = async (stream) => {
  const chunks = []
  for await (const c of stream) chunks.push(c)
  return Buffer.concat(chunks)
}

let ok = 0
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'faststart-'))
for (const key of KEYS) {
  try {
    const obj = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }))
    const inBuf = await streamToBuffer(obj.Body)
    const inPath = path.join(dir, 'in.mp4')
    const outPath = path.join(dir, 'out.mp4')
    fs.writeFileSync(inPath, inBuf)
    await run(ffmpegPath, ['-y', '-i', inPath, '-c', 'copy', '-movflags', '+faststart', outPath])
    const outBuf = fs.readFileSync(outPath)
    await s3.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: outBuf, ContentType: 'video/mp4' }))
    console.log('✅', key, `(${(outBuf.length / 1e6).toFixed(1)} Mo)`)
    ok++
  } catch (e) {
    console.error('❌', key, '→', e.message)
  }
}
fs.rmSync(dir, { recursive: true, force: true })
console.log(`\nTerminé : ${ok}/${KEYS.length} vidéos remuxées faststart sur R2 (${bucket}).`)
