"""Guided, reference-TV-only NU8000 build and installation workflow.

No device command is issued without --apply. Private identities, signed files,
device permission profiles and the Home recovery baseline stay under .local/.
"""

import argparse
import hashlib
import json
from pathlib import Path
import re
import subprocess
import sys
import time
import urllib.request
import zipfile

from private_files import check_signed_widget
from prepare_nu8000 import build as build_widget


ROOT = Path(__file__).resolve().parents[1]
LOCAL = ROOT / '.local'
HOME = LOCAL / 'native-home-investigation'
HOME_RUNNER = HOME / 'run-home-fullid-registration.py'
HOME_STATE = HOME / 'managed-cleanframe-registration/live-test-state.json'
WAKE_STATE = LOCAL / 'partner-certificate-test/native-wake-launch/state.json'
WAKE_CONFIG = LOCAL / 'native-wake.json'
APP_CONFIG = LOCAL / 'nu8000.json'
PERMIT = LOCAL / 'partner-certificate-test/permit-recovery/change-permit.py'
SETUP_STATE = LOCAL / 'setup-nu8000-state.json'
LOGS = LOCAL / 'setup-nu8000-logs'

DEVICE_ACTIONS = {'install-app', 'launch-app', 'install-startup', 'assign-home',
                  'verify-home', 'restore-home'}


def read_json(path):
    return json.loads(path.read_text(encoding='utf-8-sig'))


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def checked_package(path, expected_hash):
    package = Path(path).resolve(strict=True)
    if digest(package) != expected_hash:
        raise ValueError('Signed package hash differs from the private record')
    return package


def local_settings():
    app = read_json(APP_CONFIG)
    wake = read_json(WAKE_CONFIG)
    installed_wake = read_json(WAKE_STATE)
    if app['app_id'] != wake['target_app_id']:
        raise ValueError('App and startup target identities differ')
    if wake['service_app_id'] != installed_wake['app_id']:
        raise ValueError('Startup service identities differ')
    if wake['package_id'] != installed_wake['package_id']:
        raise ValueError('Startup package identities differ')
    if not installed_wake.get('validated'):
        raise ValueError('Startup package has not been validated')
    signed_wake = checked_package(installed_wake['signed_package'], installed_wake['sha256'])
    with zipfile.ZipFile(signed_wake) as archive:
        manifest = archive.read('tizen-manifest.xml').decode('utf-8')
        if ('appid="' + wake['service_app_id'] + '"') not in manifest:
            raise ValueError('Startup package manifest identity differs')
    runner = (LOCAL / 'partner-certificate-test/native-wake-launch/device-test.py').read_text()
    serial = re.search(r"serial='([0-9.]+:26101)'", runner)
    if not serial:
        raise ValueError('Reference-TV SDB address is missing')
    permit_source = PERMIT.read_text()
    if "serial='" + serial.group(1) + "'" not in permit_source:
        raise ValueError('Permission controller targets a different TV')
    sdk = Path(wake['sdk_path']).resolve(strict=True)
    sdb = sdk / 'tools/sdb.exe'
    cli = sdk / 'tools/ide/bin/tizen.bat'
    if not sdb.is_file() or not cli.is_file() or not HOME_RUNNER.is_file():
        raise ValueError('Reference workstation tools are incomplete')
    return app, wake, installed_wake, signed_wake, serial.group(1), sdb, cli


def save_state(data):
    SETUP_STATE.write_text(json.dumps(data, indent=2) + '\n', encoding='utf-8')


def command(args, label, timeout=90):
    LOGS.mkdir(exist_ok=True)
    result = subprocess.run([str(part) for part in args], capture_output=True,
                            timeout=timeout)
    log = LOGS / (str(time.time_ns()) + '-' + label + '.log')
    log.write_bytes(result.stdout + result.stderr)
    if result.returncode:
        raise RuntimeError(label + ' failed; private log saved under .local/')
    return (result.stdout + result.stderr).decode('utf-8', errors='replace')


def device(sdb, serial):
    host = serial.split(':')[0]
    with urllib.request.urlopen('http://' + host + ':8001/api/v2/', timeout=5) as response:
        if json.load(response).get('device', {}).get('modelName') != 'UE49NU8079':
            raise ValueError('TV model differs from the tested reference')
    command([sdb, 'connect', serial], 'connect', 20)
    cap = command([sdb, '-s', serial, 'capability'], 'capability', 20)
    if 'platform_version:4.0' not in cap or 'sdk_toolpath:/home/owner/share/tmp/sdk_tools' not in cap:
        raise ValueError('TV capability differs from the tested reference')


def inventory(sdb, serial):
    output = command([sdb, '-s', serial, 'shell', '0', 'applist'], 'inventory', 30)
    return set(re.findall(r"'([^'\r\n]+)'\s*$", output, re.M))


def install_new(sdb, serial, app_id, package, existing, label):
    before = inventory(sdb, serial)
    if app_id in before:
        print(label + ' already installed; no replacement attempted.')
        return
    if HOME_STATE.exists():
        raise ValueError('Restore the active Home assignment before installing another package')
    remote = '/home/owner/share/tmp/sdk_tools/cf-setup-' + str(time.time_ns()) + package.suffix
    try:
        command([sys.executable, PERMIT, 'partner'], 'permit-partner', 60)
        pushed = command([sdb, '-s', serial, 'push', package, remote], 'push-' + label, 60)
        if '1 file(s) pushed' not in pushed or 'failed' in pushed.lower():
            raise RuntimeError('Package transfer was not acknowledged')
        result = command([sdb, '-s', serial, 'shell', '0', 'vd_appinstall', app_id, remote],
                         'install-' + label, 120)
        if 'install completed' not in result.lower() or 'install failed' in result.lower():
            raise RuntimeError('TV installation was not acknowledged')
        after = inventory(sdb, serial)
        if after != before | {app_id} or not existing.issubset(after):
            raise RuntimeError('Installed-app inventory differs from the expected addition')
    finally:
        command([sys.executable, PERMIT, 'restore-public'], 'permit-public', 60)
    print(label + ' installed; Public device permission restored. Confirm visible TV behavior.')


def build_app(app, wake, cli, online_keys):
    report = build_widget(APP_CONFIG, include_online_keys=online_keys)
    signed_dir = Path(report['stage']).parent / 'signed'
    signed_dir.mkdir()
    command([cli, 'package', '-t', 'wgt', '-s', wake['signing_profile'],
             '-o', signed_dir, '--', report['stage']], 'sign-app', 120)
    candidates = list(signed_dir.glob('*.wgt'))
    if len(candidates) != 1:
        raise RuntimeError('Expected exactly one freshly signed widget')
    signed = candidates[0]
    check_signed_widget(signed, {'package_id': app['package_id'], 'app_id': app['app_id']})
    state = read_json(SETUP_STATE) if SETUP_STATE.exists() else {}
    state['app'] = {'package': str(signed), 'sha256': digest(signed),
                    'app_id': app['app_id'], 'package_id': app['package_id']}
    save_state(state)
    print('Signed NU8000 widget built and validated under .local/. No TV change.')


def run_home(phase):
    command([sys.executable, HOME_RUNNER, phase], 'home-' + phase, 240)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action', choices=['plan', 'build-app', 'build-startup',
                        'install-app', 'launch-app', 'install-startup', 'assign-home',
                        'verify-home', 'restore-home'])
    parser.add_argument('--apply', action='store_true', help='Required for every TV operation')
    parser.add_argument('--with-online-keys', action='store_true',
                        help='Include private picture API keys in the app build')
    args = parser.parse_args()
    if args.action in DEVICE_ACTIONS and not args.apply:
        print('Device step prepared: ' + args.action + '. Rerun with --apply after reviewing the TV and recovery state.')
        return
    if args.apply and args.action not in DEVICE_ACTIONS:
        parser.error('--apply is only for TV operations')
    if args.with_online_keys and args.action != 'build-app':
        parser.error('--with-online-keys applies only to build-app')
    app, wake, installed_wake, signed_wake, serial, sdb, cli = local_settings()
    if args.action == 'plan':
        print('Reference UE49NU8079 workflow: build-app, build-startup, install-app, launch-app, '
              'install-startup, assign-home, verify-home. Device steps require --apply. '
              'restore-home uses the exact private baseline. Existing packages are not replaced.')
        print('Home assignment state: ' + ('present' if HOME_STATE.exists() else 'absent'))
        return
    if args.action == 'build-app':
        build_app(app, wake, cli, args.with_online_keys)
        return
    if args.action == 'build-startup':
        command([sys.executable, ROOT / 'scripts/native-wake/build.py'], 'build-startup', 240)
        print('Signed startup package built under dist/. No TV change. The tested package remains the install source.')
        return
    device(sdb, serial)
    if args.action == 'install-app':
        if app['app_id'] in inventory(sdb, serial):
            print('CleanFrame already installed; no replacement attempted.')
            return
        state = read_json(SETUP_STATE)
        item = state['app']
        if item['app_id'] != app['app_id'] or item['package_id'] != app['package_id']:
            raise ValueError('Built app identity differs from current configuration')
        package = checked_package(item['package'], item['sha256'])
        check_signed_widget(package, {'package_id': app['package_id'], 'app_id': app['app_id']})
        install_new(sdb, serial, app['app_id'], package, set(), 'CleanFrame')
    elif args.action == 'launch-app':
        if app['app_id'] not in inventory(sdb, serial):
            raise ValueError('CleanFrame is not installed')
        result = command([sdb, '-s', serial, 'shell', '0', 'execute', app['app_id']],
                         'launch-app', 30)
        if 'successfully launched' not in result.lower():
            raise RuntimeError('TV did not acknowledge the CleanFrame launch')
        print('CleanFrame launch acknowledged. Confirm its visible UI with the owner.')
    elif args.action == 'install-startup':
        if app['app_id'] not in inventory(sdb, serial):
            raise ValueError('Install and visibly check CleanFrame before the startup service')
        install_new(sdb, serial, wake['service_app_id'], signed_wake,
                    {app['app_id']}, 'Startup service')
    elif args.action == 'assign-home':
        if HOME_STATE.exists():
            if read_json(HOME_STATE).get('phase') != 'both':
                raise ValueError('Partial Home state needs inspection and recovery')
            run_home('verify')
            print('Home assignment already installed and database-verified. Confirm with the remote.')
            return
        ids = inventory(sdb, serial)
        if not {app['app_id'], wake['service_app_id']}.issubset(ids):
            raise ValueError('CleanFrame and startup service must be installed first')
        run_home('register')
        try:
            run_home('install-rule')
            run_home('verify')
        except Exception:
            try:
                run_home('cleanup')
            except Exception:
                raise RuntimeError('Home setup and rollback failed; inspect private logs and TV state') from None
            raise
        print('Home rule database-verified. Press Home from another TV screen and confirm CleanFrame.')
    elif args.action == 'verify-home':
        if not HOME_STATE.exists():
            raise ValueError('No active Home baseline found')
        run_home('verify')
        print('Confirm physical Home behavior with the owner.')
    else:
        if not HOME_STATE.exists():
            raise ValueError('No active Home baseline found')
        run_home('cleanup')
        print('Database and inventory restored. Confirm physical Samsung Home with the owner.')


if __name__ == '__main__':
    try:
        main()
    except (KeyError, OSError, ValueError, RuntimeError, subprocess.TimeoutExpired,
            zipfile.BadZipFile) as exc:
        print(type(exc).__name__ + ': ' + str(exc), file=sys.stderr)
        sys.exit(1)
