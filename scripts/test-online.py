"""Offline checks for image configuration, public export and the preview proxy."""
import json
from pathlib import Path
import tempfile
import unittest
from urllib.request import Request
import zipfile

from font_assets import write_widget_archive
from online_assets import online_overlay
from preview import daily_url_allowed, DailyRedirect, Preview


class OnlineTests(unittest.TestCase):
    def test_private_key_overlay_and_public_archive(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            (root / '.local').mkdir()
            (root / 'app').mkdir()
            (root / 'app/daily-config.js').write_text("window.CleanFrameDailyConfig = { pixabayKey: '' };")
            fake_key = 'test-only-' + '1234567890'
            (root / '.local/daily-pictures.json').write_text(json.dumps({'pixabayKey': fake_key}))
            self.assertIn(fake_key.encode(), online_overlay(root)['daily-config.js'])
            for private in [True, False]:
                output = root / ('private.wgt' if private else 'public.wgt')
                write_widget_archive(output, root, include_private=private)
                with zipfile.ZipFile(output) as archive:
                    self.assertEqual(fake_key.encode() in archive.read('daily-config.js'), private)
                    self.assertFalse(any('.local' in name for name in archive.namelist()))
            # Public builds never parse or depend on local credentials.
            (root / '.local/daily-pictures.json').write_text('{ invalid secret')
            self.assertIn(b'"pixabayKey": ""', online_overlay(root, False)['daily-config.js'])
            with self.assertRaisesRegex(ValueError, '^Invalid local picture configuration;') as error:
                online_overlay(root)
            self.assertNotIn('invalid secret', str(error.exception))

    def test_proxy_allowlist_and_redirects(self):
        for url in ['http://www.bing.com/a', 'https://127.0.0.1/a', 'https://www.bing.com.attacker.example/a',
                    'https://user:password@www.bing.com/a', 'file:///etc/passwd', 'https://www.bing.com:444/a']:
            self.assertFalse(daily_url_allowed(url), url)
            with self.assertRaises(ValueError):
                DailyRedirect().redirect_request(Request('https://www.bing.com/'), None, 302, 'Found', {}, url)
        for url in ['https://pixabay.com/api/', 'https://thumb.wikimedia.org/a.jpg', 'https://cdn.esawebb.org/a.jpg']:
            self.assertTrue(daily_url_allowed(url))

    def test_proxy_logs_do_not_include_query_credentials(self):
        handler = object.__new__(Preview)
        handler.path = '/daily-fetch?url=https%3A%2F%2Fpixabay.com%2Fapi%2F%3Fkey%3Dsynthetic-secret'
        lines = []
        handler.log_message = lambda *args: lines.append(str(args))
        handler.log_request(200, 42)
        self.assertNotIn('synthetic-secret', ''.join(lines))


if __name__ == '__main__':
    unittest.main()
