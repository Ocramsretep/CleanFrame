"""Reproduce the UE49NU8079 overlay offline; no signing or TV connection."""
import argparse
import json
from pathlib import Path
import tempfile
import zipfile

from font_assets import ROOT, write_widget_archive
from local_config import validate_identity
from private_files import check_widget


def load_config(path):
    config = json.loads(Path(path).read_text(encoding='utf-8-sig'))
    if not isinstance(config, dict) or set(config) - {'package_id', 'app_id', 'selection'}:
        raise ValueError('Use only package_id, app_id and optional selection in the local config.')
    identity = {key: config.get(key) for key in ('package_id', 'app_id')}
    validate_identity(identity)
    selection = config.get('selection', {
        'home': ['netflix', 'youtube', 'primevideo', 'disneyplus', 'appletv'],
        'appRecords': [],
    })
    if not isinstance(selection, dict) or set(selection) - {'home', 'appRecords'}:
        raise ValueError('Selection may contain only home and appRecords.')
    home = selection.get('home')
    if (not isinstance(home, list) or not 1 <= len(home) <= 9
            or any(not isinstance(item, str) or not item for item in home)
            or len(set(home)) != len(home)):
        raise ValueError('Selection must contain one to nine distinct app identifiers.')
    records = selection.get('appRecords', [])
    if not isinstance(records, list) or any(
            not isinstance(record, dict) or set(record) - {'id', 'appId', 'name'}
            or not all(isinstance(record.get(key), str) and record[key] for key in ('id', 'appId', 'name'))
            for record in records):
        raise ValueError('App records need only id, appId and name strings.')
    return identity, {'home': home, 'appRecords': records}


def adapt(files, selection):
    files = dict(files)

    def change(name, old, new):
        source = files[name].decode('utf-8')
        if source.count(old) != 1:
            raise ValueError('Upstream source changed; review the NU8000 overlay: ' + name)
        files[name] = source.replace(old, new).encode('utf-8')

    change('config.xml', 'required_version="6.5"', 'required_version="4.0"')
    for name in ('main.js', 'device.js'):
        change(name, 'org.tizen.primevideo', 'evKhCgZelL.AmazonIgnitionLauncher2')
    change('main.js', "art: ['Art Mode', 'art']", "art: ['Live TV', 'art']")
    change('main.js', "perform('Art Mode', FrameDevice.art)", "perform('Live TV', FrameDevice.art)")
    device = files['device.js'].decode('utf-8')
    start_marker, end_marker = '  function art(done) {', '  function home(done) {'
    if device.count(start_marker) != 1 or device.count(end_marker) != 1:
        raise ValueError('Upstream device functions changed; review the NU8000 overlay.')
    start, end = device.index(start_marker), device.index(end_marker)
    if end <= start:
        raise ValueError('Unexpected device function order.')
    files['device.js'] = (device[:start]
                         + "  function art(done) { launchApp('org.tizen.tv-viewer', done); }\n"
                         + device[end:]).encode('utf-8')
    # Preserve the installed adaptation, including its documented unresolved defect.
    # Presence in the app catalogue does NOT establish a supported settings route.
    change('device.js', 'com.samsung.tv.coba.setting', 'org.tizen.menu')
    change('device.js', 'press the remote’s Home button to return to CleanFrame.',
           'press the remote’s Home button to return to Samsung Home.')
    seed = json.dumps(selection, ensure_ascii=True).replace('<', '\\u003c')
    files['first-run.js'] = ("(function () { 'use strict'; try { if (!localStorage.getItem('cleanframe.home.v1') && !localStorage.getItem('cleanframe.shore.v1')) localStorage.setItem('cleanframe.home.v1', JSON.stringify("
                             + seed + ")); } catch (error) {} }());\n").encode('utf-8')
    change('index.html', '<script src="main.js"></script>',
           '<script src="first-run.js"></script>\n<script src="main.js"></script>')
    return files


def build(config_path, root=ROOT):
    identity, selection = load_config(config_path)
    local = root / '.local'
    local.mkdir(exist_ok=True)
    # A fresh folder avoids stale signatures and preserves every earlier build.
    output = Path(tempfile.mkdtemp(prefix='nu8000-', dir=local))
    baseline = output / 'baseline-unsigned.wgt'
    write_widget_archive(baseline, root=root, include_private=False, identity=identity)
    with zipfile.ZipFile(baseline) as archive:
        files = adapt({name: archive.read(name) for name in archive.namelist()}, selection)
    for name in ('LICENSE', 'THIRD_PARTY_NOTICES.md'):
        files[name] = (root / name).read_bytes()
    stage, target = output / 'stage', output / 'CleanFrame-NU8000-unsigned.wgt'
    with zipfile.ZipFile(target, 'w', zipfile.ZIP_DEFLATED) as archive:
        for name, data in sorted(files.items()):
            archive.writestr(name, data)
            destination = stage / name
            destination.parent.mkdir(parents=True, exist_ok=True)
            destination.write_bytes(data)
    check_widget(target)
    report = dict(identity, stage=str(stage), widget=str(target), minimum_tizen='4.0',
                  signed=False, installed=False, native_home_changed=False,
                  known_issue='TV settings can block directional input until Back; see docs/nu8000.md.')
    (output / 'build.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
    return report


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--config', type=Path, default=ROOT / '.local/nu8000.json')
    args = parser.parse_args()
    print(json.dumps(build(args.config), indent=2))
