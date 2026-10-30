# Third-party notices

The root MIT licence covers CleanFrame's original code and documentation. Third-party material retains the terms below. Keep these notices and the adjacent licence texts when sharing source or a build.

## Fonts

| Material | Terms and source record |
| --- | --- |
| Manrope | SIL Open Font License 1.1; `app/assets/manrope-OFL.txt` |
| Geist and Newsreader | SIL Open Font License 1.1; licences beside the files in `app/assets/fonts/`, with exact sources and hashes in `app/assets/fonts/SOURCES.json` |
| Optional PP Neue Montreal, PP Mori and PP Pangram Sans | Proprietary. Binaries stay in ignored `.local/` storage and are excluded from Git and public exports. The optional local overlay requires the user's own permission to use and embed those files. |

The public app uses Manrope, Geist and Newsreader. A personal widget containing proprietary fonts must stay private. See [Pangram's licensing information](https://pangrampangram.com/pages/eula).

## Icons and trademarks

| Material | Provenance and terms |
| --- | --- |
| Simple Icons service marks | The collection is CC0; individual logo and trademark rights are not automatically cleared by that licence. Exact sources and adaptations are in `app/assets/icons/SOURCES.json`, `ADDITIONAL-SOURCES.json` and `EXTENDED-SOURCES.json`. The CC0 text and upstream `SIMPLE-ICONS-DISCLAIMER.md` are retained beside the icons. The extended register includes upstream brand sources and available guidelines. |
| Disney+, ABC, SBS, ARD, ARTE, CUPRA, maxdome and Pluto TV marks | [Custom Brand Icons](https://github.com/elax46/custom-brand-icons), MIT. The retained licence is `app/assets/icons/CUSTOM-BRAND-ICONS-LICENSE.txt`. ABC and SBS sources were replaced during the public-source review. Exact revisions, source files and adaptations are in `SOURCES.json` and `EXTENDED-SOURCES.json`. |
| Joyn, Rakuten TV, RTL+, WOW, MagentaTV and Samsung TV Plus marks | The linked Wikimedia Commons file pages record these as `PD-textlogo` (simple text/geometric logos). This records the source's copyright assessment, not a worldwide clearance or trademark licence. Authors, source pages, adaptations and file hashes are retained in `app/assets/icons/EXTENDED-SOURCES.json`. |
| Art, apps, settings and home outlines | Original CleanFrame drawings, covered by the project's MIT licence. |
| Xbox mark | Font Awesome Free 6.7.2, Copyright 2024 Fonticons, Inc.; [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). `app/assets/icons/FONT-AWESOME-LICENSE.txt` retains the terms. Shape unchanged, recoloured white. [Source](https://github.com/FortAwesome/Font-Awesome/blob/6.7.2/svgs/brands/xbox.svg). |
| HDMI, console and soundbar outlines | Original drawings for this fork, covered by the project's MIT licence. |
| Extended generic symbols and framed CleanFrame F | Original symbol drawings and a vector adaptation of the project's `app/icon.png`, covered by the project's MIT licence. Generic alternatives are not official brand logos. See `app/assets/icons/EXTENDED-SOURCES.json`. |

Brand marks identify services. Their owners retain trademark rights; this project claims no endorsement or affiliation. The older Australian TV icon archive's GPL text is retained for historical provenance only; no current icon uses that archive.

Collection licences do not replace individual brand terms. In particular, Simple
Icons explicitly warns that its CC0 distribution does not mean every included
logo is CC0. No claim of individual brand-owner permission is made for the white
adaptations. Source and licence checks are not a guarantee of non-infringement.

The glow atlases in `app/assets/icons/glow/` are blurred derivatives of the corresponding SVG icons. They retain the same credits and licence terms, including the Font Awesome Xbox attribution.

## Photographs and derived materials

The fifteen photo pages were individually checked on 20 October 2026. Each displayed its credited author and free use under the [Unsplash License](https://unsplash.com/license). The [asset source register](docs/asset-sources.md) links every page. Runtime paths are in `app/assets/wallpapers/SOURCES.json`.

Photographers retain their rights. Wallpapers, thumbnails, panel backgrounds and material fields derive from the credited photographs and retain their terms. The Unsplash licence permits copying, modification and distribution subject to its restrictions, including on selling unmodified images and building a competing image service.

## Optional online photographs

Daily pictures downloads to the owner's local cache, not the source repository
or widget. These images are not covered by CleanFrame's MIT licence. The app
retains their image-page links, supplied credits and rights labels.

- Wikimedia Commons: individual file licences, limited here to supported CC BY,
  CC BY-SA, CC0 and public-domain labels.
- [ESA/Webb](https://esawebb.org/copyright/) and
  [ESA/Hubble](https://esahubble.org/copyright/): CC BY 4.0 with complete visible
  credits. Individual exceptions still apply.
- [NASA APOD](https://science.nasa.gov/apod/): includes third-party copyrighted
  photographs. A NASA-hosted image is not automatically public domain. The app
  shows the original credit and links the individual page.
- [Pixabay Content License](https://pixabay.com/service/license-summary/) and
  [API conditions](https://pixabay.com/api/docs/): own key required; contributor
  and Pixabay attribution displayed; metadata cached for 24 hours.
- Bing: disabled by default. [Homepage help](https://support.microsoft.com/de-de/bing/explore-the-homepage)
  describes downloads for eligible images. The unofficial feed and its download
  flag do not establish a general API or redistribution licence.
  [Microsoft's terms](https://www.microsoft.com/servicesagreement) and individual
  image rights still apply; local opt-in is not independent legal clearance.

Do not publish the downloaded cache. A personal widget can contain its owner's
extractable Pixabay key; public export always injects an empty configuration.

## Optional weather data

The optional widget uses [Open-Meteo](https://open-meteo.com/) forecast and geocoding APIs. Open-Meteo's free service is for non-commercial use and its data is provided under [CC BY 4.0](https://open-meteo.com/en/terms). The forecast panel displays “Data: Open-Meteo.com”; Settings displays “Weather data by Open-Meteo.com”. Location search data is based on GeoNames; see the [geocoding documentation](https://open-meteo.com/en/docs/geocoding-api). No forecast data or remote weather artwork is bundled with the widget.

## Development dependencies and exports

Development dependencies retain the licences in their npm packages. They are not copied into the TV JavaScript runtime.

`npm run export:public` excludes private fonts and includes this notice and the root MIT licence. Preserve the included font and icon licence texts. Review [public release preparation](docs/public-release.md) before publishing a repository or download.
