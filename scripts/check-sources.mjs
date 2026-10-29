import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { openPreview, root } from './browser.mjs';
const preview = await openPreview({publicFonts:true});
mkdirSync(root+'.local/qa',{recursive:true});
try {
  for (const width of [1920,1280]) {
    const page=await preview.browser.newPage({viewport:{width,height:width*9/16}}), errors=[];
    page.on('pageerror',err=>errors.push(err.message));
    await page.addInitScript(() => {
      window.__switches=[]; window.__launches=[];
      window.tizen={application:{ getCurrentApplication:()=>({appInfo:{id:'Owner12345.Home'}}),getAppsInfo:ok=>ok([]),launch:(id,ok)=>{window.__launches.push(id);ok();}},
        systeminfo:{getPropertyValue:(name,ok)=>ok({connected:[{type:'HDMI',number:1}],disconnected:[{type:'TV',number:0},{type:'HDMI',number:2}]})},
        tvwindow:{getSource:()=>({type:'HDMI',number:1}),setSource:(source,ok)=>{window.__switches.push(source);ok();}}};
    });
    await page.goto(preview.baseURL+'/home/'); await page.waitForFunction(()=>window.ShoreQA?.ready?.());
    const original=await page.evaluate(()=>ShoreQA.state().home);
    const act=async name=>assert.ok(await page.evaluate(a=>ShoreQA.activate(a),name),name);
    await page.evaluate(()=>ShoreQA.scene('settings')); await act('settings.group.sources'); await act('sources.hdmi1');
    await act('sources.visible'); await act('sources.icon'); await act('sources.name'); await act('source.name.input');
    assert.equal(await page.locator('#sourceNameInput').evaluate(el=>el===document.activeElement),true);
    await page.locator('#sourceNameInput').fill('Xbox'); await page.keyboard.press('Enter'); await page.keyboard.press('Enter');
    assert.equal(await page.evaluate(()=>ShoreQA.state().view),'sourceEdit');
    await act('sources.earlier'); await act('sources.done'); await act('sources.scan');
    assert.match(await page.locator('.source-status').innerText(),/HDMI 1: connected \(current\)/);
    await page.keyboard.press('Escape'); await page.keyboard.press('Escape');
    await page.keyboard.press('ArrowUp');
    assert.equal(await page.evaluate(()=>ShoreQA.where().focusAction),'util.sources');
    await page.keyboard.press('Enter');
    assert.equal(await page.evaluate(()=>ShoreQA.where().focusAction),'source.hdmi1');
    assert.equal(await page.evaluate(()=>ShoreQA.where().focusCount),1);
    await page.waitForTimeout(350);
    await page.screenshot({path:root+`.local/qa/source-menu-${width}.png`});
    for (const material of ['soft','frost','tint']) {
      await page.evaluate(material=>ShoreQA.look({bg:'photo',material,focus:'glass'}),material); await page.waitForFunction(()=>ShoreQA.ready());
      const style=await page.evaluate(()=>({image:document.getElementById('sourceMenuImage').getAttribute('src'),blur:getComputedStyle(document.getElementById('sourceMenu')).backdropFilter,background:getComputedStyle(document.querySelector('#sourceMenu .is-focus')).backgroundImage}));
      assert.match(style.image,new RegExp(material==='soft'?'field-blur':material==='tint'?'field-clear':'field-frost'));
      assert.equal(style.blur,'none'); assert.notEqual(style.background,'none');
    }
    for (const bg of ['light','dark']) {
      await page.evaluate(bg=>ShoreQA.look({bg}),bg); await page.waitForFunction(()=>ShoreQA.ready());
      assert.equal(await page.locator('#sourceMenuImage').isVisible(),false);
    }
    await page.evaluate(()=>ShoreQA.look({bg:'photo',material:'soft',focus:'type',font:'geist'})); await page.waitForFunction(()=>ShoreQA.ready());
    assert.match(await page.locator('#sourceMenu').evaluate(el=>getComputedStyle(el).fontFamily),/Geist/);
    assert.equal(await page.locator('#sourceMenu .is-focus').evaluate(el=>getComputedStyle(el).backgroundImage),'none');
    await page.evaluate(()=>ShoreQA.look({focus:'glass',font:'manrope'})); await page.waitForFunction(()=>ShoreQA.ready());
    const fits=await page.locator('#sourceMenu').evaluate(el=>{const r=el.getBoundingClientRect(); return r.left>=0 && r.top>=0 && r.right<=innerWidth && r.bottom<=innerHeight;});
    assert.ok(fits); assert.equal(await page.locator('#sourceRow').count(),0);
    await page.keyboard.press('Enter');
    assert.deepEqual(await page.evaluate(()=>window.__switches),[{type:'HDMI',number:1}]);
    assert.deepEqual(await page.evaluate(()=>window.__launches),['org.tizen.tv-viewer']);
    assert.equal(await page.evaluate(()=>ShoreQA.where().focusAction),'util.sources');
    await page.keyboard.press('Enter'); await page.keyboard.press('ArrowDown');
    assert.equal(await page.evaluate(()=>ShoreQA.where().focusAction),'source.tv');
    await page.keyboard.press('Enter');
    assert.deepEqual(await page.evaluate(()=>window.__switches),[{type:'HDMI',number:1},{type:'TV',number:0}]);
    await page.keyboard.press('Enter'); await page.keyboard.press('Escape');
    assert.equal(await page.evaluate(()=>ShoreQA.where().focusAction),'util.sources');
    await page.keyboard.press('ArrowDown'); assert.equal(await page.evaluate(()=>ShoreQA.where().zone),'apps');
    assert.deepEqual(await page.evaluate(()=>ShoreQA.state().home),original);
    await page.screenshot({path:root+`.local/qa/source-home-${width}.png`});
    await page.reload(); await page.waitForFunction(()=>ShoreQA.ready());
    assert.equal(await page.evaluate(()=>ShoreQA.state().sources[0].name),'Xbox');
    await page.evaluate(()=>{ ShoreQA.look({layout:'list'}); }); await page.waitForFunction(()=>ShoreQA.ready());
    await page.keyboard.press('ArrowRight'); await page.keyboard.press('Enter');
    assert.equal(await page.evaluate(()=>ShoreQA.state().view),'sourceMenu');
    assert.equal(await page.evaluate(()=>ShoreQA.where().focusCount),1);
    await page.screenshot({path:root+`.local/qa/source-menu-list-${width}.png`});
    await page.keyboard.press('Escape'); assert.equal(await page.evaluate(()=>ShoreQA.where().focusAction),'util.sources');
    // Configured membership and the empty-menu escape work after existing preferences migrate.
    await page.evaluate(()=>{const items=FrameSources.all();items.forEach(s=>s.visible=false);FrameSources.save(items);ShoreQA.scene('home');});
    await act('util.sources'); assert.equal(await page.evaluate(()=>ShoreQA.where().focusAction),'source.configure');
    await act('source.configure'); assert.equal(await page.evaluate(()=>ShoreQA.state().view),'sources');
    assert.equal(await page.locator('[data-action="sources.audio"]').count(),0);
    await act('sources.hdmi2'); await act('sources.visible'); await act('sources.done');
    await page.keyboard.press('Escape'); await page.keyboard.press('Escape'); await act('util.sources');
    assert.deepEqual(await page.locator('#sourceMenu [data-action^="source."]').evaluateAll(els=>els.map(e=>e.dataset.action)),['source.hdmi2','source.configure']);
    assert.deepEqual(errors,[]); await page.close();
    console.log(`Sources ${width}: submenu navigation, rename, persistence, switching, geometry and visibility passed.`);
  }
} finally { await preview.close(); }
