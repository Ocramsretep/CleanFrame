import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';

const source = readFileSync(new URL('../app/weather.js', import.meta.url), 'utf8');

function runtime(seed = new Map()) {
  const requests = [];
  class Request {
    open(method, url) { this.method = method; this.url = url; }
    send() { requests.push(this); }
    abort() { this.onabort?.(); }
    respond(value, status = 200) { this.status = status; this.responseText = JSON.stringify(value); this.onload(); }
    fail() { this.onerror(); }
  }
  const storage = { getItem: key => seed.get(key) ?? null, setItem: (key, value) => seed.set(key, value) };
  const window = { XMLHttpRequest: Request };
  vm.runInNewContext(source, { window, localStorage: storage, setTimeout: () => 1, clearTimeout: () => {}, Date, isFinite, JSON, Math });
  return { weather: window.FrameWeather, requests, seed };
}

function forecast() {
  const now = new Date(); now.setMinutes(0, 0, 0);
  const hours = Array.from({ length: 12 }, (_, i) => new Date(now.getTime() + i * 3600000).toISOString().slice(0, 16));
  const dates = Array.from({ length: 3 }, (_, i) => new Date(now.getTime() + i * 86400000).toISOString().slice(0, 10));
  return { current: { temperature_2m: 9.4, weather_code: 3, is_day: 1 },
    hourly: { time: hours, temperature_2m: hours.map((_, i) => 9 + i / 10), weather_code: hours.map(() => 3), is_day: hours.map(() => 1) },
    daily: { time: dates, temperature_2m_min: [4, 5, 6], temperature_2m_max: [12, 13, 14], weather_code: [3, 2, 1] } };
}

test('weather stays off until a location is chosen, then caches a bounded forecast', () => {
  const { weather, requests, seed } = runtime();
  weather.setActive(true);
  assert.equal(requests.length, 0);
  assert.equal(weather.enable(true), false);
  let found;
  weather.search('Berlin', (error, results) => { assert.equal(error, ''); found = results; });
  assert.match(requests[0].url, /geocoding-api\.open-meteo\.com/);
  requests[0].respond({ results: [{ name: 'Berlin', admin1: 'Berlin', country: 'Germany', latitude: 52.52, longitude: 13.405 }] });
  assert.equal(found.length, 1);
  assert.equal(weather.choose(found[0]), true);
  assert.match(requests[1].url, /forecast_hours=12&forecast_days=3/);
  requests[1].respond(forecast());
  assert.equal(weather.view().data.hours.length, 12);
  assert.equal(weather.view().data.days.length, 2);
  assert.equal(weather.view().data.current.temp, 9.4);
  assert.equal(JSON.parse(seed.get('cleanframe.weather.v1')).enabled, true);
  assert.ok(seed.get('cleanframe.weather.cache.v1'));
  const restarted = runtime(seed);
  assert.equal(restarted.weather.view().data.current.temp, 9.4);
  restarted.weather.setActive(true);
  assert.equal(restarted.requests.length, 0);
});

test('failed refresh keeps the saved forecast and invalid response cannot replace it', () => {
  const { weather, requests } = runtime();
  weather.choose({ name: 'Berlin', latitude: 52.52, longitude: 13.405 });
  requests[0].respond(forecast());
  weather.refresh(); requests[1].fail();
  assert.equal(weather.view().data.current.temp, 9.4);
  assert.match(weather.view().status, /saved weather/);
  weather.refresh(); requests[2].respond({ current: { temperature_2m: 50 } });
  assert.equal(weather.view().data.current.temp, 9.4);
  assert.equal(weather.enable(false), true);
  assert.equal(weather.view().enabled, false);
});
