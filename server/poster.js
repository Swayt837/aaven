// Poster (première frame) d'une vidéo uploadée → affichage instantané du fond
// pendant que la vidéo charge (même mécanique que les templates).
// Gracieux : renvoie null si ffmpeg indisponible ou vidéo illisible.
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

// → Buffer JPEG (frame à ~0.5s) ou null.
export async function generatePoster(videoBuffer) {
  const bin = await getFfmpeg()
  if (!bin) return null
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'poster-'))
  const inPath = path.join(dir, 'in.video')
  const outPath = path.join(dir, 'poster.jpg')
  try {
    fs.writeFileSync(inPath, videoBuffer)
    await run(bin, ['-y', '-ss', '0.5', '-i', inPath, '-frames:v', '1', '-vf', 'scale=720:-2', '-q:v', '3', outPath], {
      timeout: 30000,
      maxBuffer: 1024 * 1024,
    })
    return fs.readFileSync(outPath)
  } catch {
    return null
  } finally {
    try { fs.rmSync(dir, { recursive: true, force: true }) } catch { /* ignore */ }
  }
}
