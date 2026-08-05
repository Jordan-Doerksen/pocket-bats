/* site.js — small progressive enhancements. Content never depends on this file. */

(function () {
  "use strict";
  var cfg = window.POCKET_BATS_CONFIG && window.POCKET_BATS_CONFIG.motion;

  /* Pause the hero bat's wing flap when its section leaves the viewport,
     so no motion runs where nobody is looking. */
  if (cfg && cfg.pauseOffscreen && "IntersectionObserver" in window) {
    var hero = document.getElementById("promise");
    if (hero) {
      new IntersectionObserver(function (entries) {
        document.body.classList.toggle("motion-paused", !entries[0].isIntersecting);
      }, { threshold: 0.1 }).observe(hero);
    }
  }

  /* Smooth in-page scroll for the cue links, motion-permitting. */
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!reduced) document.documentElement.style.scrollBehavior = "smooth";
})();
