# CleanFrame

This fork adapts CleanFrame for a [Samsung UE49NU8079 running Tizen 4](docs/nu8000.md). Its TV results are in [TV status](docs/tv-status.md). The source app and native Home helper originated on a different Samsung TV.

A quieter home screen for Samsung TVs. Your apps, a photograph and the time, with an interface made for the TV remote.

![CleanFrame browser preview using the bundled Manrope font](docs/images/cleanframe-dock.jpg)

The original CleanFrame was built for a Samsung The Frame. This fork records a separate adaptation and on-device checks for the UE49NU8079. Other TVs need their own checks.

**Use it at your own risk.** The setup scripts still contain upstream computer, TV and firmware assumptions. Adapt and verify them for your own hardware.

Start with the browser preview, then follow the separate NU8000 build instructions if you have that TV. Native Home/startup changes have not been performed on the NU8000; the setup guide covers the upstream method and its recovery requirements.

## Try the interface

You need Node.js 22.13+ (22 LTS), or 24+, and Python 3.10+ to run the browser preview.

```sh
git clone https://github.com/Ocramsretep/CleanFrame.git
cd CleanFrame
npm ci
npm run dev:public
```

Open [localhost:4795/home/](http://localhost:4795/home/). Use the arrow keys, Enter and Escape, or click the controls. App launches and Samsung screens require a TV; the preview reports that limitation when you select them.

The public preview uses the included Manrope, Geist and Newsreader fonts.

## What you can change

- Choose a List or Dock layout, with icons, names or both.
- Use a photograph, light or dark background, with a simple 12-hour clock.
- Adjust typography, focus and glass materials through the same Settings interface.
- Choose and reorder Home apps; discover installed apps on the TV.
- Select from fifteen wallpapers and save your preferences locally.

The glass and blur are rendered ahead of time. The TV loads the finished images and uses transforms and opacity for focus feedback.

## Use a coding agent

Open this repo in a local coding agent and give it a bounded change:

```text
Read AGENTS.md, docs/development.md and docs/interaction-behaviour.md.
Help me adapt CleanFrame. Start with the public-font browser preview.
My first change is: <describe one change>.
Preserve remote navigation, saved preferences and the ES5 runtime.
Run the source checks and relevant browser checks. Show the result.
This task is browser-only: do not connect to a TV, sign or install a
package, or change Home/startup settings.
```

See [working with an agent](docs/for-agents.md) for the TV setup prompt and the distinction between UI work, app installation and native Home changes. An agent needs local computer access for TV work; a hosted chat cannot reach your TV merely by reading this repo.

## Put it on a TV

Use the [NU8000 adaptation record](docs/nu8000.md) for this fork's build and device results. The staged [Samsung The Frame setup guide](docs/agent-tv-setup-guide.md) describes the upstream installation process and must be adapted to another TV. It covers Developer Mode, official Samsung tools, certificates, installation, visible checks and recovery.

Signing supports an ignored `.local/signing.json` based on `signing.example.json`: select your SDK, existing certificate profile and your own SDK-generated app identity. See [local signing setup](docs/development.md#local-tv-tools-and-signing). The TV installation commands and native Home helper still contain reference-machine assumptions. Your agent must check the installed-app IDs and each device stage with you. Installing the app and assigning the remote Home button are separate steps.

| Area | Evidence and limits |
| --- | --- |
| This fork's hardware | Samsung UE49NU8079, firmware T-KTM2DEUC-1360.0, Tizen 4.0, ARMv7 |
| App installation | The separate NU8000 build was signed and installed in place; individual visible checks are recorded in the TV status. |
| Home button | Physical Home still opens Samsung Home. Native Home/startup reassignment was not performed. |
| Still open | Further changed UI and remote flows need visible checks on this TV. There is no verified Home reassignment and rollback method for it. |
| Other TVs | No compatibility claim. This is Tizen source; Android TV, Google TV, LG webOS and Roku need their own implementations. |

The [TV status](docs/tv-status.md) links to the detailed NU8000 record and separates it from the [upstream LS03D results](docs/upstream-tv-status.md). The upstream native Home helper does not target this TV. CleanFrame can be opened manually without native reassignment.

## Develop and check

```sh
npm run check
npm run check:tools
npx playwright install chromium
CLEANFRAME_PUBLIC_FONTS=1 npm run check:browser
npm run check:public
npm run export:public
```

The browser checks use isolated Chromium profiles and a loopback preview. They never contact a TV. The public export creates `dist/CleanFrame-public-unsigned.wgt`, with public fonts and notices. It needs your own identity and signing before installation. It does not certify asset redistribution rights or device compatibility.

| Location | Purpose |
| --- | --- |
| `app/` | Current packaged UI and runtime assets |
| `scripts/` | Preview, validation, asset generation and reference TV tools |
| [Development](docs/development.md) / [testing](docs/testing.md) | Runtime map, preferences, checks and device boundaries |
| [Assets](docs/assets.md) / [third-party notices](THIRD_PARTY_NOTICES.md) | Rendering recipes, font separation and asset provenance |
| [Asset sources](docs/asset-sources.md) | Photo credits and verification of the bundled third-party assets |
| `.local/`, `dist/` | Ignored private setup, recovery data, generated files and packages |

## Contribute

Fork it, experiment and build something that suits your TV. If you find a useful fix or improve the setup instructions, contributions are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) before a larger change. Reports should include model, firmware and the observed result, with private identifiers removed.

## Licence and credits

CleanFrame's original code and documentation use the [MIT licence](LICENSE). Fonts, photographs and logos retain their own terms; read [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). Paid Pangram binaries are excluded from Git and public exports. A local package may include them, so keep personal builds separate from public downloads.

The [release review](docs/public-release.md) records the publication checks. Third-party assets retain the terms listed in their notices. CleanFrame is an independent project with no Samsung or streaming-service affiliation.

[TV Detox](https://github.com/Ansub/tv-detox) is a useful example of making an agent-assisted TV project approachable. Its Android setup is a different implementation; the prompts and instructions here are written for CleanFrame and Tizen.
