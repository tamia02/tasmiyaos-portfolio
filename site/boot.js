/* Runs before first paint: marks JS as available and decides whether the boot screen plays (once per visit; ?noboot skips it). */
(function () {
  var d = document.documentElement, c = "js";
  try {
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || sessionStorage.getItem("tasmiyaos-booted") || /[?&]noboot/.test(location.search)) c += " booted";
  } catch (e) { c += " booted"; }
  d.className += (d.className ? " " : "") + c;
})();
