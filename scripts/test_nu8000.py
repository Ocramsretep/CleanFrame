"""Offline regression checks for the optional NU8000 overlay (including Windows)."""
import hashlib
import json
from pathlib import Path
import subprocess
import tempfile
import unittest
import xml.etree.ElementTree as XML
import zipfile

from prepare_nu8000 import ROOT, adapt, build, load_config


class NU8000Tests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        (ROOT / '.local').mkdir(exist_ok=True)
        cls.folder = Path(tempfile.mkdtemp(prefix='nu8000-test-', dir=ROOT / '.local'))
        cls.config = cls.folder / 'config.json'
        cls.selection = {'home': ['youtube', 'Test123456.Consumer'], 'appRecords': [
            {'id': 'Test123456.Consumer', 'appId': 'Test123456.Consumer', 'name': 'Test <App>'}]}
        cls.config.write_text(json.dumps(dict(package_id='Owner12345', app_id='Owner12345.Home',
                                             selection=cls.selection)), encoding='utf-8')
        cls.before = {p.name: hashlib.sha256(p.read_bytes()).hexdigest()
                      for p in (ROOT / 'app').iterdir() if p.is_file()}
        cls.report = build(cls.config)
        with zipfile.ZipFile(cls.report['widget']) as archive:
            cls.files = {name: archive.read(name) for name in archive.namelist()}

    def test_package_and_source_separation(self):
        after = {p.name: hashlib.sha256(p.read_bytes()).hexdigest()
                 for p in (ROOT / 'app').iterdir() if p.is_file()}
        self.assertEqual(self.before, after)
        application = XML.fromstring(self.files['config.xml']).find('{http://tizen.org/ns/widgets}application')
        self.assertEqual(application.get('id'), 'Owner12345.Home')
        self.assertEqual(application.get('required_version'), '4.0')
        self.assertIn('LICENSE', self.files)
        self.assertIn('THIRD_PARTY_NOTICES.md', self.files)
        self.assertFalse(any(name.startswith('assets/private-fonts/') for name in self.files))
        self.assertNotIn('author-signature.xml', self.files)
        self.assertNotIn('config.json', self.files)
        self.assertIn(b'org.tizen.tv-viewer', self.files['device.js'])
        self.assertIn(b'evKhCgZelL.AmazonIgnitionLauncher2', self.files['main.js'])
        self.assertIn(b'org.tizen.menu', self.files['device.js'])
        self.assertIn(b'Live TV', self.files['sources.js'])

    def test_seed_preserves_current_and_legacy_preferences(self):
        code = r"""
const vm = require('node:vm'), assert = require('node:assert/strict');
const input = JSON.parse(require('node:fs').readFileSync(0, 'utf8'));
for (const existing of [null, 'cleanframe.home.v1', 'cleanframe.shore.v1']) {
  const saved = existing ? {[existing]: '{"home":["netflix"]}'} : {};
  const before = JSON.stringify(saved); let writes = 0;
  vm.runInNewContext(input.source, {localStorage: {
    getItem: key => saved[key] || null,
    setItem: (key, value) => {saved[key] = value; writes++;}
  }});
  if (existing) {assert.equal(writes, 0); assert.equal(JSON.stringify(saved), before);}
  else {assert.equal(writes, 1); assert.deepEqual(JSON.parse(saved['cleanframe.home.v1']), input.selection);}
}
vm.runInNewContext(input.source, {localStorage: {getItem: () => {throw Error('denied');}}});
"""
        subprocess.run(['node', '-e', code], input=json.dumps({
            'source': self.files['first-run.js'].decode(), 'selection': self.selection}),
            text=True, check=True)

    def test_upstream_drift_is_rejected(self):
        with self.assertRaisesRegex(ValueError, 'Upstream source changed'):
            adapt({'config.xml': b'<different />'}, self.selection)

    def test_source_seed_is_separate_and_never_overwrites_saved_choices(self):
        # Use the baseline; adapt deliberately rejects double application.
        baseline = Path(self.report['stage']).parent / 'baseline-unsigned.wgt'
        sources = [{'id': 'hdmi1', 'name': 'Console', 'icon': 'console', 'number': 1, 'visible': True}]
        with zipfile.ZipFile(baseline) as archive:
            files = adapt({name: archive.read(name) for name in archive.namelist()}, self.selection, sources)
        self.assertLess(files['index.html'].index(b'source-first-run.js'), files['index.html'].index(b'src="sources.js"'))
        code = r"""
const vm = require('node:vm'), assert = require('node:assert/strict');
const source = JSON.parse(require('node:fs').readFileSync(0, 'utf8'));
for (const existing of [false, true]) {
  const saved = {'cleanframe.home.v1':'unchanged apps'};
  if (existing) saved['cleanframe.sources.v1']='saved sources';
  vm.runInNewContext(source,{localStorage:{getItem:k=>saved[k],setItem:(k,v)=>{saved[k]=v;}}});
  assert.equal(saved['cleanframe.home.v1'],'unchanged apps');
  if (existing) assert.equal(saved['cleanframe.sources.v1'],'saved sources');
  else assert.equal(JSON.parse(saved['cleanframe.sources.v1'])[0].name,'Console');
}
"""
        subprocess.run(['node', '-e', code], input=json.dumps(files['source-first-run.js'].decode()), text=True, check=True)

    def test_local_config_rejects_secrets_and_invalid_identity(self):
        invalid = self.folder / 'invalid.json'
        for config in [dict(package_id='bad', app_id='bad.Home'),
                       dict(package_id='Owner12345', app_id='Owner12345.Home', password='do-not-read')]:
            invalid.write_text(json.dumps(config), encoding='utf-8')
            with self.assertRaises(ValueError):
                load_config(invalid)


if __name__ == '__main__':
    unittest.main()
