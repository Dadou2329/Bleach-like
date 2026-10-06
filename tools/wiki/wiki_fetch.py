#!/usr/bin/env python3
"""Fetch Bleach wiki (bleach.fandom.com) pages through the MediaWiki API and
write cleaned plain-text dossiers.

The HTML pages are blocked for bots (403/402) but api.php works.

Usage:
  python3 -I wiki_fetch.py --out DIR "Ichigo Kurosaki" "Rukia Kuchiki" ...
  python3 -I wiki_fetch.py --out DIR --all-sections "Getsuga Tenshō"   # whole page (technique/zanpakutō pages)
  python3 -I wiki_fetch.py --search "Ulquiorra"                          # find exact titles

Default output per character: infobox basics + Appearance + Equipment +
Powers & Abilities (+ Former Powers & Abilities, Weaknesses, any section
whose title mentions Zanpakutō/Resurrección/Schrift/Fullbring/Vollständig).
Plot/History/Trivia are skipped to keep files small.
"""
import argparse
import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

API = "https://bleach.fandom.com/api.php"
UA = "BleachLikeResearchBot/1.0 (fan game research; contact via github Dadou2329/Bleach-like)"

WANTED_TOP = re.compile(
    r"appearance|equipment|powers|abilities|weakness|zanpak|resurrecc|schrift|fullbring|vollst|techniques|"
    r"bankai|shikai|kid[oō]|forms|transformations|arsenal|statistics",
    re.I,
)

INFOBOX_KEYS = [
    "name", "kanji", "romaji", "race", "gender", "height", "weight", "affiliation",
    "previous affiliation", "occupation", "previous occupation", "team", "previous team",
    "partner", "previous partner", "division", "shikai", "bankai", "resurrección",
    "resurreccion", "schrift", "fullbring", "base of operations",
]


def api_get(params, retries=6):
    """GET api.php with backoff. Fandom rate-limits bursts (HTTP 429), especially when several
    fetchers share one User-Agent, so honour Retry-After and back off exponentially (max 60 s)."""
    params = dict(params)
    params.setdefault("format", "json")
    params.setdefault("formatversion", "2")
    url = API + "?" + urllib.parse.urlencode(params)
    delay = 2.0
    for attempt in range(retries + 1):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=60) as r:
                return json.loads(r.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            if attempt == retries:
                raise
            wait = delay
            if e.code == 429:
                retry_after = e.headers.get("Retry-After")
                if retry_after and retry_after.isdigit():
                    wait = max(wait, float(retry_after))
            print(f"  retry {attempt + 1} after HTTP {e.code}; sleeping {wait:.0f}s", file=sys.stderr)
            time.sleep(wait)
            delay = min(delay * 2, 60)
        except Exception as e:  # network hiccup: back off
            if attempt == retries:
                raise
            print(f"  retry {attempt + 1} after error: {e}", file=sys.stderr)
            time.sleep(delay)
            delay = min(delay * 2, 60)


def fetch_wikitext(title):
    """Return (resolved_title, wikitext) or (None, error). Tries action=parse first, then the
    lighter query/revisions endpoint, which keeps working when parse is throttled."""
    try:
        d = api_get({"action": "parse", "page": title, "prop": "wikitext", "redirects": "1"})
        if "error" not in d:
            return d["parse"]["title"], d["parse"]["wikitext"]
        err = d["error"].get("info", "error")
    except Exception as e:  # throttled or failed: fall back below
        err = str(e)
    d = api_get({"action": "query", "prop": "revisions", "rvprop": "content", "rvslots": "main",
                 "titles": title, "redirects": "1"})
    pages = d.get("query", {}).get("pages", [])
    if pages and "revisions" in pages[0]:
        return pages[0]["title"], pages[0]["revisions"][0]["slots"]["main"]["content"]
    return None, err


def search(q):
    d = api_get({"action": "opensearch", "search": q, "limit": "15"})
    # formatversion 2 opensearch returns [query, titles, descs, urls]
    return d[1] if isinstance(d, list) and len(d) > 1 else []


# ----------------------------------------------------------------------------
# Wikitext cleaning
# ----------------------------------------------------------------------------

TEXT_TEMPLATES = {"translation", "nihongo", "nihongo2", "nihongo3", "j", "jap", "ruby"}
KEEP_LAST_TEMPLATES = {"color", "colour", "font", "nowrap", "small", "big", "highlight", "sic"}


def split_params(inner):
    """Split template inner text on top-level pipes."""
    parts, depth_b, depth_l, cur = [], 0, 0, []
    i = 0
    while i < len(inner):
        two = inner[i:i + 2]
        if two == "{{":
            depth_b += 1; cur.append(two); i += 2; continue
        if two == "}}":
            depth_b -= 1; cur.append(two); i += 2; continue
        if two == "[[":
            depth_l += 1; cur.append(two); i += 2; continue
        if two == "]]":
            depth_l -= 1; cur.append(two); i += 2; continue
        ch = inner[i]
        if ch == "|" and depth_b == 0 and depth_l == 0:
            parts.append("".join(cur)); cur = []
        else:
            cur.append(ch)
        i += 1
    parts.append("".join(cur))
    return parts


def render_template(inner):
    parts = split_params(inner)
    name = parts[0].strip().lower()
    pos = [p.strip() for p in parts[1:] if not re.match(r"^\s*[\w ]+\s*=", p)]
    named = {}
    for p in parts[1:]:
        m = re.match(r"^\s*([\w ]+?)\s*=(.*)$", p, re.S)
        if m:
            named[m.group(1).strip().lower()] = m.group(2).strip()
    if name in TEXT_TEMPLATES:
        main = pos[0] if pos else ""
        extra = [x for x in pos[1:3] if x]
        s = main
        if extra:
            s += " (" + ", ".join(extra) + ")"
        if named.get("viz"):
            s += f" [Viz: {named['viz']}]"
        return s
    if name in KEEP_LAST_TEMPLATES:
        return pos[-1] if pos else ""
    if name in {"quote", "quotes", "cquote"}:
        return ""
    return ""  # refs, qref, clear, navboxes, galleries ...


def strip_templates(text):
    pat = re.compile(r"\{\{((?:(?!\{\{|\}\}).)*)\}\}", re.S)
    for _ in range(50):
        new = pat.sub(lambda m: render_template(m.group(1)), text)
        if new == text:
            break
        text = new
    return text


def strip_links(text):
    pat = re.compile(r"\[\[((?:(?!\[\[|\]\]).)*)\]\]", re.S)

    def repl(m):
        inner = m.group(1)
        head = inner.split("|", 1)[0].strip().lower()
        if head.startswith(("image:", "file:", "category:", "media:")):
            return ""
        if head.startswith("wikipedia:"):
            return inner.split("|")[-1]
        return inner.split("|")[-1]

    for _ in range(20):
        new = pat.sub(repl, text)
        if new == text:
            break
        text = new
    return text


def detable(text):
    """Flatten wiki tables into plain lines (collapsible 'Former Powers' boxes hold real content)."""
    out = []
    for line in text.splitlines():
        s = line.strip()
        if s.startswith(("{|", "|}", "|-", "|+")):
            continue
        if s.startswith(("!", "|")):
            s = s[1:]
            cells = re.split(r"\|\||!!", s)
            kept = []
            for c in cells:
                parts = split_params(c)
                if len(parts) > 1 and ("=" in parts[0] or not parts[0].strip()):
                    c = "|".join(parts[1:])
                kept.append(c.strip())
            out.append(" | ".join(k for k in kept if k))
        else:
            out.append(line)
    return "\n".join(out)


def clean(text):
    text = re.sub(r"<!--.*?-->", "", text, flags=re.S)
    text = re.sub(r"<ref[^>]*/>", "", text)
    text = re.sub(r"<ref[^>]*>.*?</ref>", "", text, flags=re.S)
    text = re.sub(r"<gallery[^>]*>.*?</gallery>", "", text, flags=re.S | re.I)
    text = detable(text)
    text = strip_templates(text)
    text = strip_links(text)
    text = re.sub(r"\[https?://\S+\s+([^\]]+)\]", r"\1", text)
    text = re.sub(r"\[https?://\S+\]", "", text)
    text = text.replace("'''", "").replace("''", "")
    text = re.sub(r"<br\s*/?>", "\n", text, flags=re.I)
    text = re.sub(r"</?[a-zA-Z][^>]*>", "", text)
    text = text.replace("&amp;", "&").replace("&nbsp;", " ")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n\s*\n\s*\n+", "\n\n", text)
    return text.strip()


# ----------------------------------------------------------------------------


def split_sections(wikitext):
    """Return list of (level, title, body) with level 0 for the lead."""
    heads = list(re.finditer(r"^(={2,6})\s*(.+?)\s*\1\s*$", wikitext, re.M))
    out = [(0, "LEAD", wikitext[: heads[0].start()] if heads else wikitext)]
    for i, h in enumerate(heads):
        end = heads[i + 1].start() if i + 1 < len(heads) else len(wikitext)
        out.append((len(h.group(1)), h.group(2).strip(), wikitext[h.end():end]))
    return out


def infobox(lead):
    rows = []
    for line in lead.splitlines():
        m = re.match(r"^\|\s*([^=]+?)\s*=\s*(.*)$", line)
        if not m:
            continue
        k = m.group(1).strip().lower()
        if k in INFOBOX_KEYS and m.group(2).strip():
            v = clean(m.group(2)).replace("\n", " / ")
            # the page-tab template also has a bare numeric |height= (tab bar height), skip it
            if k == "height" and "cm" not in v:
                continue
            if v:
                rows.append(f"- {k}: {v}")
    return "\n".join(rows)


def fetch(title, all_sections=False):
    real, wt = fetch_wikitext(title)
    if real is None:
        return None, wt
    secs = split_sections(wt)
    lines = [f"# {real}", f"Source: https://bleach.fandom.com/wiki/{urllib.parse.quote(real.replace(' ', '_'))}", ""]
    ib = infobox(secs[0][2])
    if ib:
        lines += ["## Infobox", ib, ""]
    lead_text = clean(re.sub(r"^\|.*$", "", secs[0][2], flags=re.M))
    if lead_text:
        lines += ["## Lead", lead_text[:3000], ""]
    keep_level = None
    for level, t, body in secs[1:]:
        tt = clean(t)
        if keep_level is not None and level > keep_level:
            pass  # subsection of a kept section
        else:
            keep_level = None
            if all_sections or (level == 2 and WANTED_TOP.search(tt)):
                if not re.search(r"trivia|quotes|references|navigation|gallery|plot|history|synopsis|personality", tt, re.I) or all_sections:
                    keep_level = level
        if keep_level is not None:
            lines += ["#" * min(level, 6) + " " + tt, clean(body), ""]
    return real, "\n".join(lines)


def slug(s):
    s = re.sub(r"[^\w\-]+", "_", s, flags=re.U).strip("_")
    return s[:80]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("titles", nargs="*")
    ap.add_argument("--out", default="wiki_out")
    ap.add_argument("--all-sections", action="store_true")
    ap.add_argument("--search")
    ap.add_argument("--delay", type=float, default=1.0,
                    help="seconds between pages (raise it when several fetchers run in parallel)")
    a = ap.parse_args()
    if a.search:
        for t in search(a.search):
            print(t)
        return
    os.makedirs(a.out, exist_ok=True)
    for t in a.titles:
        try:
            real, text = fetch(t, a.all_sections)
        except Exception as e:
            print(f"FAIL {t}: {e}")
            continue
        if real is None:
            hits = search(t)
            print(f"MISSING {t}: {text}. Search hits: {hits[:8]}")
            continue
        p = os.path.join(a.out, slug(real) + ".md")
        with open(p, "w", encoding="utf-8") as f:
            f.write(text)
        print(f"OK {real} -> {p} ({len(text)} chars)")
        time.sleep(a.delay)


if __name__ == "__main__":
    main()
