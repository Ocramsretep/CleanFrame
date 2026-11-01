# Development

## Browser preview

Start with Node.js 22.13+ (22 LTS), or 24+, and Python 3.10+, then `npm ci`. These are the supported development baselines; lower versions have not been checked. Install Chromium once with `npx playwright install chromium` for the optional browser tools. Linux hosts may also need Playwright's documented system dependencies (`npx playwright install --with-deps chromium`).

`npm run dev` starts http://localhost:4795/home/, bound to this computer only. `/home/` serves `app/`, the same source used in the signed widget. Arrow keys, Enter and Escape mirror remote navigation. Device controls report that they require the TV; no success is simulated.

`npm run dev:public` serves the same interface using only the bundled public fonts, even when paid Pangram files exist locally. For a contributor's fresh clone, use the README and `docs/for-agents.md`; the signing/device setup below describes the reference machine and needs adaptation for another owner.

All UI assets, public fonts and the fifteen wallpapers are bundled. This private build also includes the three locally installed Pangram families through an ignored build overlay; their binaries are not in the public source tree. Glass materials and blurred panel backgrounds are rendered ahead of time; see app/assets/wallpapers/README.md.

## Runtime map and compatibility

- [Daily online pictures](daily-pictures.md) use `daily-config.js`, `daily-providers.js`
  and `daily.js`. Local API keys are injected from ignored `.local/daily-pictures.json`;
  public-font preview and public export omit them. Downloads stay in the owner's
  IndexedDB cache, outside the source and widget.

- `app/index.html` loads the device adapter, gallery/font/palette catalogues, `assets/icons/metrics.js` and `main.js`, with `style.css`.
- `main.js` owns the List and Dock layouts, panel stack, focus, preferences and wallpaper timers. `device.js` owns installed-app discovery and Tizen calls. Keep device details in that adapter.
- `ui.js` and the shared `ui-focus-*` / `ui-popup` classes define Action Bar focus and popup surfaces; see [Home UI components](ui-components.md). `main.js` retains navigation and panel ownership.
- `app-icons.js` holds the bundled icon catalogue, public app-ID aliases and override validation. `appIcons` preferences map native app IDs to allowlisted icon names; ordinary appearance and Home writes preserve this map. `main.js` owns the icon picker and invalidates cached marks only after a successful write.
- The optional [weather widget](weather.md) uses `weather.js` for location search, forecast requests and a bounded local cache. `main.js` owns its focus, menus and inline SVG weather symbols.
- The logical stage is 1920 x 1080, scaled uniformly to the viewport. Check at 1920 x 1080 and 1280 x 720. Glass geometry and cached materials must stay aligned.
- Preferences use localStorage key `cleanframe.home.v1`, with a fallback read from `cleanframe.shore.v1`. Legacy fields are `dock`, `wallpaper`, `mode`, `lastApp` and `theme`. The 0.6 migration preserves app order, wallpaper, rotation and selection. Legacy `list` becomes Dark / List / Type; `shore` and `grid` become Photo / Dock / Glass. Appearance axes are stored separately. A saved dynamic app keeps its real app ID and name; discovery refreshes the installed catalogue. Keep migration checks when changing this format.
- Dock position is stored as `dockOffset` in 20px steps, defaulting to zero for existing preferences. The saved `dockOpacity` field now supplies the shared Design panel opacity without changing its storage key.
- `window.ShoreQA.state()` and `.where()` expose state and focus for browser tests. `minuteMs` can shorten rotation intervals in an isolated browser test.

The source app originated on the upstream Tizen 9.0 [reference TV](upstream-tv-status.md). This fork's Tizen 4.0 results and separate build overlay are in [TV status](tv-status.md) and the [NU8000 record](nu8000.md); [other reports](compatibility.md) remain separate. The manifest's `required_version="6.5"` is a package declaration, not proof of broad Tizen 6.5 support. The exact upstream reference TV Chromium/WebKit engine version has not been recorded. `npm run lint` uses ESLint's ES5 grammar for all runtime JavaScript and checks undefined names, unused code and dynamic evaluation. This does not check DOM/CSS or TV API availability; verify new APIs on the target before claiming support. The CSS guard rejects `inset` and flex `gap` declarations; use explicit top/right/bottom/left edges and child margins. The spacing fallback addresses the older engine reported in PR #11 without changing the package minimum. Geometry checks cover both Home layouts, all three control modes and both preview sizes; they do not establish TV compositor support. Tooling stays in development dependencies and outside the widget. See [ESLint's language options](https://eslint.org/docs/latest/use/configure/language-options).

Keep material rendering in the development tools. See [asset generation](assets.md) and [testing](testing.md).

## Local TV tools and signing

The setup below originated on the upstream LS03D and a Mac. This fork's Windows/NU8000 build and observed behavior are documented in [NU8000 adaptation](nu8000.md); its current Home status is in [TV status](tv-status.md). Do not apply the upstream native Home steps to the NU8000.

This Mac's setup lives under `.local/` and is excluded from Git:

- `tizen-sdk/`: official Tizen SDK command-line tools, embedded Java and SDB.
- `certificates/private/`: Samsung-issued author/distributor certificates, private keys, protected PKCS12 files and their generated password.
- `certificates/ca/`: CA certificates from Samsung's Certificate Extension.
- `device.json`: TV host address.

`npm run package` builds the widget from `app/` and signs it with an existing official SDK profile. It does not rewrite `profiles.xml`, certificate paths or SDK configuration. It writes `dist/CleanFrame-unsigned.wgt` and promotes a successful build to `dist/CleanFrame.wgt`. Each attempt uses a fresh ignored `dist/signed-*` folder, retained for inspection; a failed attempt keeps the previous successful widget. Check the packaging exit status before installing, since `tv:install` does not establish that this is the latest source build. `scripts/font_assets.py` adds only the six approved local Pangram files when complete pairs are available, plus their generated CSS/catalogue. It never copies private fonts into `app/`. Public checkouts use Manrope, Geist and Newsreader.

For another owner, copy `signing.example.json` to `.local/signing.json` and replace its placeholders with the installed SDK path, certificate profile name and the package/application IDs generated by the official project wizard. An existing local config must explicitly select `profile`; the maintainer default applies only when no config exists. Paths may be absolute or relative to the repo; `~` is supported. The SDK path resolves symlinks before invoking its tools. If the SDK launcher fails on spaces in its real installation path, select a space-free SDK installation; a repository symlink can still contain spaces. The password filename remains unresolved so the no-follow check can reject a symlink. The example contains no real credentials. Both identity fields must be set together. Packaging changes only these two attribute values in the generated manifest; tracked source and the maintainer's identity remain unchanged. The installed app reads its own identity from Tizen when filtering All apps. Native Home helpers retain their separate reference-machine guards and must be reviewed independently.

Select the profile's existing `profiles.xml` through the official SDK configuration if needed; see [Samsung's CLI configuration and packaging documentation](https://developer.samsung.com/smarttv/develop/getting-started/using-sdk/command-line-interface.html). Certificate Manager can store certificates in its own folders. CleanFrame uses those existing paths without moving or rewriting them.

`npm run export:public` is a separate offline, unsigned export. It always disables the proprietary overlay, includes the project/third-party notices and writes `dist/CleanFrame-public-unsigned.wgt`. It reads no signing credentials and contacts no TV. Use it for public build preparation; `npm run package` on this machine remains a personal build that can contain paid fonts. Asset release checks are listed in `docs/public-release.md`.

Leave `password_file` as `null` or omit it to use the SDK's saved password access. No extra plaintext copy is required. An unexpected password prompt fails immediately; configure password access in the official tools or explicitly select a password file. The optional file must be owned by the current user, have mode `600` or `400`, and reside in `.local/` or outside the repo. A symlink at the final filename and files inside `app/` or `.git/` are rejected; parent symlinks are resolved before the location check. This fallback supplies one password to at most two certificate prompts and declines password-saving prompts; use SDK-managed access for certificates with different passwords. SDK signing output is suppressed so credentials cannot enter diagnostics. Fixed validation messages identify password-prompt, timeout, failed-command, missing-signature and identity errors without copying SDK output.

With no `.local/signing.json`, the original maintainer defaults remain: `.local/tizen-sdk`, profile `FrameHome`, the source manifest identity, and the existing private password file if present. Its permissions must satisfy the same checks. The SDK must already be configured; automatic SDK/profile repair has been removed. Actual signing with an owner's certificates requires a separate local check; offline tests use a fake SDK.

The initial custom XML-signature implementation was rejected by the TV. Use the official SDK packager for future builds; the installed test was signed with Tizen CLI 2.5.25.

## Another checkout or Mac

Install the official [Samsung TV SDK](https://developer.samsung.com/smarttv/develop/getting-started/setting-up-sdk/installing-tv-sdk.html) and select its path in `.local/signing.json`. The signing runner uses POSIX terminal/process APIs and is supported by these tools on macOS/Linux; Windows needs its own adapted runner. To retain in-place updates to your own existing app, securely transfer its author certificate and password. Keep those credentials local.

For new certificates, use Samsung's [certificate setup](https://developer.samsung.com/smarttv/develop/getting-started/setting-up-sdk/creating-certificates.html). The distributor certificate must include the target TV's DUID. A generic emulator certificate does not establish compatibility with this consumer TV.

Create `.local/device.json` with:

```json
{"host": "YOUR_TV_IP_ADDRESS"}
```

For developer access, connect the TV and Mac to the same network, enable Developer Mode in Apps → App Settings → 12345 and enter the Mac's local address. Fully restart the TV if the developer port remains closed.

## Install and launch

`npm run tv:install` uploads the signed widget with a unique build filename and calls Samsung's `vd_appinstall` command. It checks for `install completed` and confirms the app appears in the installed-app list. `sdb install` on this TV only uploaded the widget and did not install it.

`npm run tv:launch` opens the selected app. It does not change startup defaults. The TV tools use the SDK path and identity selected in `.local/signing.json`, falling back to the reference SDK and source manifest. Before any install connection, the installer checks the signed widget's identity and private-file policy. Changing an installed app's identity creates a different application; preserve existing identity and author certificates for updates. These tools remain reference installation commands, not an unattended installer for every TV.

## Sources

- [Samsung developer connection steps](https://developer.samsung.com/smarttv/develop/getting-started/using-sdk/tv-device.html)
- [Samsung app-launch sample](https://github.com/SamsungDForum/LaunchApp)
- [Samsung remote input guide](https://developer.samsung.com/smarttv/develop/guides/user-interaction/remote-control.html)

## Native Home and recovery

The UE49NU8079's confirmed boot/standby service is documented separately in
[the current native startup runbook](native-wake.md). Its tracked rebuild tool
is in `scripts/native-wake/`; this section below describes the upstream LS03D
native Home helper and must not be applied to the NU8000.

On the upstream LS03D, native Home/startup was configured separately from the app installer and physical Home from Netflix was confirmed. The one-shot helper runs as the SDK user there; see scripts/native-home/README.md and [the upstream TV record](upstream-tv-status.md). On this fork's NU8000, Home currently opens Samsung Home. A separate temporary package rule opened CleanFrame and was rolled back after restart and standby checks; see [TV status](tv-status.md).

Query with `python3 scripts/native-home/run.py query`. Restore the saved pre-integration Home/startup values with `python3 scripts/native-home/run.py restore`. The private baseline is `.local/native-home/original.json`; preserve it and do not replace it with the applied state. The legacy `.local/native-home/run.py` command is also retained. Restore before uninstalling CleanFrame or changing its stable app identity.

To rebuild the one-shot helper with this Mac's private verified SDK:

```sh
DOTNET_CLI_TELEMETRY_OPTOUT=1 DOTNET_SKIP_FIRST_TIME_EXPERIENCE=1 DOTNET_CLI_HOME="$PWD/.local/native-home/cli" .local/native-home/dotnet-sdk/dotnet build scripts/native-home/Control.csproj -c Release --nologo -p:BaseIntermediateOutputPath="$PWD/.local/native-home/obj/" -o .local/native-home/out
```

The helper's output is not packaged inside the web app. Keep the original values, compiler, runtime output and all device diagnostics ignored.
