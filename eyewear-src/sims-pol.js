/* =====================================================================
   MODULE A · POLARISED LENSES — simulations and widgets
   ===================================================================== */
(function () {
"use strict";
const { P, esc, clamp, lerp, D2R, h, stage, seg, slider, btn, rr, text, pill, arrow, vib, sparkle, lensPath, tintRect, paintScene, fresnel, polRatio, polDegree, brewster } = KIT;
const L = LENS;
const live = (ctx, html) => { const el = ctx.side && ctx.side.querySelector("[data-live]"); if (el) el.innerHTML = html; };
const refLink = (k) => (k && REFS[k] ? `<a class="ref" href="${esc(REFS[k].u)}" target="_blank" rel="noopener" title="${esc(REFS[k].t)}">source</a>` : "");

/* ---------- A1 · where glare comes from (also the title-slide hero, opt.mini) ---------- */
SIMS.glare = (host, ctx, opt = {}) => {
  const S = stage(host, { label: opt.mini ? "" : L.illus, noUi: !!opt.mini, aria: "A lake and a road in bright sun. Left of the divider: what the eye sees. Right: the same view through a polarised lens." });
  let st = opt.mini ? 5 : 0, div = opt.mini ? .5 : 1, divT = div, drag = false;
  const ui = S.ui;
  let sg, sl;
  if (!opt.mini) {
    sg = seg("Steps", L.glareStages.map((x, i) => [String(i + 1), String(i + 1)]), "", (v) => setStage(+v));
    sl = slider("Polarised view", 0, 100, 0, (v) => { divT = div = 1 - v / 100; ctx.changed(); }, (v) => v + "%");
    ui.append(sg, sl);
  }
  function setStage(n) { st = clamp(n, 0, 5); if (st >= 4) divT = st === 4 ? .5 : 0; else divT = 1; if (sg) sg.set(String(st)); sideUI(); ctx.changed(); }
  function sideUI() { if (opt.mini) return; const s = L.glareStages[st - 1];
    live(ctx, s ? `<p class="sec">Step ${st} of 5</p><p class="txt"><b>${esc(s.t)}.</b> ${esc(s.d)}</p>` : `<p class="sec">Five steps</p><p class="txt">Press → to follow the light from the sun to the eye — or drag the divider on the scene.</p>`); }
  S.cv.addEventListener("pointerdown", (e) => { if (opt.mini) return; const [x] = S.pt(e); if (Math.abs(x - div * S.W) < 80) { drag = true; S.cv.setPointerCapture(e.pointerId); } });
  S.cv.addEventListener("pointermove", (e) => { if (!drag) return; const [x] = S.pt(e); divT = div = clamp(x / S.W, 0, 1); sl && sl.set(Math.round((1 - div) * 100)); });
  S.cv.addEventListener("pointerup", () => { if (drag) { drag = false; ctx.changed(); } });
  S.draw = (g, W, H, t) => {
    if (opt.mini) divT = .5 + .42 * Math.sin(t / 2600);
    div = lerp(div, divT, .12); if (sl && !drag && Math.abs(div - divT) > .002) sl.set(Math.round((1 - div) * 100));
    const glare = opt.mini ? 1 : st === 0 ? 1 : st === 1 ? .15 : 1;
    const dx = div * W;
    g.save(); g.beginPath(); g.rect(0, 0, dx, H); g.clip(); paintScene(g, W, H, t, { kind: "mix", glare, cut: 0 }); g.restore();
    g.save(); g.beginPath(); g.rect(dx, 0, W - dx, H); g.clip(); paintScene(g, W, H, t, { kind: "mix", glare, cut: 1 }); tintRect(g, dx, 0, W - dx, H, [96, 84, 66], .42); g.restore();
    if (dx > 2 && dx < W - 2) { g.fillStyle = "#fff"; g.fillRect(dx - 2, 0, 4, H); g.beginPath(); g.arc(dx, H * .5, 26, 0, 7); g.fill(); g.strokeStyle = P.ink; g.lineWidth = 2; g.stroke(); arrow(g, dx - 4, H * .5, dx - 18, H * .5, { head: 10, w: 2 }); arrow(g, dx + 4, H * .5, dx + 18, H * .5, { head: 10, w: 2 }); }
    if (dx > 220) pill(g, "Naked eye", 24, 40, { size: 18 });
    if (W - dx > 300) pill(g, "Through a polarised lens", W - 24, opt.mini ? 40 : H - 40, { size: 18, align: "right", bg: "rgba(138,107,50,.92)" });
    if (!opt.mini && st >= 1) inset(g, W, H, t);
  };
  /* side-view inset: the physics of the current step */
  function inset(g, W, H, t) {
    const x0 = W - 452, y0 = 44, w = 434, hh = 262; g.save(); rr(g, x0, y0, w, hh, 6); g.fillStyle = P.card; g.fill(); g.strokeStyle = P.line; g.lineWidth = 1.5; g.stroke();
    text(g, "SIDE VIEW", x0 + 16, y0 + 26, { size: 12, color: P.gold, w: 700 });
    const sun = [x0 + 52, y0 + 62], hit = [x0 + 200, y0 + 196], eye = [x0 + 392, y0 + 92], lens = [x0 + 336, y0 + 116];
    g.fillStyle = "#D8A93A"; g.beginPath(); g.arc(...sun, 20, 0, 7); g.fill();
    g.fillStyle = "#3C7E95"; g.fillRect(x0 + 14, hit[1], w - 28, 22); text(g, "water / road", x0 + 24, hit[1] + 16, { size: 12, color: "#fff", w: 600 });
    const ph = (t / 1600) % 1;
    g.strokeStyle = "rgba(216,169,58,.55)"; g.lineWidth = 3; g.beginPath(); g.moveTo(...sun); g.lineTo(...hit); g.stroke();
    for (let i = 0; i < 3; i++) { const k = (ph + i / 3) % 1, x = lerp(sun[0], hit[0], k), y = lerp(sun[1], hit[1], k); [0, 1, 2, 3].forEach((j) => vib(g, x, y, 18, j * Math.PI / 4 + t / 900, "#B8862B", 2)); }
    if (st >= 2) { g.strokeStyle = "rgba(169,71,47,.55)"; g.beginPath(); g.moveTo(...hit); g.lineTo(...eye); g.stroke();
      for (let i = 0; i < 3; i++) { const k = (ph + i / 3) % 1, x = lerp(hit[0], eye[0], k), y = lerp(hit[1], eye[1], k); const past = st >= 4 && x > lens[0];
        if (!past) { vib(g, x, y, 24, 0, P.red, 3); vib(g, x, y, 9, Math.PI / 2, P.red, 2); } else vib(g, x, y, 9, Math.PI / 2, P.green, 2.4); } }
    if (st >= 4) { g.save(); g.translate(...lens); g.strokeStyle = P.ink; g.lineWidth = 3; g.beginPath(); g.ellipse(0, 0, 12, 34, 0, 0, 7); g.stroke(); g.restore(); text(g, "lens", lens[0] - 14, lens[1] + 54, { size: 12, color: P.mute }); }
    /* eye */
    const hot = st === 3 ? 1 : 0; g.save(); g.translate(...eye); g.fillStyle = "#fff"; g.strokeStyle = P.ink; g.lineWidth = 2.5; g.beginPath(); g.ellipse(0, 0, 26, 14, 0, 0, 7); g.fill(); g.stroke(); g.fillStyle = P.ink; g.beginPath(); g.arc(-6, 0, hot ? 4 : 7, 0, 7); g.fill();
    if (hot) { g.strokeStyle = P.red; g.lineWidth = 2.5; for (let i = 0; i < 5; i++) { const a = -2.4 + i * .5; g.beginPath(); g.moveTo(Math.cos(a) * 30, Math.sin(a) * 22); g.lineTo(Math.cos(a) * 40, Math.sin(a) * 31); g.stroke(); } }
    g.restore();
    const cap = ["", "Sunlight: vibrates in all directions", "Reflected: mostly horizontal", "Glare hits the eye", "The lens passes the vertical part", "Much less glare reaches the eye"][st];
    text(g, cap, x0 + 16, y0 + hh - 10, { size: 15, color: st === 3 ? P.red : P.ink, w: 600 });
    g.restore();
  }
  sideUI();
  return {
    acts: () => opt.mini ? [] : [...L.glareStages.map((x, i) => ["st:" + (i + 1), (i + 1) + " · " + x.t, st === i + 1]), ["v:raw", "Naked eye", div > .97], ["v:split", "Split view", div > .3 && div < .7], ["v:pol", "Polarised view", div < .03]],
    act(a) { if (a.startsWith("st:")) setStage(+a.slice(3)); else { divT = div = a === "v:raw" ? 1 : a === "v:split" ? .5 : 0; sl && sl.set(Math.round((1 - div) * 100)); ctx.changed(); } },
    destroy: S.destroy,
  };
};

/* ---------- A1 · how the filter works ---------- */
SIMS.filter = (host, ctx) => {
  const S = stage(host, { label: "Illustration — arrows show the direction light vibrates, as seen looking along the beam", aria: "Sunlight vibrating in all directions reflects off water as mostly horizontal vibrations; a lens with a vertical axis blocks most of them." });
  let rot = 0, rotT = 0;
  const sl = slider("Turn the lens", 0, 90, 0, (v) => { rotT = v; ctx.changed(); upd(); }, (v) => v + "°");
  const qs = h(`<div class="seg"><span class="seg-l">Quick</span></div>`); [0, 45, 90].forEach((v) => qs.append(btn(v + "°", () => setRot(v))));
  S.ui.append(sl, qs);
  const H_FR = .8; /* illustrative share of the glare vibrating horizontally */
  const pass = (r) => H_FR * Math.sin(r * D2R) ** 2 + (1 - H_FR) * Math.cos(r * D2R) ** 2;
  function setRot(v) { rotT = v; sl.set(v); ctx.changed(); upd(); }
  function upd() { const p = Math.round(pass(rotT) * 100);
    live(ctx, `<p class="sec">At ${rotT}°</p><p class="txt">${rotT < 15 ? "The lens axis is <b>vertical</b>: it passes the up-and-down part of the light and blocks most of the horizontal glare." : rotT > 75 ? "The axis is now <b>horizontal</b>: the glare passes. This is why tilting your head brings reflections back." : "Part-way round: some glare gets through."} About <b>${p}%</b> of this glare passes.</p><p class="txt" style="font-size:1.02cqw;color:var(--mute);margin-top:.5cqw">The 80/20 mix is an illustration. The real share depends on the surface and the angle — try it in the simulator next.</p>`); }
  const parts = Array.from({ length: 30 }, (_, i) => ({ k: i / 30, a: Math.random() * Math.PI, hz: Math.random() < H_FR }));
  S.draw = (g, W, H, t) => {
    rot = lerp(rot, rotT, .15);
    g.fillStyle = P.bg; g.fillRect(0, 0, W, H * .7); const wy = H * .72; const wg = g.createLinearGradient(0, wy, 0, H); wg.addColorStop(0, "#3F7F96"); wg.addColorStop(1, "#1E5468"); g.fillStyle = wg; g.fillRect(0, wy, W, H - wy);
    const sun = [W * .1, H * .14], hit = [W * .34, wy], lens = [W * .7, H * .4], eye = [W * .92, H * .33];
    g.fillStyle = "#E3B24A"; g.beginPath(); g.arc(...sun, 46, 0, 7); g.fill(); text(g, "Sun", sun[0] - 18, sun[1] + 76, { size: 18, color: P.mute });
    g.strokeStyle = "rgba(227,178,74,.45)"; g.lineWidth = 26; g.lineCap = "round"; g.beginPath(); g.moveTo(...sun); g.lineTo(...hit); g.stroke();
    g.strokeStyle = "rgba(169,71,47,.25)"; g.beginPath(); g.moveTo(...hit); g.lineTo(...lens); g.stroke();
    g.strokeStyle = "rgba(62,122,74,.25)"; g.beginPath(); g.moveTo(...lens); g.lineTo(...eye); g.stroke();
    const sp = t / 7000;
    parts.forEach((p, i) => { const u = (p.k + sp) % 1;
      if (u < .4) { const k = u / .4, x = lerp(sun[0], hit[0], k), y = lerp(sun[1], hit[1], k); circleBg(g, x, y); vib(g, x, y, 34, p.a + t / 1500, "#B8862B", 3.2); }
      else if (u < .75) { const k = (u - .4) / .35, x = lerp(hit[0], lens[0], k), y = lerp(hit[1], lens[1], k); circleBg(g, x, y); vib(g, x, y, 34, p.hz ? 0 : Math.PI / 2, P.red, 3.2); }
      else { const k = (u - .75) / .25, x = lerp(lens[0], eye[0], k), y = lerp(lens[1], eye[1], k); const th = p.hz ? 0 : Math.PI / 2, ax = Math.PI / 2 - rot * D2R, a = Math.cos(th - ax) ** 2; if (a > .02) { g.globalAlpha = a; circleBg(g, x, y); vib(g, x, y, 34 * Math.sqrt(a) + 6, ax, P.green, 3.2); g.globalAlpha = 1; } }
    });
    /* the lens, face-on, with its transmission axis */
    g.save(); g.translate(...lens); g.beginPath(); g.arc(0, 0, 110, 0, 7); g.fillStyle = "rgba(70,62,52,.35)"; g.fill(); g.clip(); g.rotate(rot * D2R); g.strokeStyle = "rgba(22,20,15,.75)"; g.lineWidth = 3; for (let x = -120; x <= 120; x += 16) { g.beginPath(); g.moveTo(x, -130); g.lineTo(x, 130); g.stroke(); } g.restore();
    g.save(); g.translate(...lens); g.strokeStyle = P.ink; g.lineWidth = 8; g.beginPath(); g.arc(0, 0, 110, 0, 7); g.stroke(); g.rotate(rot * D2R); arrow(g, 0, 60, 0, -146, { color: P.gold, w: 4 }); g.restore();
    text(g, "Polarised lens", lens[0], lens[1] + 150, { size: 20, align: "center", w: 700 }); text(g, "axis " + Math.round(rot) + "° from vertical", lens[0], lens[1] + 176, { size: 16, align: "center", color: P.mute });
    /* eye */
    g.save(); g.translate(...eye); g.fillStyle = "#fff"; g.strokeStyle = P.ink; g.lineWidth = 3; g.beginPath(); g.ellipse(0, 0, 44, 24, 0, 0, 7); g.fill(); g.stroke(); g.fillStyle = P.ink; g.beginPath(); g.arc(-10, 0, 11, 0, 7); g.fill(); g.restore();
    const p = pass(rot); bar(g, W * .4, H * .1, 230, "Glare reaching the eye", p, p > .5 ? P.red : P.green);
    pill(g, "Sunlight: all directions", W * .04, H * .32, { size: 17, bg: "rgba(184,134,43,.92)" });
    pill(g, "Reflected glare: mostly horizontal", W * .44, H * .66, { size: 17, bg: "rgba(169,71,47,.92)", align: "center" });
    pill(g, "Reaches the eye", W * .98, H * .2, { size: 17, bg: "rgba(62,122,74,.92)", align: "right" });
  };
  function circleBg(g, x, y) { g.fillStyle = "rgba(255,255,255,.75)"; g.beginPath(); g.arc(x, y, 22, 0, 7); g.fill(); }
  upd();
  return { acts: () => [[ "r:0", "Lens upright (0°)", rotT === 0], ["r:45", "Turn 45°", rotT === 45], ["r:90", "Turn 90°", rotT === 90]], act(a) { setRot(+a.slice(2)); }, destroy: S.destroy };
};
function bar(g, x, y, w, lab, v, col) { text(g, lab, x, y - 12, { size: 17, w: 700 }); rr(g, x, y, w, 22, 11); g.fillStyle = "rgba(22,20,15,.1)"; g.fill(); rr(g, x, y, Math.max(22, w * v), 22, 11); g.fillStyle = col; g.fill(); text(g, Math.round(v * 100) + "%", x + w + 12, y + 18, { size: 18, w: 700 }); }

/* ---------- A2 · the lens simulator (Fresnel-driven, illustrative) ---------- */
SIMS.polsim = (host, ctx) => {
  const S = stage(host, { label: L.illus, aria: "First-person view through sunglasses over water or a road. Controls change lens type, glare, viewing angle and head tilt." });
  const st = { lens: "pol", surf: "water", amt: 85, look: 37, tilt: 0 };
  const sLens = seg("Lens", [["pol", "Polarised"], ["non", "Non-polarised"]], st.lens, (v) => set("lens", v));
  const sSurf = seg("Scene", [["water", "Water"], ["road", "Road"]], st.surf, (v) => set("surf", v));
  const sAmt = slider("Glare", 0, 100, st.amt, (v) => set("amt", v, true), (v) => v + "%");
  const sLook = slider("Looking down", 5, 70, st.look, (v) => set("look", v, true), (v) => v + "°");
  const sTilt = slider("Head tilt", 0, 90, st.tilt, (v) => set("tilt", v, true), (v) => v + "°");
  S.ui.append(sLens, sSurf, sAmt, sLook, sTilt);
  function set(k, v, fromUi) { st[k] = v; if (!fromUi) { ({ lens: sLens, surf: sSurf })[k] ? ({ lens: sLens, surf: sSurf })[k].set(v) : ({ amt: sAmt, look: sLook, tilt: sTilt })[k].set(v); } upd(); ctx.changed(); }
  const n = () => (st.surf === "water" ? 1.33 : 1.5);
  const theta = () => 90 - st.look;
  /* real surfaces ripple and real filters leak a little: average over ±8° and allow 3% leakage */
  const ratio = (th, tilt) => { let s = 0; for (let d = -8; d <= 8; d += 4) s += polRatio(clamp(th + d, 1, 89), n(), tilt); return .03 + .97 * s / 5; };
  function upd() {
    const th = theta(), r = ratio(th, st.tilt), dp = polDegree(th, n()), b = brewster(n());
    live(ctx, `<p class="sec">What's happening</p><p class="txt">Light meets the ${st.surf} at <b>${th}°</b> from vertical. There the reflection is about <b>${Math.round(dp * 100)}%</b> polarised (most at ${Math.round(b)}°).</p>
      <p class="txt" style="margin-top:.5cqw">${st.lens === "pol" ? `This polarised lens lets through about <b>${Math.round(r * 100)}%</b> of the glare a non-polarised lens of the same darkness would.${st.tilt > 30 ? " Tilting the head turns the filter — glare returns." : ""}` : "A non-polarised lens dims the glare and the scene equally: the sheen is still there, just darker."}</p>`);
  }
  const vis = (th) => { const { Rs, Rp } = fresnel(th, n()); return .3 + .7 * clamp(((Rs + Rp) / 2) / .2, 0, 1); };
  S.draw = (g, W, H, t) => {
    const th = theta(), base = st.amt / 100 * vis(th), hy = (.56 - (st.look - 5) / 65 * .86);
    const kind = st.surf === "water" ? "water" : "road";
    paintScene(g, W, H, t, { kind, glare: base, cut: 0, hy });
    /* the sunglasses, rotated by the head tilt */
    const cx = W / 2, cy = H * .56, a = 230, b = 158, gap = 76;
    const inner = () => { g.beginPath(); lensPath(g, cx - gap / 2 - a, cy, a, b); lensPath(g, cx + gap / 2 + a, cy, a, b); };
    g.save(); g.translate(cx, cy); g.rotate(-st.tilt * D2R); g.translate(-cx, -cy);
    inner(); g.save(); g.clip();
    g.setTransform(S.scale, 0, 0, S.scale, 0, 0);
    const r = st.lens === "pol" ? ratio(th, st.tilt) : 1;
    paintScene(g, W, H, t, { kind, glare: base * r, cut: 0, hy }); tintRect(g, 0, 0, W, H, [92, 88, 82], .55);
    g.restore();
    g.lineWidth = 16; g.strokeStyle = "#1B1A17"; g.beginPath(); lensPath(g, cx - gap / 2 - a, cy, a, b); g.stroke(); g.beginPath(); lensPath(g, cx + gap / 2 + a, cy, a, b); g.stroke();
    g.beginPath(); g.moveTo(cx - gap / 2 - 8, cy - b + 40); g.quadraticCurveTo(cx, cy - b - 2, cx + gap / 2 + 8, cy - b + 40); g.stroke();
    g.restore();
    /* readout */
    const rp = st.lens === "pol" ? ratio(th, st.tilt) : 1;
    g.save(); rr(g, 18, 18, 360, 132, 6); g.fillStyle = P.card; g.fill();
    text(g, "GLARE THROUGH THE LENS", 34, 46, { size: 12, color: P.gold, w: 700 });
    text(g, "vs. a non-polarised lens of the same darkness", 34, 66, { size: 13, color: P.mute });
    rr(g, 34, 82, 240, 20, 10); g.fillStyle = "rgba(22,20,15,.1)"; g.fill(); rr(g, 34, 82, Math.max(20, 240 * rp), 20, 10); g.fillStyle = rp < .5 ? P.green : rp < .85 ? P.gold2 : P.red; g.fill();
    text(g, Math.round(rp * 100) + "%", 288, 99, { size: 22, w: 700 });
    text(g, `Light meets the ${st.surf} at ${th}°`, 34, 134, { size: 15, color: P.text });
    g.restore();
    pill(g, st.lens === "pol" ? "Polarised lenses" : "Non-polarised lenses (same darkness)", cx, Math.min(H - 30, cy + b + 44), { align: "center", size: 18, bg: st.lens === "pol" ? "rgba(138,107,50,.94)" : "rgba(22,20,15,.8)" });
  };
  upd();
  return {
    acts: () => [["lens:pol", "Polarised", st.lens === "pol"], ["lens:non", "Non-polarised", st.lens === "non"], ["surf:water", "Water", st.surf === "water"], ["surf:road", "Road", st.surf === "road"],
      ["look:37", "Brewster view (37° down)", st.look === 37], ["look:8", "Far ahead (8° down)", st.look === 8], ["look:65", "Straight down-ish (65°)", st.look === 65], ["tilt:0", "Head level", st.tilt === 0], ["tilt:45", "Tilt 45°", st.tilt === 45], ["tilt:90", "Tilt 90°", st.tilt === 90], ["amt:100", "Glare 100%", st.amt === 100], ["amt:40", "Glare 40%", st.amt === 40]],
    act(a) { const [k, v] = a.split(":"); set(k, k === "lens" || k === "surf" ? v : +v); },
    destroy: S.destroy,
  };
};

/* ---------- A3 · who benefits (scene + drag-able polarised lens) ---------- */
const PROFILE_SCENE = { drive: "road", fish: "water", boat: "sea", beach: "beach", sport: "golf", hike: "lake", out: "pool" };
SIMS.profiles = (host, ctx) => {
  const S = stage(host, { label: "Drag the lens across the scene", aria: "Customer scene with a polarised lens you can move across it." });
  let cur = L.profiles[0].id, lx = .55, ly = .62, drag = false, auto = true;
  const tabs = seg("Customer", L.profiles.map((p) => [p.id, p.n]), cur, (v) => pick(v)); tabs.classList.add("wrap");
  S.ui.append(tabs);
  function pick(id) { cur = id; tabs.set(id); auto = true; side(); ctx.changed(); }
  function side() { const p = L.profiles.find((x) => x.id === cur);
    live(ctx, `<p class="sec">${esc(p.n)}</p><dl class="kv"><dt>Where</dt><dd>${esc(p.env)}</dd><dt>Glare from</dt><dd>${esc(p.src)}</dd><dt>Benefit</dt><dd>${esc(p.ben)}</dd><dt>Watch for</dt><dd>${esc(p.lim)}</dd></dl><p class="sec">Say it</p><p class="say" style="font-size:1.45cqw">${esc(p.say)}</p>`); }
  S.cv.addEventListener("pointerdown", (e) => { drag = true; auto = false; S.cv.setPointerCapture(e.pointerId); const [x, y] = S.pt(e); lx = x / S.W; ly = y / S.H; });
  S.cv.addEventListener("pointermove", (e) => { if (!drag) return; const [x, y] = S.pt(e); lx = clamp(x / S.W, .1, .9); ly = clamp(y / S.H, .25, .9); });
  S.cv.addEventListener("pointerup", () => (drag = false));
  S.draw = (g, W, H, t) => {
    const kind = PROFILE_SCENE[cur];
    if (auto) { lx = .5 + .3 * Math.sin(t / 2400); ly = .64; }
    const o = { kind, glare: 1, cut: 0, angler: cur === "fish", hy: kind === "golf" ? .36 : .42 };
    paintScene(g, W, H, t, o);
    const cx = lx * W, cy = ly * H, a = 170, b = 122, gap = 50;
    g.save(); g.beginPath(); lensPath(g, cx - gap / 2 - a, cy, a, b); lensPath(g, cx + gap / 2 + a, cy, a, b); g.clip(); paintScene(g, W, H, t, Object.assign({}, o, { cut: 1 })); tintRect(g, 0, 0, W, H, [100, 86, 66], .45); g.restore();
    g.lineWidth = 13; g.strokeStyle = "#1B1A17"; g.beginPath(); lensPath(g, cx - gap / 2 - a, cy, a, b); g.stroke(); g.beginPath(); lensPath(g, cx + gap / 2 + a, cy, a, b); g.stroke(); g.beginPath(); g.moveTo(cx - gap / 2 - 6, cy - b + 30); g.quadraticCurveTo(cx, cy - b - 4, cx + gap / 2 + 6, cy - b + 30); g.stroke();
    const p = L.profiles.find((x) => x.id === cur); pill(g, "Glare: " + p.src.toLowerCase(), 22, 38, { size: 17 });
  };
  side();
  return { acts: () => L.profiles.map((p) => ["p:" + p.id, p.n, p.id === cur]), act(a) { pick(a.slice(2)); }, destroy: S.destroy };
};

/* ---------- A4 · trade-offs ---------- */
SIMS.trade = (host, ctx) => {
  const S = stage(host, { label: "Illustration — the real effect depends on the device, display, lens and angle" });
  let cur = "pilot", pol = true, ang = 0;
  const tabs = seg("Situation", L.tradeoffs.map((x) => [x.id, x.n]), cur, (v) => pick(v)); tabs.classList.add("wrap");
  const tog = seg("Lens", [["1", "Polarised"], ["0", "Non-polarised"]], "1", (v) => { pol = v === "1"; ctx.changed(); });
  const sl = slider("Turn head / device", 0, 90, 0, (v) => { ang = v; ctx.changed(); }, (v) => v + "°");
  S.ui.append(tabs, tog, sl);
  function pick(id) { cur = id; tabs.set(id); const x = L.tradeoffs.find((y) => y.id === id); sl.style.display = ["pilot", "hud", "phone"].includes(id) ? "" : "none"; tog.style.display = id === "work" ? "none" : "";
    live(ctx, `<p class="sec">${esc(x.n)} <span class="tag">${esc(x.level)}</span></p><p class="txt">${esc(x.why)} ${refLink(x.ref)}</p><p class="sec">Depends on</p><p class="txt">${esc(x.dep)}</p>`); ctx.changed(); }
  S.draw = (g, W, H, t) => {
    const x = L.tradeoffs.find((y) => y.id === cur);
    g.fillStyle = P.bg; g.fillRect(0, 0, W, H);
    if (cur === "pilot") cockpit(g, W, H, t); else if (cur === "hud") hud(g, W, H, t); else if (cur === "phone") phone(g, W, H, t);
    else if (cur === "ski") { paintScene(g, W, H, t, { kind: "snow", glare: 1, cut: pol ? 1 : 0, hy: .3 }); if (pol) tintRect(g, 0, 0, W, H, [110, 96, 80], .3); pill(g, pol ? "Icy patch: shine reduced — harder to spot" : "Icy patch: the shine warns you", W * .56, H * .3 + (H * .7) * .58 - 90, { align: "center", size: 18, bg: pol ? "rgba(169,71,47,.92)" : "rgba(62,122,74,.92)" }); }
    else if (cur === "work") work(g, W, H);
    else if (cur === "rx") rxDemo(g, W, H);
    pill(g, x.show, 22, H - 30, { size: 17 });
  };
  const lcdLevel = (axis) => pol ? Math.cos((axis - ang) * D2R) ** 2 : 1;
  function cockpit(g, W, H, t) {
    const sk = g.createLinearGradient(0, 0, 0, H * .45); sk.addColorStop(0, "#7FB2D6"); sk.addColorStop(1, "#E6EFF1"); g.fillStyle = sk; g.fillRect(0, 0, W, H * .45);
    g.fillStyle = "#9FB2A2"; g.fillRect(0, H * .38, W, H * .07);
    if (pol) { const rb = g.createLinearGradient(0, 0, W, H * .4); ["rgba(255,0,0,.06)", "rgba(255,200,0,.06)", "rgba(0,200,120,.06)", "rgba(0,120,255,.06)", "rgba(200,0,255,.06)"].forEach((c, i) => rb.addColorStop(i / 4, c)); g.fillStyle = rb; g.fillRect(0, 0, W, H * .45); }
    g.fillStyle = "#24272B"; g.beginPath(); g.moveTo(0, H * .42); g.quadraticCurveTo(W / 2, H * .34, W, H * .42); g.lineTo(W, H); g.lineTo(0, H); g.fill();
    const lv = lcdLevel(60);
    [[W * .2, "SPD", "128"], [W * .5, "ALT", "4 500"], [W * .8, "HDG", "275"]].forEach(([x, l, v]) => { rr(g, x - 140, H * .5, 280, 200, 10); g.fillStyle = "#0B0D0F"; g.fill();
      g.globalAlpha = .12 + .88 * lv; rr(g, x - 126, H * .5 + 14, 252, 172, 6); g.fillStyle = "#102A3A"; g.fill(); text(g, l, x, H * .5 + 60, { size: 22, color: "#7FD3FF", align: "center", w: 700 }); text(g, v, x, H * .5 + 130, { size: 56, color: "#E6F7FF", align: "center", w: 700 }); g.globalAlpha = 1; });
    if (pol) tintRect(g, 0, 0, W, H, [100, 96, 90], .35);
    pill(g, pol ? `LCD brightness through the lens: ${Math.round(lv * 100)}%` : "Non-polarised: displays unaffected", W / 2, H * .5 - 24, { align: "center", size: 17, bg: P.card, fg: P.ink });
  }
  function hud(g, W, H, t) { paintScene(g, W, H, t, { kind: "road", glare: .6, cut: pol ? 1 : 0, hy: .38 }); g.fillStyle = "#1F2226"; g.beginPath(); g.moveTo(0, H * .78); g.quadraticCurveTo(W / 2, H * .7, W, H * .78); g.lineTo(W, H); g.lineTo(0, H); g.fill();
    const lv = pol ? .08 + .92 * Math.sin(ang * D2R) ** 2 : 1; g.globalAlpha = lv; text(g, "88", W * .5, H * .62, { size: 88, color: "#7CF0C8", align: "center", w: 700 }); text(g, "km/h", W * .5, H * .67, { size: 20, color: "#7CF0C8", align: "center" }); arrow(g, W * .62, H * .6, W * .7, H * .52, { color: "#7CF0C8", w: 6, head: 22 }); g.globalAlpha = 1;
    if (pol) tintRect(g, 0, 0, W, H, [100, 96, 90], .35);
    pill(g, pol ? `Head-up display: ${Math.round(lv * 100)}% visible` : "Head-up display fully visible", W * .5, H * .1, { align: "center", size: 17 }); }
  function phone(g, W, H, t) { const lv = lcdLevel(0); g.fillStyle = P.bg; g.fillRect(0, 0, W, H);
    g.save(); g.translate(W * .5, H * .48); g.rotate(-ang * D2R); g.fillStyle = "#111"; rr(g, -130, -250, 260, 500, 34); g.fill(); g.globalAlpha = .06 + .94 * lv; g.fillStyle = "#F7F7F7"; rr(g, -116, -232, 232, 464, 22); g.fill(); g.fillStyle = "#2F6B8F"; g.fillRect(-90, -190, 180, 90); g.fillStyle = "#9AA6AF"; for (let i = 0; i < 7; i++) g.fillRect(-90, -80 + i * 34, 120 + (i * 37) % 60, 12); g.globalAlpha = 1; g.restore();
    if (pol) tintRect(g, 0, 0, W, H, [100, 96, 90], .3);
    pill(g, pol ? `Screen through the lens: ${Math.round(lv * 100)}%` : "Non-polarised: screen unaffected", W * .5, 36, { align: "center", size: 17 }); }
  function work(g, W, H) { g.fillStyle = P.bg; g.fillRect(0, 0, W, H);
    const draw = (x, y, safety) => { g.save(); g.translate(x, y); g.strokeStyle = P.ink; g.lineWidth = 10; g.fillStyle = safety ? "rgba(180,200,215,.5)" : "rgba(60,56,50,.75)";
      if (safety) { rr(g, -230, -70, 460, 150, 50); g.fill(); g.stroke(); g.lineWidth = 6; g.beginPath(); g.moveTo(-230, -20); g.lineTo(-290, -10); g.lineTo(-290, 60); g.lineTo(-230, 70); g.stroke(); g.beginPath(); g.moveTo(230, -20); g.lineTo(290, -10); g.lineTo(290, 60); g.lineTo(230, 70); g.stroke(); }
      else { g.beginPath(); lensPath(g, -110, 0, 100, 72); lensPath(g, 110, 0, 100, 72); g.fill(); g.stroke(); }
      g.restore(); };
    draw(W * .3, H * .38, false); draw(W * .7, H * .38, true);
    text(g, "Fashion sunglasses", W * .3, H * .62, { size: 24, align: "center", w: 700 }); text(g, "Not protective equipment", W * .3, H * .67, { size: 18, align: "center", color: P.red });
    text(g, "Certified protective eyewear", W * .7, H * .62, { size: 24, align: "center", w: 700 }); text(g, "Marked to the relevant safety standard", W * .7, H * .67, { size: 18, align: "center", color: P.green }); }
  function rxDemo(g, W, H) { g.fillStyle = P.bg; g.fillRect(0, 0, W, H); const cx = W * .32, cy = H * .44;
    g.save(); g.beginPath(); lensPath(g, cx, cy, 220, 170); g.clip(); g.fillStyle = "rgba(110,96,78,.45)"; g.fillRect(cx - 240, cy - 190, 480, 380);
    g.fillStyle = "rgba(255,255,255,.45)"; g.fillRect(cx - 240, cy - 190, 480, 160); g.fillStyle = "rgba(255,255,255,.3)"; g.beginPath(); g.moveTo(cx - 30, cy - 30); g.lineTo(cx + 30, cy - 30); g.lineTo(cx + 60, cy + 190); g.lineTo(cx - 60, cy + 190); g.fill();
    g.strokeStyle = "rgba(22,20,15,.25)"; g.lineWidth = 3; for (let x = cx - 240; x < cx + 240; x += 18) { g.beginPath(); g.moveTo(x, cy - 190); g.lineTo(x, cy + 190); g.stroke(); } g.restore();
    g.lineWidth = 10; g.strokeStyle = P.ink; g.beginPath(); lensPath(g, cx, cy, 220, 170); g.stroke();
    text(g, "distance", cx, cy - 90, { size: 18, align: "center", w: 700 }); text(g, "near", cx, cy + 130, { size: 18, align: "center", w: 700 });
    const items = [["Prescription", "set by the optician"], ["Polarising film", "built into the lens (lines)"], ["Frame curve", "strong wraps limit some prescriptions"], ["Supplier range", "decides what's possible"]];
    items.forEach(([a, b], i) => { text(g, a, W * .6, H * .26 + i * 70, { size: 24, w: 700 }); text(g, b, W * .6, H * .26 + i * 70 + 26, { size: 18, color: P.mute }); }); }
  pick(cur);
  return { acts: () => [...L.tradeoffs.map((x) => ["t:" + x.id, x.n, x.id === cur]), ["pol:1", "Polarised", pol], ["pol:0", "Non-polarised", !pol], ["ang:0", "Upright", ang === 0], ["ang:45", "Turn 45°", ang === 45], ["ang:90", "Turn 90°", ang === 90]],
    act(a) { const [k, v] = a.split(":"); if (k === "t") pick(v); else if (k === "pol") { pol = v === "1"; tog.set(v); } else { ang = +v; sl.set(ang); } ctx.changed(); }, destroy: S.destroy };
};

/* ---------- A4 · decision guide ---------- */
SIMS.decide = (host, ctx) => {
  const wrap = h(`<div class="wdg decide"></div>`); host.appendChild(wrap);
  let i = 0, path = [], notes = [], end = null;
  function render() {
    const crumbs = L.decide.map((d, k) => { const p = path[k]; return `<li class="${p ? (p.a ? "y" : "n") : !end && k === i ? "cur" : "todo"}"><span>${k + 1}. ${esc(d.q)}</span><b>${p ? (p.a ? "Yes" : "No") : !end && k === i ? "Now" : end ? "—" : ""}</b></li>`; }).join("");
    if (end) {
      const tone = end.end === "stop" ? "stop" : end.end === "refer" ? "refer" : end.end === "maybe" ? "maybe" : "good";
      wrap.innerHTML = `<div class="dz-card ${tone}"><p class="eyebrow">Recommendation</p><h3>${esc(end.t)}</h3><p class="txt">${esc(end.d)} ${refLink(end.ref)}</p>${notes.length ? `<p class="sec">Check with the customer</p><ul class="dz-notes">${notes.map((n) => `<li>${esc(n.note)} ${refLink(n.ref)}</li>`).join("")}</ul>` : ""}<div class="dz-btns"><button type="button" class="sbtn" data-r>Start again</button></div></div><ol class="dz-path">${crumbs}</ol>`;
    } else {
      const q = L.decide[i];
      wrap.innerHTML = `<div class="dz-card"><p class="eyebrow">Question ${i + 1} of ${L.decide.length}</p><h3>${esc(q.q)}</h3><div class="dz-btns"><button type="button" class="sbtn ink" data-a="1">Yes</button><button type="button" class="sbtn" data-a="0">No</button>${i ? `<button type="button" class="sbtn ghost" data-b>Back</button>` : ""}</div></div><ol class="dz-path">${crumbs}</ol>`;
    }
    live(ctx, `<p class="sec">How to use it</p><p class="txt">Ask the customer each question. The guide ends with a recommendation and the reasons — use them as your words.</p>`);
  }
  function ans(yes) { if (end) return; const q = L.decide[i], r = yes ? q.yes : q.no; path.push({ a: yes });
    if (r && r.end) { end = r; } else { if (r && r.note) notes.push(r); i++; if (i >= L.decide.length) end = Object.assign({ end: "good" }, L.decideGood); }
    render(); ctx.changed(); }
  function back() { if (!path.length) return; path.pop(); end = null; i = path.length; notes = []; path.forEach((p, k) => { const r = p.a ? L.decide[k].yes : L.decide[k].no; if (r && r.note) notes.push(r); }); render(); ctx.changed(); }
  function restart() { i = 0; path = []; notes = []; end = null; render(); ctx.changed(); }
  wrap.addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return; if (b.hasAttribute("data-a")) ans(b.dataset.a === "1"); else if (b.hasAttribute("data-b")) back(); else if (b.hasAttribute("data-r")) restart(); });
  render();
  return { acts: () => end ? [["restart", "Start again"]] : [["yes", "Yes"], ["no", "No"], ...(i ? [["back", "Back"]] : [])], act(a) { a === "yes" ? ans(true) : a === "no" ? ans(false) : a === "back" ? back() : restart(); }, destroy: () => wrap.remove() };
};

/* ---------- A5 · identify a polarised lens ---------- */
SIMS.ident = (host, ctx) => {
  const S = stage(host, { label: "Simulated test — a demonstration, not product verification" });
  const I = L.identify, demo = { id: "demo", n: "Demo polarised pair", pol: true, dark: .7, tint: [90, 80, 66], mirror: false };
  let meth = "card", pair = demo, rot = 0, rotT = 0, lp = [.5, .47], drag = false; const verdict = {};
  const sm = seg("Method", I.methods.map((m) => [m.id, m.n]), meth, (v) => { meth = v; side(); ctx.changed(); });
  const sp = seg("Glasses", [["demo", "Demo pair"], ...I.mystery.map((m, k) => [m.id, "Pair " + (k + 1)])], "demo", (v) => { pair = v === "demo" ? demo : I.mystery.find((m) => m.id === v); side(); ctx.changed(); }); sp.classList.add("wrap");
  const sl = slider("Turn the glasses", 0, 90, 0, (v) => { rotT = v; }, (v) => v + "°");
  const vd = h(`<div class="seg"><span class="seg-l">Your call</span></div>`); const vy = btn("Polarised", () => call(true)), vn = btn("Not polarised", () => call(false)); vd.append(vy, vn);
  S.ui.append(sm, sp, sl, vd);
  function call(yes) { if (pair.id === "demo") return; verdict[pair.id] = yes === pair.pol; side(); ctx.changed(); }
  function side() { const m = I.methods.find((x) => x.id === meth); vd.style.display = pair.id === "demo" ? "none" : "";
    const done = Object.keys(verdict).length, ok = Object.values(verdict).filter(Boolean).length;
    const fb = pair.id !== "demo" && pair.id in verdict ? `<p class="fb ${verdict[pair.id] ? "ok" : "no"}">${verdict[pair.id] ? "Correct" : "Not quite"} — ${esc(pair.n)} is ${pair.pol ? "" : "not "}polarised.${!pair.pol && pair.dark > .7 ? " Dark doesn't mean polarised." : ""}${pair.mirror ? " The mirror finish is a separate coating." : ""}</p>` : "";
    live(ctx, `<p class="sec">${esc(m.n)}: how to</p><ol class="steps-ol">${m.steps.map((s) => `<li>${esc(s)}</li>`).join("")}</ol><p class="txt" style="font-size:1.02cqw;color:var(--mute)">${esc(m.note)} ${refLink(m.ref)}</p>${fb}<p class="sec">Mystery pairs · ${ok}/${I.mystery.length} correct${done < I.mystery.length ? ` · ${I.mystery.length - done} to test` : ""}</p><ul class="warn">${I.warnings.map((w) => `<li>${esc(w)}</li>`).join("")}</ul>`); }
  S.cv.addEventListener("pointerdown", (e) => { drag = true; S.cv.setPointerCapture(e.pointerId); move(e); });
  S.cv.addEventListener("pointermove", (e) => drag && move(e)); S.cv.addEventListener("pointerup", () => (drag = false));
  function move(e) { const [x, y] = S.pt(e); lp = [clamp(x / S.W, .15, .85), clamp(y / S.H, .2, .85)]; }
  S.draw = (g, W, H, t) => {
    rot = lerp(rot, rotT, .15);
    g.fillStyle = P.bg; g.fillRect(0, 0, W, H); g.fillStyle = "rgba(0,0,0,.03)"; for (let y = 0; y < H; y += 28) g.fillRect(0, y, W, 2);
    const tint = pair.tint, k = pair.dark;
    if (meth === "card") {
      const cw = 860, ch = 470, cx = W / 2 - cw / 2, cy = H / 2 - ch / 2 - 20;
      const drawCard = (through) => { g.fillStyle = "#FBFAF7"; rr(g, cx, cy, cw, ch, 14); g.fill(); g.strokeStyle = P.line; g.lineWidth = 2; g.stroke();
        text(g, "POLARISATION TEST CARD", cx + cw / 2, cy + 44, { size: 20, align: "center", color: P.gold, w: 700 });
        g.fillStyle = "#D9D3C7"; for (let i = 0; i < 15; i++) g.fillRect(cx + 40, cy + 74 + i * 24, cw - 80, 11);
        if (through && pair.pol) { const c = Math.cos(2 * rot * D2R); g.save(); g.globalAlpha = Math.abs(c); g.fillStyle = c > 0 ? "#16140F" : "#FBFAF7"; g.font = `800 92px ${KIT.FONT}`; g.textAlign = "center"; g.fillText("POLARISED", cx + cw / 2, cy + ch / 2 + 34); g.restore(); }
        text(g, "View through the lens", cx + cw / 2, cy + ch - 22, { size: 16, align: "center", color: P.mute }); };
      drawCard(false);
      glassesOver(g, W, H, () => drawCard(true));
    } else if (meth === "cross") {
      const r = 170, ax = W * .4, bx = W * .6, cy = H * .48;
      g.save(); g.beginPath(); g.arc(ax, cy, r, 0, 7); g.clip(); tintRect(g, 0, 0, W, H, tint, k * .8); axis(g, ax, cy, r, 0); g.restore();
      g.save(); g.beginPath(); g.arc(bx, cy, r, 0, 7); g.clip(); tintRect(g, 0, 0, W, H, tint, k * .8); axis(g, bx, cy, r, rot); g.restore();
      g.save(); g.beginPath(); g.arc(ax, cy, r, 0, 7); g.clip(); g.beginPath(); g.arc(bx, cy, r, 0, 7); g.clip(); const extra = pair.pol ? 1 - Math.cos(rot * D2R) ** 2 : 0; g.fillStyle = `rgba(8,8,8,${.92 * extra})`; g.fillRect(0, 0, W, H); g.restore();
      [ax, bx].forEach((x) => { g.strokeStyle = P.ink; g.lineWidth = 8; g.beginPath(); g.arc(x, cy, r, 0, 7); g.stroke(); if (pair.mirror) { g.strokeStyle = pair.mirror; g.lineWidth = 3; g.beginPath(); g.arc(x, cy, r - 7, 0, 7); g.stroke(); } });
      text(g, "fixed", ax - 90, cy - r - 18, { size: 18, color: P.mute, align: "center" }); text(g, "turned " + Math.round(rot) + "°", bx + 90, cy - r - 18, { size: 18, color: P.mute, align: "center" });
      text(g, "overlap", (ax + bx) / 2, cy + r + 34, { size: 18, align: "center", w: 700 });
    } else {
      const sx = W * .18, sy = H * .1, sw = W * .64, sh = H * .62;
      const scr = (through) => { g.fillStyle = "#111"; rr(g, sx - 18, sy - 18, sw + 36, sh + 36, 16); g.fill(); g.fillStyle = "#FDFDFD"; g.fillRect(sx, sy, sw, sh); g.fillStyle = "#2F6B8F"; g.fillRect(sx + 30, sy + 30, sw - 60, 60); g.fillStyle = "#AAB4BC"; for (let i = 0; i < 9; i++) g.fillRect(sx + 30, sy + 120 + i * 30, sw * (.5 + .4 * ((i * 37) % 10) / 10), 12);
        if (through && pair.pol) { g.fillStyle = `rgba(0,0,0,${.94 * Math.sin(rot * D2R) ** 2})`; g.fillRect(sx, sy, sw, sh); } };
      scr(false); g.fillStyle = "#2B2A28"; g.fillRect(W / 2 - 60, sy + sh + 18, 120, 40); g.fillRect(W / 2 - 160, sy + sh + 56, 320, 12);
      glassesOver(g, W, H, () => scr(true));
    }
    pill(g, pair.id === "demo" ? "Demo pair: polarised" : pair.n + " — test it, then make your call", 22, 36, { size: 17 });
  };
  function glassesOver(g, W, H, paintThrough) { const cx = lp[0] * W, cy = lp[1] * H, a = 190, b = 135, gap = 54;
    g.save(); g.translate(cx, cy); g.rotate(-rot * D2R); g.translate(-cx, -cy);
    g.save(); g.beginPath(); lensPath(g, cx - gap / 2 - a, cy, a, b); lensPath(g, cx + gap / 2 + a, cy, a, b); g.clip();
    g.setTransform(S.scale, 0, 0, S.scale, 0, 0); paintThrough(); tintRect(g, 0, 0, W, H, pair.tint, pair.dark * .8); g.restore();
    g.lineWidth = 12; g.strokeStyle = "#1B1A17"; g.beginPath(); lensPath(g, cx - gap / 2 - a, cy, a, b); g.stroke(); g.beginPath(); lensPath(g, cx + gap / 2 + a, cy, a, b); g.stroke();
    if (pair.mirror) { g.strokeStyle = pair.mirror; g.lineWidth = 4; g.globalAlpha = .8; g.beginPath(); lensPath(g, cx - gap / 2 - a, cy, a - 8, b - 8); g.stroke(); g.beginPath(); lensPath(g, cx + gap / 2 + a, cy, a - 8, b - 8); g.stroke(); g.globalAlpha = 1; }
    g.beginPath(); g.moveTo(cx - gap / 2 - 6, cy - b + 26); g.quadraticCurveTo(cx, cy - b - 4, cx + gap / 2 + 6, cy - b + 26); g.stroke(); g.restore(); }
  function axis(g, x, y, r, a) { if (!pair.pol) return; g.save(); g.translate(x, y); g.rotate(a * D2R); g.strokeStyle = "rgba(22,20,15,.18)"; g.lineWidth = 2; for (let i = -r; i <= r; i += 14) { g.beginPath(); g.moveTo(i, -r); g.lineTo(i, r); g.stroke(); } g.restore(); }
  /* the slider sets the target; keep the readout in step when the remote turns it */
  side();
  return { acts: () => [...I.methods.map((m) => ["m:" + m.id, m.n, m.id === meth]), ["g:demo", "Demo pair", pair.id === "demo"], ...I.mystery.map((m, k) => ["g:" + m.id, "Pair " + (k + 1), pair.id === m.id]), ["r:0", "Upright", rotT === 0], ["r:45", "Turn 45°", rotT === 45], ["r:90", "Turn 90°", rotT === 90], ...(pair.id !== "demo" ? [["v:1", "Call: polarised"], ["v:0", "Call: not polarised"]] : [])],
    act(a) { const [k, v] = a.split(":"); if (k === "m") { meth = v; sm.set(v); side(); } else if (k === "g") { pair = v === "demo" ? demo : I.mystery.find((m) => m.id === v); sp.set(v); side(); } else if (k === "r") { rotT = +v; sl.set(+v); } else if (k === "v") call(v === "1"); ctx.changed(); }, destroy: S.destroy };
};

/* ---------- A6 · polarisation vs UV ---------- */
SIMS.uvq = (host, ctx) => {
  const U = L.uv; const res = {};
  const wrap = h(`<div class="wdg uvq"></div>`); host.appendChild(wrap);
  const specSvg = `<svg viewBox="0 0 400 110" class="spec" role="img" aria-label="Spectrum: UV below 400 nanometres is blocked by a UV400 lens; visible light passes."><defs><linearGradient id="vis" x1="0" x2="1"><stop offset="0" stop-color="#7B3FBF"/><stop offset=".2" stop-color="#3355DD"/><stop offset=".4" stop-color="#22AA88"/><stop offset=".6" stop-color="#E6D23A"/><stop offset=".8" stop-color="#EE8833"/><stop offset="1" stop-color="#CC2222"/></linearGradient><pattern id="hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="8" height="8" fill="#E9E2D6"/><line x1="0" y1="0" x2="0" y2="8" stroke="#A59E91" stroke-width="3"/></pattern></defs>
    <rect x="10" y="20" width="110" height="40" fill="url(#hatch)"/><rect x="120" y="20" width="270" height="40" fill="url(#vis)"/><line x1="120" y1="10" x2="120" y2="72" stroke="currentColor" stroke-width="2.5"/>
    <text x="65" y="88" font-size="13" text-anchor="middle" fill="currentColor" font-family="Inter" font-weight="600">UV (invisible)</text><text x="255" y="88" font-size="13" text-anchor="middle" fill="currentColor" font-family="Inter" font-weight="600">Visible light</text><text x="120" y="104" font-size="12" text-anchor="middle" fill="currentColor" fill-opacity=".62" font-family="Inter">400 nm</text></svg>`;
  const polSvg = `<svg viewBox="0 0 400 110" class="spec" role="img" aria-label="Glare vibrating horizontally is stopped by the vertical slots of the polarising film; vertical vibration passes."><rect x="160" y="10" width="80" height="90" rx="10" fill="currentColor" fill-opacity=".1" stroke="currentColor" stroke-width="2.5"/>${[0, 1, 2, 3, 4].map((i) => `<line x1="${172 + i * 14}" y1="16" x2="${172 + i * 14}" y2="94" stroke="currentColor" stroke-width="2"/>`).join("")}
    <g stroke="#A9472F" stroke-width="4" stroke-linecap="round"><line x1="40" y1="40" x2="110" y2="40"/></g><g stroke="#3E7A4A" stroke-width="4" stroke-linecap="round"><line x1="75" y1="58" x2="75" y2="92"/><line x1="320" y1="58" x2="320" y2="92"/></g>
    <text x="75" y="28" font-size="13" text-anchor="middle" fill="#A9472F" font-family="Inter" font-weight="600">glare ↔</text><text x="320" y="44" font-size="13" text-anchor="middle" fill="#3E7A4A" font-family="Inter" font-weight="600">passes ↕</text></svg>`;
  function render() {
    wrap.innerHTML = `<div class="uv-cols"><div class="uv-col"><h4>${esc(U.pol.t)}</h4>${polSvg}<ul>${U.pol.items.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div><div class="uv-col"><h4>${esc(U.uv.t)}</h4>${specSvg}<ul>${U.uv.items.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div></div>
      <p class="uv-rule">${esc(U.rule)} ${refLink(U.ref)}</p>
      <div class="tfq">${U.quiz.map((q, k) => { const r = res[k]; return `<div class="tf ${r == null ? "" : r ? "ok" : "no"}"><p>${esc(q.q)}</p><div><button type="button" class="sbtn" data-k="${k}" data-v="1" ${r != null ? "disabled" : ""}>True</button><button type="button" class="sbtn" data-k="${k}" data-v="0" ${r != null ? "disabled" : ""}>False</button></div>${r != null ? `<p class="fb ${r ? "ok" : "no"}">${r ? "Correct." : "Not quite."} ${esc(q.e)}</p>` : ""}</div>`; }).join("")}</div>`;
    const n = Object.keys(res).length, ok = Object.values(res).filter(Boolean).length;
    live(ctx, `<p class="sec">Quick check</p><p class="txt">${n < U.quiz.length ? `Answer the four statements — ${U.quiz.length - n} left.` : `<b>${ok} of ${U.quiz.length}</b> right.`}</p><p class="sec">The rule</p><p class="txt">${esc(U.rule)}</p>`);
  }
  function ans(k, v) { if (res[k] != null) return; res[k] = U.quiz[k].a === v; render(); ctx.changed(); }
  wrap.addEventListener("click", (e) => { const b = e.target.closest("button[data-k]"); if (b) ans(+b.dataset.k, b.dataset.v === "1"); });
  render();
  const curQ = () => U.quiz.findIndex((q, k) => res[k] == null);
  return { acts: () => { const k = curQ(); return k < 0 ? [] : [["t:" + k, "Q" + (k + 1) + ": True"], ["f:" + k, "Q" + (k + 1) + ": False"]]; }, act(a) { const [x, k] = a.split(":"); ans(+k, x === "t"); }, destroy: () => wrap.remove() };
};

/* ---------- A7 · myth or fact ---------- */
SIMS.myths = (host, ctx) => {
  const M = L.myths, res = {};
  const wrap = h(`<div class="wdg myths"></div>`); host.appendChild(wrap);
  function render() {
    wrap.innerHTML = M.map((m, k) => { const r = res[k]; return `<div class="myth ${r == null ? "" : "done " + (r ? "ok" : "no")}"><p class="ms">${esc(m.s)}</p>${r == null ? `<div class="mb"><button type="button" class="sbtn" data-k="${k}" data-v="m">Myth</button><button type="button" class="sbtn" data-k="${k}" data-v="f">Fact</button></div>` : `<p class="me"><b>${m.m ? "Myth" : "Fact"}.</b> ${esc(m.e)} ${refLink(m.ref)}</p>`}</div>`; }).join("");
    const n = Object.keys(res).length, ok = Object.values(res).filter(Boolean).length;
    live(ctx, `<p class="sec">Score</p><p class="big-s">${ok}<small>/${n || 0} answered</small></p><p class="txt">Vote as a room, then tap Myth or Fact. ${n === M.length ? "All done — discuss the ones the room got wrong." : ""}</p>`);
  }
  function ans(k, myth) { if (res[k] != null) return; res[k] = M[k].m === myth; render(); ctx.changed(); }
  wrap.addEventListener("click", (e) => { const b = e.target.closest("button[data-k]"); if (b) ans(+b.dataset.k, b.dataset.v === "m"); });
  render();
  const curK = () => M.findIndex((m, k) => res[k] == null);
  return { acts: () => { const k = curK(); return k < 0 ? [] : [["m:" + k, "№" + (k + 1) + " Myth"], ["f:" + k, "№" + (k + 1) + " Fact"]]; }, act(a) { const [x, k] = a.split(":"); ans(+k, x === "m"); }, destroy: () => wrap.remove() };
};
})();
