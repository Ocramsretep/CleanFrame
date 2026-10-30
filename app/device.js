/* Public Tizen application APIs. No Mac server, network address or credentials. */
(function () {
  'use strict';
  var IDS = {
    stremio: 'IkWsFHtOY9.Stremio', netflix: 'org.tizen.netflix-app',
    disneyplus: 'MCmYXNxgcu.DisneyPlus', youtube: '9Ur5IzDKqV.TizenYouTube',
    appletv: 'com.samsung.tv.aria-video', primevideo: 'org.tizen.primevideo',
    abciview: 'mWK87Xghap.ABCiview', sbs: 'OyE7OuxlUi.SBSOnDemand',
    applemusic: 'org.tizen.apple.apple-music'
  };
  var STREAMING = ['as6cYRgkPy.Binge', '73iTZRTc34.Stan', '5b8c3eb16b.BeamCTVDev',
    'cj37Ni3qXM.HBONow', 'LBUAQX1exg.Hulu', 'gzcc4LRFBF.Peacock', 'rJyOSqC6Up.CBSAllAccess',
    'Rk72oKFsRS.OtterKidsProd', '70fRFUwYlD.OtterGAProd', 'PvWgqxV3Xa.YouTubeTV',
    'XtU8fQk2gN.ESPN', 'ZmmGjO6VKO.slingtv', 'VtuWAiZdHN.STARZPlay', 'ckfgqqzvt0.dplus',
    'kk8MbItQ0H.VUDU', 'Jz7aUrV2Q4.Twitch', 'OK2Rdkjmsi.IMDbTV', 'Ob3XhAVMu6.amcplus',
    'KaLitts8bq.tenplaySamsungTizen', 'eYuOiOLYQX.KayoSports', 'Ne2ZsPWdKl.9NOW',
    '3KA0pm7a7V.TubiTV', 'rJeHak5zRg.Spotify', 'icp4AvUPiA.7plus'];
  var CONSUMER_SYSTEM = ['org.tizen.browser', 'com.microsoft.copilot'];
  var EXTRA_BRANDS = {'rJeHak5zRg.Spotify': 'spotify', '5b8c3eb16b.BeamCTVDev': 'hbomax', 'cj37Ni3qXM.HBONow': 'hbomax', '3KA0pm7a7V.TubiTV': 'tubi'};
  var INTERNAL = ['adplatform.ADPlayer', 'WykOS4t4F0.cmsWebApp', '25emanual3.emanual',
    'd0m1lV1nt2.emanual', '2022ePop01.SmartTV',
    'ZODRT12q2l.WebAccountExtension', 'ByJlgt0XeD.CastSettingsApp', 'tv6pbVMQFF.PrivacyChoices'];
  var SELF = 'nClrkHome1.FrameHome';
  function api() { return window.tizen && window.tizen.application; }
  function selfId() {
    try { return api().getCurrentApplication().appInfo.id || SELF; }
    catch (err) { return SELF; }
  }
  function unavailable(done) {
    done({ message: 'Open CleanFrame on the TV to use this control.', detail: 'The web preview cannot control the TV.' });
  }
  function failure(err) {
    return { message: 'The TV could not open this screen.', detail: err && (err.message || err.name) || 'Try again, or press the remote’s Home button to return to CleanFrame.' };
  }
  function bounded(done, timeout) {
    var finished = false, timer = setTimeout(function () { finish({ message: 'The TV did not respond. Please try again.' }); }, timeout || 8000);
    function finish(err, value) { if (finished) return; finished = true; clearTimeout(timer); done(err, value); }
    finish.pending = function () { return !finished; };
    return finish;
  }
  function launchApp(id, done) {
    if (!api()) { unavailable(done); return; }
    var finish = bounded(done);
    try { api().launch(id, function () { finish(null); }, function (err) { finish(failure(err)); }); }
    catch (err) { finish(failure(err)); }
  }
  function launch(brand, done) {
    if (!IDS[brand]) { done({message: 'This app has no launch target.'}); return; }
    launchApp(IDS[brand], done);
  }
  function art(done) {
    if (!api()) { unavailable(done); return; }
    var finish = bounded(done);
    try {
      var data = [new tizen.ApplicationControlData('mode', ['fullscreen']), new tizen.ApplicationControlData('requester', ['mobile'])];
      var control = new tizen.ApplicationControl('http://tizen.org/appcontrol/operation/default', null, null, null, data);
      api().launchAppControl(control, 'org.tizen.art-app', function () { finish(null); }, function (err) { finish(failure(err)); });
    } catch (err) { finish(failure(err)); }
  }
  function home(done) { launchApp('com.samsung.tv.csfs', done); }
  function settings(done) { launchApp('com.samsung.tv.coba.setting', done); }
  function openUrl(url, done) {
    if (typeof url !== 'string' || !/^https:\/\/[^\s]+$/i.test(url)) { done({ message: 'This picture link is unavailable.' }); return; }
    if (!api()) { unavailable(done); return; }
    var finish = bounded(done);
    try {
      var control = new tizen.ApplicationControl('http://tizen.org/appcontrol/operation/view', url);
      api().launchAppControl(control, null, function () { finish(null); }, function (err) { finish(failure(err)); });
    } catch (err) { finish(failure(err)); }
  }
  // Source discovery/viewer flow informed by scottheinrich91's CleanFrame PR #14.
  // Use reported source objects, synchronous getSource, and propagate failures.
  function videoSources(done) {
    var tv = window.tizen, finish = bounded(done);
    if (!tv || !tv.systeminfo || !tv.tvwindow) { unavailable(finish); return; }
    try {
      tv.systeminfo.getPropertyValue('VIDEOSOURCE', function (video) {
        if (!finish.pending()) return;
        var current = null, currentError = null, result = [];
        try { current = tv.tvwindow.getSource(); } catch (err) { currentError = failure(err); }
        ['connected', 'disconnected'].forEach(function (group) {
          (video[group] || []).forEach(function (item) {
            if (item.type !== 'HDMI' && item.type !== 'TV') return;
            result.push({ type: item.type, number: item.number, connected: group === 'connected',
              active: !!current && current.type === item.type && current.number === item.number });
          });
        });
        finish(null, { sources: result, currentError: currentError });
      }, function (err) { finish(failure(err)); });
    } catch (err) { finish(failure(err)); }
  }
  function setSource(type, number, done) {
    var tv = window.tizen, finish = bounded(done);
    if (!tv || !tv.systeminfo || !tv.tvwindow || !api()) { unavailable(finish); return; }
    if ((type !== 'HDMI' && type !== 'TV') || typeof number !== 'number' || number < 0 || number % 1) {
      finish({ message: 'Choose a TV connection in Settings > Sources first.' }); return;
    }
    try {
      tv.systeminfo.getPropertyValue('VIDEOSOURCE', function (video) {
        if (!finish.pending()) return;
        var target = null;
        (video.connected || []).concat(video.disconnected || []).forEach(function (item) {
          if (item.type === type && (type === 'TV' || item.number === number)) target = item;
        });
        if (!target) { finish({ message: 'This connection was not reported by the TV.', detail: 'Check Settings > Sources and the cable connection.' }); return; }
        try {
          tv.tvwindow.setSource(target, function () {
            if (!finish.pending()) return;
            try {
              api().launch('org.tizen.tv-viewer', function () { finish(null); }, function (err) { finish(failure(err)); });
            } catch (err) { finish(failure(err)); }
          }, function (err) { finish(failure(err)); });
        } catch (err) { finish(failure(err)); }
      }, function (err) { finish(failure(err)); });
    } catch (err) { finish(failure(err)); }
  }
  function apps(done) {
    if (!api()) { unavailable(done); return; }
    // Large installed catalogues can take longer than a launch response.
    var finish = bounded(done, 20000);
    try {
      api().getAppsInfo(function (list) {
        var known = {}, seen = {}, result = [], self = selfId();
        var netflixPrimary = list.some(function (a) { return a.id === IDS.netflix; });
        Object.keys(IDS).forEach(function (brand) { known[IDS[brand]] = brand; });
        list.forEach(function (a) {
          var primary = !!known[a.id], stream = STREAMING.indexOf(a.id) >= 0;
          var consumer = /^[A-Za-z0-9]{10}\.[A-Za-z0-9_-]+$/.test(a.id) || CONSUMER_SYSTEM.indexOf(a.id) >= 0;
          if (a.id === self || INTERNAL.indexOf(a.id) >= 0 || seen[a.id] || !a.name || (!primary && !stream && (!a.show || !consumer))) return;
          if (netflixPrimary && a.id === 'RN1MCdNq8t.Netflix') return;
          if (!primary && /(?:service|worker|preview|promotion|plugin|launcher|test|sdk|^ep[ -]|factory|daemon)/i.test(a.name + ' ' + a.id)) return;
          if (/-dummy$/.test(a.id) || a.id === 'com.samsung.tv.cobalt-yt') return;
          seen[a.id] = true;
          result.push({ appId: a.id, name: a.name, brand: known[a.id] || EXTRA_BRANDS[a.id] || '', icon: a.iconPath || '', rank: primary ? Object.keys(IDS).indexOf(known[a.id]) : (stream ? 20 : 30) });
        });
        result.sort(function (a, b) { return a.rank - b.rank || a.name.toLowerCase().localeCompare(b.name.toLowerCase()); });
        finish(null, result);
      }, function (err) { finish(failure(err)); });
    } catch (err) { finish(failure(err)); }
  }
  window.FrameDevice = { launch: launch, launchApp: launchApp, art: art, home: home, settings: settings, openUrl: openUrl, apps: apps, videoSources: videoSources, setSource: setSource };
}());
