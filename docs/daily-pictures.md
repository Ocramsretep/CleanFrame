# Daily online pictures

Background offers Local pictures and Online pictures. Right reaches each entry’s
settings gear; OK opens its submenu. Online pictures settings selects sources and
picture sizing. Local pictures settings contains Wallpaper and Rotation.

The first ready picture appears on Home. Thereafter the local calendar date
selects one new picture per day, including after standby or an offline restart.
A change waits while a panel or picture info is open. Downloads run only while
the app is running and visible; they do not wake a powered-off TV. Without a
replacement the previous online picture stays. Before the first picture is ready,
Home uses a dark background instead of briefly showing a bundled local photo. The owner
confirmed this behavior after the in-place update on the UE49NU8079.
On later starts, a small saved preview of the last online image appears while
IndexedDB restores the full image. The owner confirmed a steady image after Home return and a full TV restart
on the UE49NU8079. If no preview exists or it
cannot be saved, the dark first-use background remains the fallback.

## Sources

| Source | Default | Selection |
| --- | --- | --- |
| Wikimedia Commons landscapes | On | Featured landscape, mountain, coast and forest photographs |
| Wikimedia Commons architecture | On | Featured cityscape, building and architecture photographs |
| Pixabay | On when the owner's build has a key | Editor's Choice, horizontal photos; nature and buildings alternate between daily metadata batches |
| NASA APOD | On | Recent still images with their actual photographer credits; videos skipped |
| ESA/Webb and ESA/Hubble | On | Nebula and galaxy galleries; diagram/illustration titles excluded |
| Bing | Off; explicit opt-in | Download-enabled daily-image records from the unofficial homepage feed |

The queue balances themes; the three astronomy providers do not each receive
the same share as all landscapes combined. Selection prefers a different theme
from the current image when one is ready. Broken, undersized or oversized images
are discarded. Sources can be disabled independently. This removes their queued
pictures; the current one stays until a replacement is ready. Unsplash and
Pexels are not queried.

## Local Pixabay key

Copy `daily-pictures.example.json` to `.local/daily-pictures.json` and set
`pixabayKey` to your own key. `.local/` is ignored by Git. The normal preview and
private package writer inject `daily-config.js` into the served response or
widget archive; they never copy the key into `app/`. Without a key the Pixabay
row is disabled. Public-font preview and public export omit the key even when
local configuration exists. Settings and preview request logs do not show it.

The key is extractable from a widget. Keep that personal build private; other
owners configure their own keys. Build-time injection avoids TV text entry but
is not encryption or a shared backend credential service.

[Pixabay's API documentation](https://pixabay.com/api/docs/) requires a 24-hour
metadata cache and prohibits systematic mass downloads. A batch of 30 metadata
records is cached before downloads, surviving restarts and skips. Only the small
image queue is downloaded. Full-HD URLs are preferred when returned; ordinary
access provides up to 1280 pixels, which are upscaled on a Full-HD TV. No
original-resolution URL is guessed.

## Display and controls

Fill screen uses proportional `object-fit: cover` with a centred crop. Whole
picture uses `contain` with dark borders. Neither stretches aspect ratio. Online
pictures use fixed dark gradients and neutral translucent materials for
legibility, with no live blur or pixel analysis on the TV.

Picture info shows the supplied title, full credit, provider and rights label.
Its header has a Skip button with the original curved arrow; Skip uses the offline
queue. Picture Page and License appear side by side when their links exist; full URLs stay hidden. OK requests the TV
browser for the chosen HTTPS link; the TV must have a handler for that request.
Up/Down moves through the panel and scrolls long details; Back closes it.
No permanent credit strip is shown on Home. The Action Bar has four icons:
Sources, All apps, Settings and Picture info. Picture info appears only in
Online pictures. Left/Right moves along the Action Bar; OK opens a control.
Local picture and rotation settings can be edited regardless of the active
background. The Online pictures thumbnail uses the cached online image, or an
image symbol until the first download is ready.

## Storage and networking

`cleanframe.daily.options.v1` stores source switches and fit in localStorage;
`cleanframe.daily.preview.v1` stores one bounded JPEG preview (at most 250,000
characters) of the last displayed online image. It is generated once after
the image settles, outside the animation frame. No provider key is stored
there. `cleanframe.pixabay.metadata.v1` stores metadata without the API key. IndexedDB
`cleanframe.daily.v1` stores the current image, up to ten queued images, cursors,
the date and the last 500 shown IDs. Limits: 8 MiB per image, 32 MiB total and
32 million decoded pixels; minimum dimensions are 1280 Ã— 720. Selection is
committed before replacing a working image. Failed writes keep that image.

Downloads never become repository or build assets. Existing Home preferences
remain separate. Flat and bundled-photo modes make no provider requests.
Disabling daily mode or hiding the app cancels pending requests.

The widget declares internet access to listed HTTPS hosts. The localhost preview
uses a bounded proxy with exact host, redirect and same-origin request checks.
Provider outages and HTML/feed changes can temporarily remove a source from the
mix. Live source checks and browser tests do not establish TV networking or
IndexedDB compatibility; device testing needs separate explicit authorisation.

## Rights and verification

Rights remain with the credited owner. APOD is not a public-domain collection;
Bing's unofficial feed is not a general reuse licence. Local opt-in and downloads
do not independently grant rights. Review linked image terms for your use and
do not redistribute the cache. See [third-party notices](../THIRD_PARTY_NOTICES.md).

Run `npm run check`, `CLEANFRAME_PUBLIC_FONTS=1 npm run check:browser`,
`npm run check:daily`, `npm run check:daily-tools` and `npm run check:tools`.
Daily browser tests use synthetic metadata and an existing bundled picture,
not APIs or credentials. They cover offline use, opt-in, calendar changes,
failed writes, remote focus and portrait/square/wide sizing. Tooling tests cover
private/public key injection and proxy restrictions.

USGS Earth As Art was removed because the broad Commons search also returned
posters with embedded text and logos. Legacy cached entries from that provider
are removed and the cleaned cache is persisted on the next Online pictures load.
Disabling a source also persists removal of its queued images. The current image
is kept until a replacement is ready; changing background mode retains the
offline cache for later use. Only IDs, not image blobs, remain in shown history.
