/* Online metadata only. Photographs are downloaded into the owner's local cache. */
(function () {
  'use strict';
  var pixabayKey = (window.CleanFrameDailyConfig || {}).pixabayKey || '';
  var providers = [
    { id: 'nature', name: 'Commons · Landscapes', theme: 'nature', categories: ['landscapes', 'mountains', 'coasts', 'forests'] },
    { id: 'architecture', name: 'Commons · Architecture', theme: 'architecture', categories: ['cityscapes', 'buildings', 'architecture'] },
    { id: 'pixabay', name: 'Pixabay · Nature & architecture', theme: 'nature', available: !!pixabayKey },
    { id: 'apod', name: 'NASA · APOD', theme: 'space' },
    { id: 'webb', name: 'ESA · Webb', theme: 'space', host: 'esawebb.org' },
    { id: 'hubble', name: 'ESA · Hubble', theme: 'space', host: 'esahubble.org' },
    { id: 'bing', name: 'Bing · Daily image', theme: 'mixed', optIn: true }
  ];
  var hosts = ['commons.wikimedia.org', 'upload.wikimedia.org', 'thumb.wikimedia.org', 'science.nasa.gov', 'assets.science.nasa.gov', 'apod.nasa.gov', 'esawebb.org', 'www.esawebb.org', 'cdn.esawebb.org', 'esahubble.org', 'www.esahubble.org', 'cdn.esahubble.org', 'www.bing.com', 'pixabay.com', 'cdn.pixabay.com'];
  function safeURL(url) {
    var a = document.createElement('a');
    if (typeof url !== 'string' || url.length > 4096 || !/^https:\/\//i.test(url)) return '';
    a.href = url;
    return hosts.indexOf(a.hostname.toLowerCase()) >= 0 && (!a.port || a.port === '443') && !a.username && !a.password ? a.href : '';
  }
  function plain(value) {
    // Parse in an inert document; external markup is never inserted into the app.
    var doc = new window.DOMParser().parseFromString(String(value || ''), 'text/html');
    return (doc.body.textContent || '').replace(/\s+/g, ' ').trim();
  }
  function record(p, id, url, page, title, credit, license, licenseURL) {
    credit = plain(credit);
    if (!safeURL(url) || !safeURL(page) || !credit || credit.length > 350) return null;
    return { id: p.id + ':' + id, source: p.id, theme: p.theme, url: safeURL(url), page: safeURL(page), title: plain(title).slice(0, 180), credit: credit, license: license || '', licenseURL: licenseURL || '' };
  }
  function commons(p, cursor, request, done) {
    var category = cursor.category || 0, params;
    params = 'generator=categorymembers&gcmtitle=' + encodeURIComponent('Category:Featured pictures of ' + p.categories[category % p.categories.length]) + '&gcmtype=file&gcmlimit=40' + (cursor.next ? '&gcmcontinue=' + encodeURIComponent(cursor.next) : '');
    request('https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*&' + params + '&prop=imageinfo&iiprop=url%7Csize%7Cextmetadata&iiurlwidth=1920', false, function (err, text) {
      if (err) { done(err); return; }
      try {
        var data = JSON.parse(text), pages = data.query && data.query.pages || {}, out = [];
        Object.keys(pages).forEach(function (key) {
          var page = pages[key], info = page.imageinfo && page.imageinfo[0], m, license, r;
          if (!info || info.width < 1600 || info.height < 900 || !/\.(jpe?g|png)(?:\?|$)/i.test(info.url)) return;
          m = info.extmetadata || {}; license = plain(m.LicenseShortName && m.LicenseShortName.value);
          if (!/^(CC BY(?:-SA)? [234]\.0|CC0|Public domain)$/i.test(license)) return;
          r = record(p, page.pageid, info.thumburl || info.url, info.descriptionurl, page.title.replace(/^File:|\.[^.]+$/g, ''), m.Artist && m.Artist.value, license, m.LicenseUrl && m.LicenseUrl.value);
          if (r) out.push(r);
        });
        var cont = data.continue || {};
        done(null, out, { category: cont.gcmcontinue ? category : category + 1, next: cont.gcmcontinue || '' });
      } catch (e) { done(new Error('Invalid gallery response')); }
    });
  }
  function esa(p, cursor, request, done) {
    var base = 'https://' + p.host, category = (cursor.page || 0) % 2 ? 'galaxies' : 'nebulae';
    var pageNumber = 1 + Math.floor((cursor.page || 0) / 2) % 8;
    request(base + '/images/archive/category/' + category + (p.id === 'hubble' ? '/page/' + pageNumber + '/' : '/?page=' + pageNumber), false, function (err, html) {
      if (err) { done(err); return; }
      var doc = new window.DOMParser().parseFromString(html, 'text/html'), links = doc.querySelectorAll('a[href]'), urls = [], index = 0, out = [];
      Array.prototype.forEach.call(links, function (a) {
        var path = a.getAttribute('href');
        if (/^\/images\/[a-z0-9_-]+\/$/i.test(path) && !/\/potm\/$/.test(path) && urls.indexOf(base + path) < 0) urls.push(base + path);
      });
      // Hubble's gallery exposes its links as data for a client-side grid.
      var pathMatch, paths = /\burl:\s*['"](\/images\/[a-z0-9_-]+\/)['"]/gi;
      while ((pathMatch = paths.exec(html))) if (urls.indexOf(base + pathMatch[1]) < 0) urls.push(base + pathMatch[1]);
      urls = urls.filter(function (url) { return !/\/(viewall|search|potw|potm)\/$/.test(url); });
      // Bound metadata work, rotate through the gallery rather than always using its first image.
      var start = cursor.offset || 0;
      urls = urls.slice(start, start + 6);
      function readNext() {
        if (index >= urls.length) { done(null, out, { page: urls.length < 6 ? (cursor.page || 0) + 1 : cursor.page || 0, offset: urls.length < 6 ? 0 : start + 6 }); return; }
        var page = urls[index++];
        request(page, false, function (error, body) {
          if (!error) {
            var d = new window.DOMParser().parseFromString(body, 'text/html'), title = d.querySelector('meta[property="og:title"]'), credit = d.querySelector('.credit'), image = d.querySelector('a[href*="/images/wallpaper4/"]') || d.querySelector('a[href*="/images/screen/"]'), r;
            if (title && credit && image && !/annotated|compass|comparison|illustration|artist|graphic/i.test(title.content)) {
              var url = image.getAttribute('href');
              if (url.charAt(0) === '/') url = base + url;
              r = record(p, page.split('/')[4], url, page, title.content, credit.textContent, 'CC BY 4.0', 'https://creativecommons.org/licenses/by/4.0/');
              if (r) out.push(r);
            }
          }
          readNext();
        });
      }
      readNext();
    });
  }
  function pixabay(p, request, done) {
    if (!pixabayKey) { done(new Error('API key not configured')); return; }
    var cacheKey = 'cleanframe.pixabay.metadata.v1', cache = null;
    try { cache = JSON.parse(localStorage.getItem(cacheKey)); } catch (e) { cache = null; }
    if (cache && cache.until > Date.now() && Array.isArray(cache.entries)) { done(null, cache.entries, {}); return; }
    var batch = cache && typeof cache.batch === 'number' ? cache.batch + 1 : 0;
    var category = batch % 2 ? 'buildings' : 'nature';
    var url = 'https://pixabay.com/api/?key=' + encodeURIComponent(pixabayKey) + '&image_type=photo&orientation=horizontal&editors_choice=true&safesearch=true&min_width=1280&min_height=720&per_page=30&category=' + category + '&page=' + (1 + Math.floor(batch / 2) % 10);
    request(url, false, function (err, text) {
      if (err) { done(err); return; }
      try {
        var data = JSON.parse(text), out = [];
        (data.hits || []).forEach(function (item) {
          var r = record(p, item.id, item.fullHDURL || item.largeImageURL, item.pageURL, item.tags, item.user, 'Pixabay Content License', 'https://pixabay.com/service/license-summary/');
          if (r) { r.theme = category === 'buildings' ? 'architecture' : 'nature'; out.push(r); }
        });
        // Persist metadata before any download, so restarts also respect the 24-hour cache.
        localStorage.setItem(cacheKey, JSON.stringify({ until: Date.now() + 24 * 60 * 60 * 1000, batch: out.length ? batch : -1, entries: out }));
        done(null, out, {});
      } catch (e) { done(new Error('Could not cache Pixabay metadata')); }
    });
  }
  function load(id, cursor, request, done) {
    var p = providers.filter(function (item) { return item.id === id; })[0];
    if (!p) { done(new Error('Unknown source')); return; }
    cursor = cursor || {};
    if (id === 'pixabay') { pixabay(p, request, done); return; }
    if (p.categories) { commons(p, cursor, request, done); return; }
    if (p.host) { esa(p, cursor, request, done); return; }
    var url = id === 'bing' ? 'https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=8&mkt=de-DE' : 'https://science.nasa.gov/wp-json/wp/v2/apod-basic/?count=25';
    request(url, false, function (err, text) {
      if (err) { done(err); return; }
      try {
        var data = JSON.parse(text), list = id === 'bing' ? data.images : Array.isArray(data) ? data : [data], out = [];
        list.forEach(function (item) {
          var r;
          if (id === 'bing') {
            if (item.wp !== true) return;
            r = record(p, item.urlbase || item.startdate, 'https://www.bing.com' + item.url, 'https://www.bing.com', item.title, item.copyright, 'Bing · individual image rights');
          } else {
            if (item.media_type !== 'image') return;
            var photoURL = item.hdurl || '';
            if (/^https:\/\/assets\.science\.nasa\.gov\/dynamicimage\//.test(photoURL)) photoURL = photoURL.split('?')[0] + '?w=1920&fit=clip';
            // APOD includes third-party photography: retain its actual credit, never label it public domain.
            r = record(p, item.date, photoURL, item.permalink, item.title, item.credit || item.copyright, 'APOD · individual image rights');
          }
          if (r) out.push(r);
        });
        done(null, out, {});
      } catch (e) { done(new Error('Invalid daily feed')); }
    });
  }
  window.CleanFrameDailyProviders = { list: providers, hosts: hosts, safeURL: safeURL, load: load };
}());
