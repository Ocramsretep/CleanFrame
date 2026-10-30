import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import vm from 'node:vm';
import test from 'node:test';

const root = new URL('../', import.meta.url), window = {};
vm.runInNewContext(readFileSync(new URL('app/app-icons.js', root), 'utf8'), { window });
vm.runInNewContext(readFileSync(new URL('app/assets/icons/metrics.js', root), 'utf8'), { window });
const icons = window.FrameAppIcons;

test('regional app IDs resolve without depending on translated display names', () => {
  assert.equal(icons.resolve('evKhCgZelL.AmazonIgnitionLauncher2', ''), 'primevideo');
  assert.equal(icons.resolve('rJyOSqC6Up.PPlusIntl', ''), 'paramountplus');
  assert.equal(icons.resolve('rJyOSqC6Up.CBSAllAccess', ''), 'paramountplus');
  assert.equal(icons.resolve('SrAoJxGQUf.ARD', ''), 'ard');
  assert.equal(icons.resolve('com.samsung.tv.cobalt-yt', ''), 'youtube');
  assert.equal(icons.resolve('Unknown123.App', ''), 'unknown');
  assert.equal(icons.resolve('constructor', ''), 'unknown');
});

test('saved overrides cannot inject paths or prototype keys', () => {
  const saved = JSON.parse('{"org.tizen.netflix-app":"cleanframe","constructor":"youtube","__proto__":"youtube","Other.App":"../../secret","Bad/App":"youtube"}');
  const clean = icons.clean(saved);
  assert.deepEqual(JSON.parse(JSON.stringify(clean)), { 'org.tizen.netflix-app': 'cleanframe' });
  clean['org.tizen.netflix-app'] = 'netflix';
  assert.equal(saved['org.tizen.netflix-app'], 'cleanframe', 'Cleaning must copy preferences for atomic writes');
});

test('all selectable icons are bundled and measured; extended provenance matches bytes', () => {
  const seen = new Set();
  for (const item of icons.list) {
    assert.match(item.id, /^[a-z][a-z0-9-]*$/);
    assert.ok(!seen.has(item.id)); seen.add(item.id);
    const svg = readFileSync(new URL('app/assets/icons/' + item.id + '.svg', root), 'utf8');
    assert.match(svg, /<svg\b/);
    assert.doesNotMatch(svg, /<script\b|<foreignObject\b|<image\b|\bon\w+\s*=/i);
    assert.doesNotMatch(svg, /(?:xlink:)?href\s*=\s*["'](?!#)/i);
    const m = window.FrameIconMetrics[item.id];
    assert.ok(m && m.w > 0 && m.h > 0 && m.fill > 0, item.id);
    const glow = readFileSync(new URL('app/assets/icons/glow/' + item.id + '.png', root));
    assert.equal(glow.subarray(1, 4).toString(), 'PNG', item.id + ' has a baked halo');
    assert.equal(glow.readUInt32BE(16), 192, item.id + ' halo width matches padded icon');
    assert.equal(glow.readUInt32BE(20), 192, item.id + ' halo height matches padded icon');
  }
  for (const entry of JSON.parse(readFileSync(new URL('app/assets/icons/EXTENDED-SOURCES.json', root), 'utf8'))) {
    const bytes = readFileSync(new URL('app/assets/icons/' + entry.file, root));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), entry.sha256, entry.file);
    assert.ok(entry.source && (entry.license || entry.collection_license));
  }
});
