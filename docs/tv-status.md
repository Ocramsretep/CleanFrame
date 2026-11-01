# TV status for this fork

Recorded through 1 November 2026 for the owner's Samsung UE49NU8079. See
the [NU8000 adaptation](nu8000.md) for the working app build and Home test,
and [native wake](native-wake.md) for the installed startup service. The
[upstream LS03D result](upstream-tv-status.md) belongs to a different TV.
Repository work alone does not authorise a TV connection.

| Item | Confirmed on this TV |
| --- | --- |
| Model and firmware | Samsung UE49NU8079, T-KTM2DEUC-1360.0 |
| Platform | Tizen 4.0, ARMv7 |
| CleanFrame | The separate NU8000 build is installed under the owner's existing identity; rendering and remote navigation were confirmed. |
| Focus tiles | The owner confirmed that Dock and dark Home focus tiles become more transparent together at 50% Panel opacity and that physical Home still opens CleanFrame. The clock, weather and Action Bar surfaces passed browser checks at 0%, 50% and 100%. |
| All apps focus | The grid now gives the selected app a rounded Dock-style tile in Type and Glass focus. The owner confirmed that the highlight is clear when moving between apps and that physical Home still opens CleanFrame. |
| Dock editor and Online List | The installed app supports up to 64 ordered Home apps; the owner confirmed scrolling past the ninth app and removal of the old divider after five. In Online pictures List, the owner confirmed the horizontal Action Bar at the lower right, Sources and Picture info above it, and no visible vertical shade edge. Home still opened CleanFrame after the update. |
| Online pictures startup | The current web widget keeps a bounded preview of the last online image while restoring the full cache. The owner saw a steady image after Home return and a full Samsung-logo restart; CleanFrame started automatically. Without a preview, first use stays dark. |
| Startup | A Partner-signed normal `.NET` service starts CleanFrame after a full restart and the observed standby wake. The TV does not need a running PC. Samsung's “start last app” option is off. |
| Physical Home now | **CleanFrame.** The owner confirmed Home from another app after the current installation and again after a full Samsung-logo restart. |
| Physical Home recovery | Two separate package-declared registrations were removed in a previous rollback test; exact database and app-inventory baselines and Samsung Home were restored. Both packages are now installed again with a new saved baseline. |
| Sleep timer | A separate Partner-signed service and a small Home popup are installed. The owner confirmed Off readback, a 30-minute choice, decreasing remaining minutes, Samsung's final 60-second countdown and automatic standby. After short Power-on, CleanFrame auto-started and the timer had reset to Off. A later full Samsung-logo restart also restored CleanFrame automatically; the timer popup read Off and Home still opened CleanFrame. |

The firmware's internal Sleep Timer setter accepts indices `0–4`, mapped to
Off, 30, 60, 120 and 180 minutes. On 1 November a boot-disabled Partner probe
set index `1`: the call succeeded, `savetime` became `1` and `time_t` became
`30`. The immediate Off call restored all four native keys exactly. Firmware
disassembly shows a separate system Sleep Timer node that watches this setting;
its `timer_id` key can remain zero. The new, independently identified service
uses that setter through a local MessagePort. The owner confirmed a successful
read of Off, then selected 30 minutes in CleanFrame and saw the bed badge with
remaining minutes and subsequently confirmed that the badge decreased. Samsung
then displayed its own final 60-second countdown and automatically put the TV
in standby without a keypress. On the next short Power-on, CleanFrame started
automatically, the badge was absent and the popup read Off. The documented Samsung Timer WebAPI requires Tizen 6.5 for
hospitality/signage; this NU8000 runs consumer Tizen 4.0. See the
[native timer bridge](../scripts/native-timer/README.md) for its build and recovery scope.

## Home result and current state

The successful temporary mapping required **both** a CleanFrame
`managed_app` registration and an `XF86Home` rule targeting CleanFrame's
**full application ID**. The owner saw CleanFrame stay visible after a Home
press from another screen, after a restart with Samsung logo and after short
standby/wake. Package and runtime-database captures confirmed the two
temporary packages and exact new rows survived both power cycles.

In the earlier rollback test, the rule package was removed before the registration package. Every
`managed_app`, `key_filter` and `task_filter` row matched the fresh
pre-test baseline; the original installed-app list and Public developer
permission were restored. The owner pressed Home again and confirmed Samsung
Home, then confirmed CleanFrame launched normally. On 1 November, the same
packages were installed again after a new exact baseline was captured. The
owner confirmed Home now opens CleanFrame and leaves it visible. Samsung Home
seemed to flash briefly in an earlier check. Later checks showed no visible
flash, including after a full restart. On 1 November the owner saw another
brief Samsung Home frame when pressing Home from a different app; CleanFrame
then opened and stayed visible. The flash is intermittent, and its cause has
not been measured.
**Both Home packages are currently installed.** No native Home Vconf value or
firmware file was changed. The [working record and private recovery procedure](nu8000.md#temporary-physical-home-mapping)
give the exact scope.

Earlier package-ID-only rules, registration alone and a full-ID rule alone
did not open CleanFrame. A controlled Play/Pause test opened CleanFrame only
with the same combination of registration plus full-ID rule. Other attempted
keys and the upstream LS03D helper are not retained on this TV.

## Startup result and limits

The existing native startup service launched CleanFrame after a full remote
restart and after the observed display transition on short standby/wake,
including a standby cycle after the service had been resident for several
minutes. It remains installed independently of the Home test. Follow the
[native-wake runbook](native-wake.md) for its exact locally retained signed
package and rollback artifact.

A long-running Home shortcut, long-term retention, firmware-update survival,
physical AC cold start and behavior in every Samsung screen remain
unverified. The original Vconf Home values could not be read with the tested
developer privileges. Another TV needs its own signing identity, device
checks, exact recovery baseline and owner-authorised Home test.
