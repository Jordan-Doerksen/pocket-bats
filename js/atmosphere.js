/* atmosphere.js — one responsibility: the sky depth, the scroll settle, and the
   roosting bats. Everything here is decoration. If this file never runs, the page
   is complete: layers and bats are injected here, and .reveal is added here too. */

(function () {
  "use strict";
  if (!window.POCKET_BATS_CONFIG) return;
  var CFG = window.POCKET_BATS_CONFIG.atmosphere;
  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- sky layers (behind .stars, which site.css already owns) ---- */
  var glow = document.createElement("div");
  glow.className = "sky-glow";
  var far = document.createElement("div");
  far.className = "sky-far";
  var moon = document.createElement("div");
  moon.className = "moon-disc";
  glow.setAttribute("aria-hidden", "true");
  far.setAttribute("aria-hidden", "true");
  moon.setAttribute("aria-hidden", "true");
  document.body.insertBefore(glow, document.body.firstChild);
  document.body.insertBefore(far, glow.nextSibling);
  document.body.insertBefore(moon, far.nextSibling);

  /* ---- parallax: moves only while the reader scrolls ---- */
  if (!reducedMotion) {
    var ticking = false;
    var onScroll = function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var y = window.scrollY;
        far.style.transform = "translateY(" + (y * CFG.parallaxFar).toFixed(1) + "px)";
        glow.style.transform = "translateY(" + (y * CFG.parallaxGlow).toFixed(1) + "px)";
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---- scroll settle: each section's children rise into place once ---- */
  var revealed = [];
  document.querySelectorAll("main section, footer").forEach(function (sec) {
    var children = Array.prototype.slice.call(sec.children);
    children.forEach(function (el, i) {
      if (el.classList.contains("game-frame")) return; // the canvas never shifts
      el.classList.add("reveal");
      el.style.setProperty("--reveal-shift", CFG.revealShift + "px");
      el.style.setProperty("--reveal-delay", Math.min(i, 4) * CFG.revealStaggerMs + "ms");
      revealed.push(el);
    });
  });
  var seen = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) {
        en.target.classList.add("in");
        seen.unobserve(en.target);
      }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
  revealed.forEach(function (el) { seen.observe(el); });

  /* ---- the roosting bats: fly in once, land on a letter, stay ---- */
  var ROOST_SVG =
    '<svg viewBox="0 0 60 78" aria-hidden="true">' +
    '<path class="r-foot" d="M22 6 L22 14 M38 6 L38 14" fill="none"/>' +
    '<ellipse class="r-wing" cx="30" cy="38" rx="17" ry="24"/>' +
    '<ellipse class="r-body" cx="30" cy="34" rx="12" ry="16"/>' +
    '<path class="r-ear" d="M22 58 L18 70 L27 60 Z"/>' +
    '<path class="r-ear" d="M38 58 L42 70 L33 60 Z"/>' +
    '<circle class="r-eye" cx="25" cy="52" r="1.8"/>' +
    '<circle class="r-eye" cx="35" cy="52" r="1.8"/>' +
    "</svg>";

  CFG.roosters.forEach(function (spec) {
    var heading = document.querySelector(spec.anchor);
    if (!heading) return;
    heading.classList.add("rooster-heading");
    var perch = document.createElement("span");
    perch.className = "rooster";
    perch.style.left = spec.left;
    perch.style.fontSize = spec.size + "px";
    perch.innerHTML = ROOST_SVG;
    heading.appendChild(perch);
    if (reducedMotion) return; // already hanging; the complete static state
    perch.classList.add("waiting");
    var once = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting) return;
      perch.classList.add("arrive");
      once.disconnect();
    }, { threshold: 0.6 });
    once.observe(heading);
  });
})();
