# Browser evidence

`sleep-panel-1080.png` was captured on 1 November 2026 with the public-font
browser check at 1920 × 1080. It shows the compact panel under the clock and
the separate bed badge. The 30-minute selection and 27-minute remainder are
synthetic test responses; they do not establish native timer behaviour. The
owner separately confirmed a real 30-minute selection and decreasing badge on
the TV. Regenerate with `CLEANFRAME_PUBLIC_FONTS=1 CHECK_SECTION='Sleep timer panel'
npm run check:browser` and copy `.local/qa/sleep-panel.png` here.

`weather-dock-720.png` was captured on 31 October 2026 with the weather section
of the public-font browser checks at 1280 × 720. It shows the weather chip beside
the clock and the open forecast panel in Dock layout, using bundled public fonts,
wallpaper and icons. Berlin location and forecast responses are synthetic test
fixtures, not live weather; installed apps are also synthetic. All 21 checks in
this targeted run passed, including forecast geometry in Dock and List at
1920 × 1080 and 1280 × 720. This is a desktop Chromium capture, not a TV result.
To regenerate, run `CLEANFRAME_PUBLIC_FONTS=1 CHECK_SECTION=weather npm run check:browser`
and copy `.local/qa/weather-dock-1280.png` to `docs/screenshots/weather-dock-720.png`.

`app-icons-720.png` was captured on 30 October 2026 with the public-font browser
checks at 1280 × 720. It shows Settings > App icons with the framed CleanFrame F
selected as a test override for Netflix. The checks also cover 1920 × 1080,
save failures, reset, restart and Home-edit persistence. It is a desktop browser
capture with synthetic apps, not a physical-TV result.

`compat-dock-720.png` and `compat-list-720.png` were captured by the public-font browser regression suite on 27 October 2026, at 1280 × 720. They use bundled public fonts, wallpaper and icons with a synthetic installed-app catalogue. The suite also checks 1920 × 1080 geometry.

These are desktop Chromium screenshots, not TV captures or proof of Chromium 85 compositing. They show readable labels and the rounded utility focus in the candidate UI. The wallpaper and icon sources/licences remain in the existing asset records and [third-party notices](../../THIRD_PARTY_NOTICES.md).
