import { marked } from 'marked'

// Charge tous les articles Markdown de src/blog/*.md (frontmatter + corps).
// Pour publier un article : déposer un fichier .md avec un frontmatter title/description/date.
const files = import.meta.glob('../blog/*.md', { query: '?raw', import: 'default', eager: true })

function parse(raw) {
  const m = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/)
  const meta = {}
  let body = raw
  if (m) {
    body = m[2]
    for (const line of m[1].split('\n')) {
      const i = line.indexOf(':')
      if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim()
    }
  }
  return { meta, html: marked.parse(body) }
}

export const posts = Object.entries(files)
  .map(([path, raw]) => {
    const slug = path.split('/').pop().replace(/\.md$/, '')
    const { meta, html } = parse(raw)
    return { slug, title: meta.title || slug, description: meta.description || '', date: meta.date || '', html }
  })
  .sort((a, b) => (b.date || '').localeCompare(a.date || ''))

export const getPost = (slug) => posts.find((p) => p.slug === slug)
