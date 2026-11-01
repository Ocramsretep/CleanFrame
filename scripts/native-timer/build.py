"""Build the separate NU8000 sleep timer service offline; never contacts the TV."""
from pathlib import Path
import json
import re
import subprocess
import sys
import zipfile
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[2]
HERE = Path(__file__).resolve().parent
CONFIG = ROOT / '.local' / 'native-timer.json'
OUT = ROOT / 'dist' / 'native-timer'
APP_ID = re.compile(r'^[A-Za-z0-9_-]+\.[A-Za-z0-9_.-]+$')
PACKAGE_ID = re.compile(r'^[A-Za-z0-9_-]+$')


def required_file(value):
    path = Path(value).expanduser().resolve(strict=True)
    if not path.is_file():
        raise ValueError('Expected a file in the local build configuration')
    return path


def main():
    cfg = json.loads(CONFIG.read_text(encoding='utf-8'))
    package = cfg['package_id']
    service = cfg['service_app_id']
    target = cfg['target_app_id']
    version = cfg['package_version']
    if not PACKAGE_ID.fullmatch(package) or not APP_ID.fullmatch(service) or not APP_ID.fullmatch(target):
        raise ValueError('Invalid SDK-generated identity')
    if not service.startswith(package + '.') or service == target:
        raise ValueError('Service and foreground app must have separate package identities')
    if not re.fullmatch(r'[0-9]+\.[0-9]+\.[0-9]+', version):
        raise ValueError('Invalid package version')
    sdk = Path(cfg['sdk_path']).expanduser().resolve(strict=True)
    cli = sdk / 'tools' / 'ide' / 'bin' / 'tizen.bat'
    if not cli.is_file():
        raise ValueError('Tizen SDK command-line packager is missing')
    refs = Path(cfg['references_dir']).expanduser().resolve(strict=True)
    names = sorted(p.name for p in refs.glob('*.dll'))
    if not {'mscorlib.dll', 'Tizen.Applications.Common.dll', 'Tizen.Applications.Service.dll'}.issubset(names):
        raise ValueError('Tizen 4.0 compile references are incomplete')
    icon = required_file(cfg['icon_png'])
    template = (HERE / 'TimerService.cs.in').read_text(encoding='utf-8')
    for marker, value in {'__TARGET_APP__': target}.items():
        if template.count(marker) != 1:
            raise ValueError('Unexpected source template')
        template = template.replace(marker, value)
    if re.search(r'__[A-Z_]+__', template):
        raise ValueError('Unresolved template marker')
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / 'TimerService.cs').write_text(template, encoding='utf-8')
    (OUT / 'compile.rsp').write_text('\n'.join([
        '-nologo', '-noconfig', '-nostdlib+', '-target:exe', '-langversion:6',
        '-optimize+', '-out:/work/TimerService.dll',
        *('-r:/refs/' + name for name in names),
        '/work/TimerService.cs', ''
    ]), encoding='utf-8')
    docker = [
        'docker', 'run', '--rm', '--network', 'none',
        '--mount', 'type=bind,source=' + str(OUT) + ',target=/work',
        '--mount', 'type=bind,source=' + str(refs) + ',target=/refs,readonly',
        'mcr.microsoft.com/dotnet/sdk:8.0', 'sh', '-lc',
        'dotnet $(find /usr/share/dotnet/sdk -path "*/Roslyn/bincore/csc.dll" -print -quit) @/work/compile.rsp'
    ]
    subprocess.run(docker, check=True, timeout=120)
    ns = 'http://tizen.org/ns/packages'
    ET.register_namespace('', ns)
    manifest = ET.Element('{' + ns + '}manifest', {'api-version': '4.0', 'package': package, 'version': version})
    ET.SubElement(manifest, '{' + ns + '}profile', {'name': 'tv'})
    app = ET.SubElement(manifest, '{' + ns + '}service-application', {
        'appid': service, 'exec': 'TimerService.dll', 'type': 'dotnet',
        'multiple': 'false', 'nodisplay': 'true', 'taskmanage': 'false',
        'on-boot': 'true', 'auto-restart': 'true'
    })
    ET.SubElement(app, '{' + ns + '}label').text = 'CleanFrame Sleep Timer'
    ET.SubElement(app, '{' + ns + '}icon').text = 'icon.png'
    manifest_data = ET.tostring(manifest, encoding='utf-8', xml_declaration=True)
    unsigned = OUT / 'native-timer-unsigned.tpk'
    with zipfile.ZipFile(unsigned, 'w', zipfile.ZIP_DEFLATED) as package_file:
        package_file.writestr('tizen-manifest.xml', manifest_data)
        package_file.write(OUT / 'TimerService.dll', 'bin/TimerService.dll')
        package_file.write(icon, 'shared/res/icon.png')
    signed_dir = OUT / 'signed'
    signed_dir.mkdir(exist_ok=True)
    result = subprocess.run([
        str(cli), 'package', '-t', 'tpk', '-s', cfg['signing_profile'],
        '-o', str(signed_dir), '--', str(unsigned)
    ], capture_output=True, timeout=90)
    (OUT / 'signing-private.log').write_bytes(result.stdout + result.stderr)
    if result.returncode:
        raise RuntimeError('SDK signing failed; private log is in dist/native-timer')
    signed = signed_dir / unsigned.name
    with zipfile.ZipFile(signed) as package_file:
        files = {name for name in package_file.namelist() if not name.endswith('/')}
        expected = {'tizen-manifest.xml', 'bin/TimerService.dll', 'shared/res/icon.png', 'author-signature.xml', 'signature1.xml'}
        if files != expected or package_file.read('tizen-manifest.xml') != manifest_data or package_file.read('bin/TimerService.dll') != (OUT / 'TimerService.dll').read_bytes():
            raise RuntimeError('Signed package contents differ from the validated build')
    print('Signed package ready in dist/native-timer/signed. No TV operation was performed.')


if __name__ == '__main__':
    try:
        main()
    except (KeyError, ValueError, FileNotFoundError, subprocess.CalledProcessError, subprocess.TimeoutExpired, RuntimeError) as exc:
        print(type(exc).__name__ + ': ' + str(exc), file=sys.stderr)
        sys.exit(1)
