// Offline, fixed-pixel shadows matching the approved preview. Never run on TV.
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import vm from 'node:vm';
import { chromium } from 'playwright';
import { root } from './browser.mjs';

const output = root + '.local/materials/icon-glows/';
mkdirSync(output, { recursive: true });
const window = {};
vm.runInNewContext(readFileSync(root + 'app/assets/icons/metrics.js', 'utf8'), { window });
// Six rows: Dock Icons/Both, List Icons/Both, compact List Icons/Both.
// Two columns: light halo / dark halo. Fixed cells are 264 x 216 with 64px padding.
const sizes = [[136, 88, 72], [120, 72, 58], [88, 88, 72], [84, 64, 54], [64, 64, 52], [60, 44, 42]];
const browser = await chromium.launch({ headless: true, ...(process.env.CLEANFRAME_BROWSER_CHANNEL ? { channel: process.env.CLEANFRAME_BROWSER_CHANNEL } : {}) });
try {
  const page = await browser.newPage();
  const names = readdirSync(root + 'app/assets/icons').filter(name => name.endsWith('.svg')).sort();
  for (const name of names) {
    const data = await page.evaluate(async ({ source, metrics: m, sizes }) => {
      const svg = new DOMParser().parseFromString(source, 'image/svg+xml').documentElement;
      svg.setAttribute('width', '240'); svg.setAttribute('height', '240');
      svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      const image = new Image();
      image.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(svg));
      await image.decode();
      const canvas = (w = 264, h = 216) => Object.assign(document.createElement('canvas'), { width: w, height: h });
      const atlas = canvas(528, 1296), result = atlas.getContext('2d');
      const px = value => Math.round(value * 100) / 100;
      sizes.forEach(([w, h, size], row) => {
        const weight = Math.max(.84, Math.min(1.25, Math.pow(.45 / m.fill, .3)));
        const k = Math.min(w / m.w, h / m.h, size * weight / Math.sqrt(m.w * m.h)), side = px(m.n * k);
        const ink = canvas(), ctx = ink.getContext('2d');
        ctx.drawImage(image, 64 + px(w / 2 - (m.x + m.w / 2) * k), 64 + px(h / 2 - (m.y + m.h / 2) * k), side, side);
        // Second shadow sees the first shadow as well as the sharp icon, exactly
        // like drop-shadow(0 0 8px #fff9) drop-shadow(0 0 18px #fff8).
        const near = canvas(), nearCtx = near.getContext('2d');
        nearCtx.filter = 'blur(8px)'; nearCtx.globalAlpha = .6; nearCtx.drawImage(ink, 0, 0);
        const combined = canvas(), combinedCtx = combined.getContext('2d');
        combinedCtx.drawImage(near, 0, 0); combinedCtx.drawImage(ink, 0, 0);
        const halo = canvas(), haloCtx = halo.getContext('2d');
        haloCtx.filter = 'blur(18px)'; haloCtx.globalAlpha = 8 / 15; haloCtx.drawImage(combined, 0, 0);
        haloCtx.filter = 'none'; haloCtx.globalAlpha = 1; haloCtx.drawImage(near, 0, 0);
        ['255,255,255', '32,42,45'].forEach((rgb, column) => {
          const cell = canvas(), paint = cell.getContext('2d');
          // The preview's low-opacity base light stays bounded to the mark,
          // including in Both mode; it never grows to the width of the app tile.
          paint.save(); paint.translate(64 + w / 2, 64 + h / 2);
          paint.scale((w + 60) / 2, (h + 76) / 2);
          const gradient = paint.createRadialGradient(0, 0, 0, 0, 0, Math.SQRT2 * .7);
          gradient.addColorStop(0, 'rgba(' + (column ? rgb : '255,250,236') + ',.24)');
          gradient.addColorStop(1, 'rgba(' + (column ? rgb : '255,250,236') + ',0)');
          paint.fillStyle = gradient; paint.fillRect(-2, -2, 4, 4); paint.restore();
          const tinted = canvas(), tint = tinted.getContext('2d');
          tint.drawImage(halo, 0, 0); tint.globalCompositeOperation = 'source-in';
          tint.fillStyle = 'rgb(' + rgb + ')'; tint.fillRect(0, 0, 264, 216);
          paint.drawImage(tinted, 0, 0);
          result.drawImage(cell, column * 264, row * 216);
        });
      });
      return atlas.toDataURL('image/png').split(',')[1];
    }, { source: readFileSync(root + 'app/assets/icons/' + name, 'utf8'), metrics: window.FrameIconMetrics[name.slice(0, -4)], sizes });
    writeFileSync(output + name.replace(/\.svg$/, '.png'), Buffer.from(data, 'base64'));
  }
  console.log(`Rendered ${names.length} glow atlases. Review .local/materials/icon-glows/ before copying to app/assets/icons/glow/.`);
} finally { await browser.close(); }
