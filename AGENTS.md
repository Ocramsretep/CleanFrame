# CleanFrame

`app/` is the current packaged UI. Read `docs/development.md` and `docs/interaction-behaviour.md` before app changes.
For a new contributor or a separate TV installation, also read `docs/for-agents.md`.
Keep `README.md`'s fork feature overview and screenshots current whenever user-visible features or confirmed TV behaviour
change. Say which results were observed on the TV and which images or checks come from the browser preview; update the
linked detailed docs at the same time.

Use simple HTML, CSS and ES5-compatible JavaScript for the TV. Node tooling can use modern JavaScript. Preserve remote
focus/navigation, preference migrations and cached rendering. Read `docs/assets.md` before changing images, glass
geometry or icon sizing; keep live blur and pixel analysis off the TV animation path.

Run `npm run check` for app changes and `npm run check:tools` for signing or validation-tool changes. For interaction
changes, run the browser preview and `CLEANFRAME_PUBLIC_FONTS=1 npm run check:browser`; public contributors must not
need proprietary fonts. Run `npm run check:public` and `npm run export:public` before preparing a public download.
Follow `CONTRIBUTING.md` and retain third-party notices.

On this Windows workstation, Playwright's Chromium is installed at
`C:\Users\marco\AppData\Local\ms-playwright` (including `chromium-1248` and `chromium_headless_shell-1248`).
The Codex sandbox can redirect `LOCALAPPDATA`, so set `PLAYWRIGHT_BROWSERS_PATH` to that absolute directory when
running browser checks if Playwright reports that Chromium is missing. This is a local setup note, not a path for
other contributors.
Python 3.13.17 is installed for this user at `C:\Users\marco\AppData\Local\Programs\Python\Python313\python.exe`.
For scripts that call `python3` on Windows, prepend the ignored `.local/bin` directory to `PATH`; its `python3.cmd`
wrapper invokes that installation. Set `CLEANFRAME_PYTHON` to the absolute Python executable for `check:browser`.

Browser/repository tasks do not authorise device access. Read `docs/tv-status.md` before compatibility claims and
`docs/agent-tv-setup-guide.md` before a new TV setup. An explicit device task is required even for queries that stage a
helper. Announce any installation, app launch or restart; confirm visible results with the owner. Treat native
Home/startup writes as a separate task with explicit authority and an exact-value recovery baseline.

On this fork's UE49NU8079, preserve the owner's existing package/application identity and author certificate; its
physical Home button currently opens Samsung Home. A temporary, separate `XF86Home` rule plus CleanFrame managed-app
registration opened CleanFrame, including after a full restart and a short standby cycle, and was removed with exact
database and visible Home rollback; see `docs/tv-status.md`.
Do not treat that test as a maintained installation or as a Vconf Home-setting change. The upstream LS03D has a separate native Home assignment documented in
`docs/upstream-tv-status.md`. For an independent user's signed build, create their own SDK-generated identity and certificates, then
select them in ignored `.local/signing.json` using `signing.example.json`; read the signing section in
`docs/development.md`. The generated manifest and install/launch tools use that identity; the runtime reads its own ID.
Keep the source identity guards intact. Native Home targets and firmware guards need separate review and authority. The
TV tools and native helper retain reference-machine assumptions; they are not an unattended installer.

Keep proprietary fonts, signing keys, passwords, device identifiers, addresses, SDKs, recovery values and generated
packages in ignored `.local/` or `dist/`. Never commit paid font binaries or publish a private-font widget. Public-code
licensing does not replace the terms in `THIRD_PARTY_NOTICES.md`.
