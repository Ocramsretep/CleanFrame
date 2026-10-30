# Home UI components

The framework has three Home components: **Dock**, **Action Bar** and **Widgets**.
Design settings provide shared focus, material and panel opacity values that
these components inherit. The right-side icon group is the Action Bar. Its
buttons, the weather widget, and popup choices use the same focus contract.
App tiles retain their separate
App highlight setting; text fields keep an input border so the keyboard target
remains visible.

## Focus API

`app/ui.js` exposes `FrameUI.focusClass(kind, active)`. It returns the component
class and `is-focus` when the remote selection is active. Use `solid` for sheet
actions and settings choices, `surface` for popup and widget choices, and
`utility` for Action Bar controls. `main.js` still owns remote navigation and
which item is focused. The shared appearance is in the `ui-focus-*` rules in
`app/style.css`; apply changes there rather than adding an action-specific
focus colour.

```js
className = 'source-button' + FrameUI.focusClass('surface', selected);
```

The Action Bar uses the same Glass lens for every icon. In icon mode the lens
has a rounded square shape. Type focus scales the selected icon and shows its
caption. Picture info keeps Skip and browser links inside its popup. Sources
rows and Picture info controls use the surface variant; sheet commands use the solid
variant. A popup that stays open may add `is-open` to its anchor.

## Popup API

Use the `ui-popup` container with a `ui-popup-material` sibling before
`ui-popup-content`. The material layer shares the saved Panel opacity; the
content remains fully opaque. Sources, Weather and Picture info use this
structure. `FrameUI.setPopupOpen(menu, open, anchor)` handles visibility and
`aria-expanded`. `FrameUI.placePopup(menu, anchor, image, options)` positions
anchored popups in the 1920 × 1080 logical stage and aligns a cached material
image with the background. Call it after rendering content, since popup height
can change. Pass `stage`, optional `above`, `alignRight`, `offset`, `margin`, `right`,
`bottom`, and `photo`/`imageSrc` for a photographic material.

Keep effects in CSS and pre-rendered assets. The helper only updates position,
visibility and image alignment; it does not blur or analyse pixels at runtime.
