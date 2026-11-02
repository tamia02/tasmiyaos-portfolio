/* The City — pure game state for the pixel-city mini-game (no DOM; unit-tested in test/os.test.mjs).
   World units: the street is VIEW_H = 180 units tall, the pavement line is at GROUND = 150. */
(function (root) {
  "use strict";
  var GROUND = 150, VIEW_H = 180, SPEED = 78, GAP = 28, START = 46;
  function layout(stops) {
    var x = START, out = stops.map(function (s) {
      var b = {}; for (var k in s) b[k] = s[k];
      b.x0 = x; b.x1 = x + s.w; b.door = x + s.w / 2; x = b.x1 + GAP; return b;
    });
    return { buildings: out, width: x - GAP + 20 };
  }
  function nearest(x, buildings, pad) {
    pad = pad == null ? 10 : pad;
    for (var i = 0; i < buildings.length; i++) { var b = buildings[i]; if (x >= b.x0 - pad && x <= b.x1 + pad) return b; }
    return null;
  }
  function createState(world) {
    var b0 = world.buildings[0];
    return { x: b0 ? b0.door : 20, y: 0, vy: 0, dir: 1, moving: false, walkT: 0, target: null, visited: {}, near: null, newVisit: null };
  }
  function jump(st) { if (st.y === 0) st.vy = 150; }
  function step(st, input, dt, world) {
    dt = Math.min(dt, 0.05); input = input || {};
    var dx = 0;
    if (input.left) { dx = -1; st.target = null; } else if (input.right) { dx = 1; st.target = null; }
    else if (st.target != null) { var d = st.target - st.x; if (Math.abs(d) < 1.5) { st.x = st.target; st.target = null; } else dx = d > 0 ? 1 : -1; }
    var nx = st.x + dx * SPEED * dt;
    if (st.target != null && dx !== 0 && (st.target - st.x) * (st.target - nx) <= 0) { nx = st.target; st.target = null; }
    st.x = Math.max(12, Math.min(world.width - 12, nx));
    st.moving = dx !== 0; if (dx) st.dir = dx;
    st.walkT = st.moving ? st.walkT + dt : 0;
    if (st.y > 0 || st.vy > 0) { st.y += st.vy * dt; st.vy -= 520 * dt; if (st.y <= 0) { st.y = 0; st.vy = 0; } }
    var n = nearest(st.x, world.buildings); st.newVisit = null;
    if (n && !st.visited[n.id]) { st.visited[n.id] = true; st.newVisit = n.id; }
    st.near = n; return st;
  }
  function visitedCount(st) { return Object.keys(st.visited).length; }
  root.CityCore = { GROUND: GROUND, VIEW_H: VIEW_H, SPEED: SPEED, layout: layout, nearest: nearest, createState: createState, step: step, jump: jump, visitedCount: visitedCount };
})(typeof window !== "undefined" ? window : globalThis);
