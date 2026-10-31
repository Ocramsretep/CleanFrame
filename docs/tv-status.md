# TV status for this fork

Recorded through 31 October 2026. This page describes the Samsung UE49NU8079 used for this fork. The [current native startup runbook](native-wake.md) gives the short reproducible path; detailed installation, remote and build evidence is in the [NU8000 adaptation record](nu8000.md). The [upstream maintainer's LS03D record](upstream-tv-status.md) describes a different TV and must not be used as evidence for this one. Repository work does not authorise a TV connection.

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

A later [read-only Partner .NET probe](nu8000.md#read-only-home-baseline-test-31-october-2026) tried the managed getters for four Home/firstscreen keys and the auto-start key. Each returned `MethodAccessException`; these exact Vconf recovery values remain unavailable. The separate probe was removed, the original app inventory and Public developer permission were restored, and the owner confirmed that Home still opens Samsung Home and CleanFrame opens normally. No Home rule or native setting was written.

A [read-only service captured the firmware app-context SQLite file](nu8000.md#live-app-context-database-and-non-home-rule-tests-31-october-2026) at `/etc/tvctx-manager/.app-context.db`; it matched the extracted firmware copy. Subsequent checks of that path during non-Home `XF86Color` rule installations found no test rows. These checks did **not** read the active runtime database, as established by the [later path and installer test](nu8000.md#actual-runtime-database-and-live-installer-test-31-october-2026). The test packages were removed, Public developer permission and app inventory restored, and the owner confirmed normal Home and CleanFrame behaviour. No `XF86Home` rule was installed.

A [subsequent live read-only test](nu8000.md#live-plugin-and-installed-manifest-check-31-october-2026) confirmed that the plugin registry, plugin file and installed package's `app-context` manifest element are present on this TV. `dlog` produced no messages. After the owner explicitly approved full database transfer to the local receiver, a [repeat capture](nu8000.md#repeat-live-database-check-with-explicit-transfer-approval) of the same `/etc` file found no test rows and remained byte-identical to the firmware baseline. That result concerns the firmware file only.

[Further firmware analysis](nu8000.md#package-manager-privileges-and-attempted-live-uid-observation) found that the package-manager service runs as `app_fw` with configured file-access capabilities and launches a backend with a UID 301 context. A bounded read-only process-UID probe worked when idle but captured no matching process. Its second launch failed. A fresh first-launch retry sent timing markers during the rule installation but still captured no matching process. The apparent missing rule was later explained by reading the wrong database path. After each attempt both test packages were removed, Public permission and the 257-app inventory were restored; the owner confirmed normal physical Home and CleanFrame throughout.

An [offline replay of the extracted ARM firmware parser](nu8000.md#offline-arm-parser-replay-31-october-2026) accepted the signed `XF86Color` test manifest and inserted one app row and one key-filter row into a local copy of the firmware database. A later live test found the same two kinds of rows in the **actual runtime database** while the rule was installed.

A [static trace of the normal TPK path](nu8000.md#firmware-trace-of-the-normal-tpk-plugin-path-31-october-2026) confirms that it schedules the parser-plugin step and builds the filtered XML used in the replay. The [live file watcher and runtime-database captures](nu8000.md#actual-runtime-database-and-live-installer-test-31-october-2026) now show that the installer opens and modifies `/opt/dbspace/.app-context.db`. During the isolated `XF86Color` installation, it added one `managed_app` and one `key_filter` row; after uninstall, all table rows matched the starting capture, including both existing Home rules. The app inventory and Public permission were restored. This establishes registration and cleanup for a non-Home rule, not Home-button precedence or Vconf recovery values.

An [owner-authorised temporary `XF86Home` test](nu8000.md#temporary-home-rule-and-physical-button-test-31-october-2026) registered a CleanFrame launch rule in that runtime database. The owner pressed physical Home from another screen and saw **Samsung Home**. The test rule was removed; all database table rows and the 257-app inventory matched the pre-test baseline, Public permission was restored, and the owner confirmed Home and CleanFrame still worked normally. Why the registered rule did not win remains unresolved. No permanent Home reassignment was made.

[Offline follow-up](nu8000.md#offline-home-rule-selection-and-reload-follow-up-31-october-2026) found a roughly five-second database reload after install notification and a key-handler collision check for rules with no override. The actual ARM parser accepts `override="true"` on the Home `<source>`. A [subsequent owner-authorised physical test](nu8000.md#temporary-home-override-and-physical-button-test-31-october-2026) confirmed the new rule with `override=true` in the runtime database, yet Home still opened Samsung Home. The package was removed and exact database rows, 257-app inventory, Public permission, and normal visible behavior were restored. Whether the live manager reloaded this rule or another Home route took precedence remains unverified; there is no working Home remap from these additive-rule tests.

An [additional full-restart test](nu8000.md#home-override-after-a-full-tv-restart-31-october-2026) reinstalled the same override-enabled package. After the owner restarted through the Samsung logo, both package and exact test Home row were still present, but physical Home still opened Samsung Home. The test package was removed afterward; original database rows, app inventory, Public permission and visible behavior were restored. A recheck of the earlier file watcher also found runtime-database read opens about 5.2 seconds after the non-Home rule installation, consistent with the firmware's reload timer, though the reading process was not identified. A missing restart alone therefore does not explain the result. No permanent Home reassignment exists on this TV.

[Other physical-key checks](nu8000.md#other-physical-key-controls-31-october-2026) found that a temporary `XF86PlayBack` rule aimed at CleanFrame was registered, but physical Play/Pause still controlled Timeshift. The combined color/number button prevented a direct red-key test. The remote's rectangle-plus button caused no visible response and no CleanFrame DOM keyboard event, although Left/Right control events were recorded in the same debug session. A system-level signal for that button has not been established. Temporary rule packages were removed with database rows, app inventory and Public permission restored; the debug listener was removed. These checks do not establish a working physical shortcut or Home reassignment.

A [bounded live process-visibility probe](nu8000.md#bounded-live-process-visibility-test-31-october-2026) showed that a normal developer .NET service could read only one of three numeric `/proc` entries and saw no `app_fw` or installer process. The planned `XF86Color` reinstall was therefore skipped. The probe was removed, the original 257-app inventory matched and the saved Public permission file was returned. The owner confirmed normal physical Home and CleanFrame behavior. This route cannot establish backend capabilities or plugin invocation.

The owner has confirmed CleanFrame rendering, navigation, app launches, Live TV and the Samsung Home escape on this TV. The normal last-app resume option does not pin CleanFrame after another app is used. Dedicated streaming-app buttons have not been remapped or verified as CleanFrame shortcuts.

On 31 October, an authorised investigation confirmed the model, Tizen 4.0 / ARMv7 and the installed CleanFrame identity. SDB reported shell/root/app-command support disabled and file synchronisation as `push` only. Ordinary `id` and the Home-setting getter returned `closed`. An explicitly authorised, bounded package-name marker/identity/timing probe also returned `closed` through Windows SDB 4.2.36, without the expected two-second delay. A separately authorised direct-SDB test confirmed working handshakes, app-list and ordinary installer controls, but the same encoded probes received immediate CLSE packets without output or the expected delay. The failure is therefore not solely a Windows CLI issue; other payloads or access paths remain untested. Post-checks confirmed restored ordinary SDB connectivity and an unchanged installed-app list. The HTTP information endpoint returned firmware `Unknown`; 1360.0 remains the previously recorded version, not a fresh firmware readback. No helper was staged, app launched, restart requested or native setting changed. See the [investigation details](nu8000.md#home-and-fixed-startup-investigation-31-october-2026).

An offline analysis subsequently downloaded the official 1360.0 firmware,
decrypted its kernel and system image and extracted the system files. Static
analysis found an SDB character filter that rejects characters used in the
failed probe. The older app-context manager reads `db/first_screen/type` for its
firstscreen task; this is a research lead, not a verified CleanFrame Home
assignment. Startup also has a separate Samsung firstscreen script and app-boot
manager. No additional TV connection or setting change was made. Firmware
defaults are not an exact-value recovery baseline for the owner's TV. See the
[offline firmware record](nu8000.md#offline-firmware-analysis-with-rea-31-october-2026).

Further offline REA analysis found that the managed Vconf getters also require
an internal platform privilege, enforced through Cynara before reading the
setting. No .NET diagnostic app was installed. Samsung firstscreen's own
manifest declares an `XF86Home` launch rule, and the package parser has
app-ID-scoped cleanup code. Ordinary signed-package acceptance, rule precedence
and actual rollback remain unverified; no Home rule was installed or changed.
See the [managed API and manifest follow-up](nu8000.md#follow-up-managed-getters-and-manifest-rules).

The newer installer's registry was subsequently located and explicitly lists
the `app-context` plugin. Separately, the TPK installer strips boot/restart
attributes at lower signature levels, while Partner and Platform skip that
branch. A Partner-signed boot-service experiment is a concrete research lead,
not a verified fixed-startup solution; the latest locally signed widget still
uses Public distributor certificates. No new certificate or TV package was
created. See the [installer and boot follow-up](nu8000.md#follow-up-active-plugin-registry-and-boot-certificate-levels).

## Open checks

On 31 October, Samsung successfully issued a device-bound Partner distributor
test certificate after the owner completed sign-in. Local SDK signing passed;
the author certificate and application payload were retained, and the original
profile remains the default. See the
[certificate issuance record](nu8000.md#partner-test-certificate-issued-31-october-2026).

The subsequent authorised startup probe was blocked before a boot test. A
separate Partner-signed diagnostic widget was rejected with `118012`, while its
identical Public-signed payload installed and ran. The owner confirmed that the
live `web.service` capability was `false`. No Web service or boot hook was
installed; Samsung warns against launching services when this capability is
absent. The diagnostic was uninstalled and CleanFrame was launched again; the
owner confirmed its normal interface without rendering errors. The subsequent
tests below resolve the Partner rejection and assess the native alternative.
See the [TV probe record](nu8000.md#partner-startup-probe-on-the-tv-31-october-2026).

An offline native-service follow-up confirmed the shipped .NET 4.0 service and
AppControl APIs plus AMD's on-boot service loader. A separate Partner-signed
.NET service is a concrete test candidate, but package acceptance, cold-boot
survival, foreground launch and standby wake remain unverified. Samsung's
historical Tizen 4.0 documentation warns that developer-installed .NET apps are
removed on cold boot. No native test package was built or installed. See the
[native-service investigation](nu8000.md#native-service-feasibility-31-october-2026).

The follow-up device test resolved Partner error `118012` by transferring the
matching Samsung device profile, with explicit owner permission and subsequent
Public-profile restoration. Partner WGT installation and display were confirmed.
A separate Partner-signed .NET service then installed and manually opened
CleanFrame, confirmed by the owner. Its uninstall restored the original app-ID
list. After reinstalling that boot-disabled service, the owner performed a full
remote restart with the Samsung logo. The TV removed the native test package;
CleanFrame remained installed and the original app-ID list was restored exactly.
CleanFrame was reopened and its normal interface confirmed. No test package
remains installed and no autostart was enabled. The tested .NET approach therefore
does not provide durable startup on this TV. Standby wake remains untested. See the
[native manual test](nu8000.md#partner-permission-and-native-manual-test-31-october-2026).

Further offline firmware analysis located an explicit power-on cleanup in
Samsung's BuiltInAppUpgrader: it uninstalls removable, writable packages carrying
the internal `appdebugging` privilege, except packages containing a
`dotnet-inhouse` application. The native SDB installer supplies `-G`, which causes
the package installer to add that privilege independently of compiler build mode
and Partner signing. This explains the tested disappearance consistently with
Samsung's warning, though no live cleanup log was captured. A non-debug install
route and the `dotnet-inhouse` exception remain unverified; neither was applied.
No additional TV connection or change was made. See the
[cleanup mechanism and candidate limitations](nu8000.md#cold-boot-cleanup-mechanism-31-october-2026).

The subsequent explicitly authorised `dotnet-inhouse` test succeeded in
installation, ordinary uninstallation and survival of one full restart with the
Samsung logo. Only the probe's application type changed; boot/restart remained
disabled. Manual execution after restart did not open CleanFrame, confirmed by
the owner. Offline runtime disassembly found that `SetAppInfoInhouse` requires the
internal Platform privilege and exits when it is absent. Partner signing is
therefore sufficient for this tested package's installation but not its inhouse
execution path. The probe was successfully uninstalled after restart as well,
the baseline app-ID set restored, and normal CleanFrame display confirmed by the
owner. Public device permission is restored. No test package or boot hook remains.
See the [inhouse test record](nu8000.md#inhouse-persistence-and-runtime-test-31-october-2026).

The owner subsequently requested normal `dotnet`
installation without the SDK debug marker. The original signed probe TPK installed
through the existing `vd_appinstall`/WAS route, and ordinary native uninstall
restored the baseline exactly. After reinstalling through WAS and restoring the
Public device profile, the probe survived one owner-confirmed full restart with
the Samsung logo. Manual execution afterwards opened CleanFrame successfully,
confirmed by the owner. The inspected route avoids the native SDB `-G` template;
the installed privilege list was not directly read back. The normal `dotnet`
probe was left installed after that test, with `on-boot=false` and
`auto-restart=false`. Production CleanFrame is unchanged and visible; Public
device permission was restored. Autostart was disabled at that stage.
See the [WAS installation and persistence record](nu8000.md#normal-dotnet-persistence-through-was-installation-31-october-2026).

**Latest native-service state:** the owner explicitly authorised autostart. The
same service was updated through WAS to `on-boot=true`, `auto-restart=false`,
version `1.0.1`, with the exact boot-disabled package saved for recovery. The
owner confirmed automatic CleanFrame startup after a full Samsung-logo restart
and after normal short-Power off/on with YouTube previously open. TV content
appeared first; on the normal power cycle YouTube appeared next, then CleanFrame
opened automatically. No assistant launch command was sent during either test.
Final read-only inventory matched the pre-update app-ID set. Autostart remains
enabled, Public device permission is restored and production CleanFrame is
unchanged. The owner then disabled last-app auto-start and confirmed another
normal off/on test: CleanFrame still opened automatically and YouTube no longer
appeared. A later repeat test failed to start CleanFrame, according to the owner;
the next test showed CleanFrame immediately without TV content. The owner
confirmed a different app or TV programme before switching off with a short
Power press. This establishes immediate appearance in one normal power cycle,
but not the underlying service event or a guaranteed delay for other cycles.
The earlier successes establish feasibility, not
reliable startup on every power cycle. No device access or update accompanied
this failure report; the last recorded installation remains the enabled service.
The cause (wake trigger, service execution, launch failure or foreground takeover)
has not been established. A later read-only retry confirmed the service still
installed and inventory unchanged. At the owner's request, diagnostic version
`1.0.2` is now installed with a bounded private startup journal and best-effort
LAN export, retaining the one-shot launch behaviour and boot settings. Public
device permission is restored; exact `1.0.1` recovery is saved. The manual
diagnostic run reached its launch call in about 25 ms of managed execution and
normal CleanFrame display was owner-confirmed. The next two owner cycles produced
a delayed successful start and a failure lasting over a minute. An announced
manual history dump recovered one intervening automatic run at kernel uptime
13.19 seconds under a new boot ID; its launch call returned after about 4.4
seconds. The dump ran under that same boot ID, with no additional recorded
invocation for the second cycle. This strongly supports real boot versus standby
wake as the distinction; the one-shot boot service is not a verified standby
solution. Manual CleanFrame display was again owner-confirmed. Samsung-specific
managed wake subscriptions check Platform privilege. A subsequent separate
signed test physically verified generic `Display.StateChanged`: in one short
off/on cycle the same service process and kernel boot ID recorded state `-1`
followed by `Normal` six seconds later, while the owner saw TV content. Its event
handler only logged, so this does not yet demonstrate a CleanFrame wake launch.
An earlier cycle during that test was a full kernel restart and CleanFrame
appeared after roughly five seconds; one intermediate attempt was invalid due to
an incorrectly accepted `launch failed` response, and the controller check was
fixed before the successful standby observation. The three-minute event-test
package was removed afterwards and the exact `1.0.2` boot diagnostic package
restored, with Public permission and app inventory checked. Long standby
retention remained untested at that stage. The owner then requested the
implementation. A Partner-signed normal `dotnet` service `1.0.4` now stays
resident after its on-boot CleanFrame launch and reacts to the verified
`-1` → `Normal` display sequence with one launch request. In a short standby
cycle, the log showed exactly one wake request and the owner reported CleanFrame
immediately visible. The owner also confirmed an automatic CleanFrame launch
after a full Samsung-logo restart, taking more than ten seconds. Public device
permission is restored and exact `1.0.2` rollback is saved. A later read-only
post-restart inventory matched the expected app-ID set; the first SDB attempt
had failed while its service was still unavailable. After at least five minutes
with another app open, the owner repeated short off/on and confirmed CleanFrame
opened automatically. The journal showed the same post-restart service run
receiving `-1`, then `Normal` and sending one wake request almost eight minutes
after it was created. This confirms the resident service through that interval;
days-long retention remains untested. The current installed
version is the resident `1.0.4` wake launcher; production CleanFrame is unchanged.
See the
[autostart test and rollback record](nu8000.md#native-autostart-device-test-31-october-2026).

Keep new TV results separate from browser checks and installation responses. The compact Picture info focus, side-by-side links and panel placement are confirmed. The owner also confirmed the latest Home Apps settings update: Vertical position appears for Dock and is hidden for List. Do not transfer upstream Home, startup, Art Mode, app-ID or firmware results to this TV.
