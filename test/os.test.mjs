// Unit tests for TasmiyaOS: the window manager, the City game, and the AI twin's answer cards. node --test test/
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const SITE = join(dirname(fileURLToPath(import.meta.url)), "..", "site");
const read = (f) => readFileSync(join(SITE, f), "utf8");
const load = (...files) => { const w = {}; for (const f of files) new Function("window", read(f))(w); return w; };

test("window manager: open, focus order (z-index stack), close", () => {
  const { WMCore } = load("wm-core.js");
  const wm = WMCore.createWM({ zBase: 10 });
  wm.open("about", { x: 10, y: 10, w: 400, h: 300 });
  wm.open("projects"); wm.open("twin");
  assert.deepEqual(wm.stack(), ["about", "projects", "twin"]);
  assert.equal(wm.top(), "twin");
  assert.ok(wm.get("twin").z > wm.get("projects").z && wm.get("projects").z > wm.get("about").z);
  wm.focus("about");
  assert.equal(wm.top(), "about"); assert.deepEqual(wm.stack(), ["projects", "twin", "about"]);
  assert.equal(wm.get("about").z, 12);
  wm.close("about");
  assert.equal(wm.get("about").open, false); assert.equal(wm.top(), "twin");
  assert.deepEqual(wm.openIds(), ["projects", "twin"]);
});

test("window manager: minimise, restore and the dock's click cycle", () => {
  const { WMCore } = load("wm-core.js");
  const wm = WMCore.createWM();
  assert.equal(wm.dock("city"), "open");
  wm.open("about");
  assert.equal(wm.top(), "about");
  assert.equal(wm.dock("city"), "focus");
  assert.equal(wm.dock("city"), "min");
  assert.equal(wm.get("city").min, true); assert.equal(wm.top(), "about", "minimised windows are skipped for focus");
  assert.equal(wm.dock("city"), "restore");
  assert.equal(wm.get("city").min, false); assert.equal(wm.top(), "city");
  wm.toggleMax("city"); assert.equal(wm.get("city").max, true);
  wm.close("city"); assert.equal(wm.get("city").max, false, "closing resets zoom");
});

test("window manager: dragging is clamped so a window can never be lost off-screen", () => {
  const { WMCore } = load("wm-core.js");
  const wm = WMCore.createWM();
  wm.open("about", { x: 100, y: 100, w: 500, h: 400 });
  wm.move("about", 5000, 5000, 1440, 864, 0, 0);
  let s = wm.get("about"); assert.ok(s.x <= 1440 - 120 && s.y <= 864 - 44, "stays reachable bottom-right");
  wm.move("about", -5000, -5000, 1440, 864, 0, 0);
  s = wm.get("about"); assert.ok(s.x + s.w >= 120 && s.y >= 0, "titlebar stays reachable top-left");
  const r = WMCore.clamp({ x: 0, y: 0, w: 3000, h: 3000 }, 1000, 700, 0, 0);
  assert.ok(r.w <= 1000 && r.h <= 700, "oversized windows shrink to the screen");
  const events = []; wm.on((t, id) => events.push(t + ":" + id)); wm.open("skills"); wm.close("skills");
  assert.ok(events.includes("open:skills") && events.includes("close:skills"));
});

test("city: every stop becomes a building in order, with the right app", () => {
  const w = load("os-data.js", "city-core.js"), C = w.CityCore;
  const world = C.layout(w.OS_DATA.city);
  assert.equal(world.buildings.length, 10);
  world.buildings.forEach((b, i) => {
    assert.ok(b.x1 > b.x0 && b.door > b.x0 && b.door < b.x1);
    if (i) assert.ok(b.x0 > world.buildings[i - 1].x1, "buildings do not overlap");
    assert.ok(b.h + 40 < C.GROUND, "building + sign fit in the view: " + b.id);
  });
  const apps = world.buildings.map((b) => b.app);
  for (const a of ["about", "skills", "projects", "github", "aws", "twin", "contact", "teknoa"]) assert.ok(apps.includes(a), "a building opens " + a);
  assert.ok(world.width > world.buildings.at(-1).x1);
});

test("city: walking right visits buildings, pops the nearest card, and stays inside the world", () => {
  const w = load("os-data.js", "city-core.js"), C = w.CityCore;
  const world = C.layout(w.OS_DATA.city), st = C.createState(world);
  C.step(st, {}, 0.016, world);
  assert.equal(st.near.id, "home", "starts in front of her house");
  assert.equal(C.visitedCount(st), 1);
  const x0 = st.x; C.step(st, { right: true }, 0.05, world);
  assert.ok(Math.abs(st.x - x0 - C.SPEED * 0.05) < 1e-6, "moves at SPEED units/s");
  for (let i = 0; i < 2000; i++) C.step(st, { right: true }, 0.016, world);
  assert.ok(st.x <= world.width - 12, "clamped to the street");
  assert.equal(C.visitedCount(st), 10, "walking the whole street visits every building");
  assert.equal(st.near.id, "post");
  st.target = world.buildings[2].door; for (let i = 0; i < 2000 && st.target != null; i++) C.step(st, {}, 0.016, world);
  assert.equal(st.near.id, "vaslix", "tap-to-walk stops at the building's door");
  assert.equal(st.x, world.buildings[2].door);
  C.jump(st); C.step(st, {}, 0.016, world); assert.ok(st.y > 0, "jump leaves the ground");
  for (let i = 0; i < 100; i++) C.step(st, {}, 0.016, world); assert.equal(st.y, 0, "and lands");
});

test("chat cards: answers render rich cards, not just text", () => {
  const w = load("os-data.js", "twin-cards.js"), K = w.TwinCards;
  const lp = K.cardFor("launchos");
  assert.match(lp, /data-card="project"/); assert.match(lp, /src="assets\/work\/launchos\.webp"/);
  assert.match(lp, /href="https:\/\/www\.launchos\.co\.in\/"[^>]*target="_blank"[^>]*>Visit/);
  assert.match(lp, /data-project="launchos"/, "Quick look opens the project's preview window");
  const sk = K.cardFor("skills");
  assert.equal((sk.match(/<ul class="chips">/g) || []).length, 6, "six skill rows of chips");
  assert.match(sk, /scikit-learn/);
  const ct = K.cardFor("contact");
  assert.match(ct, /href="mailto:hello@vaslix\.com"/); assert.match(ct, /github\.com\/tamia02/);
  const gal = K.cardFor("stores");
  assert.equal((gal.match(/data-project="/g) || []).length, 3); assert.match(gal, /kusho/);
  assert.match(K.cardFor("github"), /VOICEBOT/);
  assert.match(K.cardFor("teknoa"), /instagram\.com\/tek_noa/);
  assert.equal(K.cardFor("greet"), "", "small talk stays plain text");
  assert.equal(K.cardFor("joke"), "");
});

test("chat cards cover the twin's intents they name", () => {
  const w = load("twin-data.js", "os-data.js", "twin-cards.js");
  const intents = Object.keys(w.TWIN_DATA.intents);
  for (const k of w.TwinCards.intents) assert.ok(intents.includes(k), "card for unknown intent " + k);
});
