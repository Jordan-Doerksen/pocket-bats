/* roost-rest.js — the Roost & rest game. One responsibility: run the game inside #roost-rest.
   Reads window.POCKET_BATS_CONFIG.roostRest. Drag a bat to the ceiling before sunrise.
   Keyboard complete (space = pick a bat, arrows = pick a spot, enter = hang it). */

(function () {
  "use strict";
  var shell = document.getElementById("roost-rest");
  if (!shell || !window.POCKET_BATS_CONFIG) return;
  var CFG = window.POCKET_BATS_CONFIG.roostRest;
  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var canvas = document.createElement("canvas");
  var ctx = canvas.getContext("2d");
  shell.appendChild(canvas);
  shell.setAttribute("tabindex", "0");
  shell.setAttribute("role", "application");
  shell.setAttribute("aria-label",
    "Roost and rest game. Space picks a bat. Arrow keys pick a roost spot. Enter hangs the bat.");

  var css = getComputedStyle(document.documentElement);
  function tok(name, fallback) {
    var v = css.getPropertyValue(name).trim();
    return v || fallback;
  }
  var C = {
    bg: tok("--night-900", "#0b1026"),
    stone: tok("--night-700", "#1d2650"),
    line: tok("--night-line", "#2a3462"),
    star: tok("--star", "#cdd6f4"),
    moon: tok("--moon", "#f5d99a"),
    moonBright: tok("--moon-bright", "#ffe9b8"),
    echo: tok("--echo", "#9adcf0"),
    dim: tok("--text-dim", "#aab2ce"),
    body: tok("--bat-body", "#3d3554"),
    wing: tok("--bat-wing", "#2c2640"),
    ear: tok("--bat-ear", "#b98695")
  };

  var W = 750, H = 1000, dpr = 1;
  function resize() {
    var r = shell.getBoundingClientRect();
    if (r.width < 10 || r.height < 10) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(r.width * dpr);
    canvas.height = Math.round(r.height * dpr);
    W = 1000 * (r.width / r.height);
    layout();
  }
  function toUnits(px, py) {
    var r = shell.getBoundingClientRect();
    return { x: (px - r.left) / r.height * 1000, y: (py - r.top) / r.height * 1000 };
  }

  var mode = "intro"; // intro | play | done
  var bats = [], spots = [], zzz = [];
  var timeLeft = 0, now = 0, dragged = null;
  var kb = { on: false, bat: 0, spot: 0 };

  function rnd(a, b) { return a + Math.random() * (b - a); }

  function layout() {
    spots = [];
    for (var i = 0; i < CFG.spotCount; i++) {
      var t = (i + 0.5) / CFG.spotCount;
      spots.push({ x: 40 + t * (W - 80), y: 150 + ((i % 2) ? 34 : 0), bat: null });
    }
  }
  function start() {
    mode = "play";
    timeLeft = CFG.roundSeconds;
    dragged = null; zzz = [];
    layout();
    bats = [];
    for (var i = 0; i < CFG.batCount; i++)
      bats.push({ x: rnd(80, W - 80), y: rnd(430, H - 140), a: rnd(0, 6.28), flap: rnd(0, 6.28), state: "fly", spot: null, since: 0 });
  }

  function freeSpots() { return spots.filter(function (s) { return !s.bat; }); }
  function flying() { return bats.filter(function (b) { return b.state === "fly"; }); }

  function roost(bat, spot) {
    if (spot.bat) return false;
    bat.state = "roost"; bat.spot = spot; bat.since = now;
    bat.x = spot.x; bat.y = spot.y;
    spot.bat = bat;
    if (flying().length === 0) mode = "done";
    return true;
  }
  function dropAt(x, y) {
    var best = null, bd = 1e9;
    freeSpots().forEach(function (s) {
      var d = Math.hypot(s.x - x, s.y - y);
      if (d < bd) { bd = d; best = s; }
    });
    if (best && bd < CFG.snapRadius) return roost(dragged, best);
    return false;
  }

  /* ---- input ---- */
  shell.addEventListener("pointerdown", function (e) {
    e.preventDefault();
    shell.focus({ preventScroll: true });
    kb.on = false;
    if (mode !== "play") { start(); return; }
    var u = toUnits(e.clientX, e.clientY);
    var best = null, bd = 1e9;
    flying().forEach(function (b) {
      var d = Math.hypot(b.x - u.x, b.y - u.y);
      if (d < bd) { bd = d; best = b; }
    });
    if (best && bd < CFG.grabRadius) {
      dragged = best; best.state = "drag";
      try { shell.setPointerCapture(e.pointerId); } catch (err) { /* capture is optional */ }
    }
  });
  shell.addEventListener("pointermove", function (e) {
    if (!dragged) return;
    var u = toUnits(e.clientX, e.clientY);
    dragged.x = Math.min(Math.max(u.x, 30), W - 30);
    dragged.y = Math.min(Math.max(u.y, 120), H - 40);
  });
  shell.addEventListener("pointerup", function () {
    if (!dragged) return;
    if (!dropAt(dragged.x, dragged.y)) dragged.state = "fly";
    dragged = null;
  });
  shell.addEventListener("keydown", function (e) {
    if (mode !== "play") {
      if (e.key === " " || e.key === "Enter") { e.preventDefault(); start(); }
      return;
    }
    var fl = flying(), fs = freeSpots();
    switch (e.key) {
      case " ":
        e.preventDefault(); kb.on = true;
        if (fl.length) kb.bat = (kb.bat + 1) % fl.length;
        break;
      case "ArrowLeft": case "ArrowUp":
        e.preventDefault(); kb.on = true;
        if (fs.length) kb.spot = (kb.spot + fs.length - 1) % fs.length;
        break;
      case "ArrowRight": case "ArrowDown":
        e.preventDefault(); kb.on = true;
        if (fs.length) kb.spot = (kb.spot + 1) % fs.length;
        break;
      case "Enter":
        e.preventDefault(); kb.on = true;
        if (fl.length && fs.length) {
          roost(fl[kb.bat % fl.length], fs[kb.spot % fs.length]);
          kb.bat = 0; kb.spot = 0;
        }
        break;
    }
  });

  /* ---- update ---- */
  function update(dt) {
    if (mode !== "play") return;
    timeLeft -= dt;
    if (timeLeft <= 0) { timeLeft = 0; mode = "done"; return; }
    var speed = CFG.flySpeed * (reducedMotion ? 0.5 : 1);
    bats.forEach(function (b) {
      b.flap += dt * (b.state === "fly" ? 10 : 0);
      if (b.state !== "fly") return;
      b.a += rnd(-CFG.flyWander, CFG.flyWander) * dt * 4;
      b.x += Math.cos(b.a) * speed * dt * 6;
      b.y += Math.sin(b.a) * speed * dt * 6;
      if (b.x < 70 || b.x > W - 70) b.a = Math.PI - b.a;
      if (b.y < 420 || b.y > H - 120) b.a = -b.a;
      b.x = Math.min(Math.max(b.x, 70), W - 70);
      b.y = Math.min(Math.max(b.y, 420), H - 120);
    });
    bats.forEach(function (b) {
      if (b.state === "roost" && now - b.since > CFG.zzzDelaySeconds && Math.random() < dt * 0.5)
        zzz.push({ x: b.x + 18, y: b.y + 30, t: now });
    });
    zzz = zzz.filter(function (z) { return now - z.t < 2.2; });
  }

  /* ---- draw ---- */
  function dawn() { return Math.max(0, 1 - timeLeft / CFG.dawnWarnSeconds); }

  function drawBat(b) {
    var up = b.state === "roost";
    ctx.save();
    ctx.translate(b.x, b.y);
    if (up) ctx.rotate(Math.PI);
    var s = CFG.batSize / 30;
    ctx.scale(s, s);
    if (up) {
      ctx.fillStyle = C.wing;
      ctx.beginPath(); ctx.ellipse(0, 6, 20, 26, 0, 0, 7); ctx.fill();
    } else {
      var f = Math.sin(b.flap) * (reducedMotion ? 4 : 12);
      ctx.fillStyle = C.wing;
      ctx.beginPath();
      ctx.moveTo(-6, 0); ctx.quadraticCurveTo(-34, -14 - f, -52, -4 - f);
      ctx.quadraticCurveTo(-34, 8 - f * 0.4, -8, 10); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(6, 0); ctx.quadraticCurveTo(34, -14 - f, 52, -4 - f);
      ctx.quadraticCurveTo(34, 8 - f * 0.4, 8, 10); ctx.fill();
    }
    ctx.fillStyle = C.body;
    ctx.beginPath(); ctx.ellipse(0, 0, 16, 15, 0, 0, 7); ctx.fill();
    ctx.fillStyle = C.ear;
    ctx.beginPath(); ctx.moveTo(-9, -11); ctx.lineTo(-6, -22); ctx.lineTo(-2, -12); ctx.fill();
    ctx.beginPath(); ctx.moveTo(9, -11); ctx.lineTo(6, -22); ctx.lineTo(2, -12); ctx.fill();
    if (!up) {
      ctx.fillStyle = C.moonBright;
      ctx.beginPath(); ctx.arc(-5, -3, 1.6, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.arc(5, -3, 1.6, 0, 7); ctx.fill();
    }
    ctx.restore();
  }

  function draw() {
    var s = canvas.height / 1000;
    ctx.setTransform(s, 0, 0, s, 0, 0);
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, W, H);

    var d = mode === "play" ? dawn() : 0;
    if (d > 0) {
      var g = ctx.createLinearGradient(0, H, 0, H * 0.45);
      g.addColorStop(0, C.moon); g.addColorStop(1, "transparent");
      ctx.globalAlpha = d * 0.35;
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;
    }

    // ceiling
    ctx.fillStyle = C.stone;
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(0, 120);
    for (var x = 0; x <= W; x += 46) ctx.lineTo(x + 23, 96 + ((x / 46) % 3) * 26), ctx.lineTo(x + 46, 120);
    ctx.lineTo(W, 0); ctx.closePath(); ctx.fill();

    if (mode === "intro" || mode === "done") { drawPanel(); return; }

    var fs = freeSpots(), fl = flying();
    spots.forEach(function (sp) {
      ctx.strokeStyle = C.line;
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(sp.x, 118); ctx.lineTo(sp.x, sp.y - 24); ctx.stroke();
      if (!sp.bat) {
        ctx.strokeStyle = C.dim; ctx.globalAlpha = 0.7;
        ctx.beginPath(); ctx.arc(sp.x, sp.y - 14, 7, 0.3, Math.PI - 0.3); ctx.stroke();
        ctx.globalAlpha = 1;
      }
    });
    if (kb.on && fs.length) {
      var ks = fs[kb.spot % fs.length];
      ctx.strokeStyle = C.echo; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(ks.x, ks.y, 26, 0, 7); ctx.stroke();
    }

    bats.forEach(drawBat);
    if (kb.on && fl.length) {
      var kbat = fl[kb.bat % fl.length];
      ctx.strokeStyle = C.echo; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(kbat.x, kbat.y, 34, 0, 7); ctx.stroke();
    }

    ctx.fillStyle = C.dim;
    ctx.font = "400 26px " + tok("--font", "system-ui");
    zzz.forEach(function (z) {
      var age = now - z.t;
      ctx.globalAlpha = Math.max(0, 1 - age / 2.2) * 0.8;
      ctx.fillText("z", z.x + age * 8, z.y + 20 - age * 26);
      ctx.globalAlpha = 1;
    });

    var roosted = bats.length - fl.length;
    ctx.font = "600 30px " + tok("--font", "system-ui");
    ctx.textAlign = "left";  ctx.fillText("roosted " + roosted + "/" + bats.length, 28, H - 36);
    ctx.textAlign = "right";
    ctx.fillStyle = d > 0 ? C.moon : C.dim;
    ctx.fillText(Math.ceil(timeLeft) + "s to sunrise", W - 28, H - 36);
  }

  function drawPanel() {
    ctx.textAlign = "center";
    ctx.fillStyle = C.moonBright;
    ctx.font = "500 50px " + tok("--font-display", "Georgia, serif");
    if (mode === "intro") {
      ctx.fillText("Sunrise is coming.", W / 2, H * 0.42);
      ctx.fillStyle = C.dim;
      ctx.font = "400 32px " + tok("--font", "system-ui");
      ctx.fillText("Drag each bat to a spot on the ceiling.", W / 2, H * 0.42 + 60);
      ctx.fillText("Everyone hangs up before the light arrives.", W / 2, H * 0.42 + 104);
      ctx.fillStyle = C.moon;
      ctx.font = "600 36px " + tok("--font", "system-ui");
      ctx.fillText("Tap to start", W / 2, H * 0.64);
    } else {
      var left = flying().length;
      ctx.fillText(left === 0 ? "Everyone made it in." : left + " met the morning.", W / 2, H * 0.4);
      ctx.fillStyle = C.dim;
      ctx.font = "400 32px " + tok("--font", "system-ui");
      ctx.fillText("Their toes lock shut under their own weight.", W / 2, H * 0.4 + 60);
      ctx.fillText("Hanging is the rest position.", W / 2, H * 0.4 + 104);
      ctx.fillStyle = C.moon;
      ctx.font = "600 36px " + tok("--font", "system-ui");
      ctx.fillText("Tap to try again", W / 2, H * 0.64);
    }
  }

  /* ---- loop ---- */
  var running = false, rafId = 0, lastT = 0, inView = false;
  function frame(t) {
    if (!running) return;
    now = t / 1000;
    var dt = Math.min(0.05, (t - lastT) / 1000 || 0.016);
    lastT = t;
    update(dt);
    draw();
    rafId = requestAnimationFrame(frame);
  }
  function setRunning(on) {
    if (on === running) return;
    running = on;
    if (on) { lastT = performance.now(); rafId = requestAnimationFrame(frame); }
    else cancelAnimationFrame(rafId);
  }
  var io = new IntersectionObserver(function (entries) {
    inView = entries[0].isIntersecting;
    setRunning(inView && !document.hidden);
  }, { threshold: 0.15 });
  io.observe(shell);
  document.addEventListener("visibilitychange", function () {
    setRunning(inView && !document.hidden);
  });

  window.addEventListener("resize", resize);
  resize();
  draw();
})();
