/* The City app — a tiny pixel side-scroller drawn on <canvas>. Walk the robot along Tasmiya's street;
   every building is a project, skill or milestone and pops a card (and opens its window). Runs only while the window is visible. */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var C = window.CityCore, STOPS = (window.OS_DATA && window.OS_DATA.city) || [];
  var win = $("#win-city"), cv = $("#city-cv"), ctx = cv.getContext("2d"), wrap = $("#city");
  var card = $("#city-card"), cE = $("#city-e"), cT = $("#city-t"), cD = $("#city-d"), cGo = $("#city-go"), count = $("#city-count");
  var world = C.layout(STOPS), st = C.createState(world), input = { left: false, right: false };
  var W = 0, H = 0, dpr = 1, s = 2, yo = 0, cam = 0, raf = 0, last = 0, running = false, t = 0, shownId = null, done = false;
  var INK = "#172631", PAPER = "#FFF9E9", GOLD = "#F4CE6F", TEAL = "#2C9AA6";
  var night = (function () { try { var h = +new Intl.DateTimeFormat("en-GB", { hour: "numeric", hour12: false, timeZone: "Asia/Kolkata" }).format(new Date()); return h >= 19 || h < 6; } catch (e) { return false; } })();
  if (/[?&]day\b/.test(location.search)) night = false;
  var far = new Image(); far.src = "assets/pixel-world.png";
  var stars = []; for (var i = 0; i < 40; i++) stars.push([Math.random(), Math.random() * 0.55]);
  var clouds = [[30, 18, 1], [180, 32, .8], [330, 12, 1.2], [520, 26, .9]];
  var BOT = [ // x, y, w, h, color — the same pixel robot as the desktop hint (16×19)
    [7, 0, 2, 2, GOLD, "blip"], [7.5, 2, 1, 2, INK], [2, 4, 12, 9, INK], [3, 5, 10, 7, "#8ED6BE"], [5, 7, 2, 2, INK, "eye"], [9, 7, 2, 2, INK, "eye"], [6, 10, 4, 1, INK],
    [1, 7, 1, 3, INK], [14, 7, 1, 3, INK], [4, 13, 8, 5, INK], [5, 14, 6, 3, TEAL], [7, 15, 2, 1, GOLD]
  ];

  function resize() {
    var r = wrap.getBoundingClientRect(); if (!r.width || !r.height) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2); W = r.width; H = r.height;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    s = Math.min(H / C.VIEW_H, W / 170); yo = H / s - C.VIEW_H; draw();
  }
  function viewW() { return W / s; }
  function txt(str, wx, wy, size, weight, family, color, measureOnly) { // crisp text: drawn in screen pixels, positioned in world units
    ctx.save(); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.font = (weight || 600) + " " + (size * s).toFixed(1) + "px " + (family || "'Space Grotesk', system-ui, sans-serif");
    var w = ctx.measureText(str).width / s;
    if (!measureOnly) { ctx.fillStyle = color || INK; ctx.textBaseline = "middle"; ctx.fillText(str, (wx - cam) * s, (wy + yo) * s); }
    ctx.restore(); return w;
  }
  var skyMode = false;
  function R(x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); }
  function box(x, y, w, h, c, lw) { lw = lw || 1.2; R(x, y, w, h, INK); R(x + lw, y + lw, w - 2 * lw, h - 2 * lw, c); }

  function drawSky() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var g = ctx.createLinearGradient(0, 0, 0, H);
    if (night) { g.addColorStop(0, "#0E1C26"); g.addColorStop(1, "#24414F"); } else { g.addColorStop(0, "#DDF1EC"); g.addColorStop(.7, "#B9E3DF"); }
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.setTransform(s * dpr, 0, 0, s * dpr, 0, yo * s * dpr);
    var vw = viewW();
    if (night) { stars.forEach(function (p, i) { if ((t * 2 + i) % 7 > .4) R(Math.floor(p[0] * vw), Math.floor(p[1] * (C.VIEW_H + yo)) - yo, 1, 1, i % 5 ? "#FFF9E9" : GOLD); }); R(vw - 34, 14 - yo * .6, 10, 10, "#FFF3D6"); R(vw - 31, 14 - yo * .6, 7, 7, "#0E1C26"); }
    else { box(vw - 36, 12 - yo * .6, 14, 14, GOLD, 1); }
    clouds.forEach(function (c) { var x = ((c[0] - cam * 0.12 + t * 4 * c[2]) % (vw + 60) + vw + 60) % (vw + 60) - 40; cloud(x, c[1] - yo * 0.55, c[2]); });
    // far skyline: her pixel world, mirrored tiles so there is no seam
    if (far.complete && far.naturalWidth) {
      var fh = 96 + Math.max(0, yo) * 0.75, fw = fh * far.naturalWidth / far.naturalHeight, off = -((cam * 0.35) % (fw * 2));
      ctx.globalAlpha = night ? 0.35 : 0.55; ctx.imageSmoothingEnabled = false;
      for (var x = off - fw * 2; x < vw + fw; x += fw) {
        var k = Math.round((x - off) / fw); if (k % 2) { ctx.save(); ctx.translate(x + fw, C.GROUND - fh + 2); ctx.scale(-1, 1); ctx.drawImage(far, 0, 0, fw, fh); ctx.restore(); }
        else ctx.drawImage(far, x, C.GROUND - fh + 2, fw, fh);
      }
      ctx.globalAlpha = 1;
    }
  }
  function cloud(x, y, k) { x = Math.round(x); var c = night ? "#3A5560" : "#FFFFFF"; R(x + 4 * k, y, 16 * k, 4 * k, c); R(x, y + 3 * k, 26 * k, 5 * k, c); }

  function windows(b, top, cols, rows, skipDoor) {
    var lit = night ? GOLD : PAPER;
    var gw = 6, gap = (b.w - 8 - cols * gw) / Math.max(1, cols - 1);
    for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) {
      var x = b.x0 + 4 + c * (gw + gap), y = top + 7 + r * 11;
      if (y + 6 > C.GROUND - 20 && skipDoor) continue;
      box(x, y, gw, 6, (night && (r + c + b.x0) % 3 === 0) ? "#2B4350" : lit, .8);
    }
  }
  function sign(b, active) {
    var label = b.e + " " + b.t;
    var tw = txt(label, 0, 0, 6, 600, null, null, true) + 8, top = C.GROUND - b.h - (b.kind === "cloud" ? 22 : b.kind === "house" ? 20 : b.kind === "tower" || b.kind === "studio" ? 16 : 6) - 13;
    var x = Math.round(b.door - tw / 2), bob = active ? Math.round(Math.sin(t * 6) * 1.5) : 0;
    R(x + 1.5, top + 1.5 + bob, tw, 10, INK); box(x, top + bob, tw, 10, active ? GOLD : PAPER, 0.9);
    txt(label, x + 4, top + 5.4 + bob, 6, 600);
    if (active) { var ay = top - 6 + Math.round(Math.sin(t * 8) * 1.5); R(b.door - 3, ay, 6, 2, INK); R(b.door - 2, ay + 2, 4, 1.5, INK); R(b.door - 1, ay + 3.5, 2, 1.5, INK); }
  }
  function building(b, active) {
    var x = b.x0, top = C.GROUND - b.h, w = b.w;
    if (b.kind === "rocket") return rocket(b, active);
    R(x + 3, top + 3, w, b.h, "rgba(19,40,50,.85)");
    box(x, top, w, b.h, b.c);
    if (b.kind === "house") { // roof
      ctx.fillStyle = INK; ctx.beginPath(); ctx.moveTo(x - 5, top + 1); ctx.lineTo(x + w / 2, top - 18); ctx.lineTo(x + w + 5, top + 1); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#C9665A"; ctx.beginPath(); ctx.moveTo(x - 1.5, top - .2); ctx.lineTo(x + w / 2, top - 15.5); ctx.lineTo(x + w + 1.5, top - .2); ctx.closePath(); ctx.fill();
      box(x + w - 14, top - 14, 6, 9, "#B8B4C8", .8); windows(b, top, 3, 2, true);
    } else if (b.kind === "tower") { R(x + w / 2 - .6, top - 14, 1.2, 14, INK); if (Math.floor(t * 2) % 2) R(x + w / 2 - 1.5, top - 16, 3, 3, "#FF5F57"); windows(b, top, 4, 7, true); box(x + 6, top + 4, w - 12, 0, b.c); }
    else if (b.kind === "studio") { R(x + 8, top - 8, 1.2, 8, INK); box(x + 2, top - 13, 14, 6, "#FFFCF3", .8); box(x + w - 22, top + 6, 18, 8, INK, .8); txt("● REC", x + w - 21, top + 10, 4.6, 700, "'DM Mono', monospace", Math.floor(t * 2) % 2 ? "#FF5F57" : "#c9827a"); windows(b, top + 12, 3, 4, true); }
    else if (b.kind === "shop" || b.kind === "cafe") {
      windows(b, top, 4, 2, true);
      var aw = C.GROUND - 30; for (var i = 0; i < w; i += 6) box(x + i - (i ? 0 : 0), aw, Math.min(6, w - i), 6, (i / 6) % 2 ? PAPER : (b.kind === "cafe" ? TEAL : "#EF9D91"), .6);
      if (b.kind === "cafe") { box(x + w - 14, aw - 14, 9, 8, PAPER, .8); R(x + w - 5.5, aw - 12, 2, 3, INK); var sy = Math.sin(t * 3) * 1; R(x + w - 12 + sy, aw - 19, 1, 3, "#fff"); R(x + w - 9 - sy, aw - 20, 1, 3, "#fff"); }
    }
    else if (b.kind === "garage") { windows(b, top, 4, 1, false); var gx = x + 8, gw2 = w - 16; box(gx, C.GROUND - 26, gw2, 26, "#8E8AA0", 1); for (var y = C.GROUND - 22; y < C.GROUND; y += 4) R(gx + 1, y, gw2 - 2, .8, INK); }
    else if (b.kind === "cloud") { windows(b, top, 3, 8, true); var cx = x + w / 2; R(cx - 14, top - 10, 28, 8, PAPER); R(cx - 9, top - 16, 18, 8, PAPER); R(cx - 15, top - 3, 30, 3, PAPER); R(cx - 14, top - 10.8, 28, .8, INK); R(cx - 9, top - 16.8, 18, .8, INK); txt("AWS", cx - 6, top - 9, 5.5, 700, "'DM Mono', monospace"); }
    else if (b.kind === "post") { windows(b, top, 3, 2, true); box(x + w + 1, C.GROUND - 12, 7, 12, "#3A6FA8", .8); R(x + w + 2, C.GROUND - 9, 5, 1, INK); }
    else if (b.kind === "lab") { R(x + w / 2 - 9, top - 9, 18, 9, INK); R(x + w / 2 - 7.8, top - 7.8, 15.6, 7.8, "#FFF3D6"); windows(b, top, 4, 3, true); }
    // door
    var dw = 10, dx = Math.round(b.door - dw / 2);
    if (b.kind !== "garage") { box(dx, C.GROUND - 17, dw, 17, active ? GOLD : INK, 1); R(dx + dw - 3, C.GROUND - 9, 1.2, 1.2, active ? INK : GOLD); }
    sign(b, active);
  }
  function rocket(b, active) {
    var cx = b.door, base = C.GROUND, flame = active ? 1 : 0, lift = 0;
    box(cx - 22, base - 6, 44, 6, "#8E8AA0", 1); // pad
    var rx = cx - 8, top = base - b.h + 4 - lift;
    R(rx + 3, top + 3, 16, b.h - 14, "rgba(19,40,50,.85)");
    box(rx, top + 8, 16, b.h - 18, PAPER, 1.2);
    ctx.fillStyle = INK; ctx.beginPath(); ctx.moveTo(rx - .5, top + 9); ctx.lineTo(cx, top - 6); ctx.lineTo(rx + 16.5, top + 9); ctx.closePath(); ctx.fill();
    ctx.fillStyle = b.c; ctx.beginPath(); ctx.moveTo(rx + 1.5, top + 8.4); ctx.lineTo(cx, top - 3); ctx.lineTo(rx + 14.5, top + 8.4); ctx.closePath(); ctx.fill();
    box(cx - 4, top + 16, 8, 8, "#94C9DE", 1);
    box(rx - 6, base - 22, 6, 12, b.c, 1); box(rx + 16, base - 22, 6, 12, b.c, 1);
    if (flame || Math.floor(t * 4) % 2) { R(cx - 4, base - 10, 8, 3, GOLD); R(cx - 2, base - 7, 4, 2 + (Math.floor(t * 10) % 2) * 2, "#FF8A4C"); }
    sign(b, active);
  }
  function street() {
    var vw = viewW(), x0 = Math.floor(cam / 12) * 12 - 12;
    R(cam - 2, C.GROUND, vw + 4, 7, night ? "#3A5560" : "#F7EFD8"); R(cam - 2, C.GROUND, vw + 4, 1, INK);
    for (var x = x0; x < cam + vw + 12; x += 12) R(x, C.GROUND + 1, .6, 6, "rgba(23,38,49,.25)");
    R(cam - 2, C.GROUND + 7, vw + 4, C.VIEW_H - C.GROUND - 7, night ? "#10202A" : "#2B4350"); R(cam - 2, C.GROUND + 7, vw + 4, 1, INK);
    for (x = Math.floor(cam / 24) * 24; x < cam + vw + 24; x += 24) R(x, C.GROUND + 16, 12, 2, GOLD);
    // street lamps between buildings
    world.buildings.forEach(function (b, i) { if (i === world.buildings.length - 1) return; var lx = b.x1 + 17; R(lx, C.GROUND - 26, 1.4, 26, INK); R(lx - 3, C.GROUND - 28, 7, 3, INK); R(lx - 2, C.GROUND - 25.5, 5, 1.5, night ? GOLD : PAPER); if (night) { ctx.fillStyle = "rgba(244,206,111,.13)"; ctx.beginPath(); ctx.moveTo(lx - 2, C.GROUND - 24); ctx.lineTo(lx - 12, C.GROUND); ctx.lineTo(lx + 14, C.GROUND); ctx.lineTo(lx + 3.5, C.GROUND - 24); ctx.fill(); } });
  }
  function robot() {
    var x = Math.round(st.x - 8), y = C.GROUND - 19 - Math.round(st.y) - (st.moving ? (Math.floor(st.walkT * 10) % 2) : 0);
    var step = st.moving ? Math.floor(st.walkT * 10) % 2 : 0, look = st.dir > 0 ? 0.6 : -0.6;
    R(x + 3, C.GROUND - 1, 12, 1.5, "rgba(19,40,50,.35)");
    BOT.forEach(function (p) {
      if (p[5] === "blip" && Math.floor(t * 2) % 2) return;
      var px = x + p[0] + (p[5] === "eye" ? look : 0), py = y + p[1];
      if (p[5] === "eye" && (t % 4.5) > 4.35) { R(px, py + .8, p[2], .5, p[4]); return; }
      R(px, py, p[2], p[3], p[4]);
    });
    // legs
    R(x + 5, y + 18, 2, 1 + (step ? 0 : 1), INK); R(x + 9, y + 18, 2, 1 + (step ? 1 : 0), INK);
  }
  function draw() {
    if (!W) return;
    drawSky();
    ctx.setTransform(s * dpr, 0, 0, s * dpr, -cam * s * dpr, yo * s * dpr);
    street();
    var vw = viewW();
    world.buildings.forEach(function (b) { if (b.x1 + 30 > cam && b.x0 - 30 < cam + vw) building(b, st.near === b); });
    robot();
  }
  function showCard() {
    var b = st.near, id = b ? b.id : null; if (id === shownId) return; shownId = id;
    if (!b) { card.hidden = true; return; }
    cE.textContent = b.e; cE.style.background = b.c; cT.textContent = b.t; cD.textContent = b.d;
    cGo.textContent = "Open " + ({ about: "About", skills: "Skills", projects: b.project ? "project" : "Projects", teknoa: "TEKNOA", github: "GitHub", aws: "On AWS", twin: "AI Twin", contact: "Contact" }[b.app] || "") + " ↗";
    card.hidden = false;
  }
  function enter() { var b = st.near; if (!b) { C.jump(st); return; } if (!window.OS) return; if (b.project) window.OS.openProject(b.project, cGo); else window.OS.open(b.app, cGo); }
  cGo.addEventListener("click", enter);
  function frame(now) {
    if (!running) return;
    var dt = last ? (now - last) / 1000 : 0; last = now; t += dt;
    C.step(st, input, dt, world);
    var vw = viewW(), want = Math.max(0, Math.min(world.width - vw, st.x - vw * 0.42));
    if (world.width < vw) want = (world.width - vw) / 2;
    cam += (want - cam) * Math.min(1, dt * 6);
    if (st.newVisit) {
      var n = C.visitedCount(st); count.textContent = "🏙 " + n + "/" + world.buildings.length + " visited";
      if (n === world.buildings.length && !done) { done = true; if (window.OS) { window.OS.toast("🏆 City explorer — you visited every building!"); var r = cv.getBoundingClientRect(); window.OS.sparks(r.left + r.width / 2, r.top + r.height / 2); } }
    }
    showCard(); draw();
    raf = requestAnimationFrame(frame);
  }
  function start() { if (running) return; running = true; last = 0; resize(); cam = Math.max(0, st.x - viewW() * 0.42); raf = requestAnimationFrame(frame); }
  function stop() { running = false; cancelAnimationFrame(raf); input.left = input.right = false; }
  win.addEventListener("os:open", function () { setTimeout(start, 40); });
  win.addEventListener("os:resize", function () { setTimeout(resize, 60); });
  win.addEventListener("os:close", stop); win.addEventListener("os:min", stop);
  document.addEventListener("visibilitychange", function () { if (document.hidden) stop(); else if (!win.hidden) start(); });
  if ("ResizeObserver" in window) new ResizeObserver(function () { if (running) resize(); }).observe(wrap);
  far.onload = function () { if (running) draw(); };

  /* controls: keyboard (when the City is the front window), tap-to-walk, on-screen pad */
  function cityFront() { return window.OS ? window.OS.top() === "city" : !win.hidden; }
  document.addEventListener("keydown", function (e) {
    if (!cityFront() || /INPUT|TEXTAREA/.test(e.target.tagName) || e.altKey || e.metaKey || e.ctrlKey) return;
    var k = e.key;
    if (k === "ArrowLeft" || k === "a" || k === "A") input.left = true;
    else if (k === "ArrowRight" || k === "d" || k === "D") input.right = true;
    else if (k === "ArrowUp" || k === "w" || k === "W" || (k === "Enter" && e.target === cv)) { enter(); }
    else if (k === " " && e.target === cv) C.jump(st);
    else if (k === "n" || k === "N") { night = !night; }
    else return;
    e.preventDefault();
  });
  document.addEventListener("keyup", function (e) {
    var k = e.key;
    if (k === "ArrowLeft" || k === "a" || k === "A") input.left = false;
    if (k === "ArrowRight" || k === "d" || k === "D") input.right = false;
  });
  cv.addEventListener("pointerdown", function (e) {
    var r = cv.getBoundingClientRect(), wx = cam + (e.clientX - r.left) / s, wy = (e.clientY - r.top) / s;
    var hit = null; world.buildings.forEach(function (b) { if (wx >= b.x0 && wx <= b.x1 && wy >= C.GROUND - b.h - 30 && wy <= C.GROUND) hit = b; });
    if (hit && st.near === hit) { enter(); return; }
    st.target = hit ? hit.door : wx;
    try { cv.focus({ preventScroll: true }); } catch (err) {}
  });
  function hold(btn, key) {
    function down(e) { e.preventDefault(); input[key] = true; btn.classList.add("is-down"); try { btn.setPointerCapture(e.pointerId); } catch (err) {} }
    function up() { input[key] = false; btn.classList.remove("is-down"); }
    btn.addEventListener("pointerdown", down); btn.addEventListener("pointerup", up); btn.addEventListener("pointercancel", up); btn.addEventListener("lostpointercapture", up);
    btn.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); st.target = st.x + (key === "left" ? -60 : 60); } });
  }
  hold($("#city-l"), "left"); hold($("#city-r"), "right");
  $("#city-u").addEventListener("click", enter);
  /* phones: a row of building chips under the street — tap one and the robot walks there */
  var list = $("#city-list");
  if (list) STOPS.forEach(function (b) {
    var c = document.createElement("button"); c.type = "button"; c.className = "mini"; c.textContent = b.e + " " + b.t;
    c.addEventListener("click", function () { var w = world.buildings.filter(function (x) { return x.id === b.id; })[0]; if (w) st.target = w.door; });
    list.appendChild(c);
  });
  window.City = { state: st, world: world, walkTo: function (id) { var b = world.buildings.filter(function (x) { return x.id === id; })[0]; if (b) st.target = b.door; } };
})();
