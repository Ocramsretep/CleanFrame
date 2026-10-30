"""Inject owner-supplied API configuration without copying it into source."""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def online_overlay(root=ROOT, include_private=True):
    key = ''
    path = root / '.local/daily-pictures.json'
    if include_private and path.exists():
        try:
            if path.is_symlink():
                raise ValueError()
            data = json.loads(path.read_text(encoding='utf-8-sig'))
            key = data.get('pixabayKey', '')
            if not isinstance(key, str) or (key and not re.fullmatch(r'[A-Za-z0-9_-]{10,150}', key)):
                raise ValueError()
        except (ValueError, AttributeError, OSError):
            raise ValueError('Invalid local picture configuration; check .local/daily-pictures.json.') from None
    return {'daily-config.js': ('window.CleanFrameDailyConfig = ' + json.dumps({'pixabayKey': key}) + ';\n').encode()}
