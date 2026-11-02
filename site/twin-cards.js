/* tasmiya.ai answer cards — the AI twin answers with rich cards (projects, skills, contact…), not just text.
   Pure functions over OS_DATA: TwinCards.cardFor(intent) → HTML string ("" when the answer needs no card). Unit-tested. */
(function (root) {
  "use strict";
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  var AR = " ↗";
  function D() { return root.OS_DATA || { projects: [], skills: [], repos: [], contact: [] }; }
  function proj(id) { var p = D().projects.filter(function (x) { return x.id === id; })[0]; return p; }
  function projectCard(id) {
    var p = proj(id); if (!p) return "";
    return '<div class="card card--project" data-card="project">' +
      '<button class="card__shot" type="button" data-project="' + p.id + '" aria-label="Preview ' + esc(p.t) + '"><img src="' + p.img + '" alt="' + esc(p.t) + ' website screenshot" loading="lazy"></button>' +
      '<div class="card__b"><b>' + esc(p.t) + '</b><p>' + esc(p.d) + '</p><ul class="chips">' + p.tags.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + '</ul>' +
      '<div class="card__row"><a class="btn btn--dark" href="' + p.url + '" target="_blank" rel="noopener">Visit' + AR + '</a><button class="btn btn--light" type="button" data-project="' + p.id + '">Quick look</button></div></div></div>';
  }
  function gallery(ids, foot) {
    var ps = ids.map(proj).filter(Boolean);
    return '<div class="card card--gal" data-card="gallery">' + ps.map(function (p) {
      return '<button type="button" data-project="' + p.id + '"><img src="' + p.img + '" alt="" loading="lazy"><span>' + esc(p.t) + "</span></button>";
    }).join("") + '<div class="card__foot"><button class="btn btn--dark" type="button" data-open="projects">' + esc(foot || "Open all " + D().projects.length + " projects") + "</button></div></div>";
  }
  function skillsCard() {
    return '<div class="card" data-card="skills"><div class="card__skills">' + D().skills.map(function (s) {
      return "<div>" + s.e + " " + esc(s.t) + ' <ul class="chips">' + s.chips.map(function (c) { return "<li>" + esc(c) + "</li>"; }).join("") + "</ul></div>";
    }).join("") + '</div><div class="card__b"><button class="btn btn--light" type="button" data-open="skills">Open Skills</button></div></div>';
  }
  function contactCard() {
    return '<div class="card" data-card="contact"><div class="card__b"><b>Let’s build something ✉️</b><div class="card__row">' + D().contact.map(function (c) {
      var ext = /^https?:/.test(c.url);
      return '<a class="btn ' + (c.main ? "btn--dark" : "btn--light") + '" href="' + c.url + '"' + (ext ? ' target="_blank" rel="noopener"' : "") + ">" + esc(c.t) + (ext ? AR : "") + "</a>";
    }).join("") + "</div></div></div>";
  }
  function repoCard() {
    return '<div class="card" data-card="github"><div class="card__repos">' + D().repos.map(function (r) {
      return '<a href="https://github.com/tamia02/' + r.n + '" target="_blank" rel="noopener"><span>' + esc(r.n) + "</span><span>" + esc(r.lang) + "</span></a>";
    }).join("") + '</div><div class="card__b"><a class="btn btn--dark" href="https://github.com/tamia02" target="_blank" rel="noopener">github.com/tamia02' + AR + "</a></div></div>";
  }
  function teknoaCard() {
    return '<div class="card" data-card="teknoa"><div class="card__prof"><img src="assets/teknoa-logo.webp" width="52" height="52" alt="TEKNOA logo" style="border:2px solid #172631;border-radius:12px"><div><b>TEKNOA · @tek_noa</b><p class="small">Daily AI-tool reels · my AI voice clone</p></div></div>' +
      '<div class="card__b"><div class="card__row"><a class="btn btn--dark" href="https://www.instagram.com/tek_noa/" target="_blank" rel="noopener">Instagram' + AR + '</a><a class="btn btn--light" href="https://www.youtube.com/@tek_noa" target="_blank" rel="noopener">YouTube' + AR + "</a></div></div></div>";
  }
  function awsCard() {
    return '<div class="card" data-card="aws"><div class="card__flow"><span>🐙 GitHub</span>→<span>⚙️ Amplify</span>→<span>🌍 CloudFront</span>→<span>💻 you</span></div><div class="card__b"><button class="btn btn--light" type="button" data-open="aws">How it’s deployed</button></div></div>';
  }
  function profileCard() {
    return '<div class="card" data-card="profile"><div class="card__prof"><span class="avatar avatar--sm" aria-hidden="true">T<i></i></span><div><b>Tasmiya Siddiqui</b><p class="small">BTech AI/ML · founder, Vaslix · creator, TEKNOA</p></div></div><div class="card__b"><div class="card__row"><button class="btn btn--dark" type="button" data-open="about">About me</button><button class="btn btn--light" type="button" data-open="projects">Projects</button></div></div></div>';
  }
  function voiceCard() {
    return '<div class="card" data-card="voice"><div class="card__b"><b>🔊 Hear my AI voice clone</b><p>17 seconds, cloned from my real voice.</p><button class="btn btn--dark" type="button" data-twin="voice">▶ Play</button></div></div>';
  }
  var MAP = {
    about: profileCard, greet: null, study: profileCard,
    vaslix: function () { return gallery(["launchos", "aether", "kusho"]); },
    projects: function () { return gallery(["launchos", "softwarehub", "aandre"]); },
    achievements: function () { return gallery(["inquiryboost", "aarc", "laptophouse"]); },
    launchos: function () { return projectCard("launchos"); },
    stores: function () { return gallery(["kusho", "aandre", "laptophouse"], "See all storefronts"); },
    gharleads: function () { return projectCard("gharleads"); },
    agents: function () { return gallery(["aether", "inquiryboost", "aarc"], "See all projects"); },
    skills: skillsCard, superpower: skillsCard,
    github: repoCard, teknoa: teknoaCard, aws: awsCard, contact: contactCard, voice: voiceCard
  };
  function cardFor(intent) { var f = MAP[intent]; return f ? f() : ""; }
  root.TwinCards = { cardFor: cardFor, projectCard: projectCard, gallery: gallery, intents: Object.keys(MAP) };
})(typeof window !== "undefined" ? window : globalThis);
