# Bleach-like (codename REISHI)

A non-commercial **Bleach fan game**: a third-person action brawler in highly detailed voxel art, built with
**Three.js**, where the whole world is destructible and every character can do everything they do in the
manga/anime. Balance is not a goal — overpowered characters stay overpowered.

**Status:** planning complete; implementation starts with milestone M0. Read [`PLAN.md`](PLAN.md) for the full
plan (architecture, destruction engine, combat, roster of ~95 playable characters, maps, milestones).

Research behind the plan:
- [`docs/roster/`](docs/roster/) — 17 faction dossiers (~120 characters + Hollow bestiary): appearance & palettes,
  forms, complete ability lists, kit proposals, AI notes, story set pieces — summarised from the Bleach Wiki.
- [`docs/lore/mechanics.md`](docs/lore/mechanics.md) — Kidō catalogue (~80 spells), racial techniques, power rules.
- [`docs/lore/locations.md`](docs/lore/locations.md) — locations, map generator specs, materials, collapse recipes.
- [`docs/research/lookdev/`](docs/research/lookdev/) — rendering experiments (voxel scale, AO, post-processing).
- [`tools/wiki/wiki_fetch.py`](tools/wiki/wiki_fetch.py) — Bleach Wiki fetcher (MediaWiki API, rate-limit aware).

*Bleach* © Tite Kubo / Shueisha and the respective anime rights holders. No official assets are used; wiki
material is paraphrased with source links (Bleach Wiki content is CC BY-SA).
