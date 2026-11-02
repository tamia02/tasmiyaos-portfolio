/* TasmiyaOS window manager core — pure state, no DOM (unit-tested in test/os.test.mjs).
   A stack of window ids: last = front. Each window: open, min (minimised), max, x, y, w, h, z. */
(function (root) {
  "use strict";
  function clamp(r, vw, vh, top, bottom) {
    top = top || 0; bottom = bottom || 0;
    var w = Math.min(r.w, vw - 16), h = Math.min(r.h, vh - top - bottom - 12);
    var x = Math.max(8 - w + 120, Math.min(r.x, vw - 120));       // keep at least 120px of the window on screen
    var y = Math.max(top + 4, Math.min(r.y, vh - bottom - 44));    // titlebar never under the menubar or off the bottom
    return { x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h) };
  }
  function createWM(opts) {
    opts = opts || {};
    var wins = {}, stack = [], zBase = opts.zBase || 10, n = 0, listeners = [];
    function emit(type, id) { listeners.forEach(function (f) { f(type, id); }); }
    function restack() { stack.forEach(function (id, i) { wins[id].z = zBase + i; }); }
    function get(id) { return wins[id]; }
    function ensure(id, rect) {
      if (!wins[id]) { wins[id] = { id: id, open: false, min: false, max: false, x: 0, y: 0, w: 480, h: 360, z: 0, placed: false }; }
      if (rect && !wins[id].placed) { var w = wins[id]; w.x = rect.x; w.y = rect.y; w.w = rect.w; w.h = rect.h; w.placed = true; }
      return wins[id];
    }
    function top() { for (var i = stack.length - 1; i >= 0; i--) { var w = wins[stack[i]]; if (w.open && !w.min) return stack[i]; } return null; }
    function focus(id) {
      var w = wins[id]; if (!w || !w.open) return;
      w.min = false;
      var i = stack.indexOf(id); if (i >= 0) stack.splice(i, 1); stack.push(id); restack(); emit("focus", id);
    }
    function open(id, rect) {
      var w = ensure(id, rect || cascade());
      var was = w.open; w.open = true; w.min = false; focus(id); emit(was ? "refocus" : "open", id); return w;
    }
    function cascade() { var k = (n++ % 6); return { x: 140 + k * 34, y: 70 + k * 30, w: 560, h: 420 }; }
    function close(id) {
      var w = wins[id]; if (!w || !w.open) return;
      w.open = false; w.min = false; w.max = false;
      var i = stack.indexOf(id); if (i >= 0) stack.splice(i, 1); restack(); emit("close", id);
      var t = top(); if (t) emit("focus", t);
    }
    function minimise(id) { var w = wins[id]; if (!w || !w.open) return; w.min = true; emit("min", id); var t = top(); if (t) emit("focus", t); }
    function toggleMax(id) { var w = wins[id]; if (!w || !w.open) return; w.max = !w.max; focus(id); emit("max", id); }
    function move(id, x, y, vw, vh, topH, botH) {
      var w = wins[id]; if (!w) return;
      var r = clamp({ x: x, y: y, w: w.w, h: w.h }, vw || 1e5, vh || 1e5, topH, botH); w.x = r.x; w.y = r.y; w.placed = true; emit("move", id);
    }
    /* dock click: open if closed, restore if minimised, minimise if it is already the front window, else focus */
    function dock(id, rect) {
      var w = wins[id];
      if (!w || !w.open) return open(id, rect), "open";
      if (w.min) return focus(id), "restore";
      if (top() === id) return minimise(id), "min";
      return focus(id), "focus";
    }
    return { get: get, ensure: ensure, open: open, close: close, focus: focus, minimise: minimise, toggleMax: toggleMax, move: move, dock: dock, top: top,
      stack: function () { return stack.slice(); }, openIds: function () { return stack.filter(function (id) { return wins[id].open; }); },
      on: function (f) { listeners.push(f); } };
  }
  root.WMCore = { createWM: createWM, clamp: clamp };
})(typeof window !== "undefined" ? window : globalThis);
