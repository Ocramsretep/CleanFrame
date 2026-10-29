// Synthetic Tizen APIs only: no device connection or real source changes.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';

const adapter = readFileSync(new URL('../app/device.js', import.meta.url), 'utf8');
function harness() {
  const timers = new Map(), requests = [], changes = [], launches = [];
  let id = 0;
  const tv = {
    application: { launch: (id, ok, fail) => launches.push({id, ok, fail}) },
    systeminfo: { getPropertyValue: (property, ok, fail) => requests.push({property, ok, fail}) },
    tvwindow: { getSource: (...args) => { assert.equal(args.length, 0); return { type:'HDMI', number:2 }; },
      setSource: (source, ok, fail) => changes.push({ source, ok, fail }) }
  };
  const window = { tizen: tv };
  vm.runInNewContext(adapter, { window, tizen:tv, setTimeout: callback => { timers.set(++id, callback); return id; }, clearTimeout: id => timers.delete(id) });
  return {device:window.FrameDevice, tv, requests, changes, launches, expire: () => { for (const cb of [...timers.values()]) cb(); }};
}
const hdmi = {type:'HDMI', number:2}, tvSource = {type:'TV', number:7};
const sources = { connected:[hdmi], disconnected:[tvSource] };
test('discovery uses synchronous getSource and preserves connection status', () => {
  const h=harness(); let result;
  h.device.videoSources((err,value) => { assert.equal(err,null); result=value; });
  h.requests[0].ok(sources);
  assert.equal(result.sources[0].active,true);
  assert.equal(result.sources[1].connected,false);
});
test('source errors propagate without opening the viewer', () => {
  const h=harness(); const results=[];
  h.device.setSource('HDMI',2,err=>results.push(err)); h.requests[0].ok(sources);
  assert.equal(h.changes[0].source,hdmi);
  h.changes[0].fail({message:'Permission denied'});
  assert.equal(h.launches.length,0); assert.match(results[0].detail,/Permission denied/);
});
test('late discovery and late switch completion cannot open a viewer after timeout', () => {
  for (const phase of ['discovery','switch']) {
    const h=harness(), results=[];
    h.device.setSource('HDMI',2,err=>results.push(err));
    if (phase==='switch') h.requests[0].ok(sources);
    h.expire();
    if (phase==='discovery') h.requests[0].ok(sources); else h.changes[0].ok();
    assert.equal(h.changes.length,phase==='switch'?1:0); assert.equal(h.launches.length,0); assert.equal(results.length,1);
  }
});
test('missing inputs are never fabricated and TV uses the reported tuner number', () => {
  const h=harness(); let error;
  h.device.setSource('HDMI',4,err=>error=err); h.requests[0].ok(sources);
  assert.ok(error); assert.equal(h.changes.length,0);
  h.device.setSource('TV',0,err=>error=err); h.requests[1].ok(sources);
  assert.equal(h.changes[0].source,tvSource); h.changes[0].ok();
  assert.equal(h.launches[0].id,'org.tizen.tv-viewer'); h.launches[0].fail({message:'Cannot show viewer'});
  assert.match(error.detail,/Cannot show viewer/);
});
test('preference writes preserve apps and fail atomically; audio is never a video source', () => {
  const saved={'cleanframe.home.v1':'existing apps'}, window={}; let fail=false;
  vm.runInNewContext(readFileSync(new URL('../app/sources.js',import.meta.url),'utf8'), {window,localStorage:{getItem:k=>saved[k],setItem:(k,v)=>{if(fail)throw Error();saved[k]=v;}}});
  let values=window.FrameSources.all(); values[1].name='Console'; values[1].visible=true; values.push({id:'audio',name:'Old audio shortcut',icon:'soundbar',number:0,visible:true});
  assert.equal(window.FrameSources.save(values),true); assert.equal(saved['cleanframe.home.v1'],'existing apps');
  assert.equal(window.FrameSources.visible().length,2);
  fail=true; values[1].name='Uncommitted'; assert.equal(window.FrameSources.save(values),false);
  assert.equal(window.FrameSources.all()[1].name,'Console');
});
