/* =====================================================================
   ILG Academy · Eyewear Lens Technology — SIMULATION KIT
   ---------------------------------------------------------------------
   Every figure on a slide is a "sim": SIMS[name](host, ctx, opt) mounts
   into the slide's figure box and returns
       { acts() → [[id, label, pressed?], ...],   // also the phone remote's buttons
         act(id),                                 // run one of them
         destroy() }
   ctx = { slide, side, changed(), go(slideId), toast(text) }.
   Canvas sims draw in a logical 1140-wide space and are resized
   crisply for any screen. Plain 2D canvas and SVG only: no WebGL, so
   there is nothing to fall back from on older laptops or tablets.
   ===================================================================== */
const SIMS = {};
const KIT = (function () {
  "use strict";
  const RM = (() => { try { return matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; } })();
  const P = { ink: "#16140F", text: "#3B362F", mute: "#7A7366", faint: "#A59E91", line: "#E1DBD0", paper: "#F6F3EE", surface: "#FBFAF7", raise: "#EFEBE4",
    gold: "#8A6B32", gold2: "#C9A24E", red: "#A9472F", green: "#3E7A4A", blue: "#2F6B8F", glare: "#FFFFFF" };
  const FONT = 'Inter,-apple-system,"Segoe UI",Roboto,Arial,sans-serif', SERIF = '"Cormorant Garamond",Garamond,serif';
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const D2R = Math.PI / 180;
  function rng(seed) { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
  const h = (html) => { const t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstChild; };

  /* ---------- optics (used by the simulator; textbook Fresnel equations) ---------- */
  function fresnel(thetaDeg, n) {
    const ti = clamp(thetaDeg, 0, 89.9) * D2R, st = Math.sin(ti) / n, tt = Math.asin(clamp(st, -1, 1));
    const ci = Math.cos(ti), ct = Math.cos(tt);
    const rs = (ci - n * ct) / (ci + n * ct), rp = (n * ci - ct) / (n * ci + ct);
    return { Rs: rs * rs, Rp: rp * rp };
  }
  const brewster = (n) => Math.atan(n) / D2R;
  /* glare passing a polarised lens relative to a same-darkness non-polarised lens.
     tiltDeg: lens axis turned away from vertical (head tilt) */
  function polRatio(thetaDeg, n, tiltDeg) { const { Rs, Rp } = fresnel(thetaDeg, n), s = Math.sin(tiltDeg * D2R) ** 2, c = 1 - s;
    return (Rs + Rp) > 0 ? (2 * (Rs * s + Rp * c)) / (Rs + Rp) : 1; }
  const polDegree = (thetaDeg, n) => { const { Rs, Rp } = fresnel(thetaDeg, n); return (Rs + Rp) > 0 ? (Rs - Rp) / (Rs + Rp) : 0; };

  /* ---------- canvas stage ---------- */
  function stage(host, opts = {}) {
    const wrap = h(`<div class="sim${opts.cls ? " " + opts.cls : ""}"><div class="sim-cv"><canvas aria-hidden="true"></canvas>${opts.label ? `<p class="sim-lab">${esc(opts.label)}</p>` : ""}</div><div class="sim-ui"></div></div>`);
    host.appendChild(wrap);
    const box = wrap.querySelector(".sim-cv"), cv = wrap.querySelector("canvas"), g = cv.getContext("2d"), ui = wrap.querySelector(".sim-ui");
    if (opts.aria) { cv.setAttribute("role", "img"); cv.setAttribute("aria-label", opts.aria); cv.removeAttribute("aria-hidden"); }
    if (opts.noUi) ui.remove();
    const S = { wrap, box, cv, g, ui, W: 1140, H: 700, scale: 1, draw: null, dead: false, t0: performance.now(), last: 0 };
    const fit = () => { const r = box.getBoundingClientRect(); if (!r.width || !r.height) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1); cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr);
      S.scale = (r.width * dpr) / S.W; S.H = Math.round(S.W * r.height / r.width); S.cssScale = r.width / S.W; };
    let ro = null; try { ro = new ResizeObserver(fit); ro.observe(box); } catch (e) { window.addEventListener("resize", fit); }
    fit();
    const loop = (now) => { if (S.dead) return; requestAnimationFrame(loop);
      if (now - S.last < 24) return; S.last = now;
      if (!cv.width) { fit(); if (!cv.width) return; }
      g.setTransform(S.scale, 0, 0, S.scale, 0, 0); g.clearRect(0, 0, S.W, S.H);
      if (S.draw) try { S.draw(g, S.W, S.H, RM ? 0 : now - S.t0); } catch (e) { console.warn(e); S.draw = null; } };
    requestAnimationFrame(loop);
    S.pt = (e) => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * S.W, (e.clientY - r.top) / r.height * S.H]; };
    S.destroy = () => { S.dead = true; try { ro && ro.disconnect(); } catch (e) {} wrap.remove(); };
    return S;
  }

  /* ---------- small DOM controls (real buttons and sliders; the remote mirrors them) ---------- */
  function seg(label, items, cur, on) {
    const d = h(`<div class="seg" role="group" aria-label="${esc(label)}"><span class="seg-l">${esc(label)}</span>${items.map(([v, t]) => `<button type="button" data-v="${esc(v)}" aria-pressed="${v === cur}">${esc(t)}</button>`).join("")}</div>`);
    d.addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) on(b.dataset.v); });
    d.set = (v) => d.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.v === v)));
    return d;
  }
  function slider(label, min, max, val, on, fmt) {
    const id = "s" + Math.random().toString(36).slice(2, 8);
    const d = h(`<div class="sld"><label for="${id}">${esc(label)} <b></b></label><input id="${id}" type="range" min="${min}" max="${max}" step="1" value="${val}"></div>`);
    const i = d.querySelector("input"), b = d.querySelector("b");
    const show = () => (b.textContent = fmt ? fmt(+i.value) : i.value);
    i.addEventListener("input", () => { show(); on(+i.value); }); show();
    d.set = (v) => { i.value = v; show(); }; d.input = i;
    return d;
  }
  function btn(label, on, cls) { const b = h(`<button type="button" class="sbtn ${cls || ""}">${esc(label)}</button>`); b.onclick = on; return b; }

  /* ---------- drawing helpers ---------- */
  function rr(g, x, y, w, hh, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + hh, r); g.arcTo(x + w, y + hh, x, y + hh, r); g.arcTo(x, y + hh, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
  function text(g, s, x, y, o = {}) { g.font = `${o.w || 600} ${o.size || 22}px ${o.serif ? SERIF : FONT}`; g.fillStyle = o.color || P.ink; g.textAlign = o.align || "left"; g.textBaseline = o.base || "alphabetic"; g.fillText(s, x, y); }
  function pill(g, s, x, y, o = {}) { const size = o.size || 20; g.font = `600 ${size}px ${FONT}`; const w = g.measureText(s).width + size * 1.3, hh = size * 1.9;
    const x0 = o.align === "center" ? x - w / 2 : o.align === "right" ? x - w : x; rr(g, x0, y - hh / 2, w, hh, o.sq ? 3 : hh / 2); g.fillStyle = o.bg || "rgba(22,20,15,.78)"; g.fill();
    if (o.stroke) { g.strokeStyle = o.stroke; g.lineWidth = 1.5; g.stroke(); }
    g.fillStyle = o.fg || "#fff"; g.textAlign = "left"; g.textBaseline = "middle"; g.fillText(s, x0 + size * .65, y + 1); g.textBaseline = "alphabetic"; return w; }
  function arrow(g, x1, y1, x2, y2, o = {}) { const a = Math.atan2(y2 - y1, x2 - x1), hl = o.head || 16; g.strokeStyle = g.fillStyle = o.color || P.ink; g.lineWidth = o.w || 3; g.lineCap = "round";
    g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2 - Math.cos(a) * hl * .6, y2 - Math.sin(a) * hl * .6); g.stroke();
    g.beginPath(); g.moveTo(x2, y2); g.lineTo(x2 - hl * Math.cos(a - .42), y2 - hl * Math.sin(a - .42)); g.lineTo(x2 - hl * Math.cos(a + .42), y2 - hl * Math.sin(a + .42)); g.closePath(); g.fill(); }
  /* a double-headed arrow: the direction light vibrates */
  function vib(g, x, y, len, ang, color, w) { const dx = Math.cos(ang) * len / 2, dy = Math.sin(ang) * len / 2; g.save(); g.strokeStyle = g.fillStyle = color; g.lineWidth = w || 3.2; g.lineCap = "round";
    g.beginPath(); g.moveTo(x - dx, y - dy); g.lineTo(x + dx, y + dy); g.stroke();
    [[1, 1], [-1, -1]].forEach(([sx]) => { const ex = x + dx * sx, ey = y + dy * sx, a = ang + (sx < 0 ? Math.PI : 0), hl = len * .22; g.beginPath(); g.moveTo(ex, ey); g.lineTo(ex - hl * Math.cos(a - .55), ey - hl * Math.sin(a - .55)); g.lineTo(ex - hl * Math.cos(a + .55), ey - hl * Math.sin(a + .55)); g.closePath(); g.fill(); });
    g.restore(); }
  function sparkle(g, x, y, r, a) { g.save(); g.globalAlpha = a; g.fillStyle = "#fff"; g.beginPath(); g.ellipse(x, y, r * 2.8, r * .32, 0, 0, 7); g.fill(); g.globalAlpha = a * .55; g.beginPath(); g.ellipse(x, y, r * .28, r * .75, 0, 0, 7); g.fill(); g.restore(); }
  /* the outline shape of one sunglass lens (soft rectangle) */
  function lensPath(g, cx, cy, a, b, shape) { const p = shape === "round" ? 1 : .55; /* adds a closed sub-path: callers begin the path */
    for (let i = 0; i <= 72; i++) { const t = i / 72 * Math.PI * 2, c = Math.cos(t), s = Math.sin(t); let x = a * Math.sign(c) * Math.abs(c) ** p, y = b * Math.sign(s) * Math.abs(s) ** p; if (y < 0) x *= 1 - .1 * (-y / b); i ? g.lineTo(cx + x, cy - y) : g.moveTo(cx + x, cy - y); }
    g.closePath(); }
  /* apply a lens tint to whatever is inside the current clip */
  function tintRect(g, x, y, w, hh, rgb, k) { if (!rgb) return; g.save(); g.globalCompositeOperation = "multiply";
    const m = rgb.map((c) => Math.round(255 - (255 - c) * k)); g.fillStyle = `rgb(${m})`; g.fillRect(x, y, w, hh); g.restore(); }

  /* ---------- the outdoor scene painter ----------
     o.kind: mix | water | road | sea | beach | golf | lake | pool | snow | city | office
     o.glare 0..1 (amount of reflected light), o.cut 0..1 (how much of the
     polarised part a filter removes), o.hy horizon (fraction of H).
     Each surface has its own polarised share (pf): calmer, flatter, more
     dielectric surfaces reflect more strongly polarised glare. */
  const PF = { water: .88, road: .72, car: .55, glass: .4, ice: .7, sand: .5, pool: .85 };
  function sceneGlare(o, surf) { return clamp((o.glare == null ? 1 : o.glare) * (1 - (o.cut || 0) * PF[surf]), 0, 1); }
  function paintScene(g, W, H, t, o) {
    const hy = (o.hy == null ? .42 : o.hy) * H, k = o.kind || "mix", R = rng(o.seed || 7);
    /* sky */
    const sk = g.createLinearGradient(0, 0, 0, Math.max(hy, 1)); sk.addColorStop(0, o.night ? "#1D2840" : "#7FB2D6"); sk.addColorStop(1, o.night ? "#3B4660" : "#E6EFF1");
    g.fillStyle = sk; g.fillRect(0, 0, W, Math.max(hy, 0) + 2);
    const sunX = o.sunX != null ? o.sunX * W : W * .34, sunY = Math.min(hy - 40, H * .12);
    if (hy > 30 && !o.night && k !== "office") { const sg = g.createRadialGradient(sunX, sunY, 6, sunX, sunY, 150); sg.addColorStop(0, "rgba(255,250,225,1)"); sg.addColorStop(.18, "rgba(255,240,200,.9)"); sg.addColorStop(1, "rgba(255,240,200,0)"); g.fillStyle = sg; g.fillRect(sunX - 150, sunY - 150, 300, 300); }
    if (k === "office") return paintOffice(g, W, H, t, o);
    /* distant land */
    if (hy > 0) {
      if (k === "snow" || k === "lake") { g.fillStyle = "#8C9AA6"; g.beginPath(); g.moveTo(0, hy); for (let x = 0; x <= W; x += 60) g.lineTo(x, hy - 60 - 70 * Math.abs(Math.sin(x * .006 + 1)) - 40 * Math.abs(Math.sin(x * .017))); g.lineTo(W, hy); g.fill();
        g.fillStyle = "#F4F6F8"; g.beginPath(); g.moveTo(0, hy); for (let x = 0; x <= W; x += 60) { const top = hy - 60 - 70 * Math.abs(Math.sin(x * .006 + 1)) - 40 * Math.abs(Math.sin(x * .017)); g.lineTo(x, k === "snow" ? top + 4 : top + 30 > hy ? hy : top + 22); } g.lineTo(W, hy); g.globalAlpha = k === "snow" ? 1 : .55; g.fill(); g.globalAlpha = 1; }
      else if (k === "city") { for (let i = 0; i < 18; i++) { const x = i * 68 - 20, bh = 60 + R() * 150; g.fillStyle = i % 3 ? "#A9B4BD" : "#8F9CA7"; g.fillRect(x, hy - bh, 62, bh); g.fillStyle = "rgba(255,255,255,.35)"; for (let y = hy - bh + 10; y < hy - 10; y += 16) g.fillRect(x + 8, y, 46, 5); } }
      else { g.fillStyle = "#9FB2A2"; g.beginPath(); g.moveTo(0, hy); for (let x = 0; x <= W; x += 40) g.lineTo(x, hy - 22 - 18 * Math.sin(x * .008 + 2) - 10 * Math.sin(x * .021)); g.lineTo(W, hy); g.fill(); }
    }
    const ground = { mix: "#6F8F5E", water: "#2E6F86", road: "#7D8B6E", sea: "#2B6C8E", beach: "#E6D5AE", golf: "#6FA05C", lake: "#6F8F5E", pool: "#D9D2C4", snow: "#F2F5F8", city: "#B9B2A6" }[k] || "#6F8F5E";
    g.fillStyle = ground; g.fillRect(0, hy, W, H - hy);
    if (k === "mix") { const wy1 = hy + (H - hy) * .56; paintWater(g, 0, W, hy, wy1, t, o, R, sunX); g.fillStyle = "#7E9467"; g.fillRect(0, wy1, W, (H - hy) * .08); paintRoadBand(g, W, wy1 + (H - hy) * .08, H, t, o); paintCar(g, W * .66 + Math.sin(t / 5000) * 30, H - (H - wy1) * .42, .95, t, o, "#9C2F25"); }
    else if (k === "water") { paintWater(g, 0, W, hy, H, t, o, R, sunX); if (o.angler) paintAngler(g, W * .14, H, o); }
    else if (k === "sea") { paintWater(g, 0, W, hy, H, t, o, R, sunX, true); paintBoat(g, W * .64, hy + (H - hy) * .3, 1, t, o); }
    else if (k === "road") { paintRoad(g, W, H, hy, W * .5, W * .02, W * .98, t, o); paintCar(g, W * .42, hy + (H - hy) * .36, .8, t, o, "#2F4A6B"); paintCar(g, W * .6, hy + (H - hy) * .62, 1.25, t, o, "#9C2F25"); }
    else if (k === "beach") { paintWater(g, 0, W, hy, hy + (H - hy) * .45, t, o, R, sunX, true); const sg = sceneGlare(o, "sand"); const sd = g.createLinearGradient(0, hy + (H - hy) * .45, 0, H); sd.addColorStop(0, "#C9B993"); sd.addColorStop(.12, "#E8D8B2"); sd.addColorStop(1, "#F1E4C6"); g.fillStyle = sd; g.fillRect(0, hy + (H - hy) * .45, W, H);
      g.save(); g.globalAlpha = .55 * sg; g.fillStyle = "#fff"; g.beginPath(); g.ellipse(W * .5, hy + (H - hy) * .5, W * .5, 16, 0, 0, 7); g.fill(); g.restore(); paintUmbrella(g, W * .72, H * .9, 1); }
    else if (k === "golf") { const gy = hy + (H - hy) * .35; paintWater(g, W * .05, W * .55, gy, gy + (H - hy) * .3, t, o, R, sunX); g.fillStyle = "#83B66A"; g.beginPath(); g.ellipse(W * .76, hy + (H - hy) * .5, 220, 60, 0, 0, 7); g.fill(); g.strokeStyle = P.ink; g.lineWidth = 3; g.beginPath(); g.moveTo(W * .78, hy + (H - hy) * .5); g.lineTo(W * .78, hy + (H - hy) * .5 - 110); g.stroke(); g.fillStyle = "#C0392B"; g.beginPath(); g.moveTo(W * .78, hy + (H - hy) * .5 - 110); g.lineTo(W * .78 + 46, hy + (H - hy) * .5 - 96); g.lineTo(W * .78, hy + (H - hy) * .5 - 82); g.fill(); }
    else if (k === "lake") { paintWater(g, W * .1, W * .9, hy, hy + (H - hy) * .55, t, o, R, sunX); g.fillStyle = "#B9A27A"; g.beginPath(); g.moveTo(W * .2, H); g.quadraticCurveTo(W * .45, hy + (H - hy) * .7, W * .55, hy + (H - hy) * .58); g.lineTo(W * .62, hy + (H - hy) * .58); g.quadraticCurveTo(W * .58, hy + (H - hy) * .75, W * .5, H); g.fill(); paintHiker(g, W * .5, hy + (H - hy) * .78, .9); }
    else if (k === "pool") { const py = hy + (H - hy) * .3; paintPool(g, W * .06, py, W * .6, H - py - 30, t, o); paintFacade(g, W * .7, hy - 180, W * .28, 180 + (H - hy) * .4, o); }
    else if (k === "snow") { paintSnow(g, W, H, hy, t, o); }
    else if (k === "city") { paintRoad(g, W, H, hy, W * .5, W * .08, W * .92, t, o); paintFacade(g, 0, hy - 160, W * .18, 160 + (H - hy) * .3, o); paintCar(g, W * .55, hy + (H - hy) * .55, 1.1, t, o, "#E8E2D6"); }
  }
  function paintWater(g, x0, x1, y0, y1, t, o, R, sunX, sea) {
    const w = x1 - x0, hh = y1 - y0; if (hh <= 0) return;
    const gl = sceneGlare(o, "water"), see = 1 - gl * .92;
    g.save(); g.beginPath(); g.rect(x0, y0, w, hh); g.clip();
    const wg = g.createLinearGradient(0, y0, 0, y1); wg.addColorStop(0, sea ? "#4B86A6" : "#5C8C8C"); wg.addColorStop(1, sea ? "#1C566F" : "#2F5E58"); g.fillStyle = wg; g.fillRect(x0, y0, w, hh);
    /* what lies under the surface: shows when glare is removed */
    g.globalAlpha = .25 + .75 * see;
    const rr2 = rng(31); for (let i = 0; i < 26; i++) { const rx = x0 + rr2() * w, ry = y0 + hh * (.35 + rr2() * .65), s = 10 + rr2() * 34 * (ry - y0) / hh; g.fillStyle = i % 3 ? "#4E6E5E" : "#6B7D66"; g.beginPath(); g.ellipse(rx, ry, s * 1.4, s * .7, 0, 0, 7); g.fill(); }
    g.strokeStyle = "rgba(120,170,110,.9)"; g.lineWidth = 4; for (let i = 0; i < 14; i++) { const rx = x0 + ((i * 97) % w), ry = y1 - 10; g.beginPath(); g.moveTo(rx, ry); g.quadraticCurveTo(rx + 12 * Math.sin(t / 900 + i), ry - 60, rx + 6, ry - 90 - i % 3 * 20); g.stroke(); }
    for (let i = 0; i < 4; i++) { const fx = x0 + ((t / 30 * (i % 2 ? 1 : -.8) + i * 300) % (w + 200) + w + 200) % (w + 200) - 100, fy = y0 + hh * (.5 + i * .11), s = .7 + i * .18; paintFish(g, fx, fy, s, i % 2 ? 1 : -1); }
    g.globalAlpha = 1;
    /* ripples */
    g.strokeStyle = "rgba(255,255,255,.18)"; g.lineWidth = 2; for (let i = 0; i < 9; i++) { const yy = y0 + hh * (i + 1) / 10; g.beginPath(); for (let x = x0; x <= x1; x += 14) { const y = yy + Math.sin(x * .03 + t / 700 + i) * (2 + i * .4); x === x0 ? g.moveTo(x, y) : g.lineTo(x, y); } g.stroke(); }
    /* glare: a sheet of sky reflection plus the sun's glitter path */
    if (gl > 0) {
      const sh = g.createLinearGradient(0, y0, 0, y1); sh.addColorStop(0, `rgba(250,252,255,${.92 * gl})`); sh.addColorStop(.55, `rgba(235,244,250,${.62 * gl})`); sh.addColorStop(1, `rgba(220,235,245,${.38 * gl})`); g.fillStyle = sh; g.fillRect(x0, y0, w, hh);
      const n = 150, R3 = rng(11); for (let i = 0; i < n; i++) { const yy = y0 + hh * R3() ** 1.6, spread = 30 + (yy - y0) * .55, xx = clamp(sunX, x0 + 40, x1 - 40) + (R3() - .5) * 2 * spread, ph = R3() * 6.28, a = (.5 + .5 * Math.sin(t / 160 + ph)) * gl; if (xx > x0 && xx < x1) sparkle(g, xx, yy, 3 + (yy - y0) / hh * 7, a); }
    }
    g.restore();
  }
  function paintFish(g, x, y, s, dir) { g.save(); g.translate(x, y); g.scale(s * dir, s); g.fillStyle = "#3A4A42"; g.beginPath(); g.ellipse(0, 0, 34, 11, 0, 0, 7); g.fill(); g.beginPath(); g.moveTo(-30, 0); g.lineTo(-50, -12); g.lineTo(-50, 12); g.fill(); g.restore(); }
  function paintRoad(g, W, H, hy, vx, xl, xr, t, o) {
    const gl = sceneGlare(o, "road");
    g.fillStyle = "#4A4C50"; g.beginPath(); g.moveTo(vx - 4, hy); g.lineTo(vx + 4, hy); g.lineTo(xr, H); g.lineTo(xl, H); g.closePath(); g.fill();
    g.save(); g.clip();
    g.strokeStyle = "rgba(240,236,220,.9)"; g.lineWidth = 3;
    for (let i = 0; i < 12; i++) { const k1 = ((i / 12 + t / 9000) % 1) ** 2, k2 = Math.min(1, k1 + .035 + k1 * .05), x1 = vx + (( xl + xr) / 2 - vx) * k1, y1 = hy + (H - hy) * k1, x2 = vx + ((xl + xr) / 2 - vx) * k2, y2 = hy + (H - hy) * k2; g.lineWidth = 2 + 10 * k1; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); }
    if (gl > 0) { const sh = g.createLinearGradient(0, hy, 0, H); sh.addColorStop(0, `rgba(255,252,240,${.95 * gl})`); sh.addColorStop(.4, `rgba(255,250,235,${.6 * gl})`); sh.addColorStop(1, `rgba(255,250,235,${.12 * gl})`); g.fillStyle = sh; g.fillRect(0, hy, W, H - hy);
      const R4 = rng(5); for (let i = 0; i < 40; i++) { const k1 = R4() ** 1.4, xx = vx + (R4() - .5) * (xr - xl) * k1, yy = hy + (H - hy) * k1; sparkle(g, xx, yy, 2 + 5 * k1, gl * (.4 + .6 * Math.abs(Math.sin(t / 300 + i)))); } }
    g.restore();
  }
  /* a wet road running across the foreground */
  function paintRoadBand(g, W, y0, y1, t, o) {
    const gl = sceneGlare(o, "road"), hh = y1 - y0;
    const rg = g.createLinearGradient(0, y0, 0, y1); rg.addColorStop(0, "#55585C"); rg.addColorStop(1, "#3E4044"); g.fillStyle = rg; g.fillRect(0, y0, W, hh);
    g.fillStyle = "rgba(240,236,220,.9)"; const off = (t / 40) % 120; for (let x = -120 + off; x < W; x += 120) g.fillRect(x, y0 + hh * .5 - 3, 64, 6);
    g.fillStyle = "#D9D3C4"; g.fillRect(0, y0, W, 4);
    if (gl > 0) { const sh = g.createLinearGradient(0, y0, 0, y1); sh.addColorStop(0, `rgba(255,252,240,${.85 * gl})`); sh.addColorStop(.5, `rgba(255,250,235,${.5 * gl})`); sh.addColorStop(1, `rgba(255,250,235,${.2 * gl})`); g.fillStyle = sh; g.fillRect(0, y0, W, hh);
      const R4 = rng(5); for (let i = 0; i < 46; i++) sparkle(g, R4() * W, y0 + R4() * hh, 3 + R4() * 5, gl * (.4 + .6 * Math.abs(Math.sin(t / 300 + i)))); }
  }
  function paintCar(g, x, y, s, t, o, col) {
    const gl = sceneGlare(o, "car"), gg = sceneGlare(o, "glass");
    g.save(); g.translate(x, y); g.scale(s, s);
    g.fillStyle = "rgba(0,0,0,.28)"; g.beginPath(); g.ellipse(0, 52, 120, 14, 0, 0, 7); g.fill();
    g.fillStyle = col; rr(g, -110, -10, 220, 60, 18); g.fill();
    g.beginPath(); g.moveTo(-72, -10); g.lineTo(-48, -56); g.lineTo(48, -56); g.lineTo(76, -10); g.closePath(); g.fill();
    g.fillStyle = "#283440"; g.beginPath(); g.moveTo(-60, -14); g.lineTo(-42, -48); g.lineTo(42, -48); g.lineTo(62, -14); g.closePath(); g.fill();
    g.fillStyle = "#1A1A1A"; [-70, 70].forEach((wx) => { g.beginPath(); g.arc(wx, 50, 20, 0, 7); g.fill(); });
    g.fillStyle = "#F4E7B8"; g.fillRect(-104, 8, 26, 12); g.fillRect(78, 8, 26, 12);
    if (gg > 0) { const wg = g.createLinearGradient(-60, -48, 60, -14); wg.addColorStop(0, `rgba(255,255,255,${.95 * gg})`); wg.addColorStop(1, `rgba(255,255,255,${.25 * gg})`); g.fillStyle = wg; g.beginPath(); g.moveTo(-60, -14); g.lineTo(-42, -48); g.lineTo(42, -48); g.lineTo(62, -14); g.closePath(); g.fill(); }
    if (gl > 0) { g.fillStyle = `rgba(255,255,255,${.85 * gl})`; g.beginPath(); g.ellipse(-20, -6, 70, 7, 0, 0, 7); g.fill(); sparkle(g, 30, -8, 9, gl); }
    g.restore();
  }
  function paintBoat(g, x, y, s, t, o) { g.save(); g.translate(x, y + Math.sin(t / 700) * 4); g.scale(s, s); g.fillStyle = "#F4F1EA"; g.beginPath(); g.moveTo(-90, 0); g.lineTo(90, 0); g.lineTo(64, 26); g.lineTo(-70, 26); g.closePath(); g.fill(); g.strokeStyle = P.ink; g.lineWidth = 3; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -170); g.stroke(); g.fillStyle = "#FBFAF7"; g.beginPath(); g.moveTo(4, -165); g.lineTo(80, -10); g.lineTo(4, -10); g.fill(); g.fillStyle = "#E9E2D2"; g.beginPath(); g.moveTo(-4, -140); g.lineTo(-60, -10); g.lineTo(-4, -10); g.fill();
    const gl = sceneGlare(o, "water"); if (gl > 0) sparkle(g, -30, 6, 10, gl * .9); g.restore(); }
  function paintUmbrella(g, x, y, s) { g.save(); g.translate(x, y); g.scale(s, s); g.strokeStyle = "#5B4A36"; g.lineWidth = 5; g.beginPath(); g.moveTo(0, 0); g.lineTo(-16, -230); g.stroke(); g.fillStyle = "#C2553E"; g.beginPath(); g.moveTo(-170, -190); g.quadraticCurveTo(-16, -330, 140, -210); g.closePath(); g.fill(); g.fillStyle = "#F4EEE2"; g.beginPath(); g.moveTo(-90, -214); g.quadraticCurveTo(-16, -320, 54, -224); g.closePath(); g.fill(); g.restore(); }
  function paintAngler(g, x, y, o) { g.save(); g.translate(x, y); g.fillStyle = "#2B2A28"; g.beginPath(); g.ellipse(0, -150, 22, 26, 0, 0, 7); g.fill(); rr(g, -34, -128, 68, 128, 18); g.fill(); g.fillStyle = "#3F3B33"; g.beginPath(); g.ellipse(0, -170, 40, 9, 0, 0, 7); g.fill(); g.strokeStyle = "#2B2A28"; g.lineWidth = 4; g.beginPath(); g.moveTo(20, -90); g.quadraticCurveTo(160, -260, 330, -200); g.stroke(); g.lineWidth = 1.2; g.beginPath(); g.moveTo(330, -200); g.lineTo(350, -40); g.stroke(); g.restore(); }
  function paintHiker(g, x, y, s) { g.save(); g.translate(x, y); g.scale(s, s); g.fillStyle = "#2B2A28"; g.beginPath(); g.arc(0, -120, 16, 0, 7); g.fill(); rr(g, -18, -102, 36, 66, 10); g.fill(); g.fillStyle = "#8A6B32"; rr(g, -30, -100, 18, 50, 6); g.fill(); g.strokeStyle = "#2B2A28"; g.lineWidth = 9; g.lineCap = "round"; g.beginPath(); g.moveTo(-8, -38); g.lineTo(-14, 0); g.moveTo(8, -38); g.lineTo(18, 0); g.stroke(); g.lineWidth = 3; g.beginPath(); g.moveTo(22, -80); g.lineTo(34, 0); g.stroke(); g.restore(); }
  function paintPool(g, x, y, w, hh, t, o) { const gl = sceneGlare(o, "pool"); g.fillStyle = "#EDE7DB"; g.fillRect(x - 16, y - 16, w + 32, hh + 32); const pg = g.createLinearGradient(0, y, 0, y + hh); pg.addColorStop(0, "#6CC3D6"); pg.addColorStop(1, "#2F93AE"); g.fillStyle = pg; g.fillRect(x, y, w, hh);
    g.save(); g.beginPath(); g.rect(x, y, w, hh); g.clip(); g.globalAlpha = .25 + .75 * (1 - gl * .9); g.strokeStyle = "rgba(255,255,255,.6)"; g.lineWidth = 2; for (let i = 0; i < 12; i++) { g.beginPath(); for (let xx = x; xx <= x + w; xx += 12) { const yy = y + (i + .5) * hh / 12 + Math.sin(xx * .05 + t / 500 + i * 2) * 5; xx === x ? g.moveTo(xx, yy) : g.lineTo(xx, yy); } g.stroke(); } g.strokeStyle = "#1F6E85"; g.lineWidth = 6; for (let i = 1; i < 6; i++) { g.beginPath(); g.moveTo(x + i * w / 6, y + hh * .3); g.lineTo(x + i * w / 6, y + hh * .95); g.stroke(); } g.globalAlpha = 1;
    if (gl > 0) { g.fillStyle = `rgba(255,255,255,${.75 * gl})`; g.fillRect(x, y, w, hh); for (let i = 0; i < 50; i++) sparkle(g, x + (i * 137) % w, y + (i * 71) % hh, 4, gl * (.5 + .5 * Math.sin(t / 200 + i))); } g.restore(); }
  function paintFacade(g, x, y, w, hh, o) { const gg = sceneGlare(o, "glass"); g.fillStyle = "#6E7F8C"; g.fillRect(x, y, w, hh); for (let r = 0; r < 8; r++) for (let c = 0; c < 4; c++) { const fx = x + 8 + c * (w - 8) / 4, fy = y + 8 + r * (hh - 8) / 8; const lg = g.createLinearGradient(fx, fy, fx + 40, fy + 40); lg.addColorStop(0, `rgba(230,240,248,${.35 + .6 * gg})`); lg.addColorStop(1, "rgba(120,150,170,.6)"); g.fillStyle = lg; g.fillRect(fx, fy, (w - 8) / 4 - 8, (hh - 8) / 8 - 8); } }
  function paintSnow(g, W, H, hy, t, o) { const gi = sceneGlare(o, "ice"); const sg = g.createLinearGradient(0, hy, 0, H); sg.addColorStop(0, "#E9EEF3"); sg.addColorStop(1, "#FDFEFF"); g.fillStyle = sg; g.fillRect(0, hy, W, H - hy);
    g.strokeStyle = "rgba(150,170,190,.35)"; g.lineWidth = 3; for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(W * (.1 + i * .16), H); g.quadraticCurveTo(W * (.3 + i * .1), hy + (H - hy) * .4, W * (.45 + i * .02), hy); g.stroke(); }
    /* icy patch: looks like snow, but shines */
    const ix = W * .56, iy = hy + (H - hy) * .58; g.fillStyle = "#DCE6EE"; g.beginPath(); g.ellipse(ix, iy, 210, 48, -.05, 0, 7); g.fill();
    if (gi > 0) { const ig = g.createRadialGradient(ix - 30, iy - 6, 10, ix, iy, 210); ig.addColorStop(0, `rgba(255,255,255,${gi})`); ig.addColorStop(.6, `rgba(240,248,255,${.7 * gi})`); ig.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = ig; g.beginPath(); g.ellipse(ix, iy, 210, 48, -.05, 0, 7); g.fill(); for (let i = 0; i < 16; i++) sparkle(g, ix - 170 + i * 22, iy + Math.sin(i * 2.1) * 20, 4, gi * (.4 + .6 * Math.abs(Math.sin(t / 260 + i)))); }
    g.strokeStyle = "rgba(90,110,130,.55)"; g.setLineDash([8, 8]); g.lineWidth = 2; g.beginPath(); g.ellipse(ix, iy, 228, 62, -.05, 0, 7); g.stroke(); g.setLineDash([]); }
  function paintOffice(g, W, H, t, o) { g.fillStyle = "#E9E3D8"; g.fillRect(0, 0, W, H); g.fillStyle = "#D8CFBF"; g.fillRect(0, H * .66, W, H * .34); g.fillStyle = "#B9A27A"; g.fillRect(0, H * .64, W, 18);
    [[W * .3, "#1E2A36"], [W * .64, "#1E2A36"]].forEach(([x, c]) => { g.fillStyle = "#2B2A28"; rr(g, x - 190, H * .2, 380, 250, 10); g.fill(); g.fillStyle = "#EAF1F6"; g.fillRect(x - 176, H * .2 + 14, 352, 212); g.fillStyle = "#9FB3C2"; for (let i = 0; i < 6; i++) g.fillRect(x - 150, H * .2 + 40 + i * 28, 140 + (i * 53) % 150, 10); g.fillStyle = "#2B2A28"; g.fillRect(x - 12, H * .2 + 250, 24, 60); g.fillRect(x - 70, H * .64 - 8, 140, 10); });
    g.fillStyle = "rgba(255,255,240,.8)"; for (let i = 0; i < 3; i++) g.fillRect(W * (.15 + i * .3), 10, 160, 12); }

  return { RM, P, FONT, SERIF, esc, clamp, lerp, D2R, rng, h, fresnel, brewster, polRatio, polDegree, stage, seg, slider, btn, rr, text, pill, arrow, vib, sparkle, lensPath, tintRect, paintScene, sceneGlare, paintCar, paintWater, paintFish };
})();
