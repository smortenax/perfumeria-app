"""Read-only checks of the cached catalog, material HTML, and SQLite records."""

from contextlib import closing
from datetime import datetime, timezone
import json
import math
from pathlib import Path
import re
import sqlite3

from bs4 import BeautifulSoup, SoupStrainer

from .scrape import BASE_URL, JSON_FIELDS, atomic_write, discover_materials, parse_material, slug_from_url


TEXT_FIELDS = (
    "source_url", "name", "supplier", "catalog_source", "cas", "origin", "note",
    "primary_odor_category", "odor_description", "substantivity_text", "working_dilution",
)
SCALAR_FIELDS = TEXT_FIELDS + ("impact", "substantivity_hours")
REQUIRED_COLUMNS = {"slug", *SCALAR_FIELDS, *(f"{field}_json" for field in JSON_FIELDS),
                    "html_path", "downloaded_at", "parsed_at"}
CAS_PATTERN = re.compile(r"\d{2,7}-\d{2}-\d")


def normalized(value):
    """Ignore incidental whitespace; make corrupt values safe to report as JSON."""
    if isinstance(value, str):
        return " ".join(value.split())
    if isinstance(value, list):
        return [normalized(item) for item in value]
    if isinstance(value, dict):
        return {key: normalized(item) for key, item in value.items()}
    if isinstance(value, float) and not math.isfinite(value):
        return repr(value)
    if isinstance(value, bytes):
        return repr(value)
    return value


def reject_constant(value):
    raise ValueError(f"Invalid JSON constant: {value}")


def decode_json(value):
    return json.loads(value, parse_constant=reject_constant)


def nonempty_string(value):
    return isinstance(value, str) and bool(value.strip())


def number_in_range(value, minimum=0, maximum=math.inf):
    return type(value) in (int, float) and math.isfinite(value) and minimum <= value <= maximum


def check_record(row, slug, issue):
    material = {field: row[field] for field in SCALAR_FIELDS}
    invalid = set()

    def bad(field, message, actual):
        invalid.add(field)
        issue("error", slug, field, message, actual=actual)

    for field in TEXT_FIELDS:
        value = material[field]
        if value is not None and not nonempty_string(value):
            bad(field, "Expected nonempty text or NULL", value)
    for field in ("source_url", "name", "odor_description"):
        if material[field] is None:
            bad(field, "Required field is missing", None)
    for field, choices in (("origin", ("natural", "synthetic")), ("note", ("top", "heart", "base", "outside"))):
        if material[field] is not None and material[field] not in choices:
            bad(field, "Unrecognized value", material[field])
    if material["source_url"] != f"{BASE_URL}/material/{slug}":
        bad("source_url", "Source URL does not match the material slug", material["source_url"])
    if material["cas"] is not None and (not isinstance(material["cas"], str) or not CAS_PATTERN.fullmatch(material["cas"])):
        bad("cas", "Invalid CAS format", material["cas"])
    if material["impact"] is not None and (type(material["impact"]) is not int or not 0 <= material["impact"] <= 10):
        bad("impact", "Expected an integer from 0 to 10 or NULL", material["impact"])
    if material["substantivity_hours"] is not None and not number_in_range(material["substantivity_hours"]):
        bad("substantivity_hours", "Expected finite, nonnegative hours or NULL", material["substantivity_hours"])

    for field in JSON_FIELDS:
        raw = row[f"{field}_json"]
        try:
            values = decode_json(raw)
        except (ValueError, TypeError, UnicodeError) as exc:
            material[field] = None
            bad(field, f"Invalid JSON: {exc}", raw)
            continue
        material[field] = values
        if not isinstance(values, list):
            bad(field, "Expected a JSON array", values)
            continue
        for index, value in enumerate(values):
            if field in ("tags", "synonyms"):
                if not nonempty_string(value):
                    bad(field, f"Entry {index} must be nonempty text", value)
                continue
            if not isinstance(value, dict) or not nonempty_string(value.get("name")) or "percentage" not in value:
                bad(field, f"Entry {index} needs a name and percentage", value)
                continue
            percentage = value["percentage"]
            if not (field == "families" and percentage is None) and not number_in_range(percentage, 0, 100):
                bad(field, f"Entry {index} has an invalid percentage", value)
            if field == "constituents":
                cas = value.get("cas")
                if "cas" not in value or (cas is not None and (not isinstance(cas, str) or not CAS_PATTERN.fullmatch(cas))):
                    bad(field, f"Entry {index} needs a valid CAS number or NULL", value)
    return material, invalid


def metadata_cas(item):
    identifiers = item.get("identifier", [])
    if isinstance(identifiers, dict):
        identifiers = [identifiers]
    if not isinstance(identifiers, list):
        raise ValueError("identifier must be an object or array")
    return next((identifier.get("value") for identifier in identifiers
                 if isinstance(identifier, dict) and identifier.get("propertyID") == "CAS"), None)


def check_metadata(html, material, slug, issue):
    soup = BeautifulSoup(html, "html.parser", parse_only=SoupStrainer("script", type="application/ld+json"))
    candidates = []
    for script in soup.find_all("script"):
        try:
            value = decode_json(script.get_text())
            entries = value if isinstance(value, list) else [value]
            for entry in entries:
                if not isinstance(entry, dict):
                    raise ValueError("JSON-LD entries must be objects")
                graph = entry.get("@graph", [entry])
                if not isinstance(graph, list) or not all(isinstance(item, dict) for item in graph):
                    raise ValueError("JSON-LD @graph must be an array of objects")
                candidates.extend(graph)
        except (ValueError, TypeError) as exc:
            issue("error", slug, "json_ld", f"Malformed JSON-LD: {exc}")
    items = [item for item in candidates if item.get("@type") in ("ChemicalSubstance", "DefinedTerm")]
    if not items:
        issue("warning", slug, "json_ld", "No material JSON-LD; independent comparison skipped")
        return False
    if len(items) != 1:
        issue("error", slug, "json_ld", "Expected exactly one page-level material definition", actual=len(items))
        return False
    item = items[0]
    try:
        parts = item.get("hasPart", [])
        if not isinstance(parts, list) or not all(isinstance(part, dict) for part in parts):
            raise ValueError("hasPart must be an array of objects")
        keywords = item.get("keywords", "")
        if not isinstance(keywords, str):
            raise ValueError("keywords must be text")
        expected = {
            "source_url": item.get("url"),
            "name": item.get("name"),
            "cas": metadata_cas(item),
            "tags": [tag.strip() for tag in keywords.split(",") if tag.strip()],
            "synonyms": item.get("alternateName", []),
            "constituents": [{"name": part.get("name"), "cas": metadata_cas(part)} for part in parts],
        }
        if not nonempty_string(expected["name"]) or not isinstance(expected["synonyms"], list):
            raise ValueError("Material JSON-LD needs a name and an alternateName array")
        for field, value in expected.items():
            actual = material[field]
            if field == "constituents" and isinstance(actual, list):
                actual = [{"name": part.get("name"), "cas": part.get("cas")} if isinstance(part, dict) else part for part in actual]
            if normalized(actual) != normalized(value):
                issue("error", slug, field, "Stored/extracted value disagrees with JSON-LD", expected=value, actual=actual)
    except (ValueError, TypeError) as exc:
        issue("error", slug, "json_ld", f"Malformed material JSON-LD: {exc}")
        return False
    return True


def audit_saved(data_dir):
    data_dir = Path(data_dir)
    report = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "data_dir": str(data_dir),
        "summary": {"expected": None, "saved": 0, "stored": None, "checked": 0, "compared": 0,
                    "metadata_checked": 0, "errors": 0, "warnings": 0},
        "coverage": {field: {"present": 0, "missing": 0, "invalid": 0} for field in (*SCALAR_FIELDS, *JSON_FIELDS)},
        "issues": [],
    }
    summary = report["summary"]

    def issue(severity, slug, field, message, **details):
        report["issues"].append(normalized({"severity": severity, "slug": slug, "field": field,
                                           "message": message, **details}))
        summary["errors" if severity == "error" else "warnings"] += 1

    expected = None
    try:
        urls = discover_materials((data_dir / "catalog.html").read_bytes())
        expected = {slug_from_url(url) for url in urls}
        summary["expected"] = len(expected)
    except (OSError, ValueError) as exc:
        issue("error", None, "catalog", f"Cannot read saved catalog: {exc}")
    files = {path.stem: path for path in sorted((data_dir / "html").glob("*.html"))}
    summary["saved"] = len(files)
    rows = None
    try:
        uri = (data_dir / "perfumate.sqlite3").resolve().as_uri() + "?mode=ro"
        with closing(sqlite3.connect(uri, uri=True)) as connection:
            connection.row_factory = sqlite3.Row
            integrity = [row[0] for row in connection.execute("PRAGMA integrity_check")]
            if integrity != ["ok"]:
                issue("error", None, "database", "SQLite integrity check failed", actual=integrity)
            columns = {row[1] for row in connection.execute("PRAGMA table_info(materials)")}
            if REQUIRED_COLUMNS - columns:
                raise ValueError(f"Missing materials columns: {', '.join(sorted(REQUIRED_COLUMNS - columns))}")
            rows = {}
            stored = connection.execute("SELECT * FROM materials").fetchall()
            summary["stored"] = len(stored)
            for row in stored:
                slug = row["slug"]
                if not nonempty_string(slug):
                    issue("error", None, "slug", "Missing or invalid material slug", actual=slug)
                elif slug in rows:
                    issue("error", slug, "slug", "Duplicate material slug")
                else:
                    rows[slug] = dict(row)
    except (OSError, ValueError, sqlite3.Error) as exc:
        issue("error", None, "database", f"Cannot read materials database: {exc}")

    if expected is not None:
        for slug in sorted(expected - files.keys()):
            issue("error", slug, "html", "Expected material HTML is missing")
        for slug in sorted(files.keys() - expected):
            issue("warning", slug, "html", "Archived HTML is outside the saved catalog")
        if rows is not None:
            for slug in sorted(expected - rows.keys()):
                issue("error", slug, "record", "Expected material record is missing")
            for slug in sorted(rows.keys() - expected):
                issue("warning", slug, "record", "Archived record is outside the saved catalog")
    selected = sorted(expected if expected is not None else files.keys() | (rows or {}).keys())
    for index, slug in enumerate(selected, 1):
        stored = None
        if rows is not None and slug in rows:
            stored, invalid = check_record(rows[slug], slug, issue)
            for field, value in stored.items():
                state = "invalid" if field in invalid else "missing" if value is None or value == [] else "present"
                report["coverage"][field][state] += 1
        if slug not in files:
            continue
        try:
            html = files[slug].read_bytes()
            parsed = parse_material(html, f"{BASE_URL}/material/{slug}")
        except (OSError, ValueError) as exc:
            issue("error", slug, "html", f"Cannot parse saved material: {exc}")
            continue
        summary["checked"] += 1
        if stored is not None:
            for field, actual in stored.items():
                if normalized(actual) != normalized(parsed[field]):
                    issue("error", slug, field, "Stored value differs from current HTML extraction", expected=parsed[field], actual=actual)
            summary["compared"] += 1
        if check_metadata(html, stored if stored is not None else parsed, slug, issue):
            summary["metadata_checked"] += 1
        if index % 100 == 0 or index == len(selected):
            print(f"Audit {index}/{len(selected)}: errors={summary['errors']}, warnings={summary['warnings']}", flush=True)
    return report


def run_audit(data_dir, report_path=None):
    data_dir = Path(data_dir)
    destination = Path(report_path) if report_path is not None else data_dir / "audit.json"
    resolved = destination.resolve()
    if resolved in {(data_dir / "catalog.html").resolve(), (data_dir / "perfumate.sqlite3").resolve()} or resolved.is_relative_to((data_dir / "html").resolve()):
        raise ValueError("Audit report must not overwrite the database, saved catalog, or material HTML")
    report = audit_saved(data_dir)
    atomic_write(destination, (json.dumps(report, ensure_ascii=False, indent=2, allow_nan=False) + "\n").encode("utf-8"))
    summary = report["summary"]
    print(f"Audit summary: expected={summary['expected']}, saved={summary['saved']}, stored={summary['stored']}, "
          f"checked={summary['checked']}, compared={summary['compared']}, metadata_checked={summary['metadata_checked']}")
    for field, counts in report["coverage"].items():
        print(f"  {field}: present={counts['present']}, missing={counts['missing']}, invalid={counts['invalid']}")
    for finding in report["issues"][:20]:
        print(f"{finding['severity'].upper()}: {finding['slug'] or 'dataset'} [{finding['field']}]: {finding['message']}")
    if len(report["issues"]) > 20:
        print(f"  {len(report['issues']) - 20} more findings in the report")
    print(f"Finished audit: errors={summary['errors']}, warnings={summary['warnings']}; report={destination}")
    return int(summary["errors"] > 0)
