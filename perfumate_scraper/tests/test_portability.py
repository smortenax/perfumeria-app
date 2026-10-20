"""Exercise a copied and relocated tool inside a larger repository."""

import json
from pathlib import Path
import shutil
import sqlite3
import subprocess
import sys
import tempfile
import unittest


class PortabilityTests(unittest.TestCase):
    def test_nested_copy_and_relocation_keep_imports_and_data_self_contained(self):
        source = Path(__file__).resolve().parents[1]
        fixtures = source / "tests/fixtures"
        with tempfile.TemporaryDirectory(prefix="perfumate host ") as directory:
            host = Path(directory)
            copied = host / "tools/perfumate_scraper"
            shutil.copytree(source, copied, ignore=shutil.ignore_patterns("data", ".venv", "__pycache__", "*.pyc"))
            for name in ("scrape.py", "audit.py"):
                (host / name).write_text("raise AssertionError('Imported a host module instead of the tool')\n")
            data = copied / "data"
            (data / "html").mkdir(parents=True)
            shutil.copy2(fixtures / "catalog.html", data / "catalog.html")
            html = (fixtures / "bergamot-essential-oil.html").read_bytes()
            metadata = (fixtures / "bergamot-essential-oil.json").read_bytes()
            html = html.replace(b"</body>", b'<script type="application/ld+json">' + metadata + b"</script></body>")
            (data / "html/bergamot-essential-oil.html").write_bytes(html)
            result = subprocess.run([sys.executable, "-m", "tools.perfumate_scraper", "parse"],
                                    cwd=host, capture_output=True, text=True)
            self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
            with sqlite3.connect(data / "perfumate.sqlite3") as connection:
                self.assertEqual(connection.execute("SELECT html_path FROM materials").fetchone()[0],
                                 "html/bergamot-essential-oil.html")
            self.assertFalse((host / "data").exists())

            relocated = host / "integrations/renamed_scraper"
            relocated.parent.mkdir()
            copied.rename(relocated)
            result = subprocess.run([sys.executable, "-m", "integrations.renamed_scraper", "audit"],
                                    cwd=host, capture_output=True, text=True)
            self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
            report = json.loads((relocated / "data/audit.json").read_text())
            self.assertEqual(report["summary"]["expected"], 1)
            self.assertEqual(report["summary"]["errors"], 0)
            self.assertEqual(report["summary"]["warnings"], 0)
            self.assertEqual(Path(report["data_dir"]), relocated / "data")
            self.assertFalse((host / "data").exists())


if __name__ == "__main__":
    unittest.main()
