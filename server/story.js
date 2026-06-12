// Génération de la "story vidéo" : superpose l'overlay (card rendue côté client en
// PNG transparent : en-tête + boutons + watermark) sur la vidéo de fond, via ffmpeg.
// Sortie mp4 9:16 qui joue une fois (pas de boucle). Cache disque par hash.
import { spawn } from 'child_process'
import fs from 'fs'
import os from 'os'
import path from 'path'
import crypto from 'crypto'
import ffmpegPath from 'ffmpeg-static'

const TMP = os.tmpdir()

function runFfmpeg(args) {
  return new Promise((resolve, reject) => {
    const p = spawn(ffmpegPath, args)
    let err = ''
    p.stderr.on('data', (d) => { err += d.toString() })
    p.on('error', reject)
    p.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg ${code}: ${err.slice(-400)}`))))
  })
}

export async function buildStoryVideo(videoUrl, overlayBuffer) {
  const key = crypto.createHash('sha256').update(videoUrl).update(overlayBuffer).digest('hex').slice(0, 24)
  const outPath = path.join(TMP, `aaven-story-${key}.mp4`)
  if (fs.existsSync(outPath)) return fs.readFileSync(outPath) // cache

  const vidPath = path.join(TMP, `aaven-src-${key}.mp4`)
  const ovlPath = path.join(TMP, `aaven-ovl-${key}.png`)

  const res = await fetch(videoUrl)
  if (!res.ok) throw new Error(`video fetch ${res.status}`)
  fs.writeFileSync(vidPath, Buffer.from(await res.arrayBuffer()))
  fs.writeFileSync(ovlPath, overlayBuffer)

  // Vidéo recadrée plein cadre 1080x1920, puis overlay (même taille) par-dessus.
  const filter =
    '[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1[bg];' +
    '[1:v]scale=1080:1920[ovr];[bg][ovr]overlay=0:0[v]'

  try {
    await runFfmpeg([
      '-y',
      '-i', vidPath,
      '-loop', '1', '-i', ovlPath,
      '-filter_complex', filter,
      '-map', '[v]', '-map', '0:a?',
      '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'veryfast',
      '-c:a', 'aac', '-b:a', '128k',
      '-shortest', '-movflags', '+faststart',
      outPath,
    ])
  } finally {
    try { fs.unlinkSync(vidPath) } catch { /* noop */ }
    try { fs.unlinkSync(ovlPath) } catch { /* noop */ }
  }
  return fs.readFileSync(outPath)
}
