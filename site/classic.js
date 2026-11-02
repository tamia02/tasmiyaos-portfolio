(function () {
  "use strict";
    var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var yr = $("#year"); if (yr) yr.textContent = String(new Date().getFullYear());

  /* ---------- menubar clock: Tasmiya's local time (IST) ---------- */
  (function clock() {
    var el = $("#clock-t"); if (!el) return;
    function tick() {
      try { el.textContent = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Kolkata" }).format(new Date()); }
      catch (e) { var d = new Date(Date.now() + (330 + new Date().getTimezoneOffset()) * 60000); el.textContent = ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2); }
    }
    tick(); setInterval(tick, 15000);
  })();

  /* ---------- scroll reveal ---------- */
  var reveals = $$(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  } else { reveals.forEach(function (el) { el.classList.add("is-in"); }); }

  /* ---------- hero: a small neural network that "thinks" ---------- */
  var overdrive = 0;
  (function net() {
    var c = $("#net"); if (!c || !c.getContext) return;
    var ctx = c.getContext("2d"), W = 0, H = 0, dpr = 1, nodes = [], edges = [], pulses = [], mouse = null, visible = true, raf = 0;
    function build() {
      var r = c.getBoundingClientRect(); dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = r.width; H = r.height; c.width = W * dpr; c.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      nodes = []; edges = []; pulses = [];
      var layers = W < 700 ? [3, 4, 5, 4, 3] : [4, 6, 7, 8, 7, 6, 4];
      var x0 = W * 0.04, x1 = W * 0.96;
      layers.forEach(function (n, li) {
        var x = x0 + (x1 - x0) * (li / (layers.length - 1));
        for (var i = 0; i < n; i++) nodes.push({ x: x, y: H * 0.14 + (H * 0.72) * ((i + 0.5) / n), l: li, a: 0 });
      });
      nodes.forEach(function (a, i) { nodes.forEach(function (b, j) { if (b.l === a.l + 1) edges.push([i, j]); }); });
    }
    function spawn() { var e = edges[(Math.random() * edges.length) | 0]; if (e) pulses.push({ e: e, t: 0, s: 0.008 + Math.random() * 0.012 }); }
    var RGB = "44,154,166";
    function readTheme() { RGB = (getComputedStyle(document.documentElement).getPropertyValue("--ac-rgb") || "44,154,166").replace(/\s/g, ""); }
    readTheme();
    function draw() {
      ctx.clearRect(0, 0, W, H);
      ctx.lineWidth = 1;
      edges.forEach(function (e) { var a = nodes[e[0]], b = nodes[e[1]]; ctx.strokeStyle = "rgba(23,38,49,0.10)"; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); });
      var rate = overdrive > 0 ? 0.9 : 0.25; if (Math.random() < rate) spawn(); if (overdrive > 0) overdrive--;
      pulses = pulses.filter(function (p) {
        p.t += p.s * (overdrive > 0 ? 2.2 : 1); var a = nodes[p.e[0]], b = nodes[p.e[1]];
        var x = a.x + (b.x - a.x) * p.t, y = a.y + (b.y - a.y) * p.t;
        ctx.strokeStyle = "rgba(" + RGB + ",0.45)"; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(x, y); ctx.stroke();
        ctx.fillStyle = "rgb(" + RGB + ")"; ctx.fillRect(Math.round(x) - 2, Math.round(y) - 2, 4, 4);
        if (p.t >= 1) { b.a = 1; return false; } return true;
      });
      nodes.forEach(function (n) {
        if (mouse) { var d = Math.hypot(n.x - mouse.x, n.y - mouse.y); if (d < 90) n.a = Math.max(n.a, 1 - d / 90); }
        var sz = Math.round(7 + n.a * 4), nx = Math.round(n.x - sz / 2), ny = Math.round(n.y - sz / 2);
        ctx.fillStyle = "rgba(255,249,233," + (0.55 + n.a * 0.4) + ")"; ctx.fillRect(nx, ny, sz, sz);
        ctx.fillStyle = "rgba(" + RGB + "," + (0.12 + n.a * 0.85) + ")"; ctx.fillRect(nx, ny, sz, sz);
        ctx.strokeStyle = "rgba(23,38,49,0.35)"; ctx.strokeRect(nx + 0.5, ny + 0.5, sz - 1, sz - 1); n.a *= 0.96;
      });
    }
    function loop() { draw(); raf = visible ? requestAnimationFrame(loop) : 0; }
    build(); window.addEventListener("resize", function () { build(); if (reduceMotion) draw(); });
    c.parentElement.addEventListener("pointermove", function (e) { var r = c.getBoundingClientRect(); mouse = { x: e.clientX - r.left, y: e.clientY - r.top }; });
    c.parentElement.addEventListener("pointerleave", function () { mouse = null; });
    if (reduceMotion) { for (var k = 0; k < 40; k++) spawn(); draw(); return; }
    if ("IntersectionObserver" in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible && !raf) loop(); }).observe(c);
    loop();
  })();

  /* ---------- the model: multinomial Naive Bayes, trained in the browser ---------- */
  var DATA = window.TWIN_DATA || { intents: {}, suggestions: [] };
  var STOP = { "a":1,"an":1,"the":1,"is":1,"am":1,"to":1,"of":1,"in":1,"on":1,"me":1,"my":1,"i":1,"it":1,"this":1,"that":1,"and":1,"or":1,"for":1,"please":1,"can":1,"tell":1,"do":1,"does":1,"some":1,"any":1,"really":1 };
  function tokens(text) {
    return String(text).toLowerCase().replace(/[’']/g, "").replace(/[^a-z0-9_\u0900-\u097f]+/g, " ").trim().split(/\s+/)
      .filter(function (w) { return w && !STOP[w]; })
      .map(function (w) { return w.length > 3 && /s$/.test(w) && !/(ss|us|is)$/.test(w) ? w.slice(0, -1) : w; });
  }
  var model = null, TEMP = 0.8, ALPHA = 0.1;
  var WEAK = { "what":1,"whats":1,"your":1,"you":1,"who":1,"how":1,"are":1,"which":1,"where":1,"did":1,"have":1,"about":1,"know":1,"make":1,"want":1,"did":1,"many":1,"does":1,"there":1,"tell":1,"show":1 };
  function train() {
    var m = { counts: {}, totals: {}, docs: {}, vocab: {}, nDocs: 0, nVocab: 0, intents: Object.keys(DATA.intents) };
    m.intents.forEach(function (k) {
      var ex = DATA.intents[k].examples; m.counts[k] = {}; m.totals[k] = 0; m.docs[k] = ex.length; m.nDocs += ex.length;
      ex.forEach(function (s) { tokens(s).forEach(function (t) { m.counts[k][t] = (m.counts[k][t] || 0) + 1; m.totals[k]++; m.vocab[t] = 1; }); });
    });
    m.nVocab = Object.keys(m.vocab).length; model = m;
    var st = $("#model-status"); if (st) st.textContent = "online · trained on " + m.nDocs + " examples in your browser";
    return m;
  }
  function classify(text) {
    var m = model || train(), toks = tokens(text), known = toks.filter(function (t) { return m.vocab[t]; });
    var hasStrong = known.some(function (t) { return !WEAK[t]; });
    var scores = m.intents.map(function (k) {
      var s = Math.log(m.docs[k] / m.nDocs);
      known.forEach(function (t) { s += (WEAK[t] && hasStrong ? 0.35 : 1) * Math.log(((m.counts[k][t] || 0) + ALPHA) / (m.totals[k] + ALPHA * m.nVocab)); });
      return { intent: k, s: s };
    });
    var T = TEMP, mx = Math.max.apply(null, scores.map(function (x) { return x.s; })), sum = 0;
    scores.forEach(function (x) { x.p = Math.exp((x.s - mx) / T); sum += x.p; });
    scores.forEach(function (x) { x.p /= sum; });
    scores.sort(function (a, b) { return b.p - a.p; });
    var strong = known.filter(function (t) { return !WEAK[t]; });
    var unknownN = toks.length - known.length;
    var unsure = !known.length || (!strong.length && unknownN > 0);
    var shaky = unknownN > 0 && unknownN >= strong.length;
    return { ranked: scores, toks: toks, known: known, unsure: unsure, shaky: shaky };
  }
  window.__twin = { tokens: tokens, train: train, classify: classify };

  /* ---------- twin UI ---------- */
  var twin = $("#twin"), log = $("#log"), form = $("#twin-form"), input = $("#twin-input"), chipsEl = $("#chips"), psst = $(".psst"), voice = $("#voice"), voiceBtn = $("#voice-btn"), toastEl = $("#toast");
  var openers = $$("[data-open-twin]"), lastFocus = null, greeted = false, showBrain = true, history = [], hIdx = -1;

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function scrollLog() { log.scrollTop = log.scrollHeight; }
  function toast(msg) { toastEl.textContent = msg; toastEl.classList.add("is-on"); clearTimeout(toast.t); toast.t = setTimeout(function () { toastEl.classList.remove("is-on"); }, 2600); }
  function add(cls, html) { var d = document.createElement("div"); d.className = "msg " + cls; d.innerHTML = html; log.appendChild(d); scrollLog(); return d; }
  function pick(arr) { return arr[(Math.random() * arr.length) | 0]; }

  function openTwin() {
    if (!twin.hidden) { input.focus(); return; }
    lastFocus = document.activeElement; twin.hidden = false; psst.classList.add("is-hidden");
    openers.forEach(function (b) { b.setAttribute("aria-expanded", "true"); });
    if (!model) train();
    if (!greeted) {
      greeted = true;
      add("msg--sys", "model loaded · multinomial Naive Bayes · " + model.nDocs + " examples · " + model.nVocab + " words · 0 servers");
      add("msg--bot", "Hi, I’m <b>Tasmiya’s AI twin</b> 👋 Ask me anything about her — or type <b>help</b> for commands. Under every answer you’ll see <i>how I decided</i>. Tap 🔊 to hear her cloned voice.");
      renderChips();
    }
    setTimeout(function () { input.focus({ preventScroll: true }); }, 30);
  }
  function closeTwin() {
    twin.hidden = true; psst.classList.remove("is-hidden");
    openers.forEach(function (b) { b.setAttribute("aria-expanded", "false"); });
    if (voice && !voice.paused) voice.pause();
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  openers.forEach(function (b) { b.addEventListener("click", openTwin); });
  $("#twin-close").addEventListener("click", closeTwin);
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { if (!reelEl.hidden) closeReel(); else if (!twin.hidden) closeTwin(); }
  });

  function renderChips() {
    chipsEl.innerHTML = "";
    DATA.suggestions.forEach(function (s) {
      var b = document.createElement("button"); b.type = "button"; b.className = "mini"; b.textContent = s;
      b.addEventListener("click", function () { ask(s); }); chipsEl.appendChild(b);
    });
  }

  function brainHTML(r) {
    var hits = {}; r.known.forEach(function (t) { hits[t] = 1; });
    var toks = r.toks.length ? r.toks.map(function (t) { return '<span class="tok' + (hits[t] ? " tok--hit" : "") + '">' + esc(t) + "</span>"; }).join("") : '<span class="tok">∅</span>';
    var rows = r.ranked.slice(0, 3).map(function (x, i) {
      var pct = Math.round(x.p * 100);
      return '<div class="brain__row' + (i === 0 ? " brain__row--top" : "") + '"><span>' + esc(DATA.intents[x.intent].label) + '</span><span class="brain__bar"><i style="width:0" data-w="' + pct + '%"></i></span><span>' + pct + "%</span></div>";
    }).join("");
    return '<div class="brain" aria-label="How the model decided"><p class="brain__toks">🧠 words I know: ' + toks + "</p>" + rows + "</div>";
  }
  function animateBars(el) { requestAnimationFrame(function () { $$(".brain__bar i", el).forEach(function (i) { i.style.width = i.getAttribute("data-w"); }); }); }

  function answer(q, intent, r, note) {
    var it = DATA.intents[intent];
    var html = (note ? '<span class="small muted">' + note + "</span><br>" : "") + pick(it.answers);
    if (showBrain && r) html += brainHTML(r);
    html += '<div class="msg__tools"><button type="button" class="mini" data-act="reel">🎬 make it a reel</button>' + (r ? '<button type="button" class="mini" data-act="teach">🤔 wrong? teach me</button>' : "") + "</div>";
    var el = add("msg--bot", html); animateBars(el);
    el.querySelector('[data-act="reel"]').addEventListener("click", function () { playReel(q, intent); });
    var tb = el.querySelector('[data-act="teach"]'); if (tb) tb.addEventListener("click", function () { teach(q, el, tb); });
  }

  function teach(q, el, btn) {
    btn.disabled = true; btn.textContent = "pick the right topic:";
    var box = document.createElement("div"); box.className = "teach";
    model.intents.forEach(function (k) {
      var b = document.createElement("button"); b.type = "button"; b.className = "mini"; b.textContent = DATA.intents[k].label;
      b.addEventListener("click", function () {
        DATA.intents[k].examples.push(q); var before = model.nDocs; train();
        box.remove(); btn.textContent = "✓ learned";
        add("msg--sys", "retrained · " + before + " → " + model.nDocs + " examples · you just did supervised learning 🎓 (only in your browser)");
        toast("Model retrained — thanks, teacher! 🎓");
        answer(q, k, classify(q), "Got it — next time I’ll know.");
      });
      box.appendChild(b);
    });
    el.appendChild(box); scrollLog();
  }

  var COMMANDS = {
    help: function () { add("msg--bot msg--term", "commands:\n  help      this list\n  whoami    who am I?\n  ls        list projects\n  reel      turn my last answer into a reel\n  voice     hear my AI voice clone\n  brain     show/hide how I decide\n  model     model stats\n  clear     clear the chat\n\nor just ask a question in plain English.\npsst: there’s 1 hidden command. it needs admin rights 😉"); },
    whoami: function () { add("msg--bot msg--term", "visitor@tasmiya.ai — a curious human (98% confident).\nme: Tasmiya’s AI twin, a Naive Bayes model living in this tab."); },
    ls: function () { add("msg--bot msg--term", "projects/\n  teknoa/        AI-news reels · Instagram + YouTube\n  gharleads/     lead app for brokers · Hindi tutorials\n  tasmiya.ai/    you are here"); },
    clear: function () { log.innerHTML = ""; add("msg--sys", "chat cleared · model still trained on " + model.nDocs + " examples"); },
    brain: function () { showBrain = !showBrain; add("msg--sys", "brain view " + (showBrain ? "on" : "off")); },
    model: function () { add("msg--bot msg--term", "algorithm: multinomial Naive Bayes\nintents:   " + model.intents.length + "\nexamples:  " + model.nDocs + "\nvocab:     " + model.nVocab + " words\ntraining:  in your browser, on page load\nserver:    none · API keys: none"); },
    voice: function () { playVoice(); },
    reel: function () { if (lastQA) playReel(lastQA.q, lastQA.intent); else playReel("Who is Tasmiya?", "superpower"); }
  };
  var lastQA = null;

  function ask(raw) {
    var q = String(raw || "").trim(); if (!q) return;
    history.push(q); hIdx = history.length;
    add("msg--me", esc(q));
    var cmd = q.toLowerCase().replace(/^[\/>$]\s*/, "");
    if (/^sudo\b/.test(cmd)) { secret(); return; }
    if (/(make|turn).*(reel)/.test(cmd) && lastQA) { playReel(lastQA.q, lastQA.intent); return; }
    if (COMMANDS[cmd]) { COMMANDS[cmd](); return; }
    var typing = add("msg--bot", '<span class="typing" aria-label="typing"><i></i><i></i><i></i></span>');
    setTimeout(function () {
      typing.remove();
      var r = classify(q), top = r.ranked[0];
      if (r.unsure || top.p < 0.3 || (r.shaky && top.p < 0.6)) {
        var g = r.ranked.slice(0, 2);
        var el = add("msg--bot", "Hmm, I’m not sure about that one" + (r.known.length ? " (only " + Math.round(top.p * 100) + "% confident)" : " — I don’t know those words yet") + ". Did you mean…" + (showBrain && r.known.length ? brainHTML(r) : "") + '<div class="msg__tools"></div>');
        animateBars(el);
        var tools = el.querySelector(".msg__tools");
        g.forEach(function (x) { var b = document.createElement("button"); b.type = "button"; b.className = "mini"; b.textContent = DATA.intents[x.intent].label; b.addEventListener("click", function () { DATA.intents[x.intent].examples.push(q); train(); add("msg--sys", "learned “" + q.slice(0, 40) + "” → " + DATA.intents[x.intent].label + " · " + model.nDocs + " examples"); answer(q, x.intent, classify(q)); lastQA = { q: q, intent: x.intent }; }); tools.appendChild(b); });
        var tb = document.createElement("button"); tb.type = "button"; tb.className = "mini"; tb.textContent = "🤔 teach me"; tb.addEventListener("click", function () { teach(q, el, tb); }); tools.appendChild(tb);
        return;
      }
      lastQA = { q: q, intent: top.intent };
      answer(q, top.intent, r);
    }, reduceMotion ? 50 : 380 + Math.random() * 300);
  }
  form.addEventListener("submit", function (e) { e.preventDefault(); var v = input.value; input.value = ""; ask(v); });
  input.addEventListener("keydown", function (e) {
    if (e.key === "ArrowUp" && history.length) { hIdx = Math.max(0, hIdx - 1); input.value = history[hIdx]; e.preventDefault(); }
    if (e.key === "ArrowDown" && history.length) { hIdx = Math.min(history.length, hIdx + 1); input.value = history[hIdx] || ""; e.preventDefault(); }
  });

  /* ---------- voice clone ---------- */
  function playVoice() {
    if (!voice) return;
    if (!voice.paused) { voice.pause(); voice.currentTime = 0; return; }
    var p = voice.play();
    if (p && p.catch) p.catch(function () { toast("Couldn’t play audio here — try again 🔊"); });
    add("msg--sys", "🔊 playing: AI clone of Tasmiya’s voice");
  }
  voiceBtn.addEventListener("click", playVoice);
  voice.addEventListener("play", function () { voiceBtn.classList.add("is-playing"); voiceBtn.setAttribute("aria-label", "Stop my AI voice clone"); });
  ["pause", "ended"].forEach(function (ev) { voice.addEventListener(ev, function () { voiceBtn.classList.remove("is-playing"); voiceBtn.setAttribute("aria-label", "Play my AI voice clone saying hi"); }); });

  /* ---------- reel mode: any answer becomes a 9:16 TEKNOA-style reel ---------- */
  var reelEl = $("#reel"), cap = $("#reel-caption"), hook = $("#reel-hook"), bar = $("#reel-progress"), full = $("#reel-full"), reelTimer = 0, reelLast = null, reelOpener = null;
  var HOT = /^(ai|tasmiya|teknoa|gharleads|aws|superpower|voice|python|naive|bayes|reel|reels|hindi|zero|fifty-second|machine|model)$/i;
  function playReel(q, intent) {
    var it = DATA.intents[intent]; if (!it) return;
    reelLast = [q, intent]; if (reelEl.hidden) reelOpener = document.activeElement;
    reelEl.hidden = false; reelEl.classList.remove("is-ended");
    var hq = q.charAt(0).toUpperCase() + q.slice(1); hook.textContent = hq.length > 60 ? hq.slice(0, 57) + "…" : hq;
    full.textContent = it.reel; cap.innerHTML = ""; bar.style.width = "0";
    var words = it.reel.split(/\s+/), i = 0, per = reduceMotion ? 0 : 330, total = words.length * per + 900, t0 = performance.now();
    clearInterval(reelTimer);
    function step() {
      if (i >= words.length) return;
      if (i % 4 === 0) cap.innerHTML = "";
      var w = document.createElement("span"); w.className = "w" + (HOT.test(words[i].replace(/[^\w-]/g, "")) ? " w--hot" : ""); w.textContent = words[i];
      cap.appendChild(w); cap.appendChild(document.createTextNode(" ")); i++;
    }
    if (reduceMotion) { cap.textContent = it.reel; bar.style.width = "100%"; setTimeout(function () { reelEl.classList.add("is-ended"); }, 2500); }
    else {
      step();
      reelTimer = setInterval(function () {
        var p = Math.min(1, (performance.now() - t0) / total); bar.style.width = (p * 100) + "%";
        if (performance.now() - t0 > (i) * per) step();
        if (p >= 1) { clearInterval(reelTimer); reelEl.classList.add("is-ended"); }
      }, 50);
    }
    $("#reel-close").focus({ preventScroll: true });
  }
  function closeReel() { clearInterval(reelTimer); reelEl.hidden = true; if (reelOpener && reelOpener.focus) reelOpener.focus(); }
  $("#reel-close").addEventListener("click", closeReel);
  $("#reel-replay").addEventListener("click", function () { if (reelLast) playReel(reelLast[0], reelLast[1]); });
  reelEl.addEventListener("click", function (e) { if (e.target === reelEl) closeReel(); });
  reelEl.addEventListener("keydown", function (e) {
    if (e.key !== "Tab") return;
    var f = [$("#reel-replay"), $("#reel-close")];
    if (e.shiftKey && document.activeElement === f[0]) { f[1].focus(); e.preventDefault(); }
    else if (!e.shiftKey && document.activeElement === f[1]) { f[0].focus(); e.preventDefault(); }
  });

  /* ---------- easter egg: sudo (or the Konami code) ---------- */
  function sparks() {
    if (reduceMotion) return;
    for (var k = 0; k < 70; k++) {
      var s = document.createElement("i"); s.className = "spark";
      var x = window.innerWidth / 2, y = window.innerHeight / 2, a = Math.random() * 6.283, v = 4 + Math.random() * 9, vx = Math.cos(a) * v, vy = Math.sin(a) * v - 4, life = 0;
      s.style.left = x + "px"; s.style.top = y + "px"; if (k % 3 === 0) s.style.background = "#fff";
      document.body.appendChild(s);
      (function (s, x, y, vx, vy) {
        (function f() { life++; x += vx; y += vy; vy += 0.35; vx *= 0.98; s.style.transform = "translate(" + (x - window.innerWidth / 2) + "px," + (y - window.innerHeight / 2) + "px) rotate(" + life * 12 + "deg)"; s.style.opacity = String(1 - life / 70); if (life < 70) requestAnimationFrame(f); else s.remove(); })();
      })(s, x, y, vx, vy);
    }
  }
  function secret() {
    overdrive = 600; sparks(); toast("⚡ SUPERPOWER UNLOCKED");
    if (twin.hidden) openTwin();
    add("msg--bot", "🔓 <b>Permission granted, admin.</b> You found the hidden command!<br>Secret: this whole twin is " + model.nDocs + " example sentences and a bit of probability — it costs ₹0 to run and lives entirely in your tab. Scroll up: the neural net in the hero is in <b>overdrive</b> now ⚡<br><span class=\"small muted\">Tell Tasmiya you found it: DM <a href=\"https://www.instagram.com/tek_noa/\" target=\"_blank\" rel=\"noopener\">@tek_noa</a> the word SUDO.</span>");
  }
  var KON = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"], kp = 0;
  document.addEventListener("keydown", function (e) {
    if (e.target === input) return;
    kp = (e.key === KON[kp] || e.key.toLowerCase() === KON[kp]) ? kp + 1 : (e.key === KON[0] ? 1 : 0);
    if (kp === KON.length) { kp = 0; secret(); }
  });

  // Gentle nudge: the hint glows; after 12 s it says hi once (never auto-opens the panel)
  setTimeout(function () { if (twin.hidden && !greeted) { psst.querySelector(".psst__txt").textContent = "psst — my AI twin is awake"; } }, 12000);
  train();

  /* ---------- boot screen + typed headline ---------- */
  var typedEl = $("#typed"), typedFull = typedEl ? typedEl.textContent : "";
  function typeHeadline() {
    if (!typedEl || reduceMotion) return;
    var i = 0; typedEl.textContent = "";
    var t = setInterval(function () { i++; typedEl.textContent = typedFull.slice(0, i); if (i >= typedFull.length) clearInterval(t); }, 55);
  }
  (function boot() {
    var el = $("#boot"), root = document.documentElement;
    if (!el || root.classList.contains("booted")) { typeHeadline(); return; }
    var n = $("#boot-n"); if (n && model) n.textContent = String(model.nDocs);
    var lines = $$("#boot-code li"), checks = $$("#boot-checks li"), pct = $("#boot-pct"), done = false, timers = [];
    lines.forEach(function (li, i) { li.style.animationDelay = (i * 0.11) + "s"; });
    el.classList.add("is-run");
    checks.forEach(function (li, i) { timers.push(setTimeout(function () { li.classList.add("ok"); }, 650 + i * 380)); });
    var p = 0, pt = setInterval(function () { p = Math.min(100, p + 7); if (pct) pct.textContent = p + "%"; if (p >= 100) clearInterval(pt); }, 90);
    function finish() {
      if (done) return; done = true; timers.forEach(clearTimeout); clearInterval(pt);
      el.classList.add("is-done"); try { sessionStorage.setItem("tasmiya-booted", "1"); } catch (e) {}
      document.removeEventListener("keydown", finish, true);
      setTimeout(function () { el.hidden = true; }, 500); typeHeadline();
    }
    timers.push(setTimeout(finish, 2700));
    el.addEventListener("click", finish); document.addEventListener("keydown", finish, true);
  })();
})();

/* on phones the robot's speech bubble folds away once you scroll past the hero, so it never sits on top of content */
(function () {
  "use strict";
  var p = document.querySelector(".psst"); if (!p) return;
  var on = false;
  function check() { var m = window.scrollY > window.innerHeight * 0.6; if (m !== on) { on = m; p.classList.toggle("is-mini", m); } }
  window.addEventListener("scroll", check, { passive: true }); check();
})();
