/* Shared Home focus and popup contract. Keep geometry and focus ownership in main.js. */
(function () {
  'use strict';

  function clamp(value, low, high) { return Math.max(low, Math.min(high, value)); }
  function px(value) { return value + 'px'; }
  function focusClass(kind, active) {
    return ' ui-focus ui-focus-' + kind + (active ? ' is-focus' : '');
  }
  function setPopupOpen(menu, open, anchor) {
    menu.hidden = !open;
    if (anchor) anchor.setAttribute('aria-expanded', String(!!open));
  }
  function placePopup(menu, anchor, image, options) {
    var rect, stageRect, scale, x, y, source;
    if (!anchor || menu.hidden) return;
    rect = anchor.getBoundingClientRect();
    stageRect = options.stage.getBoundingClientRect();
    scale = stageRect.width / 1920 || 1;
    x = options.alignRight ? (rect.right - stageRect.left) / scale - menu.offsetWidth
      : (rect.left - stageRect.left) / scale;
    x = clamp(x, options.margin || 80, 1920 - menu.offsetWidth - (options.right || 80));
    y = options.above ? (rect.top - stageRect.top) / scale - menu.offsetHeight - (options.offset || 18)
      : (rect.bottom - stageRect.top) / scale + (options.offset || 18);
    y = clamp(y, options.margin || 80, 1080 - menu.offsetHeight - (options.bottom || 80));
    menu.style.left = px(x); menu.style.top = px(y);
    if (!image) return;
    image.hidden = !options.photo;
    if (image.hidden) return;
    source = options.imageSrc;
    if (image.getAttribute('src') !== source) image.src = source;
    image.style.left = px(-x); image.style.top = px(-y);
  }

  window.FrameUI = { focusClass: focusClass, setPopupOpen: setPopupOpen, placePopup: placePopup };
})();
