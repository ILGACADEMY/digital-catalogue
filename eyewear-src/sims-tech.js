/* =====================================================================
   MODULE B · LENS TECHNOLOGIES — one canvas sim with a mode per technology
   ===================================================================== */
(function () {
"use strict";
const { P, esc, clamp, lerp, D2R, h, stage, seg, slider, btn, rr, text, pill, arrow, sparkle, lensPath, tintRect, paintScene, rng } = KIT;
const L = LENS;
const live = (ctx, html) => { const el = ctx.side && ctx.side.querySelector("[data-live]"); if (el) el.innerHTML = html; };

/* shared: a pair of glasses drawn over whatever paint() draws inside the lenses */
function glasses(g, S, cx, cy, a, b, gap, paintIn, o = {}) {
  g.save(); g.beginPath(); lensPath(g, cx - gap / 2 - a, cy, a, b, o.shape); lensPath(g, cx + gap / 2 + a, cy, a, b, o.shape); g.clip(); paintIn(); g.restore();
  g.lineWidth = o.lw || 12; g.strokeStyle = o.frame || "#1B1A17"; g.beginPath(); lensPath(g, cx - gap / 2 - a, cy, a, b, o.shape); g.stroke(); g.beginPath(); lensPath(g, cx + gap / 2 + a, cy, a, b, o.shape); g.stroke();
  g.beginPath(); g.moveTo(cx - gap / 2 - 6, cy - b + 30); g.quadraticCurveTo(cx, cy - b - 4, cx + gap / 2 + 6, cy - b + 30); g.stroke();
}
function room(g, W, H) { g.fillStyle = "#E8E0D2"; g.fillRect(0, 0, W, H); g.fillStyle = "#D7CCB8"; g.fillRect(0, H * .72, W, H); for (let i = 0; i < 5; i++) { g.fillStyle = "#B9A27A"; g.fillRect(W * .06 + i * W * .19, H * .2, W * .15, 10); g.fillStyle = ["#7A8C99", "#A65E4B", "#556B57", "#C9A24E", "#3E4A5A"][i]; for (let j = 0; j < 4; j++) g.fillRect(W * .07 + i * W * .19 + j * 30, H * .2 - 70 + (j % 2) * 10, 24, 70 - (j % 2) * 10); }
  g.fillStyle = "#FFFDF4"; for (let i = 0; i < 3; i++) { g.fillRect(W * (.14 + i * .32), 0, 150, 14); } }
function face(g, cx, cy, sp) { const W = 1140, H = 1400; const sk = g.createRadialGradient(cx, cy + 80, 40, cx, cy + 80, 760); sk.addColorStop(0, "#E4C4A8"); sk.addColorStop(.7, "#CFA585"); sk.addColorStop(1, "#B58A6C"); g.fillStyle = sk; g.fillRect(0, 0, W, H);
  g.fillStyle = "#3B2B21"; g.beginPath(); g.moveTo(0, 0); g.lineTo(W, 0); g.lineTo(W, cy - 210); g.quadraticCurveTo(cx, cy - 300, 0, cy - 200); g.closePath(); g.fill();
  g.strokeStyle = "rgba(150,105,80,.35)"; g.lineWidth = 10; g.lineCap = "round"; g.beginPath(); g.moveTo(cx - 22, cy + 40); g.quadraticCurveTo(cx - 34, cy + 190, cx - 6, cy + 250); g.stroke();
  [-1, 1].forEach((s) => { g.fillStyle = "#fff"; g.beginPath(); g.ellipse(cx + s * sp, cy, 48, 22, 0, 0, 7); g.fill(); g.fillStyle = "#4A3426"; g.beginPath(); g.arc(cx + s * sp, cy, 16, 0, 7); g.fill(); g.fillStyle = "#111"; g.beginPath(); g.arc(cx + s * sp, cy, 7, 0, 7); g.fill(); g.strokeStyle = "#5A3E2E"; g.lineWidth = 6; g.beginPath(); g.moveTo(cx + s * sp - 50, cy - 50); g.quadraticCurveTo(cx + s * sp, cy - 70, cx + s * sp + 50, cy - 52); g.stroke(); }); }
function panel(g, x, y, w, hh, title) { rr(g, x, y, w, hh, 8); g.fillStyle = P.card; g.fill(); g.strokeStyle = P.line; g.lineWidth = 2; g.stroke(); text(g, title, x + w / 2, y + 34, { size: 20, w: 700, align: "center" }); }

const MODES = {};

/* B1 anti-reflective */
MODES.ar = (S, ctx) => {
  let v = "cmp";
  const s = seg("Lens", [["off", "No AR"], ["on", "With AR"], ["cmp", "Compare"]], v, (x) => { v = x; ctx.changed(); }); S.ui.append(s);
  const lights = [[.18, .2], [.52, .16], [.78, .26]];
  return { draw(g, W, H, t) { room(g, W, H); const cx = W / 2, cy = H * .5; face(g, cx, cy + 10, 190);
      const refl = (side) => { const on = v === "on" || (v === "cmp" && side > 0); const c = (lx, ly, r) => { g.save(); g.globalAlpha = on ? .14 : .78; g.fillStyle = on ? "#9BE3B0" : "#fff"; g.beginPath(); g.ellipse(lx, ly, r * 1.6, r * .6, -.3, 0, 7); g.fill(); g.restore(); };
        [-1, 1].forEach((sd) => { const lx0 = cx + sd * 210; if (v === "cmp" && sd !== side) return; c(lx0 - 60, cy - 40, 34); c(lx0 + 40, cy - 60, 22); g.save(); g.globalAlpha = on ? .06 : .35; g.fillStyle = "#fff"; g.fillRect(lx0 - 120, cy + 10, 240, 30); g.restore(); }); };
      glasses(g, S, cx, cy, 190, 140, 40, () => { g.fillStyle = "rgba(230,240,245,.08)"; g.fillRect(0, 0, W, H); refl(-1); refl(1); }, { lw: 10 });
      if (v === "cmp") { pill(g, "No AR", cx - 210, cy + 190, { align: "center", size: 18 }); pill(g, "With AR", cx + 210, cy + 190, { align: "center", size: 18, bg: "rgba(138,107,50,.94)" }); }
      else pill(g, v === "on" ? "With AR: faint residual colour" : "No AR: reflections of the lights", cx, cy + 190, { align: "center", size: 18 });
      /* light-path inset */
      const x0 = 26, y0 = H - 196; rr(g, x0, y0, 330, 170, 6); g.fillStyle = P.card; g.fill(); text(g, "LIGHT AT THE SURFACE", x0 + 14, y0 + 26, { size: 12, color: P.gold, w: 700 });
      g.fillStyle = "#C9D8E2"; g.fillRect(x0 + 170, y0 + 40, 30, 116); if (v !== "off") { g.fillStyle = P.gold2; g.fillRect(x0 + 166, y0 + 40, 4, 116); }
      arrow(g, x0 + 30, y0 + 70, x0 + 164, y0 + 100, { color: "#D8A93A", w: 4 }); arrow(g, x0 + 200, y0 + 100, x0 + 316, y0 + 130, { color: "#D8A93A", w: 4 });
      const on = v !== "off"; arrow(g, x0 + 164, y0 + 104, x0 + 40, y0 + 140, { color: on ? "rgba(62,122,74,.6)" : P.red, w: on ? 1.6 : 4 }); text(g, on ? "less reflected" : "reflected", x0 + 34, y0 + 162, { size: 13, color: on ? P.green : P.red, w: 600 }); },
    acts: () => [["off", "No AR", v === "off"], ["on", "With AR", v === "on"], ["cmp", "Compare", v === "cmp"]], act(a) { v = a; s.set(a); } };
};

/* B2 hard coat */
MODES.hard = (S, ctx) => {
  let coat = true, grit = false, wipe = -1, scr = []; const R = rng(4);
  const sc = seg("Lens", [["1", "Hard-coated"], ["0", "Uncoated"]], "1", (x) => { coat = x === "1"; scr = []; ctx.changed(); });
  const bg = btn("Add sand", () => { grit = true; ctx.changed(); }), bw = btn("Wipe dry", () => doWipe()), br = btn("Rinse first", () => { grit = false; ctx.toast("Rinsed: the grit is gone"); ctx.changed(); }), bx = btn("Reset", () => { scr = []; grit = false; ctx.changed(); });
  S.ui.append(sc, bg, bw, br, bx);
  function doWipe() { wipe = performance.now(); if (grit) { const n = coat ? 3 : 11; for (let i = 0; i < n; i++) { const y = 140 + R() * 300, x = 80 + R() * 200; scr.push([x, y, 120 + R() * 220, (R() - .5) * .5, coat ? .25 : .7, coat ? 1.2 : 2.4]); } } ctx.changed(); }
  return { draw(g, W, H, t) {
      g.fillStyle = P.bg; g.fillRect(0, 0, W, H);
      /* top view of the lens */
      const cx = W * .3, cy = H * .5; g.save(); g.beginPath(); g.arc(cx, cy, 230, 0, 7); g.clip(); g.fillStyle = "rgba(150,185,210,.38)"; g.fillRect(0, 0, W, H);
      scr.forEach(([x, y, l, a, al, w]) => { g.save(); g.translate(cx - 230 + x, cy - 230 + y); g.rotate(a); g.strokeStyle = `rgba(255,255,255,${al})`; g.lineWidth = w; g.beginPath(); g.moveTo(0, 0); g.lineTo(l, 0); g.stroke(); g.strokeStyle = `rgba(90,100,110,${al * .5})`; g.lineWidth = 1; g.beginPath(); g.moveTo(0, w); g.lineTo(l, w); g.stroke(); g.restore(); });
      if (grit) { const r2 = rng(9); for (let i = 0; i < 90; i++) { g.fillStyle = `rgba(${150 + r2() * 60},${120 + r2() * 40},${70 + r2() * 30},.95)`; g.beginPath(); g.arc(cx - 200 + r2() * 400, cy - 200 + r2() * 400, 2 + r2() * 4, 0, 7); g.fill(); } }
      const k = wipe > 0 ? (performance.now() - wipe) / 900 : 2; if (k < 1) { g.fillStyle = "rgba(180,170,155,.85)"; rr(g, cx - 260 + k * 420, cy - 260, 140, 520, 30); g.fill(); }
      g.restore(); g.strokeStyle = P.ink; g.lineWidth = 6; g.beginPath(); g.arc(cx, cy, 230, 0, 7); g.stroke();
      text(g, coat ? "Hard-coated lens" : "Uncoated lens", cx, cy + 270, { size: 20, align: "center", w: 700 });
      /* cross-section (exaggerated) */
      const x0 = W * .58, y0 = H * .22, w = W * .36; text(g, "CROSS-SECTION (not to scale)", x0, y0 - 20, { size: 13, color: P.gold, w: 700 });
      if (coat) { g.fillStyle = P.gold2; g.fillRect(x0, y0, w, 24); }
      g.fillStyle = "#B9CCD8"; g.fillRect(x0, y0 + (coat ? 24 : 0), w, 180);
      text(g, "lens material (substrate)", x0 + w / 2, y0 + 120, { size: 18, align: "center", w: 600, color: "#16202A" }); if (coat) text(g, "hard coat", x0 + w / 2, y0 + 18, { size: 15, align: "center", w: 700, color: "#fff" });
      const lines = coat ? ["Resists fine everyday abrasion", "Sand still scratches if wiped dry", "Scratch-resistant ≠ scratch-proof"] : ["Softer plastic surface", "Scuffs more easily", "Most lenses today carry a hard coat"];
      lines.forEach((l, i) => text(g, "• " + l, x0, y0 + 250 + i * 32, { size: 18 }));
      pill(g, "Illustration only — never test on customer merchandise", 22, 34, { size: 15 }); },
    acts: () => [["c:1", "Hard-coated", coat], ["c:0", "Uncoated", !coat], ["grit", "Add sand"], ["wipe", "Wipe dry"], ["rinse", "Rinse first"], ["reset", "Reset"]],
    act(a) { if (a.startsWith("c:")) { coat = a === "c:1"; sc.set(a.slice(2)); scr = []; } else if (a === "grit") grit = true; else if (a === "wipe") doWipe(); else if (a === "rinse") grit = false; else { scr = []; grit = false; } } };
};

/* B3 hydrophobic / B4 oleophobic / B5 anti-static share a two-panel layout */
function twoPanels(g, W, H, titles) { g.fillStyle = P.bg; g.fillRect(0, 0, W, H); panel(g, 20, 20, W / 2 - 30, H - 40, titles[0]); panel(g, W / 2 + 10, 20, W / 2 - 30, H - 40, titles[1]); return [[W / 4, H * .55], [W * 3 / 4, H * .55]]; }
MODES.hydro = (S, ctx) => {
  let drops = [], tilt = 0, t0 = 0; const R = rng(3);
  const b1 = btn("Splash water", () => splash()), b2 = btn("Tilt the lens", () => { tilt = 1; t0 = performance.now(); ctx.changed(); }), b3 = btn("Reset", () => { drops = []; tilt = 0; ctx.changed(); });
  S.ui.append(b1, b2, b3);
  function splash() { drops = []; tilt = 0; for (let i = 0; i < 26; i++) drops.push({ x: (R() - .5) * 300, y: (R() - .5) * 240, r: 8 + R() * 14 }); ctx.changed(); }
  splash();
  return { draw(g, W, H, t) {
      const c = twoPanels(g, W, H, ["Untreated: water spreads", "Hydrophobic: water beads"]);
      const k = tilt ? clamp((performance.now() - t0) / 2200, 0, 1) : 0;
      c.forEach(([cx, cy], side) => {
        /* contact-angle profile */
        const py = 110; g.fillStyle = "#B9CCD8"; g.fillRect(cx - 160, py + 40, 320, 16);
        g.fillStyle = "rgba(70,140,200,.75)"; g.beginPath(); if (side) { g.arc(cx, py + 6, 34, Math.PI * .85, Math.PI * .15 + 2 * Math.PI); } else { g.ellipse(cx, py + 40, 90, 18, 0, Math.PI, 2 * Math.PI); } g.closePath(); g.fill();
        text(g, side ? "high contact angle: a round bead" : "low contact angle: a flat film", cx, py + 84, { size: 15, color: P.mute, align: "center" });
        /* top view */
        const ly = cy + 50; g.save(); g.beginPath(); g.arc(cx, ly, 170, 0, 7); g.clip(); g.fillStyle = "rgba(150,185,210,.38)"; g.fillRect(cx - 200, ly - 200, 400, 400);
        drops.forEach((d) => { if (side) { const yy = ly + d.y * .7 + k * 500 * (.5 + d.r / 30); const rr2 = d.r * .8; const gg = g.createRadialGradient(cx + d.x * .5 - rr2 * .3, yy - rr2 * .3, 1, cx + d.x * .5, yy, rr2); gg.addColorStop(0, "rgba(255,255,255,.95)"); gg.addColorStop(1, "rgba(60,120,180,.55)"); g.fillStyle = gg; g.beginPath(); g.arc(cx + d.x * .5, yy, rr2, 0, 7); g.fill(); }
          else { g.fillStyle = "rgba(90,150,200,.22)"; g.beginPath(); g.ellipse(cx + d.x * .5, ly + d.y * .7 + k * 40, d.r * 2.4 + k * 10, d.r * 1.6 + k * 26, 0, 0, 7); g.fill(); } });
        g.restore(); g.strokeStyle = P.ink; g.lineWidth = 5; g.beginPath(); g.arc(cx, ly, 170, 0, 7); g.stroke();
      });
      pill(g, "Water-repellent is not waterproof — and doesn't stop smudges or scratches", W / 2, H - 46, { align: "center", size: 15 }); },
    acts: () => [["splash", "Splash water"], ["tilt", "Tilt the lens"], ["reset", "Reset"]], act(a) { if (a === "splash") splash(); else if (a === "tilt") { tilt = 1; t0 = performance.now(); } else { drops = []; tilt = 0; } } };
};
MODES.oleo = (S, ctx) => {
  let sm = [1, 1], n = 0;
  const b1 = btn("Wipe once", () => wipe()), b2 = btn("New fingerprint", () => { sm = [1, 1]; n = 0; ctx.changed(); }); S.ui.append(b1, b2);
  function wipe() { n++; sm = [sm[0] * .72, sm[1] * .2]; ctx.changed(); }
  const print = (g, cx, cy, a, smear) => { g.save(); g.globalAlpha = a; g.strokeStyle = "rgba(120,100,80,.9)"; g.lineWidth = 3; for (let i = 0; i < 12; i++) { g.beginPath(); g.ellipse(cx + smear * i * 2, cy, 12 + i * 8 + smear * 20, 16 + i * 10, .3, 0, 6); g.stroke(); } g.restore(); };
  return { draw(g, W, H, t) {
      const c = twoPanels(g, W, H, ["Untreated", "Oleophobic top coat"]);
      c.forEach(([cx, cy], side) => { g.save(); g.beginPath(); g.arc(cx, cy, 190, 0, 7); g.clip(); g.fillStyle = "rgba(150,185,210,.38)"; g.fillRect(cx - 200, cy - 200, 400, 400); print(g, cx, cy, sm[side], side ? 0 : n * .6); if (!side && n) { g.fillStyle = `rgba(200,190,170,${.25 * sm[0]})`; g.fillRect(cx - 200, cy - 200, 400, 400); } g.restore(); g.strokeStyle = P.ink; g.lineWidth = 5; g.beginPath(); g.arc(cx, cy, 190, 0, 7); g.stroke();
        text(g, Math.round(sm[side] * 100) + "% smudge left", cx, cy + 240, { size: 20, align: "center", w: 700, color: sm[side] < .1 ? P.green : P.ink }); });
      text(g, "Wipes: " + n, W / 2, H - 40, { size: 18, align: "center", color: P.mute }); },
    acts: () => [["wipe", "Wipe once"], ["new", "New fingerprint"]], act(a) { if (a === "wipe") wipe(); else { sm = [1, 1]; n = 0; } } };
};
MODES.stat = (S, ctx) => {
  let ch = 0, t0 = 0; const dust = Array.from({ length: 160 }, (_, i) => ({ x: Math.random(), y: Math.random(), s: Math.random(), stuck: [false, false] }));
  const b1 = btn("Rub with a dry cloth", () => { ch = 1; t0 = performance.now(); ctx.changed(); }), b2 = btn("Reset", () => { ch = 0; dust.forEach((d) => (d.stuck = [false, false])); ctx.changed(); }); S.ui.append(b1, b2);
  return { draw(g, W, H, t) {
      const c = twoPanels(g, W, H, ["Untreated", "Anti-static treatment"]);
      const age = ch ? (performance.now() - t0) / 1000 : 99, q = ch ? Math.exp(-age / 14) : 0;
      c.forEach(([cx, cy], side) => { const charge = q * (side ? .12 : 1);
        g.fillStyle = "rgba(150,185,210,.38)"; g.beginPath(); g.arc(cx, cy, 170, 0, 7); g.fill(); g.strokeStyle = P.ink; g.lineWidth = 5; g.stroke();
        if (charge > .2) { g.strokeStyle = `rgba(201,162,78,${charge * .7})`; g.lineWidth = 2; for (let i = 0; i < 8; i++) { const a = i / 8 * 6.28 + t / 2000; g.beginPath(); g.moveTo(cx + Math.cos(a) * 180, cy + Math.sin(a) * 180); g.lineTo(cx + Math.cos(a) * 205, cy + Math.sin(a) * 205); g.stroke(); } }
        dust.forEach((d, i) => { if ((i % 2) !== side && i % 3) return; let x = cx - 240 + d.x * 480 + Math.sin(t / 1500 + i) * 14, y = 80 + d.y * (H - 160) + Math.cos(t / 1700 + i) * 10;
          if (!d.stuck[side] && charge > .15 && d.s < charge * .8 && Math.hypot(x - cx, y - cy) < 260) d.stuck[side] = true;
          if (d.stuck[side]) { const a = Math.atan2(y - cy, x - cx), r = Math.min(160, Math.hypot(x - cx, y - cy) * .6); x = cx + Math.cos(a) * r; y = cy + Math.sin(a) * r; }
          g.fillStyle = "rgba(110,100,85,.85)"; g.beginPath(); g.arc(x, y, 2 + d.s * 2.5, 0, 7); g.fill(); });
        text(g, dust.filter((d, i) => d.stuck[side]).length + " dust specks on the lens", cx, cy + 230, { size: 18, align: "center", w: 700 }); });
      pill(g, "Performance depends on the treatment; not all eyewear has it", W / 2, H - 40, { align: "center", size: 15 }); },
    acts: () => [["rub", "Rub with a dry cloth"], ["reset", "Reset"]], act(a) { if (a === "rub") { ch = 1; t0 = performance.now(); } else { ch = 0; dust.forEach((d) => (d.stuck = [false, false])); } } };
};

/* B6 blue light — an ILLUSTRATIVE spectral chart, hypothetical lenses */
MODES.blue = (S, ctx) => {
  const on = { clear: true, yellow: false, uv: true };
  const s = seg("Show", [["clear", "Clear blue-filter lens"], ["yellow", "Yellow-tint blue-filter lens"], ["uv", "UV400 cut-off"]], "", (x) => { on[x] = !on[x]; sync(); ctx.changed(); }); S.ui.append(s);
  const sync = () => s.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(!!on[b.dataset.v])));
  sync();
  const curve = { clear: (nm) => nm < 400 ? 0 : nm < 455 ? .82 + .1 * (nm - 400) / 55 : .95, yellow: (nm) => nm < 400 ? 0 : nm < 500 ? .18 + .72 * ((nm - 400) / 100) ** 1.6 : .9 };
  return { draw(g, W, H, t) {
      g.fillStyle = P.card; g.fillRect(0, 0, W, H);
      const x0 = 90, x1 = W - 40, y0 = 70, y1 = H - 150, nm2x = (nm) => x0 + (nm - 280) / 500 * (x1 - x0);
      /* bands */
      g.fillStyle = "rgba(123,63,191,.12)"; g.fillRect(nm2x(280), y0, nm2x(400) - nm2x(280), y1 - y0); text(g, "UVB", nm2x(297), y0 + 26, { size: 15, align: "center", color: P.mute, w: 700 }); text(g, "UVA", nm2x(357), y0 + 26, { size: 15, align: "center", color: P.mute, w: 700 });
      g.fillStyle = "rgba(51,85,221,.08)"; g.fillRect(nm2x(380), y0, nm2x(500) - nm2x(380), y1 - y0); text(g, "blue light ≈380–500 nm", nm2x(440), y0 + 50, { size: 15, align: "center", color: "#3355DD", w: 700 });
      const sp = g.createLinearGradient(nm2x(380), 0, nm2x(780), 0); [["#7B3FBF", 0], ["#3355DD", .2], ["#22AA88", .38], ["#E6D23A", .55], ["#EE8833", .72], ["#CC2222", 1]].forEach(([c, k]) => sp.addColorStop(k, c)); g.fillStyle = sp; g.fillRect(nm2x(380), y1 + 14, nm2x(780) - nm2x(380), 22);
      g.fillStyle = "#C9C2B4"; g.fillRect(nm2x(280), y1 + 14, nm2x(380) - nm2x(280), 22);
      /* axes */
      g.strokeStyle = P.ink; g.lineWidth = 2; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x0, y1); g.lineTo(x1, y1); g.stroke();
      [0, .5, 1].forEach((v) => { const y = y1 - v * (y1 - y0 - 60); text(g, Math.round(v * 100) + "%", x0 - 12, y + 6, { size: 14, align: "right", color: P.mute }); g.strokeStyle = "rgba(0,0,0,.06)"; g.beginPath(); g.moveTo(x0, y); g.lineTo(x1, y); g.stroke(); });
      [300, 400, 500, 600, 700].forEach((nm) => text(g, nm + " nm", nm2x(nm), y1 + 60, { size: 14, align: "center", color: P.mute }));
      text(g, "light let through", x0 - 70, y0 - 24, { size: 14, color: P.mute });
      const plot = (fn, col, dash) => { g.strokeStyle = col; g.lineWidth = 4; g.setLineDash(dash || []); g.beginPath(); for (let nm = 280; nm <= 780; nm += 2) { const x = nm2x(nm), y = y1 - fn(nm) * (y1 - y0 - 60); nm === 280 ? g.moveTo(x, y) : g.lineTo(x, y); } g.stroke(); g.setLineDash([]); };
      if (on.clear) plot(curve.clear, P.blue); if (on.yellow) plot(curve.yellow, "#C99A1E");
      if (on.uv) { g.strokeStyle = P.red; g.lineWidth = 2; g.setLineDash([6, 6]); g.beginPath(); g.moveTo(nm2x(400), y0); g.lineTo(nm2x(400), y1); g.stroke(); g.setLineDash([]); text(g, "UV400: blocks up to 400 nm", nm2x(400) + 8, y0 + 80, { size: 14, color: P.red, w: 700 }); }
      pill(g, "ILLUSTRATIVE — hypothetical lenses, not measured data. Products filter different wavelengths and amounts.", W / 2, H - 34, { align: "center", size: 14, bg: "rgba(169,71,47,.92)" }); },
    acts: () => [["clear", "Clear blue-filter", on.clear], ["yellow", "Yellow-tint filter", on.yellow], ["uv", "UV400 line", on.uv]], act(a) { on[a] = !on[a]; sync(); } };
};

/* B7 photochromic */
MODES.photo = (S, ctx) => {
  let env = "in", hot = false, d = .05, hist = [];
  const se = seg("Where", [["in", "Indoors"], ["out", "Outdoors"], ["car", "In a car"]], env, (x) => { env = x; ctx.changed(); });
  const stp = seg("Temperature", [["0", "Cool"], ["1", "Hot"]], "0", (x) => { hot = x === "1"; ctx.changed(); });
  S.ui.append(se, stp);
  let last = performance.now();
  const target = () => env === "in" ? .04 : env === "car" ? .14 : hot ? .58 : .86;
  return { draw(g, W, H, t) {
      const now = performance.now(), dt = Math.min(.1, (now - last) / 1000); last = now; const tg = target(), rate = tg > d ? 1.2 : (hot ? .45 : .22); d += (tg - d) * (1 - Math.exp(-rate * dt)); hist.push(d); if (hist.length > 360) hist.shift();
      if (env === "in") { room(g, W, H); } else { paintScene(g, W, H, t, { kind: env === "car" ? "road" : "beach", glare: .5, cut: 0, hy: .45 }); if (env === "car") { g.fillStyle = "#1F2226"; g.fillRect(0, 0, W, 60); g.beginPath(); g.moveTo(0, H * .78); g.quadraticCurveTo(W / 2, H * .7, W, H * .78); g.lineTo(W, H); g.lineTo(0, H); g.fill(); g.fillStyle = "rgba(170,190,200,.15)"; g.fillRect(0, 60, W, H * .7); text(g, "windscreen blocks most UV", W - 30, 44, { size: 16, color: "#fff", align: "right", w: 600 }); } }
      glasses(g, S, W / 2, H * .5, 200, 145, 54, () => tintRect(g, 0, 0, W, H, [92, 84, 74], d), { lw: 12 });
      /* meter + history */
      const x0 = 24, y0 = 24; rr(g, x0, y0, 330, 120, 6); g.fillStyle = P.card; g.fill(); text(g, "LENS DARKNESS (illustrative)", x0 + 14, y0 + 26, { size: 12, color: P.gold, w: 700 });
      g.strokeStyle = P.ink; g.lineWidth = 3; g.beginPath(); hist.forEach((v, i) => { const x = x0 + 14 + i * (300 / 360), y = y0 + 106 - v * 70; i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.stroke();
      pill(g, env === "in" ? "Indoors: little UV — clears" : env === "car" ? "Behind a windscreen: standard lenses darken little" : hot ? "Hot day: darkens less" : "Cool and sunny: darkens fully", W / 2, H - 36, { align: "center", size: 17 }); },
    acts: () => [["e:in", "Indoors", env === "in"], ["e:out", "Outdoors", env === "out"], ["e:car", "In a car", env === "car"], ["t:0", "Cool", !hot], ["t:1", "Hot", hot]], act(a) { const [k, v] = a.split(":"); if (k === "e") { env = v; se.set(v); } else { hot = v === "1"; stp.set(v); } } };
};

/* B8 mirror */
MODES.mirror = (S, ctx) => {
  const F = [["silver", "Silver", ["#E8ECEF", "#9AA4AC"]], ["gold", "Gold", ["#F3D68A", "#A57A23"]], ["blue", "Blue", ["#9CC7F4", "#2C5FA8"]], ["green", "Green", ["#A9E2B8", "#2E7B4F"]], ["fire", "Fire red", ["#FFB27A", "#B9361F"]]];
  let f = "blue", view = "out";
  const sf = seg("Finish", F.map(([a, b]) => [a, b]), f, (x) => { f = x; ctx.changed(); }); sf.classList.add("wrap");
  const sv = seg("View", [["out", "Others see"], ["in", "Wearer sees"]], view, (x) => { view = x; ctx.changed(); });
  S.ui.append(sf, sv);
  return { draw(g, W, H, t) { const c = F.find((x) => x[0] === f)[2];
      if (view === "out") { g.fillStyle = P.bg; g.fillRect(0, 0, W, H); face(g, W / 2, H * .46, 200);
        glasses(g, S, W / 2, H * .46, 200, 150, 46, () => { const gg = g.createLinearGradient(0, H * .2, 0, H * .7); gg.addColorStop(0, c[0]); gg.addColorStop(.45, c[1]); gg.addColorStop(.55, c[0]); gg.addColorStop(1, c[1]); g.fillStyle = gg; g.fillRect(0, 0, W, H); g.fillStyle = "rgba(255,255,255,.45)"; g.beginPath(); g.ellipse(W * .36, H * .34, 120, 18, -.2, 0, 7); g.fill(); g.beginPath(); g.ellipse(W * .62, H * .34, 120, 18, -.2, 0, 7); g.fill(); }, { lw: 10 });
        pill(g, "The mirror is the finish — UV and polarisation are separate", W / 2, H - 40, { align: "center", size: 16 }); }
      else { paintScene(g, W, H, t, { kind: "beach", glare: .9, cut: 0, hy: .42 }); glasses(g, S, W / 2, H * .55, 210, 150, 54, () => { paintScene(g, W, H, t, { kind: "beach", glare: .55, cut: 0, hy: .42 }); tintRect(g, 0, 0, W, H, [96, 96, 98], .6); }, { lw: 12 });
        pill(g, "From inside: a darker view — the mirror colour barely shows", W / 2, H - 40, { align: "center", size: 16 }); } },
    acts: () => [...F.map(([a, b]) => ["f:" + a, b, f === a]), ["v:out", "Others see", view === "out"], ["v:in", "Wearer sees", view === "in"]], act(a) { const [k, v] = a.split(":"); if (k === "f") { f = v; sf.set(v); } else { view = v; sv.set(v); } } };
};

/* B9 anti-fog */
MODES.fog = (S, ctx) => {
  let t0 = -1e9;
  const b1 = btn("Walk out of air-con into humid heat", () => { t0 = performance.now(); ctx.changed(); }); S.ui.append(b1);
  const R = rng(8), dots = Array.from({ length: 900 }, () => [R(), R(), R()]);
  return { draw(g, W, H, t) { paintScene(g, W, H, t, { kind: "city", glare: .4, cut: 0, hy: .45 });
      const age = (performance.now() - t0) / 1000, f = age < 0 ? 0 : age < 1 ? age : Math.max(0, 1 - (age - 1) / 9);
      [[W * .27, "Untreated", 1], [W * .73, "Anti-fog", .14]].forEach(([cx, lab, k]) => { g.save(); g.beginPath(); lensPath(g, cx, H * .5, 220, 165); g.clip();
        const ff = f * k; if (ff > 0) { g.fillStyle = `rgba(240,244,246,${.75 * ff})`; g.fillRect(0, 0, W, H); dots.forEach(([x, y, s]) => { g.fillStyle = `rgba(255,255,255,${.8 * ff})`; g.beginPath(); g.arc(cx - 230 + x * 460, H * .5 - 175 + y * 350, 1 + s * 3.5, 0, 7); g.fill(); }); }
        if (k < 1 && f > .1) { g.fillStyle = `rgba(200,225,240,${.18 * f})`; g.fillRect(0, 0, W, H); }
        g.restore(); g.strokeStyle = "#1B1A17"; g.lineWidth = 12; g.beginPath(); lensPath(g, cx, H * .5, 220, 165); g.stroke(); pill(g, lab, cx, H * .5 + 210, { align: "center", size: 18, bg: k < 1 ? "rgba(138,107,50,.94)" : "rgba(22,20,15,.8)" }); });
      pill(g, "Reduces fogging under specified conditions — not fog-free everywhere", 22, 34, { size: 15 }); },
    acts: () => [["go", "Walk into humid heat"]], act() { t0 = performance.now(); } };
};

/* B10 tints and categories */
MODES.tint = (S, ctx) => {
  let tn = "grey", cat = 3;
  const st = seg("Tint", L.tints.map((x) => [x.id, x.n]), tn, (x) => { tn = x; side(); ctx.changed(); }); st.classList.add("wrap");
  const sc = seg("Category", L.cats.map((c) => [String(c.c), String(c.c)]), "3", (x) => { cat = +x; side(); ctx.changed(); });
  S.ui.append(st, sc);
  function side() { const T = L.tints.find((x) => x.id === tn), C = L.cats[cat];
    live(ctx, `<p class="sec">${esc(T.n)} · ${esc(T.note)}</p><p class="txt">${esc(T.use)}</p><p class="sec">Filter category ${C.c}</p><table class="cat"><tr><th>Cat.</th><th>Light let through</th><th>Driving</th></tr>${L.cats.map((c) => `<tr class="${c.c === cat ? "on" : ""}"><td>${c.c}</td><td>${esc(c.r)}</td><td>${esc(c.drive)}</td></tr>`).join("")}</table><p class="txt" style="font-size:1cqw;color:var(--mute);margin-top:.4cqw">ISO 12312-1 ranges. No sunglasses at dusk or night. Tint alone says nothing about UV, polarisation or quality.</p>`); }
  const dark = [.05, .4, .62, .8, .93];
  return { draw(g, W, H, t) { const T = L.tints.find((x) => x.id === tn); paintScene(g, W, H, t, { kind: "golf", glare: .5, cut: 0, hy: .36 });
      glasses(g, S, W / 2, H * .56, 220, 160, 54, () => { tintRect(g, 0, 0, W, H, T.rgb, clamp(dark[cat] * (T.k / .78) + .05, 0, .97)); }, { lw: 12 });
      if (cat === 4) pill(g, "Category 4: not suitable for driving", 22, 36, { size: 17, bg: "rgba(169,71,47,.94)" });
      if (tn === "yellow" && cat >= 3) pill(g, "Yellow is usually a light tint for flat light", 22, 80, { size: 15 }); },
    acts: () => [...L.tints.map((x) => ["t:" + x.id, x.n, x.id === tn]), ...L.cats.map((c) => ["c:" + c.c, "Cat " + c.c, c.c === cat])], act(a) { const [k, v] = a.split(":"); if (k === "t") { tn = v; st.set(v); } else { cat = +v; sc.set(v); } side(); }, init: side };
};

/* B11 gradient */
MODES.grad = (S, ctx) => {
  let ty = "single";
  const s = seg("Lens", [["single", "Gradient"], ["double", "Double gradient"], ["solid", "Solid tint"]], ty, (x) => { ty = x; ctx.changed(); }); S.ui.append(s);
  return { draw(g, W, H, t) { paintScene(g, W, H, t, { kind: "road", glare: .6, cut: 0, hy: .4 }); g.fillStyle = "#24272B"; g.beginPath(); g.moveTo(0, H * .7); g.quadraticCurveTo(W / 2, H * .62, W, H * .7); g.lineTo(W, H); g.lineTo(0, H); g.fill();
      g.fillStyle = "#111"; rr(g, W * .62, H * .74, 120, 200, 14); g.fill(); g.fillStyle = "#EAF1F6"; rr(g, W * .62 + 8, H * .74 + 10, 104, 180, 8); g.fill(); g.fillStyle = "#2F6B8F"; g.fillRect(W * .62 + 18, H * .74 + 24, 84, 40);
      glasses(g, S, W / 2, H * .55, 230, 190, 50, () => { const cy = H * .55; const gg = g.createLinearGradient(0, cy - 190, 0, cy + 190);
          if (ty === "solid") { gg.addColorStop(0, "rgba(70,62,52,.7)"); gg.addColorStop(1, "rgba(70,62,52,.7)"); } else if (ty === "single") { gg.addColorStop(0, "rgba(60,52,44,.82)"); gg.addColorStop(.55, "rgba(60,52,44,.4)"); gg.addColorStop(1, "rgba(60,52,44,.05)"); } else { gg.addColorStop(0, "rgba(60,52,44,.82)"); gg.addColorStop(.5, "rgba(60,52,44,.25)"); gg.addColorStop(1, "rgba(60,52,44,.7)"); }
          g.fillStyle = gg; g.fillRect(0, 0, W, H); }, { lw: 12 });
      pill(g, ty === "single" ? "Darker for the sky, lighter for the dashboard and phone" : ty === "double" ? "Dark top and bottom: e.g. for reflections off water or sand" : "Solid: the same darkness everywhere", 22, 34, { size: 16 }); },
    acts: () => [["single", "Gradient", ty === "single"], ["double", "Double", ty === "double"], ["solid", "Solid", ty === "solid"]], act(a) { ty = a; s.set(a); } };
};

/* B12 UV */
MODES.uv = (S, ctx) => {
  let lens = "clear";
  const s = seg("Lens", [["clear", "Clear + UV400"], ["darkno", "Dark, no UV filter"], ["darkuv", "Dark + UV400"]], lens, (x) => { lens = x; ctx.changed(); }); S.ui.append(s);
  return { draw(g, W, H, t) { g.fillStyle = P.card; g.fillRect(0, 0, W, H);
      const sun = [120, H * .38], lx = W * .55, ey = [W * .86, H * .38];
      g.fillStyle = "#E3B24A"; g.beginPath(); g.arc(...sun, 56, 0, 7); g.fill();
      const dark = lens !== "clear", uvBlock = lens !== "darkno";
      for (let i = 0; i < 4; i++) { const y = H * .24 + i * 40, k = ((t / 1400) + i / 4) % 1; g.strokeStyle = "rgba(227,178,74,.9)"; g.lineWidth = 6; g.beginPath(); g.moveTo(190, y); g.lineTo(lx - 30, y); g.stroke(); g.strokeStyle = `rgba(227,178,74,${dark ? .3 : .9})`; g.beginPath(); g.moveTo(lx + 30, y); g.lineTo(ey[0] - 60, y); g.stroke(); }
      for (let i = 0; i < 3; i++) { const y = H * .5 + i * 34; g.strokeStyle = "#7B3FBF"; g.lineWidth = 4; g.setLineDash([10, 8]); g.lineDashOffset = -t / 30; g.beginPath(); g.moveTo(190, y); g.lineTo(lx - 30, y); g.stroke(); if (!uvBlock) { g.beginPath(); g.moveTo(lx + 30, y); g.lineTo(ey[0] - 60, y + (ey[1] - y) * .3); g.stroke(); } g.setLineDash([]); }
      g.fillStyle = dark ? "rgba(60,54,46,.8)" : "rgba(210,228,240,.7)"; rr(g, lx - 30, H * .14, 60, H * .56, 20); g.fill(); g.strokeStyle = P.ink; g.lineWidth = 4; g.stroke();
      if (uvBlock) { g.strokeStyle = P.red; g.lineWidth = 5; [0, 1, 2].forEach((i) => { const y = H * .5 + i * 34; g.beginPath(); g.moveTo(lx - 46, y - 12); g.lineTo(lx - 22, y + 12); g.moveTo(lx - 22, y - 12); g.lineTo(lx - 46, y + 12); g.stroke(); }); }
      g.save(); g.translate(...ey); g.fillStyle = "#fff"; g.strokeStyle = P.ink; g.lineWidth = 3; g.beginPath(); g.ellipse(0, 0, 50, 26, 0, 0, 7); g.fill(); g.stroke(); g.fillStyle = P.ink; g.beginPath(); g.arc(-10, 0, 12, 0, 7); g.fill(); g.restore();
      text(g, "visible light", 200, H * .2, { size: 17, color: "#B8862B", w: 700 }); text(g, "UV (invisible)", 200, H * .5 - 18, { size: 17, color: "#7B3FBF", w: 700 });
      text(g, uvBlock ? "UV stopped" : "UV gets through", ey[0] - 30, H * .62, { size: 20, align: "center", w: 700, color: uvBlock ? P.green : P.red });
      pill(g, lens === "darkno" ? "Dark doesn't mean UV-safe: you can't see UV — check the label" : lens === "clear" ? "A clear lens can block UV fully" : "Dark and UV-blocking: both are on the label", W / 2, H - 40, { align: "center", size: 16, bg: lens === "darkno" ? "rgba(169,71,47,.94)" : "rgba(22,20,15,.8)" }); },
    acts: () => [["clear", "Clear + UV400", lens === "clear"], ["darkno", "Dark, no UV filter", lens === "darkno"], ["darkuv", "Dark + UV400", lens === "darkuv"]], act(a) { lens = a; s.set(a); } };
};

/* B13 prescription and materials */
MODES.rx = (S, ctx) => {
  let tab = "sv"; const s = seg("Show", L.rxTabs.map((x) => [x.id, x.n]), tab, (x) => { tab = x; side(); ctx.changed(); }); s.classList.add("wrap"); S.ui.append(s);
  function side() { const x = L.rxTabs.find((y) => y.id === tab); live(ctx, `<p class="sec">${esc(x.n)}</p><p class="txt">${esc(x.d)}</p>`); }
  return { draw(g, W, H, t) { g.fillStyle = P.bg; g.fillRect(0, 0, W, H); const cx = W / 2, cy = H * .48;
      if (tab === "sv" || tab === "prog" || tab === "rxsun") {
        g.save(); g.beginPath(); lensPath(g, cx, cy, 300, 220); g.clip(); g.fillStyle = tab === "rxsun" ? "rgba(84,72,58,.75)" : "rgba(150,185,210,.38)"; g.fillRect(0, 0, W, H);
        if (tab === "prog") { g.fillStyle = "rgba(62,122,74,.28)"; g.fillRect(cx - 320, cy - 230, 640, 190); g.fillStyle = "rgba(201,162,78,.38)"; g.beginPath(); g.moveTo(cx - 30, cy - 40); g.lineTo(cx + 30, cy - 40); g.lineTo(cx + 50, cy + 60); g.lineTo(cx - 50, cy + 60); g.fill(); g.fillStyle = "rgba(47,107,143,.3)"; g.beginPath(); g.ellipse(cx, cy + 150, 130, 70, 0, 0, 7); g.fill(); g.fillStyle = "rgba(169,71,47,.13)"; g.fillRect(cx - 320, cy - 40, 220, 280); g.fillRect(cx + 100, cy - 40, 220, 280); }
        g.restore(); g.strokeStyle = P.ink; g.lineWidth = 10; g.beginPath(); lensPath(g, cx, cy, 300, 220); g.stroke();
        if (tab === "sv") text(g, "one power across the whole lens", cx, cy + 8, { size: 22, align: "center", w: 700 });
        if (tab === "prog") { text(g, "distance", cx, cy - 120, { size: 22, align: "center", w: 700 }); text(g, "intermediate", cx, cy + 20, { size: 18, align: "center", w: 700 }); text(g, "near", cx, cy + 158, { size: 22, align: "center", w: 700 }); text(g, "soft zones", cx - 220, cy + 100, { size: 16, align: "center", color: P.red }); text(g, "soft zones", cx + 220, cy + 100, { size: 16, align: "center", color: P.red }); }
        if (tab === "rxsun") { text(g, "prescription + tint", cx, cy - 10, { size: 22, align: "center", w: 700, color: "#fff" }); text(g, "(+ polarisation or mirror where offered)", cx, cy + 22, { size: 17, align: "center", color: "#fff" }); }
      } else if (tab === "hi") {
        const sec = (x, k, lab) => { g.fillStyle = "#B9CCD8"; g.beginPath(); g.moveTo(x - 220, cy - 60 - 70 * k); g.quadraticCurveTo(x, cy - 30, x + 220, cy - 60 - 70 * k); g.lineTo(x + 220, cy + 60 + 70 * k); g.quadraticCurveTo(x, cy + 30, x - 220, cy + 60 + 70 * k); g.closePath(); g.fill(); g.strokeStyle = P.ink; g.lineWidth = 3; g.stroke(); text(g, lab, x, cy + 190, { size: 20, align: "center", w: 700 }); };
        sec(W * .28, 1, "standard index"); sec(W * .72, .45, "high-index: thinner edges"); text(g, "Same prescription, cross-section (illustration)", cx, 50, { size: 18, align: "center", color: P.mute });
      } else { g.fillStyle = "#B9CCD8"; g.beginPath(); g.ellipse(cx + 80, cy, 60, 220, 0, 0, 7); g.fill(); g.strokeStyle = P.ink; g.lineWidth = 4; g.stroke(); g.fillStyle = "#C2553E"; const k = (t / 1600) % 1; g.beginPath(); g.arc(cx - 360 + Math.min(k, .5) * 2 * 380, cy, 30, 0, 7); g.fill(); text(g, "Polycarbonate: light and impact-resistant", cx, cy + 270, { size: 22, align: "center", w: 700 }); text(g, "Protective use still needs certified eyewear", cx, cy + 300, { size: 17, align: "center", color: P.mute }); }
      pill(g, "Prescribing is for the optician — advisors explain the options", W / 2, H - 34, { align: "center", size: 15 }); },
    acts: () => L.rxTabs.map((x) => ["t:" + x.id, x.n, x.id === tab]), act(a) { tab = a.slice(2); s.set(tab); side(); }, init: side };
};

SIMS.tech = (host, ctx, opt) => {
  const T = L.tech[opt.k];
  const S = stage(host, { label: opt.k === "blue" ? "" : L.illus, aria: T.n + " — interactive illustration" });
  const M = MODES[opt.k](S, ctx);
  S.draw = M.draw; if (M.init) M.init();
  return { acts: M.acts, act(a) { M.act(a); ctx.changed(); }, destroy: S.destroy };
};
SIMS._glasses = glasses;
})();
