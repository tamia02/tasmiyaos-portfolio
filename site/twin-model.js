/* tasmiya.ai — the AI twin's brain: a multinomial Naive Bayes intent model trained in the visitor's browser on page load.
   No server, no API key. Data lives in twin-data.js. Exposes window.TwinModel = { train, classify, tokens, get }. */
(function (window) {
  "use strict";
  var $ = function () { return null; };
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
  
  window.TwinModel = { tokens: tokens, train: train, classify: classify, get: function () { return model || train(); }, data: DATA };
})(window);
