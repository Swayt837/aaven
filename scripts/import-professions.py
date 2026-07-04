# Profession Engine — convertit aaven_profession_engine.xlsx (onglet "Professions")
# en module JS versionné : src/lib/professions.js
#
# Usage (Windows, python anaconda avec openpyxl) :
#   python scripts/import-professions.py
#
# Règle d'or : AUCUN contenu métier codé en dur ailleurs. Ajouter une niche =
# ajouter une ligne dans l'Excel puis relancer ce script.
import openpyxl, json, io, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'aaven_profession_engine.xlsx')
OUT = os.path.join(ROOT, 'src', 'lib', 'professions.js')

PIPE_FIELDS = {'template_blocks', 'meta_targeting_interests', 'email_sequence'}

wb = openpyxl.load_workbook(SRC)
ws = wb['Professions']
rows = list(ws.iter_rows(values_only=True))
headers = [str(h).strip() for h in rows[0]]

profs = []
for r in rows[1:]:
    if not r or not r[0]:
        continue
    d = {}
    for k, v in zip(headers, r):
        v = ('' if v is None else str(v).strip())
        d[k] = [s.strip() for s in v.split('|') if s.strip()] if k in PIPE_FIELDS else v
    profs.append(d)

banner = (
    "// GÉNÉRÉ par scripts/import-professions.py depuis aaven_profession_engine.xlsx — NE PAS ÉDITER À LA MAIN.\n"
    "// Ajouter une profession = ajouter une ligne dans l'Excel puis relancer le script.\n"
)
body = json.dumps(profs, ensure_ascii=False, indent=2)
js = (
    banner
    + "export const PROFESSIONS = " + body + "\n\n"
    + "export const PROFESSION_SLUGS = PROFESSIONS.map((p) => p.slug)\n"
    + "export const professionBySlug = (slug) => PROFESSIONS.find((p) => p.slug === slug) || null\n"
    + "// Groupées par catégorie (ordre d'apparition dans l'Excel), pour le picker d'onboarding.\n"
    + "export const PROFESSIONS_BY_CATEGORY = PROFESSIONS.reduce((acc, p) => {\n"
    + "  (acc[p.category] = acc[p.category] || []).push(p)\n"
    + "  return acc\n"
    + "}, {})\n"
)
with io.open(OUT, 'w', encoding='utf-8', newline='\n') as f:
    f.write(js)
print('OK ->', OUT, '(', len(profs), 'professions )')
