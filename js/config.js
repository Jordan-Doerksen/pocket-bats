/* config.js — every tunable value on this site. Logic files read it and never write it. */

window.POCKET_BATS_CONFIG = {
  echoPing: {
    roundSeconds: 45,        // length of one round
    mothCount: 5,            // moths alive at once
    mothSpeed: 14,           // px per second, at the 1000-unit design height
    mothWander: 0.55,        // how much a moth changes direction, 0..1
    pingCooldownMs: 900,     // wait between calls
    pingSpeed: 900,          // ripple travel, design units per second
    pingMaxRadius: 1400,     // ripple stops here
    revealSeconds: 1.6,      // how long a moth stays visible after the ripple touches it
    revealFadeSeconds: 0.9,  // the tail of that fade
    catchRadius: 46,         // finger-forgiveness around a moth, design units
    batSize: 34,             // the player bat glyph
    starCount: 22,           // faint stars inside the canvas
    hitFlashMs: 260,
    missFlashMs: 200
  },
  motion: {
    pauseOffscreen: true     // pause character motion when its section is not visible
  }
};
