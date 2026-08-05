/* echo-ping.js — the Echo ping game. One responsibility: run the game inside #echo-ping.
   Reads window.POCKET_BATS_CONFIG.echoPing. Touch first; keyboard complete
   (space = call, arrows = move the aim, enter = catch). Cosmetic randomness only. */

(function () {
  "use strict";
  var shell = document.getElementById("echo-ping");
  if (!shell || !window.POCKET_BATS_CONFIG) return;
  var CFG = window.POCKET_BATS_CONFIG.echoPing;
  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var canvas = document.createElement("canvas");
  var ctx = canvas.getContext("2d");
  shell.appendChild(canvas);
  shell.setAttribute("tabindex", "0");
  shell.setAttribute("role", "application");
  shell.setAttribute("aria-label",
    "Echo ping game. Space sends a call. Arrow keys move the aim. Enter catches a moth.");

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
    text: tok("--text", "#eaedf8"),
    dim: tok("--text-dim", "#aab2ce")
  };

  /* Design space: height is always 1000 units; width follows the aspect ratio. */
  var W = 750, H = 1000, dpr = 1;
  function resize() {
    var r = shell.getBoundingClientRect();
    if (r.width < 10 || r.height < 10) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(r.width * dpr);
    canvas.height = Math.round(r.height * dpr);
    H = 1000;
    W = H * (r.width / r.height);
  }
  function toUnits(px, py) {
    var r = shell.getBoundingClientRect();
    return { x: (px - r.left) / r.height * 1000, y: (py - r.top) / r.height * 1000 };
  }

  /* ---- state ---- */
  var mode = "intro"; // intro | play | done
  var moths = [], pings = [], stars = [], flashes = [];
  var score = 0, timeLeft = 0, lastPingAt = -1e9, now = 0;
  var aim = { x: 375, y: 500, keyboard: false };

  function rnd(a, b) { return a + Math.random() * (b - a); }

  function makeStars() {
    stars = [];
    for (var i = 0; i < CFG.starCount; i++)
      stars.push({ x: rnd(0, W), y: rnd(0, H), r: rnd(0.8, 2) });
  }
  function makeMoth() {
    return {
      x: rnd(60, W - 60), y: rnd(120, H - 160),
      a: rnd(0, Math.PI * 2),
      seen: -1e9, flap: rnd(0, Math.PI * 2)
    };
  }
  function start() {
    mode = "play";
    score = 0;
    timeLeft = CFG.roundSeconds;
    moths = []; pings = []; flashes = [];
    lastPingAt = -1e9;
    for (var i = 0; i < CFG.mothCount; i++) moths.push(makeMoth());
  }

  function ping(x, y) {
    if (now - lastPingAt < CFG.pingCooldownMs / 1000) return;
    lastPingAt = now;
    if (reducedMotion) {
      // Reduced motion: no travelling ripple. One quiet flash; moths inside range appear.
      flashes.push({ t: now, kind: "call", x: x, y: y });
      moths.forEach(function (m) { m.seen = now; });
    } else {
      pings.push({ x: x, y: y, r: 0 });
    }
  }

  function tryCatch(x, y) {
    for (var i = 0; i < moths.length; i++) {
      var m = moths[i];
      var visible = (now - m.seen) < (CFG.revealSeconds + CFG.revealFadeSeconds);
      var d = Math.hypot(m.x - x, m.y - y);
      if (visible && d < CFG.catchRadius) {
        score++;
        flashes.push({ t: now, kind: "hit", x: m.x, y: m.y });
        moths[i] = makeMoth();
        return true;
      }
    }
    flashes.push({ t: now, kind: "miss", x: x, y: y });
    return false;
  }

  /* ---- input ---- */
  function press(x, y) {
    if (mode !== "play") { start(); return; }
    var u = { x: x, y: y };
    if (!tryCatch(u.x, u.y)) ping(u.x, u.y);
  }
  shell.addEventListener("pointerdown", function (e) {
    e.preventDefault();
    shell.focus({ preventScroll: true });
    aim.keyboard = false;
    var u = toUnits(e.clientX, e.clientY);
    press(u.x, u.y);
  });
  shell.addEventListener("keydown", function (e) {
    var step = 40;
    switch (e.key) {
      case " ":
        e.preventDefault();
        if (mode !== "play") start(); else { aim.keyboard = true; ping(aim.x, aim.y); }
        break;
      case "Enter":
        e.preventDefault();
        if (mode !== "play") start(); else { aim.keyboard = true; tryCatch(aim.x, aim.y); }
        break;
      case "ArrowLeft":  aim.keyboard = true; aim.x = Math.max(30, aim.x - step); e.preventDefault(); break;
      case "ArrowRight": aim.keyboard = true; aim.x = Math.min(W - 30, aim.x + step); e.preventDefault(); break;
      case "ArrowUp":    aim.keyboard = true; aim.y = Math.max(30, aim.y - step); e.preventDefault(); break;
      case "ArrowDown":  aim.keyboard = true; aim.y = Math.min(H - 30, aim.y + step); e.preventDefault(); break;
    }
  });

  /* ---- update ---- */
  function update(dt) {
    if (mode !== "play") return;
    timeLeft -= dt;
    if (timeLeft <= 0) { timeLeft = 0; mode = "done"; return; }

    var speed = CFG.mothSpeed * (reducedMotion ? 0.6 : 1);
    moths.forEach(function (m) {
      m.a += rnd(-CFG.mothWander, CFG.mothWander) * dt * 4;
      m.x += Math.cos(m.a) * speed * dt * 6;
      m.y += Math.sin(m.a) * speed * dt * 6;
      m.flap += dt * 14;
      if (m.x < 40 || m.x > W - 40) m.a = Math.PI - m.a;
      if (m.y < 100 || m.y > H - 60) m.a = -m.a;
      m.x = Math.min(Math.max(m.x, 40), W - 40);
      m.y = Math.min(Math.max(m.y, 100), H - 60);
    });

    for (var i = pings.length - 1; i >= 0; i--) {
      var p = pings[i];
      var r0 = p.r;
      p.r += CFG.pingSpeed * dt;
      moths.forEach(function (m) {
        var d = Math.hypot(m.x - p.x, m.y - p.y);
        if (d >= r0 && d <= p.r) m.seen = now;
      });
      if (p.r > CFG.pingMaxRadius) pings.splice(i, 1);
    }
    flashes = flashes.filter(function (f) { return now - f.t < 0.6; });
  }

  /* ---- draw ---- */
  function draw() {
    var s = canvas.height / 1000; // units -> device px
    ctx.setTransform(s, 0, 0, s, 0, 0);
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = C.star;
    ctx.globalAlpha = 0.4;
    stars.forEach(function (st) {
      ctx.beginPath(); ctx.arc(st.x, st.y, st.r, 0, 7); ctx.fill();
    });
    ctx.globalAlpha = 1;

    if (mode === "intro" || mode === "done") { drawPanel(); return; }

    pings.forEach(function (p) {
      ctx.strokeStyle = C.echo;
      ctx.globalAlpha = Math.max(0, 1 - p.r / CFG.pingMaxRadius) * 0.8;
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.stroke();
      ctx.globalAlpha = 1;
    });

    moths.forEach(function (m) {
      var age = now - m.seen;
      var vis = age < CFG.revealSeconds ? 1 :
        Math.max(0, 1 - (age - CFG.revealSeconds) / CFG.revealFadeSeconds);
      if (vis <= 0) return;
      var w = 13 + Math.sin(m.flap) * (reducedMotion ? 1.5 : 5);
      ctx.globalAlpha = vis;
      ctx.fillStyle = C.moonBright;
      ctx.beginPath(); ctx.ellipse(m.x - w * 0.6, m.y, w * 0.62, 8, -0.5, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.ellipse(m.x + w * 0.6, m.y, w * 0.62, 8, 0.5, 0, 7); ctx.fill();
      ctx.fillStyle = C.moon;
      ctx.beginPath(); ctx.ellipse(m.x, m.y + 2, 4.5, 9, 0, 0, 7); ctx.fill();
      ctx.globalAlpha = 1;
    });

    flashes.forEach(function (f) {
      var a = 1 - (now - f.t) / 0.6;
      ctx.globalAlpha = Math.max(0, a) * (f.kind === "hit" ? 0.9 : 0.35);
      ctx.strokeStyle = f.kind === "miss" ? C.dim : (f.kind === "call" ? C.echo : C.moon);
      ctx.lineWidth = f.kind === "hit" ? 4 : 2;
      var r = f.kind === "hit" ? 30 + (now - f.t) * 60 : 26;
      ctx.beginPath(); ctx.arc(f.x, f.y, r, 0, 7); ctx.stroke();
      ctx.globalAlpha = 1;
    });

    if (aim.keyboard) {
      ctx.strokeStyle = C.echo;
      ctx.globalAlpha = 0.9; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(aim.x, aim.y, 20, 0, 7); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(aim.x - 30, aim.y); ctx.lineTo(aim.x - 12, aim.y);
      ctx.moveTo(aim.x + 12, aim.y); ctx.lineTo(aim.x + 30, aim.y);
      ctx.moveTo(aim.x, aim.y - 30); ctx.lineTo(aim.x, aim.y - 12);
      ctx.moveTo(aim.x, aim.y + 12); ctx.lineTo(aim.x, aim.y + 30);
      ctx.stroke(); ctx.globalAlpha = 1;
    }

    var cd = Math.min(1, (now - lastPingAt) / (CFG.pingCooldownMs / 1000));
    ctx.fillStyle = C.dim;
    ctx.font = "600 30px " + tok("--font", "system-ui");
    ctx.textAlign = "left";  ctx.fillText("moths " + score, 28, 52);
    ctx.textAlign = "right"; ctx.fillText(Math.ceil(timeLeft) + "s", W - 28, 52);
    ctx.strokeStyle = cd < 1 ? C.dim : C.echo;
    ctx.globalAlpha = cd < 1 ? 0.5 : 0.9; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(W / 2, 46, 14, -Math.PI / 2, -Math.PI / 2 + cd * Math.PI * 2);
    ctx.stroke(); ctx.globalAlpha = 1;
  }

  function drawPanel() {
    ctx.textAlign = "center";
    ctx.fillStyle = C.moonBright;
    ctx.font = "500 50px " + tok("--font-display", "Georgia, serif");
    if (mode === "intro") {
      ctx.fillText("The dark is not empty.", W / 2, H * 0.4);
      ctx.fillStyle = C.dim;
      ctx.font = "400 32px " + tok("--font", "system-ui");
      ctx.fillText("Tap to call. The echo shows the moths.", W / 2, H * 0.4 + 60);
      ctx.fillText("Tap a moth while you still see it.", W / 2, H * 0.4 + 104);
      ctx.fillStyle = C.moon;
      ctx.font = "600 36px " + tok("--font", "system-ui");
      ctx.fillText("Tap to start", W / 2, H * 0.62);
    } else {
      ctx.fillText(score + (score === 1 ? " moth." : " moths."), W / 2, H * 0.38);
      ctx.fillStyle = C.dim;
      ctx.font = "400 32px " + tok("--font", "system-ui");
      ctx.fillText("A real bat keeps this up all night,", W / 2, H * 0.38 + 60);
      ctx.fillText("by the hundred, without a screen.", W / 2, H * 0.38 + 104);
      ctx.fillStyle = C.moon;
      ctx.font = "600 36px " + tok("--font", "system-ui");
      ctx.fillText("Tap to fly again", W / 2, H * 0.62);
    }
  }

  /* ---- loop: runs only while the shell is visible and the tab is shown ---- */
  var running = false, rafId = 0, lastT = 0;
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
  var inView = false;
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
