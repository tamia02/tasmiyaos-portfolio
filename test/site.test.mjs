// Runs on every Amplify build (see amplify.yml) and locally with: node --test test/site.test.mjs test/os.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const SITE = join(dirname(fileURLToPath(import.meta.url)), "..", "site");
const read = (f) => readFileSync(join(SITE, f), "utf8");
const html = read("index.html");
const classic = read("classic.html");

test("page basics: title, language, responsive viewport, description", () => {
  for (const page of [html, classic]) {
    assert.match(page, /<html lang="en"/);
    assert.match(page, /<title>Tasmiya Siddiqui[^<]+<\/title>/);
    assert.match(page, /<meta name="viewport" content="width=device-width, initial-scale=1/);
    assert.match(page, /<meta name="description" content="[^"]{60,}"/);
  }
});

test("TasmiyaOS: the three required sections are apps on the desktop", () => {
  assert.match(html, /id="win-about"[\s\S]*About me/);
  assert.match(html, /id="win-skills"[\s\S]*Skills \/ tech superpowers/);
  assert.match(html, /id="win-projects"[\s\S]*Projects &amp; achievements/);
  assert.match(html, /Achievements<\/p>/);
  for (const app of ["about", "skills", "projects", "github", "aws", "teknoa", "city", "twin", "contact", "terminal"])
    assert.match(html, new RegExp(`class="icon"[^>]*data-open="${app}"`), "desktop icon for " + app);
  assert.match(html, /menubar__nav[\s\S]*data-open="about"[\s\S]*data-open="skills"[\s\S]*data-open="projects"/, "menubar links reach the rubric sections");
});

test("all 9 Vaslix projects (+ GharLeads) are in the Projects finder with screenshots", () => {
  const files = [...html.matchAll(/class="file" type="button" data-project="([a-z]+)"/g)].map((m) => m[1]);
  assert.equal(files.length, 10);
  for (const id of ["launchos", "softwarehub", "aandre", "kusho", "aarc", "aether", "inquiryboost", "laptophouse", "pagani", "gharleads"]) assert.ok(files.includes(id), id);
  assert.match(html, /id="pv-go"[^>]*target="_blank"/, "preview has a Visit link");
});

test("the AI twin has a visible hint and its own app window", () => {
  assert.match(html, /class="psst"[^>]*data-open="twin"/);
  assert.match(html, /psst — talk to my AI twin/);
  assert.match(html, /id="win-twin"[^>]*aria-modal="false"/, "windows are non-modal so the desktop stays usable");
  assert.ok((html.match(/data-open="twin"/g) || []).length >= 3, "several ways to open the twin");
  assert.match(html, /id="voice-btn"/); assert.match(html, /id="reel"/);
});

test("classic view exists for judges/SEO and both views link to each other", () => {
  assert.match(html, /href="classic\.html"/);
  assert.match(classic, /href="index\.html\?noboot"/);
  assert.match(classic, /id="about"[\s\S]*About me/);
  assert.match(classic, /id="superpowers"[\s\S]*Skills \/ tech superpowers/);
  assert.match(classic, /id="work"[\s\S]*Projects &amp; achievements/);
});

test("every local file the pages reference exists", () => {
  for (const [name, page] of [["index", html], ["classic", classic]]) {
    const refs = [...page.matchAll(/(?:src|href)="([^"]+)"/g)].map((m) => m[1].split("?")[0])
      .filter((u) => u && !/^(https?:|mailto:|tel:|#)/.test(u));
    assert.ok(refs.length > 10, name);
    for (const r of refs) assert.ok(existsSync(join(SITE, r)), name + " missing: " + r);
  }
  for (const css of ["os.css", "classic.css"])
    for (const u of [...read(css).matchAll(/url\("([^"]+)"\)/g)].map((m) => m[1])) assert.ok(existsSync(join(SITE, u)), css + " missing: " + u);
  for (const img of [...read("os-data.js").matchAll(/img: "([^"]+)"/g)].map((m) => m[1])) assert.ok(existsSync(join(SITE, img)), "missing screenshot " + img);
});

test("no leftover placeholders or inline scripts", () => {
  for (const page of [html, classic]) {
    assert.doesNotMatch(page, /TODO|lorem ipsum|\[PLACEHOLDER|undefined/i);
    assert.doesNotMatch(page, /<script(?![^>]*\bsrc=)[^>]*>/, "all scripts are external files (works under a strict CSP)");
  }
});

test("the AI twin's Naive Bayes model learns and generalises to unseen questions", () => {
  const win = {};
  new Function("window", read("twin-data.js"))(win);
  new Function("window", read("twin-model.js"))(win);
  const m = win.TwinModel, model = m.train();
  assert.ok(model.nDocs >= 200, "trained on 200+ examples");
  const heldOut = {
    "what's your tech superpower?": "superpower", "tell me about your instagram": "teknoa",
    "are you chatgpt": "model", "which college do you go to": "study", "do you know python": "skills",
    "is that really your voice": "voice", "who are you": "about", "kya haal hai": "hindi",
    "how did you build this website": "aws", "where can I follow you": "contact",
    "do you make whatsapp bots": "agents", "what does your agency do": "vaslix",
    "tell me about launchos": "launchos", "which ecommerce sites did you build": "stores",
    "what's your email": "contact", "show me your github": "github", "hello!": "greet",
  };
  let right = 0;
  for (const [q, want] of Object.entries(heldOut)) if (m.classify(q).ranked[0].intent === want) right++;
  const acc = right / Object.keys(heldOut).length;
  assert.ok(acc >= 0.85, "held-out accuracy " + acc.toFixed(2));
  assert.ok(m.classify("purple elephant weather tomorrow").unsure, "gibberish is not answered confidently");
  assert.equal(m.classify("x").ranked.length >= 3, true, "top-3 confidence is available");
});

test("theme: her tasmiya_os look (paper, ink, pastel, pixel world) and fonts", () => {
  const css = read("os.css");
  assert.match(css, /--paper:#FFF9E9/i); assert.match(css, /--ink:#172631/i);
  assert.match(css, /--teal:#2C9AA6/i); assert.match(css, /--gold:#F4CE6F/i);
  assert.match(css, /Space Grotesk/); assert.match(css, /DM Mono/);
  assert.match(css, /pixel-world\.png/);
  assert.match(html, /id="clock"/, "menubar clock");
});

test("full name appears in title, desktop and About", () => {
  assert.match(html, /<title>Tasmiya Siddiqui/);
  assert.match(html, /<h1 id="hello-name">Tasmiya Siddiqui<\/h1>/);
  assert.match(html, /Hi, I’m Tasmiya Siddiqui\./);
  assert.match(classic, /<footer[\s\S]*Tasmiya Siddiqui/);
});

test("boot screen is short and skippable with ?noboot", () => {
  assert.match(html, /TasmiyaOS booting…/);
  assert.match(read("boot.js"), /noboot/);
  assert.match(read("os.js"), /setTimeout\(finish, (1\d{3}|2[0-4]\d{2})\)/, "auto-finishes in under 2.5 s");
});
