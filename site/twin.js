/* tasmiya.ai — the AI twin app: chat UI over the in-browser Naive Bayes model (twin-model.js).
   Top-3 confidence under every answer, "wrong? teach me" retraining, 🔊 voice clone, 🎬 reel mode, easter egg — and answers come with rich cards. */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var M = window.TwinModel, DATA = M.data, model = M.train();
  var win = $("#win-twin"), log = $("#log"), form = $("#twin-form"), input = $("#twin-input"), chipsEl = $("#chips"), voice = $("#voice"), voiceBtn = $("#voice-btn");
  var greeted = false, showBrain = true, history = [], hIdx = -1, lastQA = null;
  var st = $("#model-status"); if (st) st.textContent = "online · trained on " + model.nDocs + " examples in your browser";
  function toast(m) { if (window.OS) window.OS.toast(m); }

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function scrollLog() { log.scrollTop = log.scrollHeight; }
  function add(cls, html) { var d = document.createElement("div"); d.className = "msg " + cls; d.innerHTML = html; log.appendChild(d); scrollLog(); $$("img", d).forEach(function (i) { i.addEventListener("load", scrollLog, { once: true }); }); return d; }
  function pick(arr) { return arr[(Math.random() * arr.length) | 0]; }

  function greet() {
    if (greeted) return; greeted = true;
    add("msg--sys", "model loaded · multinomial Naive Bayes · " + model.nDocs + " examples · " + model.nVocab + " words · 0 servers");
    add("msg--bot", "Hi, I’m <b>Tasmiya’s AI twin</b> 👋 Ask me anything about her — answers come with cards you can tap. Type <b>help</b> for commands, or tap 🔊 to hear her cloned voice.");
    renderChips();
  }
  win.addEventListener("os:open", greet);

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
    return '<div class="brain" aria-label="How the model decided — top 3 guesses"><p class="brain__toks">🧠 words I know: ' + toks + "</p>" + rows + "</div>";
  }
  function animateBars(el) { requestAnimationFrame(function () { requestAnimationFrame(function () { $$(".brain__bar i", el).forEach(function (i) { i.style.width = i.getAttribute("data-w"); }); }); }); }

  function answer(q, intent, r, note) {
    var it = DATA.intents[intent];
    var html = (note ? '<span class="small muted">' + note + "</span><br>" : "") + pick(it.answers);
    html += window.TwinCards ? window.TwinCards.cardFor(intent) : "";
    if (showBrain && r) html += brainHTML(r);
    html += '<div class="msg__tools"><button type="button" class="mini" data-act="reel">🎬 make it a reel</button>' + (r ? '<button type="button" class="mini" data-act="teach">🤔 wrong? teach me</button>' : "") + "</div>";
    var el = add("msg--bot", html); animateBars(el);
    el.querySelector('[data-act="reel"]').addEventListener("click", function () { playReel(q, intent); });
    var tb = el.querySelector('[data-act="teach"]'); if (tb) tb.addEventListener("click", function () { teach(q, el, tb); });
    return el;
  }
  function teach(q, el, btn) {
    btn.disabled = true; btn.textContent = "pick the right topic:";
    var box = document.createElement("div"); box.className = "teach";
    model.intents.forEach(function (k) {
      var b = document.createElement("button"); b.type = "button"; b.className = "mini"; b.textContent = DATA.intents[k].label;
      b.addEventListener("click", function () {
        DATA.intents[k].examples.push(q); var before = model.nDocs; model = M.train();
        box.remove(); btn.textContent = "✓ learned";
        add("msg--sys", "retrained · " + before + " → " + model.nDocs + " examples · you just did supervised learning 🎓 (only in your browser)");
        toast("Model retrained — thanks, teacher! 🎓");
        answer(q, k, M.classify(q), "Got it — next time I’ll know.");
      });
      box.appendChild(b);
    });
    el.appendChild(box); scrollLog();
  }
  var COMMANDS = {
    help: function () { add("msg--bot msg--term", "commands:\n  help      this list\n  whoami    who am I?\n  ls        list projects\n  reel      turn my last answer into a reel\n  voice     hear my AI voice clone\n  brain     show/hide how I decide\n  model     model stats\n  clear     clear the chat\n\nor just ask a question in plain English.\npsst: there’s 1 hidden command. it needs admin rights 😉"); },
    whoami: function () { add("msg--bot msg--term", "visitor@tasmiya.ai — a curious human (98% confident).\nme: Tasmiya’s AI twin, a Naive Bayes model living in this tab."); },
    ls: function () { add("msg--bot", "Here’s a peek — tap any one for a quick look:" + window.TwinCards.gallery(["launchos", "aether", "kusho"])); },
    clear: function () { log.innerHTML = ""; add("msg--sys", "chat cleared · model still trained on " + model.nDocs + " examples"); },
    brain: function () { showBrain = !showBrain; add("msg--sys", "brain view " + (showBrain ? "on" : "off")); },
    model: function () { add("msg--bot msg--term", "algorithm: multinomial Naive Bayes\nintents:   " + model.intents.length + "\nexamples:  " + model.nDocs + "\nvocab:     " + model.nVocab + " words\ntraining:  in your browser, on page load\nserver:    none · API keys: none"); },
    voice: function () { playVoice(); },
    reel: function () { if (lastQA) playReel(lastQA.q, lastQA.intent); else playReel("Who is Tasmiya?", "superpower"); }
  };
  function ask(raw) {
    var q = String(raw || "").trim(); if (!q) return;
    greet(); history.push(q); hIdx = history.length;
    add("msg--me", esc(q));
    var cmd = q.toLowerCase().replace(/^[\/>$]\s*/, "");
    if (/^sudo\b/.test(cmd)) { if (window.OS) window.OS.secret(); else secret(); return; }
    if (/(make|turn).*(reel)/.test(cmd) && lastQA) { playReel(lastQA.q, lastQA.intent); return; }
    if (COMMANDS[cmd]) { COMMANDS[cmd](); return; }
    var typing = add("msg--bot", '<span class="typing" aria-label="typing"><i></i><i></i><i></i></span>');
    setTimeout(function () {
      typing.remove();
      var r = M.classify(q), top = r.ranked[0];
      if (r.unsure || top.p < 0.3 || (r.shaky && top.p < 0.6)) {
        var g = r.ranked.slice(0, 2);
        var el = add("msg--bot", "Hmm, I’m not sure about that one" + (r.known.length ? " (only " + Math.round(top.p * 100) + "% confident)" : " — I don’t know those words yet") + ". Did you mean…" + (showBrain && r.known.length ? brainHTML(r) : "") + '<div class="msg__tools"></div>');
        animateBars(el);
        var tools = el.querySelector(".msg__tools");
        g.forEach(function (x) { var b = document.createElement("button"); b.type = "button"; b.className = "mini"; b.textContent = DATA.intents[x.intent].label; b.addEventListener("click", function () { DATA.intents[x.intent].examples.push(q); model = M.train(); add("msg--sys", "learned “" + esc(q.slice(0, 40)) + "” → " + DATA.intents[x.intent].label + " · " + model.nDocs + " examples"); answer(q, x.intent, M.classify(q)); lastQA = { q: q, intent: x.intent }; }); tools.appendChild(b); });
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
  log.addEventListener("click", function (e) { var b = e.target.closest('[data-twin="voice"]'); if (b) playVoice(); });

  /* voice clone */
  function playVoice() {
    if (!voice) return;
    if (!voice.paused) { voice.pause(); voice.currentTime = 0; return; }
    var p = voice.play(); if (p && p.catch) p.catch(function () { toast("Couldn’t play audio here — try again 🔊"); });
    add("msg--sys", "🔊 playing: AI clone of Tasmiya’s voice");
  }
  voiceBtn.addEventListener("click", playVoice);
  voice.addEventListener("play", function () { voiceBtn.classList.add("is-playing"); voiceBtn.setAttribute("aria-label", "Stop my AI voice clone"); });
  ["pause", "ended"].forEach(function (ev) { voice.addEventListener(ev, function () { voiceBtn.classList.remove("is-playing"); voiceBtn.setAttribute("aria-label", "Play my AI voice clone saying hi"); }); });
  win.addEventListener("os:close", function () { if (!voice.paused) voice.pause(); });
  $("#reel-btn").addEventListener("click", function () { COMMANDS.reel(); });

  /* reel mode: any answer becomes a 9:16 TEKNOA-style reel */
  var reelEl = $("#reel"), cap = $("#reel-caption"), hook = $("#reel-hook"), bar = $("#reel-progress"), full = $("#reel-full"), reelTimer = 0, reelLast = null, reelOpener = null;
  var HOT = /^(ai|tasmiya|teknoa|gharleads|aws|superpower|voice|python|naive|bayes|reel|reels|hindi|zero|machine|model|vaslix|agents)$/i;
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
        if (performance.now() - t0 > i * per) step();
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
    if (e.key === "Escape") { closeReel(); e.stopPropagation(); return; }
    if (e.key !== "Tab") return;
    var f = [$("#reel-replay"), $("#reel-close")];
    if (e.shiftKey && document.activeElement === f[0]) { f[1].focus(); e.preventDefault(); }
    else if (!e.shiftKey && document.activeElement === f[1]) { f[0].focus(); e.preventDefault(); }
  });

  /* easter egg: sudo (or the Konami code) */
  function secret() {
    if (window.OS) window.OS.open("twin");
    greet();
    add("msg--bot", "🔓 <b>Permission granted, admin.</b> You found the hidden command!<br>Secret: this whole twin is " + model.nDocs + " example sentences and a bit of probability — it costs ₹0 to run and lives entirely in your tab. Look at the little robot — it’s dancing 🕺<br><span class=\"small muted\">Tell Tasmiya you found it: DM <a href=\"https://www.instagram.com/tek_noa/\" target=\"_blank\" rel=\"noopener\">@tek_noa</a> the word SUDO.</span>");
  }
  if (window.OS) window.OS.onSecret(secret);

  /* the robot's hint text changes once, after a while (it never auto-opens the chat) */
  setTimeout(function () { var t = $(".psst__txt"); if (t && !greeted) t.textContent = "psst — my AI twin is awake"; }, 15000);

  window.Twin = { ask: function (q) { ask(q); }, classify: M.classify };
})();
