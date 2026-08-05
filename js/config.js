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
  roostRest: {
    roundSeconds: 75,        // time until sunrise
    batCount: 5,             // sleepy bats to hang up
    spotCount: 7,            // roost spots on the ceiling
    flySpeed: 9,             // drift speed of a flying bat, design units/s scale
    flyWander: 0.5,          // direction change, 0..1
    grabRadius: 70,          // how close a finger must be to pick a bat up
    snapRadius: 110,         // how close a drop must be to a spot to roost
    dawnWarnSeconds: 12,     // the sky starts to turn this early
    zzzDelaySeconds: 2,      // a roosted bat starts snoring after this
    batSize: 30
  },
  mothChase: {
    batSpeed: 620,           // how fast the bat follows the thumb, design units/s
    mothSpeed: 90,           // moth drift
    mothSpawnSeconds: 0.9,   // one new moth this often
    maxMoths: 7,
    owlAfterSeconds: 12,     // the owl arrives once the night is under way
    owlSpeed: 150,           // slower than the bat, but it never stops
    owlTurn: 1.5,            // how sharply the owl corrects, higher = harder
    owlGraceSeconds: 2.2,    // invulnerable after a hit
    catchRadius: 40,
    owlRadius: 52,
    lives: 3,
    batSize: 30
  },
  motion: {
    pauseOffscreen: true     // pause character motion when its section is not visible
  }
};
