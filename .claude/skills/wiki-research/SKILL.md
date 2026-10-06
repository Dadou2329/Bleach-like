---
name: wiki-research
description: Use when researching Bleach characters, techniques, forms, Zanpakutō, battles or locations for REISHI, or when creating or updating dossiers in docs/roster/ or lore files in docs/lore/ (e.g. after new TYBW anime episodes). Explains tools/wiki/wiki_fetch.py (MediaWiki API - the fandom HTML pages are bot-blocked; --search, --all-sections, --delay; 429 back-off and query/revisions fallback), where raw output goes (scratchpad, never the repo), the dossier template, the paraphrase and source rules, canon flags, and how to estimate and verify colours with (verify) markers.
---

# Wiki research (Bleach Wiki → dossiers)

**Purpose.** Keep `docs/roster/*.md` and `docs/lore/*.md` accurate, complete and legally clean. The research is the
canon source for models (`voxel-art` skill) and kits (`bleach-kit-design` skill), so precision matters more than speed.
Source: bleach.fandom.com (CC BY-SA). We **paraphrase** with source links; we never copy text or ship images.

## 1. Fetching with `tools/wiki/wiki_fetch.py`
The wiki's HTML pages are bot-blocked (HTTP 403/402) - do not use a browser fetch or WebFetch on them. `api.php`
works, and the script wraps it (stdlib only; run with `python3 -I`).

```bash
SCRATCH=<session scratchpad>/wiki          # raw output goes here, never into the repo
python3 -I tools/wiki/wiki_fetch.py --search "Ulquiorra"                       # exact titles (opensearch, 15 hits)
python3 -I tools/wiki/wiki_fetch.py --out "$SCRATCH" "Byakuya Kuchiki" "Renji Abarai"   # character pages
python3 -I tools/wiki/wiki_fetch.py --out "$SCRATCH" --all-sections "Getsuga Tenshō"    # whole technique page
python3 -I tools/wiki/wiki_fetch.py --out "$SCRATCH" --delay 4 "Senbonzakura" "Gōkei" # slower when parallel
```

What it does:
- `action=parse` (wikitext) first; if that errors or is throttled, falls back to the lighter `query/revisions`.
- Retries up to 6 times with exponential back-off (2 s doubling to 60 s), honouring `Retry-After` on **HTTP 429**.
  Fandom rate-limits bursts, especially when several fetchers share one User-Agent - raise `--delay` (default 1 s
  between pages) to 3-5 s when running fetchers in parallel, and keep batches small.
- Writes one Markdown file per page (`<slug>.md`): `# Title`, `Source: <url>`, `## Infobox` (name, kanji, race, height,
  weight, affiliation, division, Shikai, Bankai, Resurrección, Schrift, Fullbring…), `## Lead` (≤ 3,000 chars) and the
  kept sections.
- **Default (character pages):** keeps sections about appearance, equipment, powers & abilities, weaknesses,
  Zanpakutō, Resurrección, Schrift, Fullbring, Vollständig, techniques, Bankai, Shikai, Kidō, forms, transformations,
  arsenal, statistics; skips plot, history, synopsis, personality, trivia, quotes, gallery, references.
  **`--all-sections`** keeps everything - use it for technique, Zanpakutō-spirit, battle, episode and location pages.
- Unknown titles print `MISSING … Search hits: […]` - rerun with the exact title (macrons matter: `Gōkei`, `Hōgyoku`).

Pages worth fetching beyond the main character page: `<Name>/Anime_Continuity`, `<Name>/Other_Media`,
`<Name>/Image_Gallery` (captions), technique pages (`Getsuga_Tenshō`, `Cero`, `Gran_Rey_Cero`, Kidō by name), Zanpakutō
spirit pages, battle pages (`"Ichigo Kurosaki vs. Byakuya Kuchiki"`), TYBW episode pages (their **Anime Notes** list
anime-only changes), location pages and templates (`Template:KarakuraTown`, `Template:Seireitei`), group pages
(`Gotei 13`, `Hollow`, `List of Hollows`, `Sternritter`, `Quincy: Vollständig`).

If the network fails in a sandbox, read the environment's proxy/network notes before retrying; never disable TLS
verification.

## 2. Where things go
- **Raw dumps:** the session scratchpad only. The script's default `--out wiki_out` is gitignored, but do not create it
  in the repo tree - raw wiki text (CC BY-SA) must never be committed.
- **Dossiers:** `docs/roster/<group>.md` (characters, Hollow bestiary), `docs/lore/mechanics.md` (Kidō, racial layers,
  power rules), `docs/lore/locations.md` (maps). Kit specs derived from them live in `docs/kits/<id>.md`.
- Images fetched for colour checks: scratchpad only, each download in its own new directory; never commit or ship them.

## 3. Dossier format (copy the existing files)
**File header:** `# Roster <ID> - <group>`, a one-paragraph scope, a **Conventions** block, then `---`.
Conventions to state: heights in cm and voxels (project standard **48 vox/m**; the existing files use 32/m - when editing
an old file keep its convention and add the 48/m value in parentheses); hex colours are estimates unless marked ✔
(the wiki states the colour in words) and `(verify)` items must be checked against reference art; engine tags in
`[brackets]` from the primitive vocabulary, with needs outside it tagged `[NEW: …]` and collected at the end; canon flags
(§4); sources fetched via the MediaWiki API and paraphrased. When a request contains uncertain names ("Hakushō?"),
answer them up front in an **"Answers to the prompt's question marks"** list - never invent a technique to fit a name.

**Sections:** `## 0. Quick reference` (one table: rank/role, height → voxels, forms/releases with commands, reiatsu
colour, tier) → `## 1. Shared baseline` (race/rank layer that applies to everyone in the file) → one `##` section per
character → `## Engine needs beyond the brief's primitive list` (table: tag, what it needs, used by) → `## Gaps,
uncertainties, things not found` → sources.

**Per-character fields, in this order** (bold labels, as in the existing files):
1. `**Wiki:**` - page URLs (+ subpages, technique and battle pages used)
2. `**Roster tier:**` - S/A/B/C with a one-line reason and wave suggestion
3. `**Canon power:**` - 1-10 with the feats that justify it
4. `**Body:**` - height cm → voxels, weight, build, proportions, **silhouette keys**
5. `**Palette (hex estimates):**` - grouped: core (skin, hair, eyes), garments per era, weapon, energies; ramps where known
6. `**Look by form/outfit:**` - numbered, per era/form, the details a model MUST have; asymmetries with the character's side
7. `**Weapons:**` - sizes (m and voxels), guard/grip/sheath, per form
8. `**Forms & states (ordered):**` - release commands (romaji + kanji + meaning)
9. `**Abilities (complete):**` - grouped by form/source; each with a one-line paraphrase and `[Primitive]` tags
10. `**TYBW anime additions:**` (when relevant) - anime-only material, tagged
11. `**Passives & weaknesses:**`
12. `**Signature moments to recreate:**` - canon set pieces (become story stages)
13. `**Kit proposal:**` - per form: Shift, LMB, Heavy, Q E R F Z X, G, C, V, Tab (control scheme in PLAN §2.3)
14. `**AI notes:**` - personality, release thresholds, tells, taunt hooks
15. `**Callouts:**` - romaji + kanji

**Hollow archetypes** (bestiary) use: `Canon basis`, `Size/HP`, `Silhouette & mask`, `Palette`, `Attacks`, `Spawn`,
`AI`, `World`, `Weak point/death`, `Variants`. **Locations** follow `locations.md`'s template: Canon · Story stages ·
Must-haves · Scale · Palette · Materials · Light/sky/weather · Generator · Spawns · Destruction & collapse · Performance ·
Gameplay hooks · Sources.

## 4. Canon flags
Use one style consistently within a file (existing files use either the long or the short form):

| Flag | Meaning |
|---|---|
| `[manga]` / `[M]` | manga canon (unflagged text = manga canon) |
| `[anime-only]` / `[A-ep N]` | original anime fillers (2004-12) or TYBW anime additions (2022-26) - give the episode |
| `[novel]` / `[N]` | light novels (e.g. *Can't Fear Your Own World*) |
| `[KO]` | Kubo's Q&A / *Klub Outside* |
| `[1S]` | the 2021 one-shot *NO BREATHES FROM HELL* (canon) |
| `[movie-only]` / `[Mv]` | films (non-canon) |
| `[game-only]` / `[BS]` `[RoS]` `[SR]` | names or moves invented by games - optional filler only |
| `[X]` | our own extrapolation for the game - never canon, always flagged |

## 5. Paraphrase and sourcing rules
- Write in your own words: summarise what happens and what it does in game terms. **No copied sentences or
  paragraphs.** Quote only names, release commands and short terms ("Chire", "Bankai").
- Incantations: describe their effect and length (the game shows a verse meter), do not reproduce them.
- Keep the source URL on every character/location section and list all pages used; note the fetch date when material
  is time-sensitive (anime airing).
- Separate facts from design: canon facts plain; estimates `est.`; design choices `design`/`[X]`; doubts `(verify)`.
- Do not invent canon. When the wiki is silent, say so in "Gaps" and propose a clearly flagged default.
- Cross-check numbers (heights, sizes) against the infobox and at least one other page; manga vs anime differences are
  recorded side by side.

## 6. Colours - estimating and verifying
1. **Prefer words over pixels:** if the wiki states a colour ("his reiatsu is light blue", "a magenta Cero"), use a
   representative hex and mark it ✔ / "canon".
2. Otherwise **estimate from official art**: list a page's images with
   `api.php?action=query&titles=<Page>&prop=images&format=json&formatversion=2`; the infobox `image` field is a
   `<gallery>` of era portraits with captions (e.g. `686Byakuya profile.png|2013`). Resolve file URLs with
   `api.php?action=query&titles=File:<name>&prop=imageinfo&iiprop=url|size|mime&format=json&formatversion=2`
   (served from `static.wikia.nocookie.net`). Download to the scratchpad, look at it with the image reader, and sample
   with a small script (PIL if available): take the **median of a hand-picked midtone region** (no highlights,
   shadows or line art); sample ≥ 2 images (an anime frame and a colour page) and normalise for scene lighting.
3. Record ramps (highlight/base/shade/deep) when the art shows them, and both variants when manga, classic anime and
   TYBW anime differ (petals white vs pink, Getsuga gold vs blue).
4. Mark everything not confirmed as `(verify)`; note the source of each estimate ("TYBW sheet", "ch.581 colour page").
5. Voxel-readability tweaks (e.g. lightening a near-black iris) are noted next to the canon value, never silently
   replacing it.

## 7. Updating when canon adds material (e.g. a new TYBW cour)
1. Fetch the new episode pages with `--all-sections` and read their **Anime Notes**.
2. Add the material to the character's `TYBW anime additions` (tagged `[anime-only]`/`[A-ep N]`), update forms,
   abilities, looks and palettes; adjust `Canon power` only with feats.
3. Update `## 0. Quick reference`, the file's `Engine needs` and `Gaps` sections, and any affected location in
   `docs/lore/locations.md`.
4. Add new rows to the character's kit completeness table (`docs/kits/<id>.md`) so nothing is dropped, and flag model
   changes for the `voxel-art` workflow.

## 8. Checklist
- [ ] Raw dumps in the scratchpad only; nothing from the wiki committed verbatim; no images in the repo.
- [ ] Every section has source URLs; flags on every non-manga item; `(verify)` on unconfirmed colours/sizes.
- [ ] Heights in cm + voxels (state the density); silhouette keys and asymmetries (character's side) captured.
- [ ] Abilities list complete (cross-check technique pages and battle pages), each with primitive tags.
- [ ] Gaps listed honestly; no invented names or techniques.
