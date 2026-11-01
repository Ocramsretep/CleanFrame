"""Offline safety tests for the reference-TV setup controller."""
import contextlib
import io
from pathlib import Path
import sys
import unittest
from unittest.mock import patch

import setup_nu8000


class Nu8000SetupTests(unittest.TestCase):
    def test_device_action_without_apply_never_reads_private_config_or_connects(self):
        with patch.object(setup_nu8000, 'local_settings', side_effect=AssertionError('config read')):
            with patch.object(setup_nu8000, 'device', side_effect=AssertionError('device access')):
                with patch.object(sys, 'argv', ['setup_nu8000.py', 'assign-home']):
                    with contextlib.redirect_stdout(io.StringIO()) as output:
                        setup_nu8000.main()
        self.assertIn('--apply', output.getvalue())

    def test_existing_app_is_not_replaced(self):
        with patch.object(setup_nu8000, 'inventory', return_value={'Example.App'}):
            with patch.object(setup_nu8000, 'command', side_effect=AssertionError('install command')):
                with contextlib.redirect_stdout(io.StringIO()):
                    setup_nu8000.install_new('sdb', 'tv:26101', 'Example.App',
                                             Path('signed.wgt'), set(), 'CleanFrame')

    def test_failed_install_restores_public_permission(self):
        calls = []

        def fake_command(args, label, timeout=90):
            calls.append(label)
            if label == 'push-CleanFrame':
                return '1 file(s) pushed'
            if label == 'install-CleanFrame':
                raise RuntimeError('synthetic install failure')
            return ''

        with patch.object(setup_nu8000, 'inventory', return_value=set()):
            with patch.object(setup_nu8000, 'HOME_STATE') as state:
                state.exists.return_value = False
                with patch.object(setup_nu8000, 'command', side_effect=fake_command):
                    with self.assertRaisesRegex(RuntimeError, 'synthetic install failure'):
                        setup_nu8000.install_new('sdb', 'tv:26101', 'Example.App',
                                                 Path('signed.wgt'), set(), 'CleanFrame')
        self.assertEqual(calls[-1], 'permit-public')


if __name__ == '__main__':
    unittest.main()
