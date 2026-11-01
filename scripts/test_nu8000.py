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
        cls.report = build(cls.config, timer_config_path=False)
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
        self.assertIn(b'"pixabayKey": ""', self.files['daily-config.js'])
        self.assertIn(b'org.tizen.tv-viewer', self.files['device.js'])
        self.assertIn(b'evKhCgZelL.AmazonIgnitionLauncher2', self.files['main.js'])
        self.assertIn(b'org.tizen.menu', self.files['device.js'])
        self.assertIn(b"http://tizen.org/appcontrol/operation/setting", self.files['device.js'])
        self.assertIn(b"launchAppControl(control, 'org.tizen.menu'", self.files['device.js'])
        self.assertIn(b'Live TV', self.files['sources.js'])

    def test_timer_service_id_is_private_and_matches_target_app(self):
        timer = self.folder / 'timer.json'
        timer.write_text(json.dumps({'target_app_id': 'Owner12345.Home',
                                     'service_app_id': 'Timer12345.CleanFrameTimer'}), encoding='utf-8')
        report = build(self.config, timer_config_path=timer)
        with zipfile.ZipFile(report['widget']) as archive:
            self.assertEqual(archive.read('timer-config.js'),
                             b'window.CleanFrameTimerServiceId = "Timer12345.CleanFrameTimer";\n')
        timer.write_text(json.dumps({'target_app_id': 'Wrong12345.Home',
                                     'service_app_id': 'Timer12345.CleanFrameTimer'}), encoding='utf-8')
        with self.assertRaisesRegex(ValueError, 'does not match'):
            build(self.config, timer_config_path=timer)

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

    def test_youtube_launch_route_preserves_catalogue_and_error_handling(self):
        code = r"""
const vm = require('node:vm'), assert = require('node:assert/strict');
const source = JSON.parse(require('node:fs').readFileSync(0, 'utf8'));
const legacy = '9Ur5IzDKqV.TizenYouTube', native = 'com.samsung.tv.cobalt-yt';
const launches = [], timers = new Map(); let next = 0;
const window = {tizen: {application: {
  getCurrentApplication: () => ({appInfo:{id:'Owner12345.Home'}}),
  launch: (id, ok, fail) => launches.push({id, ok, fail}),
  getAppsInfo: ok => ok([
    {id:legacy, name:'YouTube', show:true},
    {id:native, name:'Youtube', show:true}
  ])
}}};
vm.runInNewContext(source, {window,
  setTimeout: (fn, ms) => {timers.set(++next, {fn, ms}); return next;},
  clearTimeout: id => timers.delete(id)
});
const device = window.FrameDevice;
let catalogue;
device.apps((err, apps) => {assert.equal(err, null); catalogue = apps;});
assert.equal(catalogue.length, 1);
assert.equal(catalogue[0].appId, legacy);
assert.equal(catalogue[0].brand, 'youtube');
for (const call of [done => device.launch('youtube', done),
                   done => device.launchApp(legacy, done),
                   done => device.launchApp(catalogue[0].appId, done),
                   done => device.launchApp(native, done)]) {
  let replies = 0;
  call(err => {assert.equal(err, null); replies++;});
  assert.equal(launches.at(-1).id, native);
  launches.at(-1).ok(); assert.equal(replies, 1);
}
device.launchApp('org.tizen.netflix-app', err => assert.equal(err, null));
assert.equal(launches.at(-1).id, 'org.tizen.netflix-app'); launches.at(-1).ok();
let denied;
device.launchApp(legacy, err => {denied = err;});
launches.at(-1).fail({name:'SecurityError', message:'Denied'});
assert.equal(denied.detail, 'Denied');
assert.equal(launches.at(-1).id, native); // Never silently fall back to broken route.
let timeoutReplies = 0;
device.launchApp(legacy, err => {assert.match(err.message, /did not respond/); timeoutReplies++;});
const pending = [...timers.values()]; assert.equal(pending.length, 1);
assert.equal(pending[0].ms, 8000); pending[0].fn(); launches.at(-1).ok();
assert.equal(timeoutReplies, 1);
"""
        subprocess.run(['node', '-e', code],
                       input=json.dumps(self.files['device.js'].decode()), text=True, check=True)

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

    def test_tv_settings_uses_explicit_app_control_and_reports_failures(self):
        code = r"""
const vm = require('node:vm'), assert = require('node:assert/strict');
const source = JSON.parse(require('node:fs').readFileSync(0, 'utf8'));
const calls = [], timers = new Map(); let next = 0;
function ApplicationControl(operation) { this.operation = operation; }
const application = { launchAppControl: (control, id, ok, fail) => calls.push({control, id, ok, fail}) };
const window = {tizen: {application}};
vm.runInNewContext(source, {window, tizen: {ApplicationControl},
  setTimeout: (fn, ms) => {timers.set(++next, {fn, ms}); return next;},
  clearTimeout: id => timers.delete(id)
});
const settings = window.FrameDevice.settings;
let replies = [];
settings(err => replies.push(err));
assert.equal(calls.length, 1);
assert.equal(calls[0].id, 'org.tizen.menu');
assert.equal(calls[0].control.operation, 'http://tizen.org/appcontrol/operation/setting');
calls[0].ok(); calls[0].fail({name:'LateError'});
assert.deepEqual(replies, [null]);
settings(err => replies.push(err));
calls[1].fail({name:'SecurityError', message:'Denied'});
assert.equal(replies[1].detail, 'Denied');
settings(err => replies.push(err));
assert.equal([...timers.values()].at(-1).ms, 8000);
[...timers.values()].at(-1).fn(); calls[2].ok();
assert.match(replies[2].message, /did not respond/);
assert.equal(replies.length, 3);
"""
        subprocess.run(['node', '-e', code],
                       input=json.dumps(self.files['device.js'].decode()), text=True, check=True)

    def test_local_config_rejects_secrets_and_invalid_identity(self):
        invalid = self.folder / 'invalid.json'
        for config in [dict(package_id='bad', app_id='bad.Home'),
                       dict(package_id='Owner12345', app_id='Owner12345.Home', password='do-not-read')]:
            invalid.write_text(json.dumps(config), encoding='utf-8')
            with self.assertRaises(ValueError):
                load_config(invalid)

    def test_local_config_accepts_up_to_64_home_apps(self):
        config_path = self.folder / 'large-selection.json'
        base = {'package_id': 'Owner12345', 'app_id': 'Owner12345.Home'}
        home = [f'Example{i:03d}.Consumer' for i in range(64)]
        config_path.write_text(json.dumps({**base, 'selection': {'home': home}}), encoding='utf-8')
        self.assertEqual(load_config(config_path)[1]['home'], home)
        config_path.write_text(json.dumps({**base, 'selection': {'home': home + ['Example064.Consumer']}}), encoding='utf-8')
        with self.assertRaisesRegex(ValueError, 'one to 64'):
            load_config(config_path)


if __name__ == '__main__':
    unittest.main()
