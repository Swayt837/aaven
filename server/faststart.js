// Remux "faststart" des vidéos MP4 uploadées : déplace l'atome `moov` au début
// pour permettre la lecture progressive / autoplay dans <video> (sinon fond gris).
//
// Stream copy (`-c copy`) : AUCUN ré-encodage → CPU/RAM faibles (sans rapport avec
// l'encodage libx264 qui avait causé l'OOM). Gracieux : si ffmpeg est indisponible
// ou en cas d'erreur, on renvoie le buffer d'origine inchangé.
import { execFile } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'
import os from 'os'
import path from 'path'

const run = promisify(execFile)

let ffmpegPath = null
let loaded = false
async function getFfmpeg() {
  if (loaded) return ffmpegPath
  loaded = true
  try { ffmpegPath = (await import('ffmpeg-static')).default } catch { ffmpegPath = null }
  return ffmpegPath
}

// Ne traite que le MP4 (le seul concerné par le problème moov-à-la-fin).
export async function faststartIfVideo(buffer, mimetype) {
  if (mimetype !== 'video/mp4') return buffer
  const bin = await getFfmpeg()
  if (!bin) return buffer
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fs-upload-'))
  const inPath = path.join(dir, 'in.mp4')
  const outPath = path.join(dir, 'out.mp4')
  try {
    fs.writeFileSync(inPath, buffer)
    await run(bin, ['-y', '-i', inPath, '-c', 'copy', '-movflags', '+faststart', outPath], {
      timeout: 60000,
      maxBuffer: 1024 * 1024,
    })
    const out = fs.readFileSync(outPath)
    return out.length ? out : buffer
  } catch {
    return buffer // remux impossible → on garde l'original (jamais bloquant)
  } finally {
    try { fs.rmSync(dir, { recursive: true, force: true }) } catch { /* ignore */ }
  }
}
