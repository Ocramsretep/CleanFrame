# Source shortcuts

The Sources control replaces the former direct Live TV/Art control. OK opens
an anchored submenu containing the enabled TV/HDMI shortcuts. Up/Down selects,
OK switches, and Back/Left closes it with focus returned to Sources. The Dock
has its control at the top right; List keeps its existing bottom-right controls.
There is no extra row below the app dock.

The submenu follows the same background, photo material, font and focus settings
as Home. It uses the bundled preblurred material field, aligned with its actual
position, rather than runtime blur. Flat Light/Dark modes use their matching
colours. Configure sources opens the existing editor, even if all inputs are
hidden. App slots and source slots remain independent.

Settings > Sources controls visibility, name, icon, HDMI assignment and order.
OK on a value changes it; completed changes persist immediately. Name opens the
TV keyboard, followed by explicit Save/Cancel. Failed storage writes retain the
previous configuration. Source preferences use `cleanframe.sources.v1` and never
replace `cleanframe.home.v1` or the legacy app/appearance preferences.

Check connections reads `VIDEOSOURCE` and the current TV source. This public API
reports connection type and number, not reliable Xbox/CEC device names. It does
not prove which physical device is attached. Live TV uses the actual reported
tuner source before opening the TV viewer, so it can return from HDMI to cable.

On a UE49NU8079 running Tizen 4.0, the owner confirmed Xbox switching on HDMI 1.
The same TV reported every HDMI input as disconnected while the Xbox was
powered on. Treat connection flags as advisory, not a reason to disable a
reported input. After installing the submenu version on 29 October 2026, the
owner confirmed the requested Xbox and Live TV test worked.

The source discovery and TV-viewer approach was informed by
[scottheinrich91's upstream PR #14](https://github.com/nthnclrk/CleanFrame/pull/14).
This implementation uses synchronous `getSource()`, propagates switch/viewer
errors, rejects unreported inputs and ignores callbacks after the operation's
deadline. Source switching has the public `tv.window` and `systeminfo`
privileges. No native Home/startup setting is changed.

Soundbar power/audio control was deferred at the owner's request. The inactive
audio placeholder is omitted. Previously stored audio entries are ignored;
HDMI source switching never pretends to select an ARC audio output.

## Validation

`npm run check:device` includes source failures, deadlines and preference
isolation. `npm run check:sources` exercises the real UI with synthetic Tizen
APIs in both resolutions and layouts, including rename, reorder, persistence,
source launch, visibility, the empty-menu escape and appearance inheritance. Generated screenshots stay
under `.local/qa/`. These checks are not physical TV compatibility evidence.

Windows test runners can set `CLEANFRAME_PYTHON` to an installed Python executable
and `CLEANFRAME_BROWSER_CHANNEL=msedge`; default behaviour remains unchanged.

## Personal build defaults

The optional NU8000 build config accepts a `sources` array in addition to its
existing fields. Entries have `id` (`tv`, `hdmi1` to `hdmi4`, legacy `audio` is ignored), `name`,
`icon` (`tv`, `hdmi`, `xbox`, `console`, `soundbar`), `number` and `visible`.
It seeds only when no source preferences exist. Keep this personal selection in
the ignored configuration. Existing TV selections always take precedence.
