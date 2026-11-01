/* Bounded offline image queue. No image data is kept in preferences or the widget. */
(function () {
  'use strict';
  var P = window.CleanFrameDailyProviders, OPTIONS = 'cleanframe.daily.options.v1', PREVIEW = 'cleanframe.daily.preview.v1';
  var LIMIT = 10, MAX_IMAGE = 8 * 1024 * 1024, MAX_TOTAL = 32 * 1024 * 1024;
  var MAX_PREVIEW = 250000;
  function day() { var d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
  function defaults() { var o = { fit: 'cover', sources: {} }; P.list.forEach(function (p) { o.sources[p.id] = !p.optIn && p.available !== false; }); return o; }
  function options() {
    var o = defaults(), saved;
    try { saved = JSON.parse(localStorage.getItem(OPTIONS)); } catch (e) { saved = null; }
    if (saved && saved.sources) P.list.forEach(function (p) { if (p.available !== false && typeof saved.sources[p.id] === 'boolean') o.sources[p.id] = saved.sources[p.id]; });
    if (saved && saved.fit === 'contain') o.fit = 'contain';
    return o;
  }
  function savedPreview() {
    try {
      var value = JSON.parse(localStorage.getItem(PREVIEW));
      if (value && typeof value.id === 'string' && typeof value.url === 'string' &&
          value.url.length <= MAX_PREVIEW && /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(value.url)) return value;
    } catch (e) {}
    return null;
  }
  var opt = options(), state = { queue: [], current: null, date: '', history: [], cursors: {}, theme: '', source: '' };
  var cleanupPending = false;
  var db = null, opened = false, opening = false, active = false, canAdvance = false, filling = false, saving = false, advancing = false;
  var preview = savedPreview();
  var generation = 0, xhrs = [], timer = 0, previewTimer = 0, retryAt = 0, displayURL = preview ? preview.url : '', displayImage = null, status = '', errors = {}, listener = function () {};
  function changed() { listener(); }
  function valid(item) { return item && typeof item.id === 'string' && P.list.some(function (p) { return item.source === p.id; }) && P.safeURL(item.url) && P.safeURL(item.page) && item.blob instanceof window.Blob && item.blob.size <= MAX_IMAGE; }
  function clean(data) {
    if (!data || !Array.isArray(data.queue)) return;
    state.queue = data.queue.filter(function (item) { return valid(item) && opt.sources[item.source]; }).slice(0, LIMIT);
    state.current = valid(data.current) ? data.current : null;
    state.date = typeof data.date === 'string' ? data.date : '';
    state.history = Array.isArray(data.history) ? data.history.filter(function (id) { return typeof id === 'string'; }).slice(-500) : [];
    state.cursors = data.cursors && typeof data.cursors === 'object' ? data.cursors : {};
    state.theme = data.theme || ''; state.source = data.source || '';
    cleanupPending = data.queue.length !== state.queue.length || !!data.current && !state.current;
  }
  function snapshot() { return { queue: state.queue.slice(), current: state.current, date: state.date, history: state.history.slice(), cursors: state.cursors, theme: state.theme, source: state.source }; }
  function save(data, done) {
    if (!db || saving) { done(false); return; }
    saving = true; var finished = false;
    function finish(ok) { if (finished) return; finished = true; saving = false; done(ok); }
    try {
      var tx = db.transaction('cache', 'readwrite');
      tx.objectStore('cache').put(data, 'state');
      tx.oncomplete = function () { finish(true); };
      tx.onabort = tx.onerror = function () { if (finished) return; status = 'Could not save the image cache. Your current picture is kept.'; finish(false); changed(); };
    } catch (e) { status = 'Image storage is unavailable.'; finish(false); changed(); }
  }
  function decode(blob, done) {
    var url = window.URL.createObjectURL(blob), img = new Image(), finished = false;
    var timeout = setTimeout(function () { finish(false); }, 15000);
    function finish(ok) {
      if (finished) return; finished = true; clearTimeout(timeout); img.onload = img.onerror = null;
      if (!ok) window.URL.revokeObjectURL(url);
      done(ok ? { url: url, image: img } : null);
    }
    img.onload = function () { finish(img.naturalWidth >= 1280 && img.naturalHeight >= 720 && img.naturalWidth * img.naturalHeight <= 32000000); };
    img.onerror = function () { finish(false); }; img.src = url;
  }
  function show(item, done) {
    decode(item.blob, function (result) {
      if (!result) { done(null); return; }
      done(result);
    });
  }
  function rememberPreview(result) {
    var item = state.current;
    clearTimeout(previewTimer);
    if (!item || preview && preview.id === item.id) return;
    previewTimer = setTimeout(function () {
      if (state.current !== item || displayURL !== result.url) return;
      try {
        var image = result.image, canvas = document.createElement('canvas');
        var scale = Math.min(1, 960 / Math.max(image.naturalWidth, image.naturalHeight));
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        var context = canvas.getContext('2d');
        context.fillStyle = '#000'; context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        var url = canvas.toDataURL('image/jpeg', .68);
        if (url.length > MAX_PREVIEW) return;
        localStorage.setItem(PREVIEW, JSON.stringify({ id: item.id, url: url }));
        preview = { id: item.id, url: url };
      } catch (e) { /* A full-size cached image still works without a preview. */ }
    }, 1200);
  }
  function install(result) {
    var old = displayURL;
    displayURL = result.url; displayImage = result.image;
    changed();
    if (old && old.indexOf('blob:') === 0) window.URL.revokeObjectURL(old);
    rememberPreview(result);
  }
  function open() {
    if (opening || opened) return;
    opening = true;
    try {
      var request = window.indexedDB.open('cleanframe.daily.v1', 1);
      request.onupgradeneeded = function () { request.result.createObjectStore('cache'); };
      request.onerror = function () { opening = false; status = 'Local image storage is unavailable. Try again.'; changed(); };
      request.onblocked = function () { status = 'Close other CleanFrame previews to open the cache.'; changed(); };
      request.onsuccess = function () {
        db = request.result; db.onversionchange = function () { db.close(); db = null; opened = false; stop(); };
        var read = db.transaction('cache').objectStore('cache').get('state');
        read.onerror = function () { opening = false; status = 'Could not read the image cache.'; changed(); };
        read.onsuccess = function () {
          clean(read.result); opening = false; opened = true;
          if (state.current) show(state.current, function (result) {
            if (result) install(result); else { state.current = null; status = 'Cached image could not be loaded.'; }
            tick();
          });
          else tick();
        };
      };
    } catch (e) { opening = false; status = 'This browser does not provide local image storage.'; changed(); }
  }
  function stop() {
    generation++; clearTimeout(timer); timer = 0;
    xhrs.slice().forEach(function (xhr) { xhr.abort(); }); xhrs = []; filling = false;
  }
  function request(url, binary, done) {
    if (!active || !P.safeURL(url)) { done(new Error('Request cancelled')); return; }
    var xhr = new window.XMLHttpRequest(), token = generation, ended = false;
    function finish(err, value) {
      if (ended) return; ended = true; xhrs = xhrs.filter(function (x) { return x !== xhr; });
      if (token !== generation) return;
      done(err, value);
    }
    // The preview provides an allowlisted local proxy for browser CORS. Packaged TVs request origins directly.
    var preview = /^(127\.0\.0\.1|localhost)$/.test(window.location.hostname) && /^https?:$/.test(window.location.protocol);
    xhr.open('GET', preview ? '/daily-fetch?url=' + encodeURIComponent(url) : url, true);
    if (preview) xhr.setRequestHeader('X-CleanFrame-Preview', 'daily');
    xhr.timeout = 20000; if (binary) xhr.responseType = 'blob';
    xhr.onprogress = function (e) { if (e.loaded > (binary ? MAX_IMAGE : 2 * 1024 * 1024)) { finish(new Error('Response too large')); xhr.abort(); } };
    xhr.onload = function () {
      if (xhr.status < 200 || xhr.status >= 300) { finish(new Error('Source unavailable')); return; }
      if (binary && (!xhr.response || !/^image\/(jpeg|png|webp)$/i.test(xhr.response.type) || xhr.response.size > MAX_IMAGE)) { finish(new Error('Unsupported image')); return; }
      finish(null, binary ? xhr.response : xhr.responseText);
    };
    xhr.onerror = xhr.ontimeout = function () { finish(new Error('Network unavailable')); };
    xhr.onabort = function () { finish(new Error('Request cancelled')); };
    xhrs.push(xhr); xhr.send();
  }
  function eligible(item) { return opt.sources[item.source] && state.history.indexOf(item.id) < 0 && (!state.current || state.current.id !== item.id); }
  function advance(skip) {
    if (!opened || saving || advancing || (!canAdvance && (!skip || !active))) return;
    if (!skip && state.current && state.date === day() && opt.sources[state.current.source]) return;
    var candidates = state.queue.filter(eligible), candidate = candidates.filter(function (i) { return i.theme !== state.theme; })[0] || candidates[0];
    if (!candidate) { if (skip) { status = 'No next picture ready. Downloading more…'; retryAt = 0; fill(); changed(); } return; }
    var token = generation; advancing = true;
    // Decode before saving the selection; a broken download cannot replace a working background.
    show(candidate, function (result) {
      advancing = false;
      if (!result) { state.queue = state.queue.filter(function (i) { return i.id !== candidate.id; }); retryAt = 0; fill(); return; }
      if (token !== generation || (!canAdvance && (!skip || !active)) || saving || !opt.sources[candidate.source]) { window.URL.revokeObjectURL(result.url); return; }
      var data = snapshot();
      data.current = candidate; data.date = day(); data.theme = candidate.theme; data.source = candidate.source;
      data.queue = data.queue.filter(function (i) { return i.id !== candidate.id; });
      data.history = data.history.concat(candidate.id).slice(-500);
      save(data, function (ok) {
        if (!ok) { window.URL.revokeObjectURL(result.url); return; }
        state = data; prune(); status = ''; install(result); retryAt = 0; fill();
      });
    });
  }
  function fill() {
    if (!active || !opened || filling || saving || Date.now() < retryAt) return;
    var sources = P.list.filter(function (p) { return opt.sources[p.id]; });
    if (!sources.length) { status = 'All sources are off. Enable a source to download pictures.'; changed(); return; }
    if (state.queue.filter(eligible).length >= LIMIT) return;
    filling = true; var token = generation, attempts = 0, used = {}, failedThemes = {}, loaded = 0;
    function nextSource() {
      if (token !== generation || !active) return;
      if (saving || advancing) { timer = setTimeout(nextSource, 100); return; }
      if (state.queue.length >= LIMIT || attempts >= sources.length * 2) {
        filling = false; retryAt = Date.now() + (loaded ? 60000 : 30 * 60000);
        if (!loaded && !state.queue.length) status = 'No suitable pictures downloaded. Check the connection or try another source.';
        changed(); advance(false); return;
      }
      var counts = {}, i, tried;
      state.queue.forEach(function (item) { counts[item.theme] = (counts[item.theme] || 0) + 1; });
      if (state.current) counts[state.current.theme] = (counts[state.current.theme] || 0) + 1;
      sources.sort(function (a, b) { return ((counts[a.theme] || 0) + (failedThemes[a.theme] || 0)) - ((counts[b.theme] || 0) + (failedThemes[b.theme] || 0)) || (used[a.id] || 0) - (used[b.id] || 0); });
      var p = sources[0]; attempts++; used[p.id] = (used[p.id] || 0) + 1;
      P.load(p.id, state.cursors[p.id], request, function (err, entries, cursor) {
        if (token !== generation) return;
        if (err) { errors[p.id] = 'Unavailable'; failedThemes[p.theme] = (failedThemes[p.theme] || 0) + 1; nextSource(); return; }
        state.cursors[p.id] = cursor; i = 0; tried = 0;
        entries = entries.slice(0, 40);
        function nextImage() {
          if (token !== generation) return;
          var item = entries[i++];
          if (!item || tried >= 8) { failedThemes[p.theme] = (failedThemes[p.theme] || 0) + 1; nextSource(); return; }
          if (!eligible(item) || state.queue.some(function (x) { return x.id === item.id || x.url === item.url; })) { nextImage(); return; }
          tried++;
          request(item.url, true, function (error, blob) {
            if (error) { errors[p.id] = 'Image unavailable'; nextImage(); return; }
            decode(blob, function (decoded) {
              if (decoded) window.URL.revokeObjectURL(decoded.url);
              if (token !== generation) return;
              if (!decoded) { nextImage(); return; }
              var data = snapshot(), bytes = blob.size + (data.current ? data.current.blob.size : 0);
              data.queue.forEach(function (q) { bytes += q.blob.size; });
              if (bytes > MAX_TOTAL) { filling = false; retryAt = Date.now() + 60000; changed(); advance(false); return; }
              item.blob = blob; item.width = decoded.image.naturalWidth; item.height = decoded.image.naturalHeight;
              data.queue.push(item);
              save(data, function (ok) {
                if (!ok) { filling = false; retryAt = Date.now() + 30 * 60000; return; }
                state = data; prune(); loaded++; delete errors[p.id]; status = ''; changed();
                if (token !== generation) { tick(); return; }
                // Give the first image to Home immediately, then refill across themes.
                advance(false);
                timer = setTimeout(nextSource, 1000);
              });
            });
          });
        }
        nextImage();
      });
    }
    changed(); nextSource();
  }
  function tick() {
    if (!active) return;
    if (!opened) { open(); return; }
    if (cleanupPending) {
      if (saving || advancing) return;
      cleanupPending = false;
      save(snapshot(), function (ok) { if (!ok) cleanupPending = true; else tick(); });
      return;
    }
    advance(false); fill();
  }
  function prune() { state.queue = state.queue.filter(function (i) { return opt.sources[i.source]; }); }
  function configure(id, value) {
    if (value && P.list.some(function (p) { return p.id === id && p.available === false; })) return false;
    var copy = JSON.parse(JSON.stringify(opt));
    if (id === 'fit') { if (['cover', 'contain'].indexOf(value) < 0) return false; copy.fit = value; }
    else if (Object.prototype.hasOwnProperty.call(copy.sources, id)) copy.sources[id] = !!value;
    else return false;
    try { localStorage.setItem(OPTIONS, JSON.stringify(copy)); } catch (e) { status = 'Could not save this setting. Try again.'; changed(); return false; }
    opt = copy; stop(); retryAt = 0;
    prune(); cleanupPending = true;
    changed(); timer = setTimeout(tick, 0); return true;
  }
  window.CleanFrameDaily = {
    providers: P.list,
    onChange: function (fn) { listener = fn; },
    configure: configure,
    setActive: function (enabled, home) {
      var wasHome = canAdvance;
      canAdvance = !!enabled && !!home;
      if (active === !!enabled) { if (!wasHome && canAdvance) timer = setTimeout(tick, 0); return; }
      active = !!enabled;
      if (!active) stop(); else { retryAt = 0; timer = setTimeout(tick, 0); }
    },
    tick: tick,
    skip: function () { advance(true); },
    retry: function () { retryAt = 0; tick(); },
    view: function () { return { options: opt, current: state.current, image: displayImage, url: displayURL, count: state.queue.filter(eligible).length, status: status, loading: filling || opening, errors: errors }; }
  };
}());
