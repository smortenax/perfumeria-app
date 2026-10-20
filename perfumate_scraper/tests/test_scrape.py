import contextlib
import io
import json
from pathlib import Path
import sqlite3
import tempfile
import unittest
from unittest.mock import Mock, patch

import requests

from .. import scrape


FIXTURES = Path(__file__).parent / "fixtures"
BERGAMOT_URL = f"{scrape.BASE_URL}/material/bergamot-essential-oil"


def fixture(name):
    return (FIXTURES / f"{name}.html").read_bytes()


def response(status=200, content=b"ok", headers=None):
    result = requests.Response()
    result.status_code = status
    result._content = content
    result.headers.update(headers or {})
    return result


class ParserTests(unittest.TestCase):
    def parse(self, slug):
        return scrape.parse_material(fixture(slug), f"{scrape.BASE_URL}/material/{slug}")

    def test_discovery_deduplicates_and_ignores_unrelated_links(self):
        self.assertEqual(scrape.discover_materials(fixture("catalog")), [BERGAMOT_URL])

    def test_natural_material_and_fractional_constituents(self):
        material = self.parse("bergamot-essential-oil")
        self.assertEqual(material["name"], "Bergamot Essential Oil")
        self.assertEqual(material["cas"], "8007-75-8")
        self.assertEqual(material["origin"], "natural")
        self.assertEqual(material["note"], "top")
        self.assertEqual(material["primary_odor_category"], "Bright citrus")
        self.assertEqual(material["impact"], 6)
        self.assertEqual(material["substantivity_hours"], 8)
        self.assertEqual(material["working_dilution"], "Neat or 10%")
        self.assertIn("Bergamot Oil", material["synonyms"])
        self.assertIn("zesty", material["tags"])
        self.assertEqual(material["families"], [
            {"name": "Citrus", "percentage": 67},
            {"name": "Floral", "percentage": 33},
        ])
        self.assertEqual([part["percentage"] for part in material["subcategories"]], [44, 22, 22, 11])
        self.assertEqual(material["constituents"], [
            {"name": "Limonene", "cas": "138-86-3", "percentage": 38},
            {"name": "Linalool", "cas": "78-70-6", "percentage": 11},
            {"name": "Geraniol", "cas": "106-24-1", "percentage": 0.3},
            {"name": "Citral", "cas": "5392-40-5", "percentage": 0.4},
        ])

    def test_branded_synthetic_and_days(self):
        material = self.parse("ambroxan")
        self.assertEqual(material["name"], "Ambroxan")
        self.assertEqual(material["supplier"], "Kao Corporation")
        self.assertEqual(material["substantivity_hours"], 408)
        self.assertEqual(material["substantivity_text"], "17 days on a blotter")
        self.assertEqual(material["constituents"], [])

    def test_no_duration_is_inferred_from_description(self):
        material = self.parse("6-methyl-quinoline")
        self.assertIn("400 hours", material["odor_description"])
        self.assertIsNone(material["substantivity_hours"])
        self.assertIsNone(material["substantivity_text"])
        self.assertIsNone(material["primary_odor_category"])
        self.assertEqual(material["catalog_source"], "Fraterworks")
        self.assertEqual(material["working_dilution"], "1%")

    def test_compounded_base_has_no_cas_or_impact(self):
        material = self.parse("amazonia")
        self.assertIsNone(material["cas"])
        self.assertIsNone(material["impact"])
        self.assertIsNone(material["working_dilution"])
        self.assertIsNone(material["primary_odor_category"])

    def test_unicode_survives(self):
        html = fixture("bergamot-essential-oil").decode("utf-8").replace("Bergamot Essential Oil", "Crème de bergamote")
        self.assertEqual(scrape.parse_material(html.encode("utf-8"), BERGAMOT_URL)["name"], "Crème de bergamote")

    def test_category_names_containing_cas_are_preserved(self):
        for category in ("Cassis fruity", "Castoreum animalic"):
            html = fixture("bergamot-essential-oil").replace(b"Bright citrus", category.encode("utf-8"))
            with self.subTest(category=category):
                self.assertEqual(scrape.parse_material(html, BERGAMOT_URL)["primary_odor_category"], category)

    def test_family_without_percentage_does_not_invent_one(self):
        material = self.parse("acetic-acid")
        self.assertEqual(material["families"], [{"name": "Other", "percentage": None}])
        self.assertEqual(material["subcategories"], [{"name": "other", "percentage": 100}])

    def test_carrier_outside_note_pyramid(self):
        material = self.parse("apricot-kernel-oil")
        self.assertEqual(material["families"], [{"name": "Solvent", "percentage": None}])
        self.assertEqual(material["note"], "outside")
        self.assertEqual(material["primary_odor_category"], "Solvent carrier")

    def test_error_and_unrelated_pages_are_rejected(self):
        for html in (b"", b"<h1>Server error</h1>", fixture("catalog")):
            with self.subTest(html=html[:40]), self.assertRaises(ValueError):
                scrape.parse_material(html, BERGAMOT_URL)
        with self.assertRaises(ValueError):
            scrape.discover_materials(fixture("ambroxan"))


class DownloadTests(unittest.TestCase):
    @patch.object(scrape.time, "sleep")
    def test_transient_http_errors_and_retry_after(self, sleep):
        session = Mock()
        session.get.side_effect = [response(503), response(429, headers={"Retry-After": "7"}), response()]
        self.assertEqual(scrape.fetch_html(session, BERGAMOT_URL, 0.5), b"ok")
        self.assertEqual(session.get.call_count, 3)
        self.assertEqual([call.args[0] for call in sleep.call_args_list], [0.5, 1, 0.5, 7, 0.5])

    @patch.object(scrape.time, "sleep")
    def test_network_failures_are_bounded(self, sleep):
        session = Mock()
        session.get.side_effect = requests.Timeout("timeout")
        with self.assertRaises(requests.Timeout):
            scrape.fetch_html(session, BERGAMOT_URL, 0)
        self.assertEqual(session.get.call_count, 3)

    @patch.object(scrape.time, "sleep")
    def test_permanent_http_error_is_not_retried(self, sleep):
        session = Mock()
        session.get.return_value = response(404)
        with self.assertRaises(requests.HTTPError):
            scrape.fetch_html(session, BERGAMOT_URL, 0)
        self.assertEqual(session.get.call_count, 1)

    @patch.object(scrape.time, "sleep")
    def test_cached_run_and_failed_refresh_preserve_html(self, sleep):
        with tempfile.TemporaryDirectory() as directory, contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(io.StringIO()):
            data_dir = Path(directory)
            with patch.object(scrape.requests, "Session") as factory:
                session = factory.return_value.__enter__.return_value
                session.get.side_effect = [response(content=fixture("catalog")), response(content=fixture("bergamot-essential-oil"))]
                urls, failures = scrape.download(data_dir, delay=0)
                self.assertEqual(urls, [BERGAMOT_URL])
                self.assertFalse(failures)
                self.assertEqual(session.get.call_count, 2)
                session.get.reset_mock()
                scrape.download(data_dir, delay=0)
                session.get.assert_not_called()
                session.get.side_effect = [response(content=fixture("catalog")), response(content=b"<h1>Maintenance</h1>")]
                _, failures = scrape.download(data_dir, refresh=True, delay=0)
                self.assertEqual(failures, {BERGAMOT_URL})
                self.assertEqual((data_dir / "html/bergamot-essential-oil.html").read_bytes(), fixture("bergamot-essential-oil"))

    def test_interrupted_replace_preserves_previous_file(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "page.html"
            path.write_bytes(b"previous")
            with patch.object(Path, "replace", side_effect=OSError("interrupted")):
                with self.assertRaises(OSError):
                    scrape.atomic_write(path, b"new")
            self.assertEqual(path.read_bytes(), b"previous")
            self.assertFalse(path.with_suffix(".html.tmp").exists())


class DatabaseTests(unittest.TestCase):
    def test_offline_parse_upsert_json_and_failed_parse(self):
        with tempfile.TemporaryDirectory() as directory, contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(io.StringIO()):
            data_dir = Path(directory)
            path = data_dir / "html/bergamot-essential-oil.html"
            scrape.atomic_write(path, fixture("bergamot-essential-oil"))
            with patch.object(scrape.requests, "Session", side_effect=AssertionError("Offline parse must not use HTTP")):
                self.assertFalse(scrape.parse_saved(data_dir))
                self.assertFalse(scrape.parse_saved(data_dir))
            connection = sqlite3.connect(data_dir / "perfumate.sqlite3")
            try:
                self.assertEqual(connection.execute("SELECT count(*) FROM materials").fetchone()[0], 1)
                row = connection.execute("SELECT constituents_json, downloaded_at, parsed_at FROM materials").fetchone()
                self.assertEqual(json.loads(row[0])[2]["percentage"], 0.3)
                self.assertTrue(row[1].endswith("+00:00"))
                self.assertTrue(row[2].endswith("+00:00"))
                self.assertEqual(connection.execute("SELECT json_extract(value, '$.cas') FROM materials, json_each(materials.constituents_json) WHERE json_extract(value, '$.name') = 'Citral'").fetchone()[0], "5392-40-5")
                updated = fixture("bergamot-essential-oil").replace(b"Bright citrus", b"Updated citrus")
                path.write_bytes(updated)
                self.assertFalse(scrape.parse_saved(data_dir))
                self.assertEqual(connection.execute("SELECT primary_odor_category FROM materials").fetchone()[0], "Updated citrus")
                path.write_bytes(b"<h1>Bad page</h1>")
                self.assertEqual(scrape.parse_saved(data_dir), {BERGAMOT_URL})
                self.assertEqual(connection.execute("SELECT primary_odor_category FROM materials").fetchone()[0], "Updated citrus")
            finally:
                connection.close()

    def test_all_reports_missing_material_as_failure(self):
        with tempfile.TemporaryDirectory() as directory, contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(io.StringIO()):
            with patch.object(scrape, "download", return_value=([BERGAMOT_URL], {BERGAMOT_URL})):
                self.assertEqual(scrape.main(["all", "--data-dir", directory]), 1)


if __name__ == "__main__":
    unittest.main()
