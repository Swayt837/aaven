// Génération de la "story vidéo" : superpose l'overlay (PNG transparent rendu client)
// sur la vidéo de fond, via ffmpeg. Sortie mp4 9:16 (720×1280) qui joue une fois.
// Optimisé mémoire (streaming + ultrafast + 1 thread + verrou) pour tenir sur 512 Mo.
import { spawn } from 'child_process'
import fs from 'fs'
import os from 'os'
import path from 'path'
import crypto from 'crypto'
import { pipeline } from 'stream/promises'
import { Readable } from 'stream'
import ffmpegPath from 'ffmpeg-static'

const TMP = os.tmpdir()
let busy = false // une seule compo ffmpeg à la fois (protège la RAM de l'instance)

function runFfmpeg(args) {
  return new Promise((resolve, reject) => {
    const p = spawn(ffmpegPath, args)
    let err = ''
    p.stderr.on('data', (d) => { err += d.toString().slice(-500) })
    p.on('error', reject)
    p.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg ${code}: ${err.slice(-300)}`))))
  })
}

// Renvoie le chemin du mp4 (à streamer côté route). Lance "busy" pendant l'encodage.
export async function buildStoryVideo(videoUrl, overlayBuffer) {
  const key = crypto.createHash('sha256').update(videoUrl).update(overlayBuffer).digest('hex').slice(0, 24)
  const outPath = path.join(TMP, `aaven-story-${key}.mp4`)
  if (fs.existsSync(outPath)) return outPath // cache

  if (busy) {
    const e = new Error('busy')
    e.code = 'BUSY'
    throw e
  }
  busy = true

  const vidPath = path.join(TMP, `aaven-src-${key}.mp4`)
  const ovlPath = path.join(TMP, `aaven-ovl-${key}.png`)
  try {
    // Téléchargement en flux (pas de gros Buffer en mémoire)
    const res = await fetch(videoUrl)
    if (!res.ok || !res.body) throw new Error(`video fetch ${res.status}`)
    await pipeline(Readable.fromWeb(res.body), fs.createWriteStream(vidPath))
    fs.writeFileSync(ovlPath, overlayBuffer)

    const filter =
      '[0:v]scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,setsar=1[bg];' +
      '[1:v]scale=720:1280[ovr];[bg][ovr]overlay=0:0[v]'

    await runFfmpeg([
      '-y',
      '-i', vidPath,
      '-loop', '1', '-i', ovlPath,
      '-filter_complex', filter,
      '-map', '[v]', '-map', '0:a?',
      '-threads', '1',
      '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'ultrafast', '-crf', '26',
      '-c:a', 'aac', '-b:a', '128k',
      '-shortest', '-movflags', '+faststart',
      outPath,
    ])
    return outPath
  } finally {
    busy = false
    try { fs.unlinkSync(vidPath) } catch { /* noop */ }
    try { fs.unlinkSync(ovlPath) } catch { /* noop */ }
  }
}
