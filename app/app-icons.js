/* Bundled white icons. Public application IDs identify services, not devices. */
(function () {
  'use strict';
  var list = [
    {
      "id": "abciview",
      "name": "ABC iview"
    },
    {
      "id": "airplay",
      "name": "Apple AirPlay"
    },
    {
      "id": "applemusic",
      "name": "Apple Music"
    },
    {
      "id": "appletv",
      "name": "Apple TV"
    },
    {
      "id": "apps",
      "name": "Apps"
    },
    {
      "id": "ard",
      "name": "ARD Mediathek"
    },
    {
      "id": "arte",
      "name": "ARTE"
    },
    {
      "id": "audi",
      "name": "Audi"
    },
    {
      "id": "brandtv",
      "name": "Brand.TV"
    },
    {
      "id": "chili",
      "name": "CHILI"
    },
    {
      "id": "cleanframe",
      "name": "CleanFrame"
    },
    {
      "id": "couchplay",
      "name": "Couchplay Games"
    },
    {
      "id": "cupra",
      "name": "CUPRA"
    },
    {
      "id": "dazn",
      "name": "DAZN"
    },
    {
      "id": "deezer",
      "name": "Deezer"
    },
    {
      "id": "disneyplus",
      "name": "Disney+"
    },
    {
      "id": "gallery",
      "name": "Gallery"
    },
    {
      "id": "unknown",
      "name": "Generic app"
    },
    {
      "id": "movies",
      "name": "Google Play Movies & TV"
    },
    {
      "id": "hbomax",
      "name": "HBO Max"
    },
    {
      "id": "home",
      "name": "Home"
    },
    {
      "id": "internet",
      "name": "Internet"
    },
    {
      "id": "joyn",
      "name": "Joyn"
    },
    {
      "id": "magentatv",
      "name": "MagentaTV"
    },
    {
      "id": "magentatv-alt",
      "name": "MagentaTV (alternative)"
    },
    {
      "id": "maxdome",
      "name": "maxdome"
    },
    {
      "id": "netflix",
      "name": "Netflix"
    },
    {
      "id": "paramountplus",
      "name": "Paramount+"
    },
    {
      "id": "art",
      "name": "Picture"
    },
    {
      "id": "plutotv",
      "name": "Pluto TV"
    },
    {
      "id": "primevideo",
      "name": "Prime Video"
    },
    {
      "id": "prosieben",
      "name": "ProSieben"
    },
    {
      "id": "rakutentv",
      "name": "Rakuten TV"
    },
    {
      "id": "rtlplus",
      "name": "RTL+"
    },
    {
      "id": "tvplus",
      "name": "Samsung TV Plus"
    },
    {
      "id": "sbs",
      "name": "SBS"
    },
    {
      "id": "settings",
      "name": "Settings"
    },
    {
      "id": "smartthings",
      "name": "SmartThings"
    },
    {
      "id": "sportworld",
      "name": "Sportworld"
    },
    {
      "id": "spotify",
      "name": "Spotify"
    },
    {
      "id": "stremio",
      "name": "Stremio"
    },
    {
      "id": "ted",
      "name": "TED"
    },
    {
      "id": "tiktok",
      "name": "TikTok"
    },
    {
      "id": "tubi",
      "name": "Tubi"
    },
    {
      "id": "twitch",
      "name": "Twitch"
    },
    {
      "id": "wow",
      "name": "WOW"
    },
    {
      "id": "xbox",
      "name": "Xbox"
    },
    {
      "id": "youtube",
      "name": "YouTube"
    },
    {
      "id": "kids",
      "name": "YouTube Kids"
    },
    {
      "id": "youtubetv",
      "name": "YouTube TV"
    },
    {
      "id": "zdf",
      "name": "ZDF mediathek"
    }
  ];
  var appIds = {
    "org.tizen.apple.apple-music": "applemusic",
    "com.samsung.tv.aria-video": "appletv",
    "SrAoJxGQUf.ARD": "ard",
    "aLlph042JZ.arte": "arte",
    "TCVAAnsPTa.Audi": "audi",
    "PK700Cupra.Cupra": "cupra",
    "8HwqClkwtp.DAZN": "dazn",
    "cexr1qp97S.Deezer": "deezer",
    "MCmYXNxgcu.DisneyPlus": "disneyplus",
    "cg2m3QSB89.7tv": "joyn",
    "My5jIduosH.smarttvftv": "magentatv",
    "g0nt8dscFO.MagentaTV": "magentatv-alt",
    "Kbeo5u275B.maxdome": "maxdome",
    "org.tizen.netflix-app": "netflix",
    "RN1MCdNq8t.Netflix": "netflix",
    "org.tizen.netflixlowmem": "netflix",
    "rJyOSqC6Up.PPlusIntl": "paramountplus",
    "X1pKpFCiUu.PlutoTV": "plutotv",
    "evKhCgZelL.AmazonIgnitionLauncher2": "primevideo",
    "Q5XAEisxwi.ProSieben": "prosieben",
    "vbUQClczfR.Wuakitv": "rakutentv",
    "KbRHmu0vrC.TVNOWPREMIUM": "rtlplus",
    "com.samsung.tv.iot-dashboard": "smartthings",
    "rJeHak5zRg.Spotify": "spotify",
    "UCJa2s9hhC.TED": "ted",
    "9FhM0cODbY.TikTokTV": "tiktok",
    "Jz7aUrV2Q4.Twitch": "twitch",
    "Mo5FtpAjGy.Skyonline": "wow",
    "9Ur5IzDKqV.TizenYouTube": "youtube",
    "com.samsung.tv.cobalt-yt": "youtube",
    "yPSlpvfeTf.ZDFmediathek": "zdf",
    "NRi6kdBYJ0.AirPlayWebApp": "airplay",
    "com.samsung.tv.airplay-app": "airplay",
    "SSS02MyT3r.BrandWorld": "brandtv",
    "vYlbEeT4gk.ChiliTizen": "chili",
    "NeV3gZvFmN.Couchplay": "couchplay",
    "com.samsung.tv.gallery": "gallery",
    "QizQxC7CUf.PlayMovies": "movies",
    "com.samsung.tv.cobalt-gpm": "movies",
    "org.tizen.browser": "internet",
    "com.samsung.tv.tvPlusDeeplinker": "tvplus",
    "Y9sxevvNCT.SportWorld": "sportworld",
    "bbvbMgeZGF.SamsungSportWorld": "sportworld",
    "com.samsung.tv.cobalt-ytkids": "kids",
    "com.samsung.tv.cobalt-yttv": "youtubetv",
    "rJyOSqC6Up.CBSAllAccess": "paramountplus",
    "PvWgqxV3Xa.YouTubeTV": "youtubetv",
    "cj37Ni3qXM.HBONow": "hbomax",
    "5b8c3eb16b.BeamCTVDev": "hbomax",
    "3KA0pm7a7V.TubiTV": "tubi"
  };
  function has(id) { return list.some(function (item) { return item.id === id; }); }
  function resolve(appId, brand) { return Object.prototype.hasOwnProperty.call(appIds, appId) ? appIds[appId] : (has(brand) ? brand : 'unknown'); }
  function clean(saved) {
    var result = {};
    if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return result;
    Object.keys(saved).slice(0, 256).forEach(function (id) {
      if (/^[A-Za-z0-9][A-Za-z0-9._-]{0,160}$/.test(id) && ['constructor', 'prototype', '__proto__'].indexOf(id) < 0 && has(saved[id])) result[id] = saved[id];
    });
    return result;
  }
  window.FrameAppIcons = { list: list, has: has, resolve: resolve, clean: clean };
}());
