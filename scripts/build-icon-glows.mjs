// Offline companion textures for the existing icon catalogue. No filters run on TV.
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';
import { root } from './browser.mjs';

const output = root + '.local/materials/icon-glows/';
mkdirSync(output, { recursive: true });
const browser = await chromium.launch({ headless: true, ...(process.env.CLEANFRAME_BROWSER_CHANNEL ? { channel: process.env.CLEANFRAME_BROWSER_CHANNEL } : {}) });
try {
  const page = await browser.newPage();
  const names = readdirSync(root + 'app/assets/icons').filter(name => name.endsWith('.svg')).sort();
  for (const name of names) {
    const data = await page.evaluate(async source => {
      const svg = new DOMParser().parseFromString(source, 'image/svg+xml').documentElement;
      svg.setAttribute('width', '128'); svg.setAttribute('height', '128');
      svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      const image = new Image();
      image.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(svg));
      await image.decode();
      const ink = document.createElement('canvas'); ink.width = ink.height = 192;
      const context = ink.getContext('2d'); context.drawImage(image, 32, 32, 128, 128);
      context.globalCompositeOperation = 'source-in'; context.fillStyle = '#fffaf0'; context.fillRect(0, 0, 192, 192);
      const glow = document.createElement('canvas'); glow.width = glow.height = 192;
      const paint = glow.getContext('2d');
      paint.filter = 'blur(10px)'; paint.globalAlpha = .8; paint.drawImage(ink, 0, 0);
      paint.filter = 'blur(5px)'; paint.globalAlpha = .6; paint.drawImage(ink, 0, 0);
      return glow.toDataURL('image/png').split(',')[1];
    }, readFileSync(root + 'app/assets/icons/' + name, 'utf8'));
    writeFileSync(output + name.replace(/\.svg$/, '.png'), Buffer.from(data, 'base64'));
  }
  console.log(`Rendered ${names.length} icon glows to .local/materials/icon-glows/. Review before copying to app/assets/icons/glow/.`);
} finally { await browser.close(); }
