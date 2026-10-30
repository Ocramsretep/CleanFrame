# TV status for this fork

Recorded through 30 October 2026. This page describes the Samsung UE49NU8079 used for this fork. The detailed installation, remote and build evidence is in the [NU8000 adaptation record](nu8000.md). The [upstream maintainer's LS03D record](upstream-tv-status.md) describes a different TV and must not be used as evidence for this one. Repository work does not authorise a TV connection.

## Hardware and installed app

| Item | This TV |
| --- | --- |
| Model | Samsung UE49NU8079 |
| Firmware | T-KTM2DEUC-1360.0 |
| Platform | Tizen 4.0, ARMv7 |
| Build | Separate NU8000 overlay and the owner's own Samsung signing identity |

The source manifest still requests Tizen 6.5. The ordinary package command does not produce the NU8000 build; use the [documented overlay](nu8000.md#reproduce-an-unsigned-build). The latest recorded NU8000 build was signed and installed in place. Installation returned `install completed` and retained CleanFrame in the installed-app list. The owner confirmed CleanFrame rendering and that a Picture info link opens in the TV browser. See the adaptation record for the exact scope of each physical check.

## Remote and native Home

The physical Home button **opens Samsung Home**, not CleanFrame. Native Home/startup reassignment has **not** been performed on this TV. An ordinary attempt to read the existing Home setting returned `closed`; the upstream one-shot helper targets different hardware and firmware and was not staged. There is no verified native reassignment and rollback method for this TV.

The owner has confirmed CleanFrame rendering, navigation, app launches, Live TV and the Samsung Home escape on this TV. The normal last-app resume option does not pin CleanFrame after another app is used. Dedicated streaming-app buttons have not been remapped or verified as CleanFrame shortcuts.

## Open checks

Keep new TV results separate from browser checks and installation responses. The latest recorded update confirms the compact Picture info focus, side-by-side links and panel placement; any later changed UI or remote flows need their own visible check. Do not transfer upstream Home, startup, Art Mode, app-ID or firmware results to this TV.
