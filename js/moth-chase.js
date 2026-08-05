/* moth-chase.js — the Moth chase game. One responsibility: run the game inside #moth-chase.
   Reads window.POCKET_BATS_CONFIG.mothChase. Drag with one thumb; the bat follows.
   Keyboard complete (arrows steer, space starts). */

(function () {
  "use strict";
  var shell = document.getElementById("moth-chase");
  if (!shell || !window.POCKET_BATS_CONFIG) return;
  var CFG = window.POCKET_BATS_CONFIG.mothChase;
  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var canvas = document.createElement("canvas");
  var ctx = canvas.getContext("2d");
  shell.appendChild(canvas);
  shell.setAttribute("tabindex", "0");
  shell.setAttribute("role", "application");
  shell.setAttribute("aria-label",
    "Moth chase game. Drag to steer the bat. Arrow keys also steer. Space starts a night.");

  var css = getComputedStyle(document.documentElement);
  function tok(name, fallback) {
    var v = css.getPropertyValue(name).trim();
    return v || fallback;
  }
  var C = {
    bg: tok("--night-900", "#0b1026"),
    line: tok("--night-line", "#2a3462"),
    star: tok("--star", "#cdd6f4"),
    moon: tok("--moon", "#f5d99a"),
    moonBright: tok("--moon-bright", "#ffe9b8"),
    echo: tok("--echo", "#9adcf0"),
    dim: tok("--text-dim", "#aab2ce"),
    body: tok("--bat-body", "#3d3554"),
    wing: tok("--bat-wing", "#2c2640"),
    ear: tok("--bat-ear", "#b98695"),
    owl: tok("--night-700", "#1d2650")
  };

  var W = 750, H = 1000, dpr = 1;
  function resize() {
    var r = shell.getBoundingClientRect();
    if (r.width < 10 || r.height < 10) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(r.width * dpr);
    canvas.height = Math.round(r.height * dpr);
    W = 1000 * (r.width / r.height);
  }
  function toUnits(px, py) {
    var r = shell.getBoundingClientRect();
    return { x: (px - r.left) / r.height * 1000, y: (py - r.top) / r.height * 1000 };
  }

  var mode = "intro"; // intro | play | done
  var bat, moths, owl, stars, puffs;
  var score = 0, lives = 0, elapsed = 0, now = 0, spawnAt = 0, hurtUntil = 0, best = 0;
  var target = null, keys = {};

  function rnd(a, b) { return a + Math.random() * (b - a); }

  function makeStars() {
    stars = [];
    for (var i = 0; i < 20; i++) stars.push({ x: rnd(0, W), y: rnd(0, H), r: rnd(0.8, 2) });
  }
  function makeMoth() {
    return { x: rnd(60, W - 60), y: rnd(80, H - 80), a: rnd(0, 6.28), flap: rnd(0, 6.28) };
  }
  function start() {
    mode = "play";
    score = 0; lives = CFG.lives; elapsed = 0; spawnAt = 0; hurtUntil = -1e9;
    bat = { x: W / 2, y: H * 0.7, flap: 0, face: 1 };
    target = null;
    moths = [makeMoth(), makeMoth(), makeMoth()];
    owl = null;
    puffs = [];
  }

  /* ---- input ---- */
  function steerTo(e) {
    var u = toUnits(e.clientX, e.clientY);
    target = { x: u.x, y: u.y };
  }
  shell.addEventListener("pointerdown", function (e) {
    e.preventDefault();
    shell.focus({ preventScroll: true });
    if (mode !== "play") { start(); return; }
    try { shell.setPointerCapture(e.pointerId); } catch (err) { /* capture is optional */ }
    steerTo(e);
  });
  shell.addEventListener("pointermove", function (e) { if (mode === "play" && target) steerTo(e); });
  shell.addEventListener("pointerup", function () { target = null; });
  shell.addEventListener("keydown", function (e) {
    if (mode !== "play") {
      if (e.key === " " || e.key === "Enter") { e.preventDefault(); start(); }
      return;
    }
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].indexOf(e.key) >= 0) {
      e.preventDefault(); keys[e.key] = true;
    }
  });
  shell.addEventListener("keyup", function (e) { keys[e.key] = false; });
  shell.addEventListener("blur", function () { keys = {}; target = null; });

  /* ---- update ---- */
  function update(dt) {
    if (mode !== "play") return;
    elapsed += dt;

    var sp = CFG.batSpeed * (reducedMotion ? 0.7 : 1);
    if (target) {
      var dx = target.x - bat.x, dy = target.y - bat.y;
      var d = Math.hypot(dx, dy);
      if (d > 2) {
        var step = Math.min(d, sp * dt);
        bat.x += dx / d * step; bat.y += dy / d * step;
        if (Math.abs(dx) > 4) bat.face = dx > 0 ? 1 : -1;
      }
    }
    var kx = (keys.ArrowRight ? 1 : 0) - (keys.ArrowLeft ? 1 : 0);
    var ky = (keys.ArrowDown ? 1 : 0) - (keys.ArrowUp ? 1 : 0);
    if (kx || ky) {
      var kl = Math.hypot(kx, ky);
      bat.x += kx / kl * sp * dt; bat.y += ky / kl * sp * dt;
      if (kx) bat.face = kx > 0 ? 1 : -1;
      target = null;
    }
    bat.x = Math.min(Math.max(bat.x, 30), W - 30);
    bat.y = Math.min(Math.max(bat.y, 60), H - 30);
    bat.flap += dt * 16;

    spawnAt += dt;
    if (spawnAt > CFG.mothSpawnSeconds && moths.length < CFG.maxMoths) {
      spawnAt = 0; moths.push(makeMoth());
    }

    moths.forEach(function (m) {
      m.a += rnd(-0.6, 0.6) * dt * 4;
      m.flap += dt * 14;
      m.x += Math.cos(m.a) * CFG.mothSpeed * dt;
      m.y += Math.sin(m.a) * CFG.mothSpeed * dt;
      if (m.x < 40 || m.x > W - 40) m.a = Math.PI - m.a;
      if (m.y < 70 || m.y > H - 50) m.a = -m.a;
      m.x = Math.min(Math.max(m.x, 40), W - 40);
      m.y = Math.min(Math.max(m.y, 70), H - 50);
    });

    for (var i = moths.length - 1; i >= 0; i--) {
      if (Math.hypot(moths[i].x - bat.x, moths[i].y - bat.y) < CFG.catchRadius) {
        puffs.push({ x: moths[i].x, y: moths[i].y, t: now, kind: "eat" });
        moths.splice(i, 1);
        score++;
      }
    }

    if (!owl && elapsed > CFG.owlAfterSeconds) {
      owl = { x: rnd(0, 1) < 0.5 ? -60 : W + 60, y: rnd(150, H - 150), a: 0, flap: 0 };
    }
    if (owl) {
      var ox = bat.x - owl.x, oy = bat.y - owl.y;
      var want = Math.atan2(oy, ox);
      var diff = Math.atan2(Math.sin(want - owl.a), Math.cos(want - owl.a));
      owl.a += Math.max(-CFG.owlTurn * dt, Math.min(CFG.owlTurn * dt, diff));
      var osp = CFG.owlSpeed * (reducedMotion ? 0.7 : 1);
      owl.x += Math.cos(owl.a) * osp * dt;
      owl.y += Math.sin(owl.a) * osp * dt;
      owl.flap += dt * 5;
      if (now > hurtUntil && Math.hypot(ox, oy) < CFG.owlRadius) {
        lives--;
        hurtUntil = now + CFG.owlGraceSeconds;
        puffs.push({ x: bat.x, y: bat.y, t: now, kind: "hit" });
        owl.x = rnd(0, 1) < 0.5 ? -60 : W + 60;
        owl.y = rnd(150, H - 150);
        if (lives <= 0) { mode = "done"; best = Math.max(best, score); }
      }
    }
    puffs = puffs.filter(function (p) { return now - p.t < 0.6; });
  }

  /* ---- draw ---- */
  function drawMoth(m) {
    var w = 12 + Math.sin(m.flap) * (reducedMotion ? 1.5 : 4);
    ctx.fillStyle = C.moonBright;
    ctx.beginPath(); ctx.ellipse(m.x - w * 0.6, m.y, w * 0.6, 7, -0.5, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.ellipse(m.x + w * 0.6, m.y, w * 0.6, 7, 0.5, 0, 7); ctx.fill();
    ctx.fillStyle = C.moon;
    ctx.beginPath(); ctx.ellipse(m.x, m.y + 2, 4, 8, 0, 0, 7); ctx.fill();
  }

  function drawBat() {
    var blink = now < hurtUntil && Math.floor(now * 10) % 2 === 0;
    ctx.save();
    ctx.translate(bat.x, bat.y);
    ctx.scale(bat.face * CFG.batSize / 30, CFG.batSize / 30);
    ctx.globalAlpha = blink ? 0.35 : 1;
    var f = Math.sin(bat.flap) * (reducedMotion ? 4 : 13);
    ctx.fillStyle = C.wing;
    ctx.beginPath();
    ctx.moveTo(-6, 0); ctx.quadraticCurveTo(-32, -14 - f, -50, -4 - f);
    ctx.quadraticCurveTo(-32, 8 - f * 0.4, -8, 10); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(6, 0); ctx.quadraticCurveTo(32, -14 - f, 50, -4 - f);
    ctx.quadraticCurveTo(32, 8 - f * 0.4, 8, 10); ctx.fill();
    ctx.fillStyle = C.body;
    ctx.beginPath(); ctx.ellipse(0, 0, 16, 15, 0, 0, 7); ctx.fill();
    ctx.fillStyle = C.ear;
    ctx.beginPath(); ctx.moveTo(-9, -11); ctx.lineTo(-6, -22); ctx.lineTo(-2, -12); ctx.fill();
    ctx.beginPath(); ctx.moveTo(9, -11); ctx.lineTo(6, -22); ctx.lineTo(2, -12); ctx.fill();
    ctx.fillStyle = C.moonBright;
    ctx.beginPath(); ctx.arc(-5, -3, 1.6, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(5, -3, 1.6, 0, 7); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  function drawOwl() {
    ctx.save();
    ctx.translate(owl.x, owl.y);
    ctx.rotate(0);
    var f = Math.sin(owl.flap) * (reducedMotion ? 3 : 10);
    ctx.fillStyle = C.owl;
    ctx.beginPath();
    ctx.moveTo(-10, 0); ctx.quadraticCurveTo(-44, -16 - f, -64, 0 - f);
    ctx.quadraticCurveTo(-40, 14 - f * 0.4, -10, 14); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(10, 0); ctx.quadraticCurveTo(44, -16 - f, 64, 0 - f);
    ctx.quadraticCurveTo(40, 14 - f * 0.4, 10, 14); ctx.fill();
    ctx.beginPath(); ctx.ellipse(0, 2, 22, 24, 0, 0, 7); ctx.fill();
    ctx.fillStyle = C.moon;
    ctx.beginPath(); ctx.arc(-8, -4, 6, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(8, -4, 6, 0, 7); ctx.fill();
    ctx.fillStyle = C.bg;
    ctx.beginPath(); ctx.arc(-8, -4, 2.6, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(8, -4, 2.6, 0, 7); ctx.fill();
    ctx.fillStyle = C.moon;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-4, 6); ctx.lineTo(4, 6); ctx.fill();
    // tufts
    ctx.fillStyle = C.owl;
    ctx.beginPath(); ctx.moveTo(-16, -18); ctx.lineTo(-12, -30); ctx.lineTo(-6, -19); ctx.fill();
    ctx.beginPath(); ctx.moveTo(16, -18); ctx.lineTo(12, -30); ctx.lineTo(6, -19); ctx.fill();
    ctx.restore();
  }

  function draw() {
    var s = canvas.height / 1000;
    ctx.setTransform(s, 0, 0, s, 0, 0);
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = C.star; ctx.globalAlpha = 0.4;
    stars.forEach(function (st) { ctx.beginPath(); ctx.arc(st.x, st.y, st.r, 0, 7); ctx.fill(); });
    ctx.globalAlpha = 1;

    if (mode === "intro" || mode === "done") { drawPanel(); return; }

    moths.forEach(drawMoth);
    if (owl) drawOwl();
    drawBat();

    puffs.forEach(function (p) {
      var a = 1 - (now - p.t) / 0.6;
      ctx.globalAlpha = Math.max(0, a);
      ctx.strokeStyle = p.kind === "hit" ? C.dim : C.moon;
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(p.x, p.y, 20 + (now - p.t) * 70, 0, 7); ctx.stroke();
      ctx.globalAlpha = 1;
    });

    ctx.fillStyle = C.dim;
    ctx.font = "600 30px " + tok("--font", "system-ui");
    ctx.textAlign = "left"; ctx.fillText("moths " + score, 28, 52);
    ctx.textAlign = "right";
    var hearts = "";
    for (var i = 0; i < lives; i++) hearts += "•";
    ctx.fillStyle = C.moon;
    ctx.font = "600 40px " + tok("--font", "system-ui");
    ctx.fillText(hearts, W - 28, 54);

    if (!owl && elapsed > CFG.owlAfterSeconds - 3) {
      ctx.textAlign = "center";
      ctx.fillStyle = C.dim;
      ctx.font = "400 26px " + tok("--font", "system-ui");
      ctx.globalAlpha = 0.8;
      ctx.fillText("something else is awake", W / 2, 52);
      ctx.globalAlpha = 1;
    }
  }

  function drawPanel() {
    ctx.textAlign = "center";
    ctx.fillStyle = C.moonBright;
    ctx.font = "500 50px " + tok("--font-display", "Georgia, serif");
    if (mode === "intro") {
      ctx.fillText("One night's work.", W / 2, H * 0.4);
      ctx.fillStyle = C.dim;
      ctx.font = "400 32px " + tok("--font", "system-ui");
      ctx.fillText("Drag to steer. Fly through the moths.", W / 2, H * 0.4 + 60);
      ctx.fillText("An owl joins you later. It is not friendly.", W / 2, H * 0.4 + 104);
      ctx.fillStyle = C.moon;
      ctx.font = "600 36px " + tok("--font", "system-ui");
      ctx.fillText("Tap to fly", W / 2, H * 0.62);
    } else {
      ctx.fillText(score + (score === 1 ? " moth." : " moths."), W / 2, H * 0.36);
      ctx.fillStyle = C.dim;
      ctx.font = "400 32px " + tok("--font", "system-ui");
      ctx.fillText("A small brown bat can take hundreds", W / 2, H * 0.36 + 60);
      ctx.fillText("in a night, and does it again tomorrow.", W / 2, H * 0.36 + 104);
      if (best) {
        ctx.fillStyle = C.echo;
        ctx.font = "400 28px " + tok("--font", "system-ui");
        ctx.fillText("best tonight: " + best, W / 2, H * 0.36 + 156);
      }
      ctx.fillStyle = C.moon;
      ctx.font = "600 36px " + tok("--font", "system-ui");
      ctx.fillText("Tap to fly again", W / 2, H * 0.64);
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

  window.addEventListener("resize", function () { resize(); makeStars(); });
  resize();
  makeStars();
  draw();
})();
