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
| Online pictures startup | The current web widget keeps a bounded preview of the last online image while restoring the full cache. The owner saw a steady image after Home return and a full Samsung-logo restart; CleanFrame started automatically. Without a preview, first use stays dark. |
| Startup | A Partner-signed normal `.NET` service starts CleanFrame after a full restart and the observed standby wake. The TV does not need a running PC. Samsung's “start last app” option is off. |
| Physical Home now | **CleanFrame.** The owner confirmed Home from another app after the current installation and again after a full Samsung-logo restart. |
| Physical Home recovery | Two separate package-declared registrations were removed in a previous rollback test; exact database and app-inventory baselines and Samsung Home were restored. Both packages are now installed again with a new saved baseline. |

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
seemed to flash briefly in an earlier check. In the latest owner checks, it
did not visibly flash, including after a full restart; the reason is unknown.
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
