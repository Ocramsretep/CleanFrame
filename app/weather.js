/* Optional weather forecast. Only a chosen location is sent to Open-Meteo. */
(function () {
  'use strict';
  var KEY = 'cleanframe.weather.v1', CACHE = 'cleanframe.weather.cache.v1';
  var REFRESH_MS = 30 * 60 * 1000, RETRY_MS = 10 * 60 * 1000, KEEP_MS = 12 * 60 * 60 * 1000;
  var config = { enabled: false, location: null }, data = null, updated = 0;
  var active = false, loading = false, status = '', retryAt = 0, timer = 0, request = null, generation = 0, listener = function () {};
  function finite(v, min, max) { return typeof v === 'number' && isFinite(v) && v >= min && v <= max; }
  function locationOf(value) {
    if (!value || typeof value !== 'object' || typeof value.name !== 'string' || !finite(value.latitude, -90, 90) || !finite(value.longitude, -180, 180)) return null;
    return { name: value.name.slice(0, 64), admin: typeof value.admin === 'string' ? value.admin.slice(0, 64) : '',
      country: typeof value.country === 'string' ? value.country.slice(0, 64) : '', latitude: value.latitude, longitude: value.longitude };
  }
  function cleanForecast(raw) {
    var c = raw && raw.current, h = raw && raw.hourly, d = raw && raw.daily, hours = [], days = [], i;
    if (!c || !h || !d || !finite(c.temperature_2m, -100, 70) || !finite(c.weather_code, 0, 99) || !Array.isArray(h.time) || !Array.isArray(d.time)) return null;
    for (i = 0; i < h.time.length && hours.length < 12; i++) {
      if (typeof h.time[i] !== 'string' || !Array.isArray(h.temperature_2m) || !Array.isArray(h.weather_code) || !finite(h.temperature_2m[i], -100, 70) || !finite(h.weather_code[i], 0, 99)) continue;
      hours.push({ time: h.time[i].slice(0, 16), temp: h.temperature_2m[i], code: h.weather_code[i], day: Array.isArray(h.is_day) && h.is_day[i] === 1 });
    }
    for (i = 1; i < d.time.length && days.length < 2; i++) {
      if (typeof d.time[i] !== 'string' || !Array.isArray(d.temperature_2m_min) || !Array.isArray(d.temperature_2m_max) || !Array.isArray(d.weather_code) || !finite(d.temperature_2m_min[i], -100, 70) || !finite(d.temperature_2m_max[i], -100, 70) || !finite(d.weather_code[i], 0, 99)) continue;
      days.push({ date: d.time[i].slice(0, 10), min: d.temperature_2m_min[i], max: d.temperature_2m_max[i], code: d.weather_code[i] });
    }
    if (hours.length < 10 || days.length < 2) return null;
    return { current: { temp: c.temperature_2m, code: c.weather_code, day: c.is_day === 1 }, hours: hours, days: days };
  }
  try {
    var saved = JSON.parse(localStorage.getItem(KEY));
    if (saved && typeof saved === 'object') { config.location = locationOf(saved.location); config.enabled = saved.enabled === true && !!config.location; }
    var cached = JSON.parse(localStorage.getItem(CACHE));
    if (cached && config.location && cached.latitude === config.location.latitude && cached.longitude === config.location.longitude && finite(cached.updated, 0, Date.now()) && Date.now() - cached.updated < KEEP_MS) {
      data = cleanForecast(cached.data); updated = data ? cached.updated : 0;
    }
  } catch (e) { /* Storage is optional; Settings can still choose a location. */ }
  function changed() { listener(); }
  function save(next, quiet) {
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch (e) { status = 'Could not save weather settings.'; changed(); return false; }
    config = next; status = ''; if (!quiet) changed(); return true;
  }
  function xhr(url, done) {
    var x = new window.XMLHttpRequest(), finished = false;
    function finish(error, result) { if (finished) return; finished = true; done(error, result); }
    try { x.open('GET', url, true); } catch (e) { finish('Request unavailable'); return null; }
    x.timeout = 15000;
    x.onprogress = function (event) { if (event.loaded > 120000) { finish('Response too large'); x.abort(); } };
    x.onload = function () {
      if (x.status < 200 || x.status >= 300 || x.responseText.length > 120000) { finish('Service unavailable'); return; }
      try { finish(null, JSON.parse(x.responseText)); } catch (e) { finish('Invalid response'); }
    };
    x.onerror = x.ontimeout = function () { finish('Network unavailable'); };
    x.onabort = function () { finish('Request cancelled'); };
    try { x.send(); } catch (e) { finish('Request unavailable'); return null; }
    return x;
  }
  function stop() { generation++; clearTimeout(timer); timer = 0; if (request) request.abort(); request = null; loading = false; }
  function forecastURL(loc) {
    return 'https://api.open-meteo.com/v1/forecast?latitude=' + encodeURIComponent(loc.latitude) + '&longitude=' + encodeURIComponent(loc.longitude)
      + '&current=temperature_2m,weather_code,is_day&hourly=temperature_2m,weather_code,is_day'
      + '&daily=weather_code,temperature_2m_max,temperature_2m_min&forecast_hours=12&forecast_days=3&timezone=auto';
  }
  function refresh(force) {
    var token, loc;
    if (!active || !config.enabled || !config.location || loading) return;
    if (!force && (Date.now() - updated < REFRESH_MS || Date.now() < retryAt)) return;
    loc = config.location; token = ++generation; loading = true; status = data ? '' : 'Loading weather…'; changed();
    request = xhr(forecastURL(loc), function (error, raw) {
      var result;
      if (token !== generation) return;
      request = null; loading = false; result = error ? null : cleanForecast(raw);
      if (!result) { retryAt = Date.now() + RETRY_MS; status = data ? 'Could not refresh. Showing saved weather.' : 'Weather unavailable. Try again later.'; changed(); return; }
      data = result; updated = Date.now(); retryAt = 0; status = '';
      try { localStorage.setItem(CACHE, JSON.stringify({ latitude: loc.latitude, longitude: loc.longitude, updated: updated, data: raw })); } catch (e) { /* A live forecast remains usable. */ }
      changed();
      timer = setTimeout(function () { refresh(false); }, REFRESH_MS);
    });
  }
  function setActive(value) {
    if (active === value) { if (active) refresh(false); return; }
    active = value;
    if (!active) { stop(); return; }
    refresh(false);
  }
  function search(query, done) {
    var q = String(query || '').replace(/^\s+|\s+$/g, '').slice(0, 80);
    if (q.length < 2) { done('Enter at least two letters.', []); return; }
    xhr('https://geocoding-api.open-meteo.com/v1/search?name=' + encodeURIComponent(q) + '&count=5&language=en&format=json', function (error, raw) {
      var results = error ? [] : (raw && Array.isArray(raw.results) ? raw.results : []).map(function (entry) {
        return locationOf({ name: entry.name, admin: entry.admin1, country: entry.country, latitude: entry.latitude, longitude: entry.longitude });
      }).filter(function (entry) { return !!entry; });
      done(error || (!results.length ? 'No matching locations.' : ''), results);
    });
  }
  window.FrameWeather = {
    view: function () { return { enabled: config.enabled, location: config.location, data: data, updated: updated, stale: !!data && Date.now() - updated > REFRESH_MS, loading: loading, status: status }; },
    onChange: function (fn) { listener = fn; },
    setActive: setActive,
    refresh: function () { retryAt = 0; refresh(true); },
    search: search,
    enable: function (value) { if (value && !config.location) return false; if (save({ enabled: !!value, location: config.location })) { if (value) setActive(true); else setActive(false); return true; } return false; },
    choose: function (value) {
      var loc = locationOf(value);
      if (!loc || !save({ enabled: true, location: loc }, true)) return false;
      stop(); data = null; updated = 0; retryAt = 0; active = true; changed(); refresh(true); return true;
    }
  };
}());
