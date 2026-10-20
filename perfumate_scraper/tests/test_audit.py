import contextlib
import hashlib
import io
import json
from pathlib import Path
import sqlite3
import tempfile
import unittest
from unittest.mock import patch

from .. import audit, scrape


FIXTURES = Path(__file__).parent / "fixtures"
BERGAMOT = "bergamot-essential-oil"


class AuditTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.directory = Path(self.temporary.name)
        self.output = io.StringIO()
        self.capture_stdout = contextlib.redirect_stdout(self.output)
        self.capture_stderr = contextlib.redirect_stderr(self.output)
        self.capture_stdout.__enter__()
        self.capture_stderr.__enter__()
        self.addCleanup(self.capture_stdout.__exit__, None, None, None)
        self.addCleanup(self.capture_stderr.__exit__, None, None, None)

    @property
    def database(self):
        return self.directory / "perfumate.sqlite3"

    def metadata(self, slug):
        return json.loads((FIXTURES / f"{slug}.json").read_text(encoding="utf-8"))

    def add_material(self, slug, source_slug=None, metadata=True, html=None):
        source_slug = source_slug or slug
        if html is None:
            html = (FIXTURES / f"{source_slug}.html").read_bytes()
        if metadata is True:
            metadata = self.metadata(source_slug)
            metadata["url"] = f"{scrape.BASE_URL}/material/{slug}"
        if isinstance(metadata, dict):
            script = '<script type="application/ld+json">' + json.dumps(metadata) + '</script>'
            html = html.replace(b"</body>", script.encode("utf-8") + b"</body>")
        path = self.directory / "html" / f"{slug}.html"
        scrape.atomic_write(path, html)
        connection = sqlite3.connect(self.database)
        try:
            connection.executescript(scrape.SCHEMA)
            material = scrape.parse_material(html, f"{scrape.BASE_URL}/material/{slug}")
            scrape.save_material(connection, material, path)
        finally:
            connection.close()

    def catalog(self, *slugs):
        links = ''.join(f'<li><a href="/material/{slug}">{slug}</a></li>' for slug in slugs)
        html = '<h1>The materials catalog</h1><section class="fsec"><ul class="mats">' + links + '</ul></section>'
        (self.directory / "catalog.html").write_text(html, encoding="utf-8")

    def dataset(self, *slugs):
        slugs = slugs or (BERGAMOT,)
        for slug in slugs:
            self.add_material(slug)
        self.catalog(*slugs)

    def update(self, field, value, slug=BERGAMOT):
        with sqlite3.connect(self.database) as connection:
            connection.execute(f"UPDATE materials SET {field} = ? WHERE slug = ?", (value, slug))

    def run_command(self, *arguments):
        return scrape.main(["audit", "--data-dir", str(self.directory), *arguments])

    def report(self):
        return audit.decode_json((self.directory / "audit.json").read_text(encoding="utf-8"))

    def fingerprints(self):
        paths = [self.database, self.directory / "catalog.html", *sorted((self.directory / "html").glob("*.html"))]
        return {path: (hashlib.sha256(path.read_bytes()).hexdigest(), path.stat().st_mtime_ns)
                for path in paths if path.exists()}

    def test_clean_command_is_offline_and_preserves_inputs(self):
        self.dataset()
        before = self.fingerprints()
        with patch.object(scrape.requests, "Session", side_effect=AssertionError("Audit must stay offline")):
            self.assertEqual(self.run_command(), 0)
        self.assertEqual(before, self.fingerprints())
        report = self.report()
        self.assertEqual(report["summary"], {"expected": 1, "saved": 1, "stored": 1, "checked": 1,
                                             "compared": 1, "metadata_checked": 1, "errors": 0, "warnings": 0})
        self.assertEqual(report["coverage"]["cas"], {"present": 1, "missing": 0, "invalid": 0})
        self.assertEqual(report["issues"], [])

    def test_incomplete_dataset_reports_missing_page_and_row_and_continues(self):
        self.dataset(BERGAMOT, "amazonia")
        (self.directory / "html" / f"{BERGAMOT}.html").unlink()
        with sqlite3.connect(self.database) as connection:
            connection.execute("DELETE FROM materials WHERE slug = ?", (BERGAMOT,))
        self.assertEqual(self.run_command(), 1)
        report = self.report()
        self.assertEqual(report["summary"]["checked"], 1)
        self.assertEqual({issue["field"] for issue in report["issues"]}, {"html", "record"})
        self.assertTrue(all(issue["slug"] == BERGAMOT for issue in report["issues"]))

    def test_archive_extras_are_warnings(self):
        self.dataset()
        self.add_material("amazonia")
        self.assertEqual(self.run_command(), 0)
        self.assertEqual(self.report()["summary"]["warnings"], 2)
        self.assertEqual(self.report()["summary"]["checked"], 1)

    def test_stale_fields_include_source_evidence(self):
        self.dataset()
        self.update("odor_description", "Stale odor description")
        report = audit.audit_saved(self.directory)
        issue = next(issue for issue in report["issues"] if issue["field"] == "odor_description")
        self.assertEqual(issue["actual"], "Stale odor description")
        self.assertIn("Sparkling", issue["expected"])

    def test_defined_term_optional_fields_and_different_source_dates(self):
        self.dataset(BERGAMOT, "amazonia")
        path = self.directory / "html/amazonia.html"
        path.write_bytes(path.read_bytes().replace(b'2026-10-18', b'2026-10-19'))
        report = audit.audit_saved(self.directory)
        self.assertEqual(report["summary"]["errors"], 0)
        self.assertEqual(report["summary"]["metadata_checked"], 2)
        self.assertEqual(report["coverage"]["cas"]["missing"], 1)

    def test_invalid_values_are_reported_without_stopping_other_materials(self):
        self.dataset(BERGAMOT, "amazonia")
        cases = [
            ("tags_json", "{", "tags"),
            ("synonyms_json", "{}", "synonyms"),
            ("families_json", '[{"name":"Citrus","percentage":101}]', "families"),
            ("families_json", '[{"name":"Citrus","percentage":true}]', "families"),
            ("families_json", '[{"name":"Citrus","percentage":NaN}]', "families"),
            ("subcategories_json", '[{"name":"bergamot","percentage":null}]', "subcategories"),
            ("constituents_json", '[{"name":"Limonene","percentage":38}]', "constituents"),
            ("constituents_json", '[{"name":"Limonene","cas":"bad","percentage":38}]', "constituents"),
            ("impact", 11, "impact"),
            ("substantivity_hours", -1, "substantivity_hours"),
            ("substantivity_hours", float("inf"), "substantivity_hours"),
            ("origin", "unknown", "origin"),
            ("note", "opening", "note"),
            ("name", " ", "name"),
        ]
        for column, value, field in cases:
            with self.subTest(column=column, value=value):
                with sqlite3.connect(self.database) as connection:
                    original = connection.execute(f"SELECT {column} FROM materials WHERE slug = ?", (BERGAMOT,)).fetchone()[0]
                try:
                    self.update(column, value)
                    self.assertEqual(self.run_command(), 1)
                    report = self.report()
                    self.assertEqual(report["summary"]["checked"], 2)
                    self.assertEqual(report["coverage"][field]["invalid"], 1)
                finally:
                    self.update(column, original)

    def test_missing_database_is_not_created(self):
        self.dataset()
        self.database.unlink()
        self.assertEqual(self.run_command(), 1)
        self.assertFalse(self.database.exists())
        self.assertIsNone(self.report()["summary"]["stored"])

    def test_bad_database_and_missing_columns_still_produce_reports(self):
        self.dataset()
        self.database.write_bytes(b"not a SQLite database")
        before = self.database.read_bytes()
        self.assertEqual(self.run_command(), 1)
        self.assertEqual(before, self.database.read_bytes())
        self.assertTrue(any(issue["field"] == "database" for issue in self.report()["issues"]))
        self.database.unlink()
        with sqlite3.connect(self.database) as connection:
            connection.execute("CREATE TABLE materials (slug TEXT)")
        self.assertEqual(self.run_command(), 1)
        self.assertTrue(any("Missing materials columns" in issue["message"] for issue in self.report()["issues"]))

    def test_missing_catalog_still_checks_available_pages(self):
        self.dataset()
        (self.directory / "catalog.html").unlink()
        self.assertEqual(self.run_command(), 1)
        report = self.report()
        self.assertEqual(report["summary"]["checked"], 1)
        self.assertIsNone(report["summary"]["expected"])

    def test_bad_html_does_not_stop_remaining_pages(self):
        self.dataset(BERGAMOT, "amazonia")
        (self.directory / "html" / f"{BERGAMOT}.html").write_bytes(b"<h1>Server error</h1>")
        report = audit.audit_saved(self.directory)
        self.assertEqual(report["summary"]["checked"], 1)
        self.assertTrue(any(issue["slug"] == BERGAMOT and issue["field"] == "html" for issue in report["issues"]))

    def test_missing_metadata_is_a_warning(self):
        self.add_material(BERGAMOT, metadata=False)
        self.catalog(BERGAMOT)
        self.assertEqual(self.run_command(), 0)
        self.assertEqual(self.report()["summary"]["warnings"], 1)
        self.assertEqual(self.report()["summary"]["metadata_checked"], 0)

    def test_malformed_metadata_is_an_error(self):
        self.dataset()
        path = self.directory / "html" / f"{BERGAMOT}.html"
        html = path.read_bytes()
        html = html.replace(b'<script type="application/ld+json">{', b'<script type="application/ld+json">{broken')
        path.write_bytes(html)
        self.assertEqual(self.run_command(), 1)
        self.assertTrue(any("Malformed JSON-LD" in issue["message"] for issue in self.report()["issues"]))

    def test_metadata_detects_parser_bug_even_when_record_matches_parser(self):
        self.dataset()
        self.update("name", "Wrong name")
        original = scrape.parse_material

        def wrong_parser(html, url):
            material = original(html, url)
            material["name"] = "Wrong name"
            return material

        with patch.object(audit, "parse_material", side_effect=wrong_parser):
            report = audit.audit_saved(self.directory)
        issue = next(issue for issue in report["issues"] if issue["field"] == "name")
        self.assertIn("JSON-LD", issue["message"])
        self.assertEqual(issue["expected"], "Bergamot Essential Oil")
        self.assertEqual(issue["actual"], "Wrong name")

    def test_wrong_page_url_and_constituent_metadata_are_errors(self):
        metadata = self.metadata(BERGAMOT)
        metadata["url"] = f"{scrape.BASE_URL}/material/other"
        metadata["hasPart"][0]["name"] = "Wrong constituent"
        self.add_material(BERGAMOT, metadata=metadata)
        self.catalog(BERGAMOT)
        report = audit.audit_saved(self.directory)
        self.assertTrue({"source_url", "constituents"}.issubset({issue["field"] for issue in report["issues"]}))

    def test_incidental_metadata_whitespace_is_ignored(self):
        metadata = self.metadata(BERGAMOT)
        metadata["alternateName"][0] += "  "
        metadata["name"] = "  Bergamot   Essential Oil "
        self.add_material(BERGAMOT, metadata=metadata)
        self.catalog(BERGAMOT)
        self.assertEqual(self.run_command(), 0)
        self.assertFalse(self.report()["issues"])

    def test_expected_percentage_and_duration_variants_pass(self):
        html = (FIXTURES / f"{BERGAMOT}.html").read_bytes().replace(b"8.0 hours", b"under an hour")
        self.add_material(BERGAMOT, html=html)
        self.add_material("acetic-acid", metadata=False)
        self.add_material("apricot-kernel-oil", metadata=False)
        self.catalog(BERGAMOT, "acetic-acid", "apricot-kernel-oil")
        report = audit.audit_saved(self.directory)
        self.assertEqual(report["summary"]["errors"], 0)
        self.assertEqual(report["coverage"]["substantivity_hours"]["missing"], 2)

    def test_duplicate_cas_numbers_are_allowed(self):
        self.add_material(BERGAMOT)
        self.add_material("bergamot-copy", source_slug=BERGAMOT)
        self.catalog(BERGAMOT, "bergamot-copy")
        self.assertEqual(self.run_command(), 0)
        self.assertFalse(self.report()["issues"])

    def test_report_path_and_protected_inputs(self):
        self.dataset()
        custom = self.directory / "reports/result.json"
        self.assertEqual(self.run_command("--report", str(custom)), 0)
        self.assertEqual(json.loads(custom.read_text())["summary"]["errors"], 0)
        before = self.fingerprints()
        for path in before:
            with self.subTest(path=path):
                self.assertEqual(self.run_command("--report", str(path)), 1)
                self.assertEqual(before, self.fingerprints())

    def test_partial_audit_and_report_on_other_commands_are_rejected(self):
        with self.assertRaises(SystemExit) as raised:
            self.run_command("--limit", "1")
        self.assertEqual(raised.exception.code, 2)
        with self.assertRaises(SystemExit) as raised:
            scrape.main(["parse", "--report", str(self.directory / "report.json")])
        self.assertEqual(raised.exception.code, 2)


if __name__ == "__main__":
    unittest.main()
