# Interaction behaviour — 0.6.1

This describes the source UI and its intended interactions. Device-specific results for this fork are in [TV status](tv-status.md) and the [NU8000 record](nu8000.md). Upstream LS03D Home routing and Samsung component behavior do not establish the same behavior on this TV.

## Home

- Dock: Left/Right scrolls the apps without wrapping. Up enters the top-right controls, starting with Sources or the last selected control. Left/Right moves between Sources, All apps and Settings. Down or Back returns to the selected app. The clock is at the top left.
- List: Up/Down scrolls the apps without wrapping. Right enters the horizontal Action Bar at the lower right. Left/Right moves between Sources, All apps, Settings and Picture info when online pictures are active. Its panels open above the bar. Up reaches weather or the clock; Down or Back returns to the selected app. The list fades at both ends as it scrolls.
- OK opens the selected item. Focus alone never launches an app.
- Icons-only apps and controls reveal their names when focused. App presentation and control presentation are independent.
- List and Dock share the same saved Home app order, with up to 64 apps. The Dock scrolls beyond the visible apps: Icons mode fits about nine, while Icons and text uses wider tiles and shows about five at once.
- Back from the app list or Dock opens a choice to stay or open Samsung Home.
- A panel keeps focus within its own controls. Back closes one panel at a time.
- The icon group opposite the clock and widgets is the Action Bar. Its controls share one focus treatment; focused controls, clock and weather show a rounded dark tile on photographic Home in both Type and Glass focus, matching the Dock. Sources, Weather and Picture info share one popup surface.
- This fork adds configurable [source shortcuts](sources.md): OK on Sources opens a submenu; Up/Down selects, OK switches, and Back/Left closes it. Its styling follows Home settings.
- When weather is enabled, its icon and temperature appear beside the clock. In Dock, Left from Sources reaches it; in List, Up from Sources reaches it. OK opens a compact forecast panel with four three-hour periods and two days, separated visually. Back closes it.
- The clock opens a compact Home popup for the native sleep timer. The five values are Off, 30, 60, 120 and 180 minutes. The selected value has a checkmark; setting it reports success or failure in the popup. When a timer is active, a separate bed badge beside the clock shows its TV-reported remaining minutes. The widget refreshes that value while visible.
- Returning to the running launcher keeps the selected app or panel item. There is no auto-return timer. Held OK and Back keys act once until the key is released.

## Settings and appearance

Settings opens a grouped overview: Background, Home Apps, Action Bar, Widgets, Design, Typography, App icons and Samsung. OK opens a group. Appearance groups use a two-pane screen with visible choices on the left and the Home preview on the right. Dock position drafts move the Dock in that preview before OK saves them.

| Group | Choices |
| --- | --- |
| Background | Local pictures and Online pictures; their settings gears |
| Home Apps | List or Dock; Text, Icons or Both for apps; Apps in Dock; vertical position when Dock is active |
| Action Bar | Text, Icons or Both for its controls; Sources |
| Widgets | 12-hour or 24-hour clock format; optional weather and location |
| Design | Type or Glass focus; Soft, Frost or Clear tint material; app highlight; shared Panel opacity |
| Typography | Manrope, Neue Montreal, Mori, Pangram Sans, Geist and Newsreader, when available |
| App icons | Per-app white icon selection, with Home apps first |
| Samsung | Samsung Home and TV settings |

Up/Down moves between rows. Left/Right moves between choices in a horizontal row. Focus alone changes neither the preview nor saved preferences in these appearance groups. Wallpaper has its own temporary photo preview, described below. OK applies the focused value. A checkmark identifies the applied value; the filled plate identifies remote focus. Applying the current value does not write again.

Material applies to a photographic Dock, or Glass focus on a photographic List. Inactive material choices remain visible with an explanation and are skipped during navigation. Their stored value is retained. Wallpaper and rotation are also inactive on flat backgrounds.

App highlight is shared by Dock and List, including Text, Icons and Both. Standard preserves the existing Type/Glass appearance. Glow adds a bounded, soft light behind the icon using pre-rendered shadows at the actual display size. App names remain sharp in Both mode; Text mode uses a text glow. Underline marks the app name, including the focused caption in Icons mode. Light tile adds a softly rounded, translucent plate behind the icon and name, preserving their normal ink colour. It also works with Type focus; on a Light background the plate uses a subtle dark tint. These options affect app focus, independently of the Type/Glass choice for Home controls. The Settings and Wallpaper previews show the same focused-app scaling, opacity and plate as Home, while interactive focus remains in Settings. In particular, Standard with Type has no app plate in either view; Standard with Glass shows the same glass plate in both. Existing preferences default to Standard. Saved Focus line preferences migrate to Glow. Saved Light tile preferences use the translucent style.

Apps in Dock opens the existing membership and arrangement editor. Sources opens the existing shortcut editor for visibility, names, icons, order, HDMI assignment and connection queries. Back returns to Home Apps or Action Bar respectively. Widgets changes the Home clock between 12-hour and 24-hour display; existing preferences default to 12-hour. Weather is off until a location is chosen. See [weather](weather.md) for requests, cache and offline behaviour.

Design's Panel opacity slider ranges from 0% to 100% in 5% steps. It controls the Dock material, the dark focus tiles for the clock, weather widget and Action Bar, the Action Bar focus lens, and Sources, Weather and Picture info panel backgrounds while keeping their text and controls fully opaque. The slider remains available in both layouts and on all backgrounds. Left/Right or dragging adjusts an unsaved value; OK applies it. Leaving the row or pressing Back discards an unconfirmed adjustment. Failed saves retain the previous appearance and offer Try again. The saved dockOpacity preference is retained across updates, layout changes and restart.

Dock's vertical position slider appears only when Dock is the active app layout. It moves the Dock in 20px steps from 160px above to 80px below its original position. Left/Right and dragging update the Home preview immediately. OK saves; Back or leaving the row discards an unconfirmed position. Existing preferences keep the original position, including while List is active. The Dock's navigation cues and action button move with it.

A font or photo change applies only after its resources are ready and storage succeeds. A load or storage failure keeps the previous appearance and checkmark, with a Try again action. Back cancels a pending change, leaves the group and keeps completed changes. Late load callbacks cannot apply a cancelled choice. There is no Save button. Returning to a group restores its last choice focus; returning to Settings restores its category focus. Local pictures settings contains Wallpaper and Rotation. Online pictures settings contains source and sizing controls. Back returns to the originating gear; leaving Rotation returns to Local pictures.

The selected font applies to Home app names, the clock and Home controls, including Newsreader. Settings, All apps, the Home editor and status text retain Manrope. The preview shows the committed Home appearance and its clock continues to update. Pangram faces are available in Nathan's private build when the local files are present; their binaries are not included in the public source. An unavailable optional face is omitted. If the baseline font is slow or missing, Home remains usable with a local fallback and can recover when the font loads.

Online pictures adds Picture info to the Action Bar, forming one row of four
icons in both layouts. Left/Right moves between them. Picture info contains
image credits, a Skip button beside the title, and selectable Picture Page/License
links in one row without displaying their full URLs. Up/Down moves between the
controls and scrolls long details; Left/Right also moves between the links. OK opens
a link through the TV browser request or skips to the next cached picture.
Back closes the panel. Credits are not displayed separately at the bottom.
Local pictures settings remain editable when another background is active;
changing a wallpaper or its rotation does not activate Local pictures.
The online thumbnail shows the current cached image instead of the local photo.

## Streaming apps

The nine default apps keep their known native IDs. Other installed consumer apps can also be added to Home. Launching uses the public `tizen.application.launch` API with the app's native ID. Missing apps and denied launches produce a real error. No web player, placeholder success page or account credential is embedded.

## All apps

The panel reads `tizen.application.getAppsInfo` on entry and shows the filtered consumer apps alphabetically. Samsung's visibility flag alone also exposes system utilities, so EP packages, background services, ad players, account utilities, placeholders and duplicates are omitted. Known brands use bundled white marks; other apps use a generic white symbol. A saved icon choice is shared with Home and the editor.

The five-column grid scrolls with remote focus. The focused app has a rounded tile like the Dock, including in Type focus; its fill stays visible on photo, dark and light backgrounds. OK launches an app; its On Home badge shows membership. Up from the first row reaches Apps in Dock, which opens the editor. An API failure shows a retry and keeps saved Home choices. Browser previews report that installed-app discovery and launching require the TV.

## Apps in Dock

Open the editor from Settings or All apps. On Home shows the current order in a scrollable left column. Not on Home shows Recently removed first, followed by other installed apps on the right. Home holds one to 64 apps.

- Reorder: OK on an app name picks it up. Up/Down moves it. OK places it and saves the order. Back puts an unplaced app back without saving that move.
- Remove: Right from an app name reaches Remove from Home. OK saves the removal and moves focus to the same app in Recently removed. The app stays installed.
- Add: OK on an app in Not on Home adds it and saves. A recently removed app returns to its previous position within the editing session; another app is added at the end. Focus follows the app to its Remove from Home control, so another OK can reverse the addition.
- Undo reverses a completed addition, removal or reorder from the current editing session. Done or Back closes the editor and keeps completed changes. Undo history ends when the editor closes.

Removing the last Home app or adding a 65th app is prevented. A failed storage write keeps the committed choices and order, with a retry message. Saved native app IDs and names survive a restart or a failed catalogue refresh.

## App icons

Settings > App icons lists Home apps in their saved order, followed by other
discovered apps alphabetically. OK opens a five-column icon picker for that app.
Arrow keys move focus and scroll; focus alone never changes the icon or launches
the app. OK applies the focused icon immediately. A checkmark identifies the
saved choice; Automatic restores the bundled service mark or generic fallback.
Applying the current choice does not write again. Back returns to the same app,
then the App icons settings group, and keeps completed changes.

Choices use native app IDs and survive restart, appearance changes, Home edits,
Undo and failed discovery. A failed storage write keeps the previous icon and
offers another attempt with OK. Saved Home apps remain editable when discovery
fails. The picker selects bundled icons; importing external images is not part
of this control. Icon bounds are measured offline, and cached content refreshes
only after a committed icon change or catalogue update.

## Art Mode and Samsung screens

Art Mode sends an application control to the installed `org.tizen.art-app`, with `mode=fullscreen` and `requester=mobile`. This aims to enter native Art Mode with its current artwork, without toggling power or changing the selected artwork.

This mode comes from [research on Samsung's Art app](https://github.com/TheFab21/ha-samsungtv-smart/blob/master/notes/QN55LS03FAFXZA/ART_MODE_DECOMPILED.md), on another Tizen 9 Frame model. It is an internal Samsung contract, not a documented public Art API. It has not been verified as an NU8000 feature.

The source Samsung Home control launches `com.samsung.tv.csfs`. On the NU8000, the overlay retains that target and the owner confirmed the visible Samsung Home escape. Its TV-settings route uses an application control to `org.tizen.menu`; see the [NU8000 record](nu8000.md). The upstream LS03D used a different TV-settings route, and its `com.samsung.tv.coba.newhome` trial did not visibly open Smart Hub. Launch callbacks alone are not visual proof. There is no blind power-key fallback.

All calls have bounded response handling. A failure leaves CleanFrame usable. No simulated device success views remain. Browser validation cannot confirm the visible Samsung destination.

Installed-app discovery allows up to 20 seconds for large TV catalogues; launch controls retain an 8-second limit. Opening All apps or the editor refreshes the catalogue while retaining saved Home choices. No discovery polling runs during hidden startup.

## Preferences and wallpaper

The launcher stores appearance, Home order, recently removed apps, the last launched Home app, wallpaper and rotation locally. List and Dock share these preferences. The existing `cleanframe.home.v1` key is retained, with a fallback read from `cleanframe.shore.v1`. Legacy List maps to Dark + List + Type; Glass Dock and Glass Grid map to Photo + Dock + Glass. App order, wallpaper, rotation and the last Home app are preserved.

The gallery contains 15 bundled wallpapers. Settings → Background → Wallpaper keeps the two-pane Settings frame. Up/Down browses a vertical thumbnail list without wrapping; the right-hand Home preview shows the candidate while the surrounding Settings backdrop stays on the applied photo. OK applies the focused photo and stays in Wallpaper. The tick marks the applied photo and preview status distinguishes unsaved browsing. Back restores the latest applied photo, cancels pending loading and returns to Background’s Wallpaper row. Photo and material assets change as one complete bundle; a failed load restores the applied preview and offers retry. Preview loading waits briefly for remote focus to settle. OK during loading queues application for that photo; another browse move or Back cancels it. Browsing never saves, and repeated OK on the applied photo does not write again.

Settings → Background → Rotation offers Fixed, Each time Home opens, Every 5 minutes, Every 15 minutes and Every hour. Each time Home opens advances once when the launcher loads; a return to the already-running launcher does not advance it. Timed rotation counts only visible Photo Home time in either List or Dock. Panels, flat backgrounds and time spent in other apps pause the cycle. Changing the photo or rotation mode starts a new interval.

Launcher wallpaper is separate from native Art Mode. Runtime photos, materials and available fonts are local assets; they do not require the Mac or a network download.

## Sources

- [Samsung Application API](https://developer.samsung.com/smarttv/develop/api-references/tizen-web-device-api-references/application-api.html): installed-app discovery and application control.
- [Samsung application termination guide](https://developer.samsung.com/smarttv/develop/guides/fundamentals/terminating-applications.html): exiting is not treated as a deterministic Samsung Home route.

The upstream LS03D native Home operation and startup configuration from 19 October are separate from this app and from the NU8000 adaptation. On this fork's TV, physical Home currently opens CleanFrame through two separately installed packages. The same packages passed a temporary rollback test before the current installation. Streaming apps retain their own Back navigation; no global Back interception is installed. See [TV status](tv-status.md) for this fork's device evidence and the [upstream record](upstream-tv-status.md) for the LS03D results.

## Clock and rendering

Both layouts show the TV's local time in 12-hour format, without AM/PM or seconds. It updates at the minute boundary and on return to the launcher. No date or clock panel is shown.

Photographic materials and blurred panel backgrounds are generated before packaging and stay aligned with the full-screen image. Photo colour and contrast metadata are also prepared offline. Navigation does not sample image pixels, run an optics engine or apply live backdrop blur. Flat backgrounds use matching light or dark panel colours. Focus feedback uses transforms and opacity; reduced motion removes animated scaling and movement while retaining opacity feedback.

Hidden prelaunch can install a fully loaded wallpaper bundle without waiting for an animation frame. A valid loaded image remains usable if detached-image decoding rejects. A failed startup bundle retries when the launcher becomes visible; an active wallpaper preview keeps its candidate. Font recovery clears fallback measurements and cached markup. This readiness fallback uses a completed load and nonzero image dimensions; it does not prove a TV has painted the image, and an accepted bundle is not automatically decoded again on return. These paths have browser regression coverage; physical cold-boot behaviour still needs owner observation.
