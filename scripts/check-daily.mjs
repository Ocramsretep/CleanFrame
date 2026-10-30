// Offline browser regressions for the daily queue, using synthetic source responses.
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync } from 'node:fs';
import { openPreview, root } from './browser.mjs';

const preview = await openPreview({ publicFonts: true });
const context = await preview.browser.newContext({ viewport: { width: 1920, height: 1080 } });
const page = await context.newPage();
const errors = [];
page.on('pageerror', e => errors.push(e.message));
const image = readFileSync(root + 'app/assets/wallpapers/misty.jpg');
const requests = [];
let failNetwork = false;
await context.route('**/daily-fetch?*', async route => {
  const url = new URL(route.request().url()).searchParams.get('url');
  requests.push(url);
  if (failNetwork) return route.abort();
  await route.fulfill({ status: 200, contentType: 'image/jpeg', body: image });
});
await context.addInitScript(() => {
  window.__dailyCalls = [];
  window.addEventListener('DOMContentLoaded', () => {
    let n = 0;
    window.CleanFrameDailyProviders.load = (id, cursor, request, done) => {
      window.__dailyCalls.push(id);
      const p = window.CleanFrameDailyProviders.list.find(p => p.id === id);
      done(null, [{ id: id + ':' + ++n, source: id, theme: p.theme,
        url: 'https://assets.science.nasa.gov/test-' + id + '-' + n + '.jpg',
        page: 'https://science.nasa.gov/apod/', title: 'Test landscape <unsafe>',
        credit: 'Test photographer', license: 'CC BY 4.0' }], {});
    };
  });
});
const state = () => page.evaluate(() => {
  const d = CleanFrameDaily.view();
  return { current: d.current && d.current.id, theme: d.current && d.current.theme, count: d.count, options: d.options, status: d.status, loading: d.loading };
});
async function ready() { await page.waitForFunction(() => window.ShoreQA && ShoreQA.ready()); }
async function act(action) { assert.ok(await page.evaluate(a => ShoreQA.activate(a), action), action); }
try {
  await page.goto(preview.baseURL + '/home/'); await ready();
  assert.equal(requests.length, 0, 'Bundled backgrounds make no provider requests');
  assert.equal(await page.locator('#dailySkip').isVisible(), false);
  assert.equal((await state()).options.sources.bing, false);
  await page.evaluate(() => ShoreQA.scene('settings'));
  await act('settings.group.background');
  assert.equal(await page.locator('[data-action="choice.bg.light"]').count(), 0);
  assert.equal(await page.locator('[data-action="choice.bg.dark"]').count(), 0);
  assert.match(await page.locator('[data-action="choice.bg.photo"]').innerText(), /Local pictures/);
  await page.evaluate(() => ShoreQA.nav('right'));
  assert.equal((await page.evaluate(() => ShoreQA.where())).focusAction, 'background.local');
  await page.evaluate(() => ShoreQA.nav('ok'));
  assert.equal(await page.locator('[data-action="background.wallpaper"]').isVisible(), true);
  await page.evaluate(() => ShoreQA.nav('back'));
  assert.equal((await page.evaluate(() => ShoreQA.where())).focusAction, 'background.local');
  await page.evaluate(() => ShoreQA.nav('down'));
  assert.equal((await page.evaluate(() => ShoreQA.where())).focusAction, 'background.daily');
  await page.evaluate(() => ShoreQA.nav('ok', 'back'));
  assert.equal((await page.evaluate(() => ShoreQA.where())).focusAction, 'background.daily');
  mkdirSync(root + '.local/qa', { recursive: true });
  await page.screenshot({path:root + '.local/qa/background-types.png'});
  await page.evaluate(() => ShoreQA.scene('home'));

  await page.evaluate(async () => {
    const blob = await (await fetch('/home/assets/wallpapers/misty.jpg')).blob();
    await new Promise((resolve, reject) => {
      const request = indexedDB.open('cleanframe.daily.v1', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('cache');
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result, tx = db.transaction('cache', 'readwrite');
        const poster = {id:'earth:poster',source:'earth',theme:'earth',url:'https://upload.wikimedia.org/poster.jpg',page:'https://commons.wikimedia.org/wiki/File:Poster.jpg',title:'Old poster',credit:'USGS',blob};
        tx.objectStore('cache').put({queue:[{...poster,id:'earth:queued'}],current:poster,date:'2000-1-1',history:[],cursors:{}}, 'state');
        tx.oncomplete = () => {db.close();resolve();}; tx.onerror = () => reject(tx.error);
      };
    });
  });
  await page.evaluate(() => ShoreQA.look({ bg: 'daily' })); await ready();
  await page.waitForFunction(() => CleanFrameDaily.view().current && CleanFrameDaily.view().count >= 5);
  assert.equal(await page.locator('#dailySkip').isVisible(), false, 'Skip is inside Picture info');
  assert.ok(!(await page.evaluate(() => window.__dailyCalls)).includes('bing'));
  assert.ok(!await page.evaluate(() => CleanFrameDaily.providers.some(p => p.id === 'earth')));
  const cachedSources = await page.evaluate(() => new Promise(resolve => {
    const request = indexedDB.open('cleanframe.daily.v1', 1);
    request.onsuccess = () => { const db=request.result; const read=db.transaction('cache').objectStore('cache').get('state'); read.onsuccess=()=>{const s=read.result; db.close();resolve([s.current].concat(s.queue).filter(Boolean).map(x=>x.source));}; };
  }));
  assert.ok(!cachedSources.includes('earth'), 'Retired USGS current and queued blobs are removed from persistent storage');
  const before = await state();
  await page.evaluate(() => ShoreQA.nav('up', 'right', 'right', 'right'));
  assert.equal((await page.evaluate(() => ShoreQA.where())).focusAction, 'daily.info');
  assert.equal((await page.evaluate(() => ShoreQA.where())).focusCount, 1);
  await page.evaluate(() => ShoreQA.nav('ok'));
  assert.equal((await page.evaluate(() => ShoreQA.where())).focusAction, 'daily.skip');
  assert.equal(await page.locator('#dailySkip').isVisible(), true);
  await page.evaluate(() => ShoreQA.nav('ok'));
  await page.waitForFunction(id => CleanFrameDaily.view().current.id !== id, before.current);
  assert.notEqual((await state()).theme, before.theme, 'Skip alternates available themes');
  const skippedTo = (await state()).current;
  await page.evaluate(() => CleanFrameDaily.tick());
  assert.equal((await state()).current, skippedTo, 'Same calendar day keeps the picture');
  assert.equal(await page.locator('#dailyCredit').isVisible(), false);
  assert.equal(await page.locator('#dailyCredit unsafe').count(), 0);
  assert.equal(await page.locator('#dailyDetails').isVisible(), true);
  assert.match(await page.locator('#dailyDetails').innerText(), /Test photographer/);
  assert.deepEqual(await page.locator('.daily-info-link').allInnerTexts(), ['Picture Page']);
  assert.equal((await page.locator('#dailyDetailsContent').innerText()).includes('https://'), false, 'Full URLs are not shown');
  await page.evaluate(() => { window.__openedPictureUrl = ''; window.__realOpenUrl = FrameDevice.openUrl; FrameDevice.openUrl = (url, done) => { window.__openedPictureUrl = url; done(null); }; ShoreQA.nav('down'); });
  assert.ok(await page.locator('[data-action="daily.link.page"]').evaluate(el => el.classList.contains('is-focus')), 'Picture Page visibly receives focus');
  await page.evaluate(() => ShoreQA.nav('ok'));
  assert.equal(await page.evaluate(() => window.__openedPictureUrl), 'https://science.nasa.gov/apod/', 'Picture page opens through the browser adapter');
  await page.evaluate(() => {
    const c = CleanFrameDaily.view().current;
    window.__licenseOriginal = c.licenseURL;
    c.licenseURL = 'https://creativecommons.org/licenses/by/4.0/';
    ShoreQA.nav('down');
  });
  assert.deepEqual(await page.locator('.daily-info-link').allInnerTexts(), ['Picture Page', 'License']);
  assert.ok(await page.locator('[data-action="daily.link.license"]').evaluate(el => el.classList.contains('is-focus')), 'License visibly receives focus');
  assert.ok((await page.locator('[data-action="daily.link.license"]').boundingBox()).width <= 280, 'Link focus stays compact');
  const pageLinkBounds = await page.locator('[data-action="daily.link.page"]').boundingBox();
  const licenseLinkBounds = await page.locator('[data-action="daily.link.license"]').boundingBox();
  assert.ok(licenseLinkBounds.x > pageLinkBounds.x && Math.abs(licenseLinkBounds.y - pageLinkBounds.y) < 2, 'Picture Page and License share a row');
  const panelBounds = await page.locator('#dailyDetails').boundingBox();
  const anchorBounds = await page.locator('#dailyInfo').boundingBox();
  assert.ok(Math.abs(panelBounds.y - anchorBounds.y - anchorBounds.height - 18) < 2, 'Picture info uses the same anchor spacing as Sources');
  await page.evaluate(() => ShoreQA.nav('left'));
  assert.ok(await page.locator('[data-action="daily.link.page"]').evaluate(el => el.classList.contains('is-focus')), 'Left moves focus to Picture Page');
  await page.evaluate(() => ShoreQA.nav('right'));
  assert.ok(await page.locator('[data-action="daily.link.license"]').evaluate(el => el.classList.contains('is-focus')), 'Right moves focus to License');
  await page.screenshot({ path: root + '.local/qa/picture-info-link-focus.png' });
  await page.evaluate(() => ShoreQA.nav('up', 'up'));
  assert.ok(await page.locator('#dailySkip').evaluate(el => el.classList.contains('is-focus')), 'Up returns focus to Skip');
  await page.screenshot({ path: root + '.local/qa/picture-info-skip-focus.png' });
  await page.evaluate(() => ShoreQA.nav('down', 'down'));
  await page.evaluate(() => ShoreQA.nav('ok'));
  assert.equal(await page.evaluate(() => window.__openedPictureUrl), 'https://creativecommons.org/licenses/by/4.0/', 'License link opens through the browser adapter');
  await page.evaluate(() => { CleanFrameDaily.view().current.licenseURL = window.__licenseOriginal; });
  await page.evaluate(() => { FrameDevice.openUrl = window.__realOpenUrl; ShoreQA.nav('back', 'ok'); });
  await page.evaluate(() => {
    const c = CleanFrameDaily.view().current;
    window.__sourceCredit = c.credit;
    c.credit = 'Long source credit '.repeat(120);
    ShoreQA.nav('down', 'down', 'down');
  });
  assert.ok((await page.locator('#dailyDetails').boundingBox()).height <= 610);
  assert.ok(await page.locator('#dailyDetailsContent').evaluate(el => el.scrollTop > 0), 'Long attribution details scroll with the remote');
  await page.evaluate(() => { CleanFrameDaily.view().current.credit = window.__sourceCredit; });
  await page.evaluate(() => ShoreQA.nav('back'));
  assert.equal(await page.locator('#dailyDetails').isVisible(), false);
  assert.equal((await page.evaluate(() => ShoreQA.where())).focusAction, 'daily.info');
  await page.evaluate(() => ShoreQA.scene('settings'));
  await act('settings.group.background');
  const onlineThumb = await page.locator('[data-action="choice.bg.daily"] img').getAttribute('src');
  assert.ok(onlineThumb.startsWith('blob:'));
  await act('background.local'); await act('background.rotation'); await act('rotation.15');
  assert.equal(await page.evaluate(() => ShoreQA.state().look.bg), 'daily');
  await page.evaluate(() => ShoreQA.nav('back', 'back'));
  await act('background.daily');
  assert.notEqual((await page.evaluate(() => ShoreQA.where())).focusAction, 'daily.skip');
  assert.equal((await state()).options.sources.pixabay, false, 'Public preview has no API key');
  assert.equal(await page.evaluate(() => CleanFrameDaily.configure('pixabay', true)), false);
  mkdirSync(root + '.local/qa', { recursive: true });
  await page.screenshot({ path: root + '.local/qa/daily-settings.png' });
  const retryBounds = await page.locator('[data-action="daily.retry"]').boundingBox();
  assert.ok(retryBounds.y + retryBounds.height < 980, 'All source controls fit above the footer');
  await act('daily.fit.contain');
  assert.equal(await page.locator('#dailyPhoto').evaluate(el => getComputedStyle(el).objectFit), 'contain');
  await act('daily.source.bing');
  assert.equal((await state()).options.sources.bing, true);
  await act('daily.source.bing');
  await page.evaluate(() => ShoreQA.nav('back'));
  assert.equal((await page.evaluate(() => ShoreQA.where())).focusAction, 'background.daily');
  await page.evaluate(() => ShoreQA.scene('home'));
  failNetwork = true;
  await page.reload(); await ready();
  await page.waitForFunction(() => CleanFrameDaily.view().url);
  assert.equal((await state()).current, skippedTo, 'Current blob and date survive an offline reload');
  assert.equal((await state()).options.fit, 'contain');
  assert.equal((await state()).options.sources.bing, false);
  const offline = (await state()).current;
  await act('daily.info'); await act('daily.skip');
  await page.waitForFunction(id => CleanFrameDaily.view().current.id !== id, offline);
  await page.evaluate(() => ShoreQA.nav('back'));
  const priorDay = (await state()).current;
  await page.clock.install({ time: new Date() });
  await page.clock.setSystemTime(new Date(Date.now() + 24 * 60 * 60 * 1000));
  await page.evaluate(() => ShoreQA.scene('settings'));
  await page.evaluate(() => CleanFrameDaily.tick());
  assert.equal((await state()).current, priorDay, 'Calendar change waits while a panel owns focus');
  await page.evaluate(() => ShoreQA.scene('home'));
  await page.waitForFunction(id => CleanFrameDaily.view().current.id !== id, priorDay);
  const newDay = (await state()).current;
  await page.evaluate(() => CleanFrameDaily.tick());
  assert.equal((await state()).current, newDay, 'Exactly one automatic change per day');
  await page.evaluate(() => {
    window.__savedPut = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function () { throw new DOMException('Synthetic full storage', 'QuotaExceededError'); };
    CleanFrameDaily.skip();
  });
  await page.waitForFunction(() => /storage|save/i.test(CleanFrameDaily.view().status));
  assert.equal((await state()).current, newDay, 'Failed cache commit retains the current image');
  await page.evaluate(() => { IDBObjectStore.prototype.put = window.__savedPut; });
  for (const layout of ['dock', 'list']) {
    await page.evaluate(layout => ShoreQA.look({ layout }), layout); await ready();
    await page.evaluate(() => ShoreQA.scene('home'));
    await act('daily.info'); await act('daily.skip');
    assert.equal((await page.evaluate(() => ShoreQA.where())).focusAction, 'daily.skip');
    const buttons = await page.locator('.utils .u').evaluateAll(es => es.map(e => e.getBoundingClientRect().top));
    assert.equal(buttons.length, 4); assert.ok(buttons.every(y => Math.abs(y - buttons[0]) < 1));
    for (const width of [1920, 1280]) {
      await page.setViewportSize({ width, height: width * 9 / 16 });
      mkdirSync(root + '.local/qa', { recursive: true });
      await page.screenshot({ path: root + '.local/qa/daily-' + layout + '-' + width + '.png' });
      const bounds = await page.locator('#dailySkip').boundingBox();
      assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= width);
    }
  }
  await page.evaluate(() => {
    CleanFrameDaily.providers.forEach(p => CleanFrameDaily.configure(p.id, false));
    CleanFrameDaily.skip();
  });
  assert.ok((await state()).current, 'An empty queue keeps the current picture');
  assert.equal((await state()).count, 0, 'Disabled sources are removed from the queue');
  await page.waitForFunction(async () => await new Promise(resolve => {
    const request=indexedDB.open('cleanframe.daily.v1',1);
    request.onsuccess=()=>{const db=request.result;const read=db.transaction('cache').objectStore('cache').get('state');read.onsuccess=()=>{db.close();resolve(read.result.queue.length===0);};};
  }));
  // Confirm the actual rendered crop never distorts image proportions.
  await page.setViewportSize({ width: 1920, height: 1080 });
  for (const [width, height] of [[1600, 2400], [2000, 2000], [2400, 1000]]) {
    await page.evaluate(([w, h]) => {
      const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d'); ctx.fillStyle = '#285f83'; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#fff'; ctx.fillRect(w / 2 - 10, 0, 20, h);
      document.getElementById('dailyPhoto').src = canvas.toDataURL('image/jpeg');
    }, [width, height]);
    await page.locator('#dailyPhoto').evaluate(el => el.decode());
    for (const fit of ['cover', 'contain']) {
      const geometry = await page.locator('#dailyPhoto').evaluate((el, fit) => {
        el.style.objectFit = fit;
        return { width: el.clientWidth, height: el.clientHeight, naturalWidth: el.naturalWidth, naturalHeight: el.naturalHeight, fit: getComputedStyle(el).objectFit };
      }, fit);
      assert.equal(geometry.fit, fit); assert.equal(geometry.width, 1920); assert.equal(geometry.height, 1080);
      assert.equal(geometry.naturalWidth, width); assert.equal(geometry.naturalHeight, height);
      await page.screenshot({ path: root + '.local/qa/daily-format-' + width + '-' + fit + '.png' });
    }
  }
  await page.evaluate(() => ShoreQA.look({ bg: 'photo' })); await ready();
  assert.equal(await page.locator('#dailySkip').isVisible(), false);
  assert.equal(await page.locator('#dailyPhoto').isVisible(), false);
  assert.deepEqual(errors, []);
  // Exercise real parsers separately from queue fixtures, with a synthetic build key.
  const providersContext = await preview.browser.newContext();
  try {
    await providersContext.route('**/daily-config.js', route => route.fulfill({ contentType: 'text/javascript', body: 'window.CleanFrameDailyConfig = {pixabayKey:"synthetic-test-only"};' }));
    const sourcePage = await providersContext.newPage();
    await sourcePage.goto(preview.baseURL + '/home/');
    const checks = await sourcePage.evaluate(async () => {
      const P = CleanFrameDailyProviders;
      const load = (id, data) => new Promise((resolve, reject) => P.load(id, {}, (url, binary, done) => done(null, JSON.stringify(data)), (err, entries) => err ? reject(err) : resolve(entries)));
      const commons = await load('nature', { query: { pages: { 42: { pageid: 42, title: 'File:Mountain.jpg', imageinfo: [{ width: 3000, height: 2000, url: 'https://upload.wikimedia.org/Mountain.jpg?utm_source=api', thumburl: 'https://thumb.wikimedia.org/Mountain.jpg', descriptionurl: 'https://commons.wikimedia.org/wiki/File:Mountain.jpg', extmetadata: { Artist: {value:'<a href="https://example.org">Photographer</a>'}, LicenseShortName: {value:'CC BY-SA 4.0'} } }] } } } });
      let calls = 0;
      const pixabay = () => new Promise((resolve, reject) => P.load('pixabay', {}, (url, binary, done) => {
        calls++; done(null, JSON.stringify({ hits: [{ id: 1, user: 'Test artist', tags: 'mountain, nature', pageURL: 'https://pixabay.com/photos/test-1/', largeImageURL: 'https://cdn.pixabay.com/test_1280.jpg', fullHDURL: 'https://cdn.pixabay.com/test_1920.jpg' }] }));
      }, (err, entries) => err ? reject(err) : resolve(entries)));
      const first = await pixabay(); const second = await pixabay();
      return { commons: commons.length, credit: commons[0].credit, calls, cached: second[0].id === first[0].id, fullHD: first[0].url.endsWith('_1920.jpg'), safe: !P.safeURL('https://pixabay.com.attacker.example/'), noKeyInCache: !localStorage.getItem('cleanframe.pixabay.metadata.v1').includes('synthetic-test-only') };
    });
    assert.deepEqual(checks, { commons: 1, credit: 'Photographer', calls: 1, cached: true, fullHD: true, safe: true, noKeyInCache: true });
    await sourcePage.reload();
    const cached = await sourcePage.evaluate(() => new Promise(resolve => CleanFrameDailyProviders.load('pixabay', {}, () => resolve(false), (err, entries) => resolve(!err && entries.length === 1))));
    assert.equal(cached, true, 'Pixabay metadata cache survives reload without another API request');
  } finally { await providersContext.close(); }
  console.log('Daily queue, offline reload/skip, source opt-in, remote focus, escaping and six image-fit cases passed.');
} finally { await context.close(); await preview.close(); }
