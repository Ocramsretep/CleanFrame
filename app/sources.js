/* Local source preferences are independent of the existing nine-app layout. */
(function () {
  'use strict';
  var KEY = 'cleanframe.sources.v1';
  var ICONS = ['tv', 'hdmi', 'xbox', 'console', 'soundbar'];
  function defaults() {
    var items = [{ id: 'tv', name: 'Live TV', icon: 'tv', type: 'TV', number: 0, visible: true }];
    for (var i = 1; i <= 4; i++) items.push({ id: 'hdmi' + i, name: 'HDMI ' + i, icon: 'hdmi', type: 'HDMI', number: i, visible: false });
    return items;
  }
  function clean(value) {
    var base = defaults(), result = [], seen = {};
    if (!Array.isArray(value)) return base;
    value.forEach(function (item) {
      if (!item || seen[item.id]) return;
      var original = base.filter(function (entry) { return entry.id === item.id; })[0];
      if (!original) return;
      seen[item.id] = true;
      original.name = typeof item.name === 'string' && item.name.replace(/\s/g, '') ? item.name.slice(0, 24) : original.name;
      original.icon = ICONS.indexOf(item.icon) >= 0 ? item.icon : original.icon;
      original.visible = original.type !== 'AUDIO' && item.visible === true;
      if (original.type === 'HDMI') original.number = typeof item.number === 'number' && item.number >= 1 && item.number <= 4 && item.number % 1 === 0 ? item.number : original.number;
      result.push(original);
    });
    base.forEach(function (item) { if (!seen[item.id]) result.push(item); });
    return result;
  }
  var items;
  try { items = clean(JSON.parse(localStorage.getItem(KEY))); } catch (err) { items = defaults(); }
  window.FrameSources = {
    icons: ICONS,
    all: function () { return JSON.parse(JSON.stringify(items)); },
    visible: function () { return items.filter(function (item) { return item.visible; }); },
    save: function (value) {
      var next = clean(value);
      try { localStorage.setItem(KEY, JSON.stringify(next)); } catch (err) { return false; }
      items = next; return true;
    }
  };
}());
