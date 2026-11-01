# CleanFrame startup on this NU8000

**Current confirmed state (31 October 2026):** This fork's UE49NU8079 has a
separate Partner-signed normal `.NET` service, version `1.0.4`, installed via
Samsung's `vd_appinstall`. It starts CleanFrame on a real system boot. While
resident, it also starts CleanFrame after the observed display transition
`-1` → `Normal` on a short remote off/on. The TV's "start last app" option is
off. No always-running computer is needed. A separate two-package assignment
currently makes the physical Home button open CleanFrame; see [TV status](tv-status.md).

The owner confirmed automatic CleanFrame display in three meaningful cases:
short standby from another app (immediate); full remote restart with Samsung
logo from another app (more than ten seconds); and short standby after the
post-restart service had been alive almost eight minutes (automatic). The
service journal showed one wake launch request for each tested standby cycle.
An app-ID inventory after the full restart matched the pre-update list. Public
developer device permission was restored. Longer retention and firmware-update
survival remain untested.

For a new coding agent on this workstation:

1. Read `AGENTS.md`, this page and
   [`scripts/native-wake/README.md`](../scripts/native-wake/README.md). The
   concise device results and the working Home test are in
   [NU8000 notes](nu8000.md); earlier experiments remain in Git history and
   need not be repeated to rebuild the existing service.
2. Inspect ignored `.local/partner-certificate-test/native-wake-launch/state.json`.
   Its `signed_package` is the **currently tested** `1.0.4` TPK. Its
   `recovery_package` and `recovery_sha256` refer to the exact previously
   installed `1.0.2` boot-only diagnostic TPK. The older `1.0.1` boot-only TPK
   is recorded under `.local/partner-certificate-test/native-autostart-probe/`.
   The TV cannot provide a fresh package backup through SDB.
3. For a rebuild, use the tracked source template and build tool in
   `scripts/native-wake/`. The ignored `.local/native-wake.json` on this
   workstation already selects the owner's current identity, certificate and
   compile references. Run `python scripts/native-wake/build.py` to produce a
   signed private TPK in `dist/native-wake/signed/`. The tracked source renders
   byte-for-byte to the tested C# source, and the build has passed locally;
   regenerated binary bytes may differ.
4. For device update or rollback, use the exact inventory, Partner permission,
   WAS install and Public restore sequence in the native-wake README. Do not
   transfer upstream LS03D Home settings to this TV. Announce device installs,
   app launches and restarts and confirm visible results with the owner.

The service's optional diagnostic UDP export uses private local values and
never waits for the PC. `auto-restart=false` means a system-killed resident
process might not resume until a full boot; that failure mode has not been
measured over days. The display state `-1` is an observed value on this
firmware, not a portable Tizen API promise. Its subsequent `Normal` event was
physically confirmed under the same service process and kernel boot ID during
a short off/on. The service arms on `-1` and disarms after one launch request,
so a plain boot-time `Normal` event does not trigger an extra launch.
