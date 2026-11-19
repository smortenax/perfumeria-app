"""
A web page as plain text, for the reading of batch 61: it downloads the page once into cache/ (not in
Git) and prints its visible text, so a reader copies phrases from what the page says and not from a
summary. consolidar.py later checks that each quoted phrase is in the cached text.

    python3 -I migracion-v3/web/info-61/pagina.py <url> [palabra…]   → the text (or only the lines with those words)
"""
import hashlib
import html
import os
import re
import sys
import urllib.error
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
CACHE = os.path.join(HERE, "cache")


def cached(url: str) -> str:
    return os.path.join(CACHE, hashlib.sha256(url.encode()).hexdigest()[:24] + ".html")


def fetch(url: str) -> str:
    os.makedirs(CACHE, exist_ok=True)
    file = cached(url)
    if os.path.exists(file):
        with open(file, encoding="utf-8") as f:
            return f.read()
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/124 Safari/537.36", "Accept-Language": "en,es;q=0.8"})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            body = r.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as e:
        body = f"<!-- HTTP {e.code} -->"
    with open(file, "w", encoding="utf-8") as f:
        f.write(f"<!-- {url} -->\n" + body)
    return body


def text_of(page: str) -> str:
    page = re.sub(r"(?is)<(script|style|noscript|svg)[^>]*>.*?</\1>", " ", page)
    page = re.sub(r"(?i)<br\s*/?>|</(p|div|li|tr|h[1-6]|dt|dd|td|th|section)>", "\n", page)
    text = html.unescape(re.sub(r"<[^>]+>", " ", page))
    lines = [re.sub(r"[ \t ]+", " ", l).strip() for l in text.split("\n")]
    return "\n".join(l for l in lines if l)


def normal(text: str) -> str:
    """What two copies of the same phrase share: spaces, quotes and dashes folded."""
    t = text.replace("’", "'").replace("‘", "'").replace("“", '"').replace("”", '"').replace("–", "-").replace("—", "-")
    return re.sub(r"\s+", " ", t).strip().lower()


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    body = text_of(fetch(sys.argv[1]))
    words = [w.lower() for w in sys.argv[2:]]
    for line in body.split("\n"):
        if not words or any(w in line.lower() for w in words):
            print(line)
