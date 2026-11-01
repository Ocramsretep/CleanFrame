# NU8000 sleep timer bridge

This separate Partner-signed Tizen 4.0 .NET service listens on a local
MessagePort. CleanFrame's web widget asks it for the native timer state or
requests one of the TV's supported values: Off, 30, 60, 120 and 180 minutes.
The service accepts requests only from the configured CleanFrame application
ID. It has no network listener and needs no running PC. It uses the firmware's
`SetItemValue("sleeptimer", index, false)` path and reads the TV's `savetime`
and `time_t` keys for confirmation and remaining minutes. The firmware path
and key meanings are specific to the owner's UE49NU8079.

The source template is `TimerService.cs.in`. `build.py` reads ignored
`.local/native-timer.json` with an independent package/application ID, the
owner's CleanFrame application ID, installed SDK, compile references, icon and
Partner signing profile. Start from `config.example.json` for a separate TV.
It compiles without network access and signs a TPK
under ignored `dist/native-timer/`. It never contacts the TV. The NU8000 web
overlay reads the same private config and inserts only the service application
ID into `timer-config.js`; public builds leave that ID empty.

Device installation is a separate, owner-authorised operation. Capture the
exact app inventory and preserve the Public developer profile before temporarily
transferring the Partner profile. Install the verified signed TPK with
`vd_appinstall`, verify the one-app addition, then restore Public. Do not reuse
the package identity of a diagnostic probe: doing so can replace and remove
the service during later tests. A rollback uninstalls this separate package
and checks the original inventory. Remove the timer service before running the
older private Home rollback controller, whose baseline predates this service.
Home and startup packages are otherwise independent.

The Home clock opens a compact popup, and an active timer adds a bed badge
showing the TV-reported remaining minutes. The widget polls while visible.
Browser previews use a mock MessagePort response; they do not prove native
timer behavior. On the owner's TV, the 30-minute timer counted down, Samsung
showed its final 60-second dialog and the TV entered standby automatically.
The [TV status](../../docs/tv-status.md) separates this from still untested
values and other firmware versions.
