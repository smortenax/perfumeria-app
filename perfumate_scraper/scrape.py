"""Download PerfuMate's catalog and parse cached material pages into SQLite."""

import argparse
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
import json
from pathlib import Path
import re
import sqlite3
import sys
import time
from urllib.parse import urljoin, urlsplit

from bs4 import BeautifulSoup
import requests


BASE_URL = "https://perfumate.app"
CATALOG_URL = f"{BASE_URL}/catalog"
DEFAULT_DATA_DIR = Path(__file__).resolve().parent / "data"
JSON_FIELDS = ("tags", "synonyms", "families", "subcategories", "constituents")
NOTE_LABELS = {"top note": "top", "heart note": "heart", "base note": "base", "outside the note pyramid": "outside"}
SCHEMA = """
CREATE TABLE IF NOT EXISTS materials (
    slug TEXT PRIMARY KEY,
    source_url TEXT NOT NULL,
    name TEXT NOT NULL,
    supplier TEXT,
    catalog_source TEXT,
    cas TEXT,
    origin TEXT,
    note TEXT,
    primary_odor_category TEXT,
    odor_description TEXT NOT NULL,
    impact INTEGER,
    substantivity_text TEXT,
    substantivity_hours REAL,
    working_dilution TEXT,
    tags_json TEXT NOT NULL,
    synonyms_json TEXT NOT NULL,
    families_json TEXT NOT NULL,
    subcategories_json TEXT NOT NULL,
    constituents_json TEXT NOT NULL,
    html_path TEXT NOT NULL,
    downloaded_at TEXT NOT NULL,
    parsed_at TEXT NOT NULL
);
"""


def text(element):
    return element.get_text(" ", strip=True) if element else None


def slug_from_url(url):
    parts = urlsplit(url)
    match = re.fullmatch(r"/material/([a-z0-9]+(?:-[a-z0-9]+)*)/?", parts.path)
    if parts.scheme != "https" or parts.netloc != "perfumate.app" or not match:
        raise ValueError(f"Not a material URL: {url}")
    return match.group(1)


def discover_materials(html):
    soup = BeautifulSoup(html, "html.parser")
    urls = []
    seen = set()
    for link in soup.select("section.fsec ul.mats a[href]"):
        url = urljoin(BASE_URL, link["href"])
        try:
            slug = slug_from_url(url)
        except ValueError:
            continue
        url = f"{BASE_URL}/material/{slug}"
        if url not in seen:
            seen.add(url)
            urls.append(url)
    if not soup.h1 or not urls:
        raise ValueError("Not a catalog page: missing heading or material links")
    return urls


def material_article(html):
    soup = BeautifulSoup(html, "html.parser")
    article = soup.select_one("article.rec")
    if not article or not text(article.select_one(".head h1")) or not text(article.select_one("p.odor")):
        raise ValueError("Not a material page: missing material heading or odor description")
    return article


def profile(entries, *, percentages_optional=False):
    result = []
    for entry in entries:
        label = text(entry)
        match = re.fullmatch(r"(.+?)\s+(\d+(?:\.\d+)?)%", label)
        if not match:
            if percentages_optional and label and "%" not in label:
                result.append({"name": label, "percentage": None})
                continue
            raise ValueError(f"Unrecognized profile entry: {label!r}")
        result.append({"name": match[1].strip(), "percentage": float(match[2])})
    return result


def parse_material(html, url):
    article = material_article(html)
    heading = article.select_one(".head h1")
    supplier = text(heading.select_one(".house"))
    for decoration in heading.select(".tm, .house"):
        decoration.decompose()
    source = text(article.select_one(".head .src"))
    identity = text(article.select_one(".cas")) or ""
    parts = [part.strip() for part in identity.split("·") if part.strip()]
    cas = re.search(r"\bCAS\s+(\d{2,7}-\d{2}-\d)\b", identity)
    origin = next((part.lower() for part in parts if part.lower() in ("natural", "synthetic")), None)
    note = next((NOTE_LABELS[part.lower()] for part in parts if part.lower() in NOTE_LABELS), None)
    category = parts[-1] if parts else None
    if category and (category.lower() in ("natural", "synthetic") or re.search(r"\bCAS\b", category, re.I) or category.lower() in NOTE_LABELS):
        category = None

    metrics = {}
    for metric in article.select(".chr-c"):
        label = text(metric.h3)
        value = metric.select_one(".v")
        if label and value:
            metrics[label] = text(value)
    impact = re.match(r"^(\d+)\b", metrics.get("Impact", ""))
    substantivity = metrics.get("Substantivity")
    duration = re.fullmatch(r"(\d+(?:\.\d+)?)\s+(hours?|days?)(?:\s+on a blotter)?", substantivity or "", re.I)
    hours = None
    if duration:
        hours = float(duration[1]) * (24 if duration[2].lower().startswith("day") else 1)

    dilution = None
    for metric in article.select(".chr-c"):
        if text(metric.h3) == "Working dilution":
            value = metric.select_one(".v")
            if value:
                for explanation in value.select("small"):
                    explanation.decompose()
                dilution = text(value)

    constituents = []
    for row in article.select("table.gc tbody tr"):
        name = text(row.select_one("td.n"))
        share = text(row.select_one("td.p"))
        if not name or not share or not re.fullmatch(r"\d+(?:\.\d+)?%", share):
            raise ValueError(f"Unrecognized constituent row: {text(row)!r}")
        constituent_cas = text(row.select_one("td.c"))
        constituents.append({
            "name": name,
            "cas": constituent_cas if constituent_cas and re.fullmatch(r"\d{2,7}-\d{2}-\d", constituent_cas) else None,
            "percentage": float(share[:-1]),
        })

    synonyms = text(article.select_one(".aka"))
    return {
        "slug": slug_from_url(url),
        "source_url": url,
        "name": text(heading),
        "supplier": supplier.strip(" ()") if supplier else None,
        "catalog_source": source.removeprefix("Catalog source:").strip() if source else None,
        "cas": cas[1] if cas else None,
        "origin": origin,
        "note": note,
        "primary_odor_category": category,
        "odor_description": text(article.select_one("p.odor")),
        "impact": int(impact[1]) if impact else None,
        "substantivity_text": substantivity,
        "substantivity_hours": hours,
        "working_dilution": dilution,
        "tags": [text(tag) for tag in article.select("p.odor + .pills > span")],
        "synonyms": [name.strip() for name in synonyms.split("·") if name.strip()] if synonyms else [],
        "families": profile(article.select(".rfam .fams .fam"), percentages_optional=True),
        "subcategories": profile(article.select(".rfam .mix > span")),
        "constituents": constituents,
    }


def atomic_write(path, content):
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + ".tmp")
    try:
        temporary.write_bytes(content)
        temporary.replace(path)
    finally:
        temporary.unlink(missing_ok=True)


def retry_delay(response, attempt):
    value = response.headers.get("Retry-After", "")
    if value.isdigit():
        return int(value)
    if value:
        try:
            return max(0, (parsedate_to_datetime(value) - datetime.now(timezone.utc)).total_seconds())
        except (ValueError, TypeError, OverflowError):
            pass
    return 2 ** attempt


def fetch_html(session, url, delay):
    for attempt in range(3):
        time.sleep(delay)
        try:
            response = session.get(url, timeout=30)
        except (requests.ConnectionError, requests.Timeout):
            if attempt == 2:
                raise
            time.sleep(2 ** attempt)
            continue
        if response.status_code == 429 or 500 <= response.status_code < 600:
            if attempt < 2:
                time.sleep(retry_delay(response, attempt))
                continue
        response.raise_for_status()
        return response.content


def download(data_dir, *, limit=None, refresh=False, delay=0.5):
    catalog_path = data_dir / "catalog.html"
    failed = set()
    downloaded = cached = 0
    with requests.Session() as session:
        session.headers.update({"User-Agent": "PerfumateScraper/1.0", "Accept-Language": "en"})
        catalog = None
        if catalog_path.exists() and not refresh:
            try:
                catalog = catalog_path.read_bytes()
                discover_materials(catalog)
            except (OSError, ValueError):
                catalog = None
        if catalog is None:
            catalog = fetch_html(session, CATALOG_URL, delay)
            discover_materials(catalog)
            atomic_write(catalog_path, catalog)
        urls = discover_materials(catalog)
        print(f"Discovered {len(urls)} materials", flush=True)
        if limit is not None:
            urls = urls[:limit]
            print(f"Partial run: selecting {len(urls)} materials (--limit {limit})", flush=True)
        for index, url in enumerate(urls, 1):
            path = data_dir / "html" / f"{slug_from_url(url)}.html"
            try:
                valid_cache = False
                if path.exists() and not refresh:
                    try:
                        material_article(path.read_bytes())
                        valid_cache = True
                    except (OSError, ValueError):
                        pass
                if valid_cache:
                    cached += 1
                else:
                    html = fetch_html(session, url, delay)
                    material_article(html)
                    atomic_write(path, html)
                    downloaded += 1
            except (requests.RequestException, OSError, ValueError) as exc:
                failed.add(url)
                print(f"Download failed: {url}: {exc}", file=sys.stderr, flush=True)
            if index % 25 == 0 or index == len(urls):
                print(f"Download {index}/{len(urls)}: downloaded={downloaded}, cached={cached}, failed={len(failed)}", flush=True)
    return urls, failed


def save_material(connection, material, path):
    row = dict(material)
    for field in JSON_FIELDS:
        row[f"{field}_json"] = json.dumps(row.pop(field), ensure_ascii=False)
    row.update({
        "html_path": f"html/{path.name}",
        "downloaded_at": datetime.fromtimestamp(path.stat().st_mtime, timezone.utc).isoformat(),
        "parsed_at": datetime.now(timezone.utc).isoformat(),
    })
    columns = list(row)
    updates = ", ".join(f"{column}=excluded.{column}" for column in columns if column != "slug")
    statement = f"INSERT INTO materials ({', '.join(columns)}) VALUES ({', '.join('?' for _ in columns)}) ON CONFLICT(slug) DO UPDATE SET {updates}"
    with connection:
        connection.execute(statement, [row[column] for column in columns])


def parse_saved(data_dir, *, urls=None, limit=None):
    if urls is None:
        paths = sorted((data_dir / "html").glob("*.html"))
        if limit is not None:
            paths = paths[:limit]
            print(f"Partial parse: selecting {len(paths)} saved pages (--limit {limit})", flush=True)
        urls = [f"{BASE_URL}/material/{path.stem}" for path in paths]
    if not urls:
        raise ValueError("No saved material pages; run download first")
    failed = set()
    parsed = 0
    connection = sqlite3.connect(data_dir / "perfumate.sqlite3")
    try:
        connection.executescript(SCHEMA)
        for index, url in enumerate(urls, 1):
            try:
                path = data_dir / "html" / f"{slug_from_url(url)}.html"
                material = parse_material(path.read_bytes(), url)
                save_material(connection, material, path)
                parsed += 1
            except (OSError, ValueError, sqlite3.Error) as exc:
                failed.add(url)
                print(f"Parse failed: {url}: {exc}", file=sys.stderr, flush=True)
            if index % 100 == 0 or index == len(urls):
                print(f"Parse {index}/{len(urls)}: parsed={parsed}, failed={len(failed)}", flush=True)
    finally:
        connection.close()
    return failed


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=("download", "parse", "all", "audit"))
    parser.add_argument("--data-dir", type=Path, default=DEFAULT_DATA_DIR,
                        help="Data directory (default: data/ beside this module)")
    parser.add_argument("--limit", type=int, help="Select only the first N materials (partial run)")
    parser.add_argument("--refresh", action="store_true", help="Refetch the catalog and selected material pages")
    parser.add_argument("--delay", type=float, default=0.5, help="Seconds between HTTP requests (default: 0.5)")
    parser.add_argument("--report", type=Path, help="Audit report path (default: DATA_DIR/audit.json)")
    args = parser.parse_args(argv)
    if args.limit is not None and args.limit < 1:
        parser.error("--limit must be positive")
    if args.delay < 0:
        parser.error("--delay cannot be negative")
    if args.command == "audit" and args.limit is not None:
        parser.error("audit requires the full saved catalog; omit --limit")
    if args.report is not None and args.command != "audit":
        parser.error("--report applies only to audit")
    failures = set()
    urls = None
    try:
        if args.command == "audit":
            from .audit import run_audit

            return run_audit(args.data_dir, args.report)
        if args.command in ("download", "all"):
            urls, failures = download(args.data_dir, limit=args.limit, refresh=args.refresh, delay=args.delay)
        if args.command in ("parse", "all"):
            failures.update(parse_saved(args.data_dir, urls=urls, limit=args.limit))
    except (requests.RequestException, OSError, ValueError, sqlite3.Error) as exc:
        print(f"Cannot complete {args.command}: {exc}", file=sys.stderr)
        return 1
    except KeyboardInterrupt:
        print("\nInterrupted; rerun to reuse completed downloads.", file=sys.stderr)
        return 130
    print(f"Finished: failed={len(failures)}", flush=True)
    return int(bool(failures))


if __name__ == "__main__":
    sys.exit(main())
