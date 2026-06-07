const EMOJIS = ['❤️', '🎉', '✨', '🍸', '☕', '💛', '🙌', '🌟']
// Confettis déterministes (pas de Math.random → rendu stable).
const PIECES = Array.from({ length: 22 }, (_, i) => ({
  emoji: EMOJIS[i % EMOJIS.length],
  left: (i * 41) % 100,
  delay: (i % 11) * 0.12,
  dur: 2.6 + (i % 5) * 0.4,
  size: 16 + (i % 4) * 7,
}))

export function Confetti() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      {PIECES.map((c, i) => (
        <span
          key={i}
          className="bb-confetti"
          style={{ left: `${c.left}%`, fontSize: c.size, animationDelay: `${c.delay}s`, animationDuration: `${c.dur}s` }}
        >
          {c.emoji}
        </span>
      ))}
    </div>
  )
}
