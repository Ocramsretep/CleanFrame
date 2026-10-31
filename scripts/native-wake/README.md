# NU8000 boot and standby service

This directory contains the source and offline build tool for the **separate**
native service tested on this fork's Samsung UE49NU8079, Tizen 4.0, firmware
T-KTM2DEUC-1360.0. The service opens the installed CleanFrame app once at
system boot and once when a running service sees display state `-1` followed by
`Normal`. It stays resident without a PC. It does not change the physical Home
button or a global TV startup setting. The `-1` state and timing were measured
on this particular TV; do not treat them as a general Tizen contract.

The source template is the same C# text used for the owner-tested `1.0.4`
service after substituting local identities and receiver values. The exact
owner-tested signed TPK and recovery package remain in ignored `.local/`.
Recompilation may yield a different binary hash; install and observe a newly
built package before claiming its physical behavior. No firmware file, signing
key, device address, diagnostic token or generated package is tracked here.

## Rebuild on the configured workstation

1. Read `AGENTS.md`, `docs/tv-status.md` and `docs/native-wake.md`. Confirm the
   target is still the owner's UE49NU8079 and the package/app IDs in the private
   status file match the existing installation. Keep the current branch.
2. Copy `config.example.json` to ignored `.local/native-wake.json` and enter
   the **existing** SDK-generated service identity, production CleanFrame app
   ID, official Samsung SDK path and existing Partner signing profile. On this
   workstation the compile-only Tizen 4 references and `Tizen.System.dll` are
   already retained under ignored `.local/partner-certificate-test/`; select
   their paths. `package_version` is `1.0.4` for the documented tested build;
   use a newer version for a future update to the currently installed package.
   For a separate TV, generate its own identity/certificates and
   obtain references for its Tizen version. Do not reuse this owner's identity.
3. Enter a private diagnostic receiver IP, port and random 32–64-character hex
   token. The service never waits for the receiver and works while the PC is
   off. Keep these values private even if no receiver is running.
4. Run `python scripts/native-wake/build.py` from the repository root. It uses
   the locally available .NET 8 SDK container without network access to
   compile against the Tizen 4 references, then the official SDK CLI to sign.
   Its output is under ignored `dist/native-wake/`. It validates the signed
   payload and has **no TV access**.

This build retains `on-boot=true`, `auto-restart=false`, normal `dotnet` type,
separate service identity and only the `appmanager.launch` and `internet`
privileges. The latter supports best-effort diagnostic UDP export. It does not
authorize root or Platform APIs. Production CleanFrame is not rebuilt here.

## Install or update on this TV

Device access and the owner's authorisation are separate from the offline
build. Before update, save the exact currently installed signed TPK locally,
record its SHA-256 and check that package and application IDs are unchanged.
The TV does not support package readback over SDB, so the recovery artifact is
the exact previously installed local package, **not** a live TV backup. Preserve
the Public device-profile file and matching Partner device-profile file in
ignored `.local/`. Validate both hashes. Do not treat a fresh signing result as
an exact recovery artifact.

The tested installation route is:

```text
sdb connect <TV_IP>:26101
sdb -s <TV_IP>:26101 capability
sdb -s <TV_IP>:26101 shell 0 applist
sdb -s <TV_IP>:26101 push <VERIFIED_PARTNER_DEVICE_PROFILE> /home/owner/share/tmp/sdk_tools/device-profile.xml
sdb -s <TV_IP>:26101 push <SIGNED_TPK> /home/owner/share/tmp/sdk_tools/<UNIQUE_NAME>.tpk
sdb -s <TV_IP>:26101 shell 0 vd_appinstall <SERVICE_APP_ID> /home/owner/share/tmp/sdk_tools/<UNIQUE_NAME>.tpk
sdb -s <TV_IP>:26101 shell 0 applist
sdb -s <TV_IP>:26101 push <VERIFIED_PUBLIC_DEVICE_PROFILE> /home/owner/share/tmp/sdk_tools/device-profile.xml
```

Require `install completed` and the exact expected app-ID set. Restore Public
permission even if installation fails. On this TV, ordinary `sdb install`
added the SDK debug marker and cold-boot cleanup removed the .NET service;
`vd_appinstall` did not. The Partner distributor certificate needs the matching
device profile temporarily for install. The default SDK signing profile stays
the owner's original production profile.

**Rollback:** with Partner device permission temporarily active, uninstall
only the separate service package, check the baseline app-ID set, install the
verified previously installed TPK through `vd_appinstall`, check the expected
inventory, and restore Public permission. The private controller used for this
TV is `.local/partner-certificate-test/native-wake-launch/device-test.py
restore`; it checks the exact saved `1.0.2` package hash and both inventories.
The original `1.0.1` boot-only package is also retained privately. Do not run
the private controller against another TV without adapting its hard-coded
addresses and identity assumptions. Removing the separate service package
removes its package-owned boot registration; CleanFrame is a different package.

## What was physically checked

The owner observed an immediate CleanFrame takeover after a short Power
off/on from another app. The resident service log recorded `-1` then `Normal`
and one wake launch request. After a full Samsung-logo restart from another
app, CleanFrame opened automatically after more than ten seconds, and SDB later
confirmed the app inventory. After the TV remained on with another app for at
least five minutes, a second short off/on also opened CleanFrame; the same
post-restart service run logged the wake nearly eight minutes after creation.
The device's "start last app" menu option was off in the earlier tests. These
checks establish the tested boot and standby paths, not days-long process
retention or firmware-update behavior. See `docs/native-wake.md` for the
compact operator runbook and `docs/nu8000.md` for the full evidence trail.
