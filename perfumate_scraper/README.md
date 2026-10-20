# PerfuMate catalog scraper

A sequential Python scraper using `requests`, Beautiful Soup, and SQLite. It
discovers material links from `https://perfumate.app/catalog`, saves complete
HTML responses, and extracts core material data. Scraping permission has been
obtained for this project.

## Setup and use

Requires Python 3.10 or newer. Commands below run from the parent of the
`perfumate_scraper/` folder.

```sh
python3 -m venv .venv
.venv/bin/python -m pip install -r perfumate_scraper/requirements.txt

# Restore the bundled HTML before offline parsing or auditing.
tar -xJf perfumate_scraper/data/html.tar.xz -C perfumate_scraper/data

# Small live smoke run, then download and parse the full catalog.
.venv/bin/python -m perfumate_scraper all --limit 3
.venv/bin/python -m perfumate_scraper all

# Run each stage separately; parsing requires no network access.
.venv/bin/python -m perfumate_scraper download
.venv/bin/python -m perfumate_scraper parse

# Refetch the catalog and material pages, including previously cached pages.
.venv/bin/python -m perfumate_scraper all --refresh
```

Defaults: `perfumate_scraper/data/catalog.html`,
`perfumate_scraper/data/html/<slug>.html`, and
`perfumate_scraper/data/perfumate.sqlite3`, located beside the code regardless
of the working directory. Use `--data-dir PATH` to change the directory, or
`--delay SECONDS` to change the default 0.5-second pause between requests.
`--limit N` explicitly selects a partial run. For offline parsing it selects
the first N saved files in filename order; for downloading it uses catalog
order. `--refresh` and `--delay` apply to downloading only.

Downloads reuse validated cached HTML, including the catalog, unless
`--refresh` is supplied. Each successful response is saved atomically. HTTP
429, HTTP 5xx, connection errors, and timeouts receive at most three attempts,
with backoff and support for `Retry-After`. Each request has a 30-second timeout.
Rerun an interrupted or failed command to reuse completed downloads. Use
`--refresh` when you want to discover newly added materials.

Errors include the source URL, and the command exits nonzero if any materials
fail. An `all` run parses every selected material and reports failures for
missing files. Offline `parse` processes existing saved material pages; it does
not verify that the entire catalog has been downloaded. Refetch failures retain
prior HTML and remain failures even if a previously saved page can be parsed.

## Offline audit

```sh
.venv/bin/python -m perfumate_scraper audit
.venv/bin/python -m perfumate_scraper audit --report perfumate_scraper/data/audit.json
```

The audit makes no network requests and opens SQLite read-only. It checks the
saved catalog against HTML files and database rows, checks SQLite integrity and
field shapes/ranges, and compares stored values with fresh HTML extraction.
It also independently compares names, source URLs, CAS numbers, tags, synonyms,
and constituent names/CAS numbers with the page's JSON-LD. Both
`ChemicalSubstance` and `DefinedTerm` material definitions are supported.
Incidental whitespace is ignored; value order is preserved. File paths and
timestamps are excluded from semantic comparisons.

Missing expected HTML or records, malformed data, and value mismatches are
errors. Retained files/records outside the saved catalog and missing material
JSON-LD are warnings. Optional missing values, duplicate CAS numbers, rounded
profiles, partial constituent tables, unweighted families, and bounded
durations are valid. Global statistics and source modification dates are not
used as fixed expectations.

The console prints progress, totals, field coverage, and the first 20 findings.
The full JSON report is written atomically to `DATA_DIR/audit.json`, or to the
path supplied with `--report`, even when inputs are incomplete or corrupt.
`--report` cannot target the database, catalog, or material HTML. Auditing the
full saved catalog is required; `--limit` is rejected. `--report` applies only
to `audit`; download flags have no effect on auditing.

The report contains `generated_at`, `data_dir`, `summary`, `coverage`, and
`issues`. Summary counts include expected catalog entries, saved files, stored
rows, successfully parsed pages (`checked`), rows compared to HTML (`compared`),
and pages compared to JSON-LD (`metadata_checked`), plus error and warning
counts. Unknown counts are `null` when an input cannot be read. Coverage gives
`present`, `missing`, and `invalid` counts for each field among inspected
records. Each issue includes severity, slug, field, and message, with
expected/actual values when applicable. Dataset-wide issues have a `null` slug.

Exit status is `0` when there are no errors, including warnings-only results,
and `1` when errors occur. The audit does not repair data. After fixing a
confirmed extraction bug, rerun `parse` and then `audit` using the saved HTML.

## Copying into a larger repository

The complete tool lives in this normal folder: Python modules, dependency file,
tests, fixtures, README, `.gitignore`, and `data/`. Copy and commit this folder
inside the host repository. The SQLite database and reports remain ordinary
files; only downloaded HTML is compressed in `data/html.tar.xz`. No package
installation or changes to the host application's code are required.

For example, with the folder at `tools/perfumate_scraper/`, run these commands
from the larger repository's root using its Python environment:

```sh
python -m pip install -r tools/perfumate_scraper/requirements.txt
tar -xJf tools/perfumate_scraper/data/html.tar.xz -C tools/perfumate_scraper/data
python -m tools.perfumate_scraper audit
python -m unittest discover -s tools/perfumate_scraper/tests -t tools -v
```

Use `python -m <parent-packages>.perfumate_scraper` for the other commands too.
Default outputs stay inside this folder. Explicit relative `--data-dir` and
`--report` paths are interpreted relative to the caller's working directory.
Imports are relative to this package, so generic modules such as `scrape` or
`audit` in the host repository do not interfere.

Git versions source, tests, `data/perfumate.sqlite3`, reports,
`data/html.tar.xz`, and its checksum normally. The nested `.gitignore` excludes
restored `data/catalog.html` and `data/html/`, temporary database files, Python
caches, and virtual environments. Small HTML test fixtures remain normal,
versioned files. Install the two dependencies into the host environment.

The archive contains `catalog.html` and the `html/` directory, including all
2,212 downloaded material pages in the bundled snapshot. Restore it with the
`tar -xJf` command above before `parse` or `audit`. Neither command decompresses
automatically; the audit retains its read-only behavior for HTML and SQLite.

After new downloads, rebuild only the HTML archive from the parent of this
folder using `tar` and `xz`:

```sh
XZ_OPT='-9e -T1' tar -C perfumate_scraper/data \
  -cJf perfumate_scraper/data/html.tar.xz.tmp catalog.html html \
  && mv perfumate_scraper/data/html.tar.xz.tmp perfumate_scraper/data/html.tar.xz \
  && (cd perfumate_scraper/data && sha256sum html.tar.xz > html.tar.xz.sha256)
```

XZ uses maximum compression in one stream so repeated HTML across pages can
compress together. Verify with `sha256sum -c html.tar.xz.sha256` from the
`data/` directory. The database, reports, source, and tests are not in this
archive. Keep local restored HTML if useful; Git ignores it.

## SQLite data

One `materials` table, keyed by `slug`. CAS is stored as text and is not unique:
several catalog materials can share the same CAS number.

Scalar columns contain `source_url`, clean `name`, `supplier`,
`catalog_source`, `cas`, `origin`, `note`, `primary_odor_category`,
`odor_description`, `impact`, `substantivity_text`, `substantivity_hours`,
and `working_dilution`. Provenance columns contain `html_path`, `downloaded_at`
(saved HTML modification time), and `parsed_at`, with UTC timestamps.
`html_path` is relative to the SQLite database directory, for example
`html/bergamot-essential-oil.html`, so moving the complete folder preserves
source-file references.
`note` is `top`, `heart`, `base`, or `outside` when the page explicitly says
"Outside the note pyramid"; it is `NULL` if no position is given.

Repeated fields are JSON arrays in these text columns:

| Column | Array entries |
| --- | --- |
| `tags_json` | Strings |
| `synonyms_json` | Strings |
| `families_json` | `{"name": "Citrus", "percentage": 67.0}` |
| `subcategories_json` | `{"name": "bergamot", "percentage": 44.0}` |
| `constituents_json` | `{"name": "Limonene", "cas": "138-86-3", "percentage": 38.0}` |

Missing scalar fields are `NULL`; absent collections are `[]`. Family and
subcategory order and displayed percentages are preserved. Family percentages
are `null` when the label has no displayed percentage, such as `Solvent`.
Percentages are not renormalized: rounding can make profiles sum to 99 or 101, and constituent
tables may describe only part of a material. Family/subcategory relationships
are not inferred. Substantivity hours are converted only from explicit
hours/days measurements on the page, so they retain the rounding and estimated
nature of the displayed values. Working dilution remains text, including
values such as `Neat or 10%`. Bounds such as `under an hour` retain their text
with `NULL` numeric hours.

Parsing upserts one material at a time. Repeated runs do not duplicate rows,
and failed parses preserve existing records. Rows for materials removed from
the catalog are not automatically deleted.

Example SQL:

```sql
SELECT name, cas, impact, substantivity_hours
FROM materials
WHERE origin = 'natural' AND note = 'top';

SELECT m.name, json_extract(c.value, '$.percentage') AS percentage
FROM materials AS m, json_each(m.constituents_json) AS c
WHERE json_extract(c.value, '$.cas') = '138-86-3';
```

Formula references, usage guidance, substitutes, videos, and related materials
are retained in the complete saved HTML but are not extracted into SQLite.

## Tests

```sh
.venv/bin/python -m unittest discover -s perfumate_scraper/tests -t . -v
```

Tests run offline. The material fixtures contain material articles trimmed
from live pages retrieved on 2026-10-20, with HTML comments removed. The small
catalog fixture exercises duplicate and unrelated links. JSON fixtures contain
the original material JSON-LD for independent audit comparisons.
