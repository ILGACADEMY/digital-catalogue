/* =====================================================================
   MODULES C–G · anatomy explorer, comparison lab, care, consultation,
   assessment — DOM/SVG widgets on the same sim interface
   ===================================================================== */
(function () {
"use strict";
const { P, esc, clamp, h, stage, paintScene, rng } = KIT;
const L = LENS;
const live = (ctx, html) => { const el = ctx.side && ctx.side.querySelector("[data-live]"); if (el) el.innerHTML = html; };
const refLink = (k) => (k && REFS[k] ? `<a class="ref" href="${esc(REFS[k].u)}" target="_blank" rel="noopener" title="${esc(REFS[k].t)}">source</a>` : "");
const KCOL = { coating: "#C9A24E", filter: "#2F6B8F", tint: "#8A5A36", material: "#9AA6AF", claim: "#A9472F" };
const kindChip = (k) => `<span class="kchip" style="--k:${KCOL[k] || "#999"}">${esc((L.kinds[k] || { n: k === "claim" ? "Claim" : k }).n)}</span>`;

/* ---------- C · conceptual lens cross-section (also used by the assessment) ---------- */
function xsecSVG(on, sel, o = {}) {
  const has = (id) => on.has(id);
  const bands = []; let y = 70;
  const add = (id, hgt, side) => { bands.push({ id, y, h: hgt, side }); y += hgt; };
  /* front surface treatments */
  if (has("top")) add("top", 16, "front"); if (has("mirror")) add("mirror", 20, "front"); if (has("ar") && !has("mirror")) add("ar", 30, "front"); if (has("hard")) add("hard", 24, "front");
  const subY = y, subH = 230; y += subH;
  if (has("hard")) add("hard", 24, "back"); if (has("ar")) add("ar", 30, "back"); if (has("top")) add("top", 16, "back");
  const X0 = 330, X1 = 640, LX = 690;
  const col = { top: "#E7D6A8", mirror: "url(#mir)", ar: "url(#arG)", hard: "#C9A24E" };
  const bandSvg = bands.map((b) => `<g class="lay${sel === b.id ? " sel" : ""}" data-l="${b.id}" tabindex="0" role="button" aria-label="${esc(L.layers.find((x) => x.id === b.id).n)}"><rect x="${X0}" y="${b.y}" width="${X1 - X0}" height="${b.h}" fill="${col[b.id]}" stroke="currentColor" stroke-width="1"/></g>`).join("");
  const subSvg = `<g class="lay${sel === "sub" ? " sel" : ""}" data-l="sub" tabindex="0" role="button" aria-label="Lens substrate"><rect x="${X0}" y="${subY}" width="${X1 - X0}" height="${subH}" fill="#C8D9E3" stroke="currentColor" stroke-width="1"/></g>
    ${has("tint") ? `<g class="lay${sel === "tint" ? " sel" : ""}" data-l="tint" tabindex="0" role="button" aria-label="Tint or photochromic dye"><rect x="${X0}" y="${subY}" width="${X1 - X0}" height="${subH * .45}" fill="rgba(110,82,54,.42)"/></g>` : ""}
    ${has("uv") ? `<g class="lay${sel === "uv" ? " sel" : ""}" data-l="uv" tabindex="0" role="button" aria-label="UV absorber"><rect x="${X0}" y="${subY + subH * .55}" width="${X1 - X0}" height="${subH * .45}" fill="url(#uvP)"/></g>` : ""}
    ${has("pol") ? `<g class="lay${sel === "pol" ? " sel" : ""}" data-l="pol" tabindex="0" role="button" aria-label="Polarising film"><rect x="${X0}" y="${subY + subH * .45}" width="${X1 - X0}" height="${subH * .1}" fill="url(#polP)" stroke="currentColor" stroke-width="1"/></g>` : ""}`;
  /* labels with leader lines */
  const labs = []; const seen = new Set();
  bands.forEach((b) => { if (seen.has(b.id + b.side)) return; seen.add(b.id + b.side); labs.push({ id: b.id, y: b.y + b.h / 2, t: (L.layers.find((x) => x.id === b.id).s || L.layers.find((x) => x.id === b.id).n) + (b.side === "back" ? " (back)" : "") }); });
  labs.push({ id: "sub", y: subY + subH * .8, t: "Lens substrate" }); if (has("tint")) labs.push({ id: "tint", y: subY + subH * .22, t: "Tint / photochromic" }); if (has("pol")) labs.push({ id: "pol", y: subY + subH * .5, t: "Polarising film" }); if (has("uv")) labs.push({ id: "uv", y: subY + subH * .68, t: "UV absorber" });
  labs.sort((a, b) => a.y - b.y); let ly = 40; labs.forEach((l) => { l.ly = Math.max(ly, l.y); ly = l.ly + 34; });
  const k0 = (id) => KCOL[(L.layers.find((x) => x.id === id) || {}).kind] || "#999";
  const labSvg = o.noLabels ? "" : labs.map((l) => `<g class="lab${sel === l.id ? " sel" : ""}" data-l="${l.id}"><path d="M${X1},${l.y} L${LX - 12},${l.ly}" stroke="currentColor" stroke-opacity=".55" stroke-width="1" fill="none"/><circle cx="${LX}" cy="${l.ly}" r="6" fill="${k0(l.id)}"/><text x="${LX + 14}" y="${l.ly + 6}" font-size="19" font-family="Inter" font-weight="${sel === l.id ? 700 : 500}" fill="currentColor">${esc(l.t)}</text></g>`).join("");
  const H = Math.max(y + 60, ly + 20);
  return `<svg viewBox="0 0 1000 ${H}" class="xsec" role="group" aria-label="Conceptual lens cross-section"><defs>
    <linearGradient id="mir" x1="0" x2="1"><stop offset="0" stop-color="#9CC7F4"/><stop offset=".5" stop-color="#E8F2FC"/><stop offset="1" stop-color="#2C5FA8"/></linearGradient>
    <pattern id="arG" width="12" height="30" patternUnits="userSpaceOnUse"><rect width="12" height="30" fill="#DDEFE3"/><rect y="6" width="12" height="4" fill="#9BD3AE"/><rect y="16" width="12" height="4" fill="#B9C7F0"/><rect y="25" width="12" height="3" fill="#9BD3AE"/></pattern>
    <pattern id="polP" width="10" height="10" patternUnits="userSpaceOnUse"><rect width="10" height="10" fill="#3A4048"/><line x1="5" y1="0" x2="5" y2="10" stroke="#9AA6AF" stroke-width="2"/></pattern>
    <pattern id="uvP" width="14" height="14" patternUnits="userSpaceOnUse"><circle cx="7" cy="7" r="2.4" fill="#7B3FBF" opacity=".55"/></pattern></defs>
    <text x="40" y="34" font-size="15" font-family="Inter" font-weight="700" letter-spacing="2" fill="#8A6B32">CONCEPTUAL · NOT TO SCALE</text>
    <g transform="translate(40,90)"><path d="M10,0 Q120,-24 230,0 Q246,110 230,220 Q120,244 10,220 Q-6,110 10,0Z" fill="${has("tint") ? "rgba(110,82,54,.4)" : "#DCE7EE"}" stroke="currentColor" stroke-width="5"/>${has("mirror") ? `<path d="M10,0 Q120,-24 230,0 Q246,110 230,220 Q120,244 10,220 Q-6,110 10,0Z" fill="url(#mir)" opacity=".55"/>` : ""}<rect x="150" y="80" width="40" height="60" fill="none" stroke="#8A6B32" stroke-width="3"/></g>
    <path d="M230,170 L${X0},70 M230,230 L${X0},${y}" stroke="#8A6B32" stroke-width="1.5" stroke-dasharray="5 5" fill="none"/>
    <text x="${X0}" y="58" font-size="14" font-family="Inter" fill="currentColor" fill-opacity=".62">front (outside)</text><text x="${X0}" y="${y + 24}" font-size="14" font-family="Inter" fill="currentColor" fill-opacity=".62">back (eye side)</text>
    ${subSvg}${bandSvg}${labSvg}</svg>`;
}
SIMS._xsec = xsecSVG;
SIMS.anat = (host, ctx) => {
  const wrap = h(`<div class="wdg anat"><p class="concept">${esc(L.concept)}</p><div class="xs-host"></div><div class="sim-ui"></div></div>`); host.appendChild(wrap);
  const on = new Set(L.presets.sun.on); let sel = "pol", preset = "sun";
  const ui = wrap.querySelector(".sim-ui");
  const pre = KIT.seg("Lens", Object.entries(L.presets).map(([k, p]) => [k, p.n]), preset, (k) => setPreset(k));
  const tog = h(`<div class="seg wrap" role="group" aria-label="Layers"><span class="seg-l">Layers</span>${L.layers.map((l) => `<button type="button" data-t="${l.id}" aria-pressed="${on.has(l.id)}">${esc(l.n.split(" (")[0].replace("Hydrophobic / oleophobic top coat", "Top coat").replace("Anti-reflective stack", "AR").replace("Tint or photochromic dye", "Tint / photochromic"))}</button>`).join("")}</div>`);
  ui.append(pre, tog);
  tog.addEventListener("click", (e) => { const b = e.target.closest("[data-t]"); if (b) toggle(b.dataset.t); });
  function setPreset(k) { preset = k; on.clear(); L.presets[k].on.forEach((x) => on.add(x)); pre.set(k); if (!on.has(sel)) sel = "sub"; render(); ctx.changed(); }
  function toggle(id) { if (id === "sub") return; on.has(id) ? on.delete(id) : on.add(id); preset = ""; pre.set(""); if (on.has(id)) sel = id; else if (sel === id) sel = "sub"; render(); ctx.changed(); }
  function select(id) { sel = id; render(); ctx.changed(); }
  function render() { wrap.querySelector(".xs-host").innerHTML = xsecSVG(on, sel);
    tog.querySelectorAll("[data-t]").forEach((b) => b.setAttribute("aria-pressed", String(on.has(b.dataset.t))));
    const l = L.layers.find((x) => x.id === sel);
    live(ctx, `<p class="sec">${esc(l.n)} ${kindChip(l.kind)}</p><p class="txt">${esc(l.d)}</p><dl class="kv"><dt>Where</dt><dd>${esc(l.where)}</dd><dt>Combines</dt><dd>${esc(l.with)}</dd></dl><p class="sec">Common combinations</p><ul class="combo">${L.combos.map(([a, b]) => `<li><b>${esc(a)}</b> — ${esc(b)}</li>`).join("")}</ul>`); }
  wrap.addEventListener("click", (e) => { const g = e.target.closest("[data-l]"); if (g) select(g.dataset.l); });
  wrap.addEventListener("keydown", (e) => { const g = e.target.closest && e.target.closest("[data-l]"); if (g && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); e.stopPropagation(); select(g.dataset.l); } });
  render();
  return { acts: () => [...Object.entries(L.presets).map(([k, p]) => ["p:" + k, p.n, preset === k]), ...L.layers.filter((l) => on.has(l.id)).map((l) => ["s:" + l.id, l.n.split(" (")[0], sel === l.id])],
    act(a) { const [k, v] = a.split(":"); if (k === "p") setPreset(v); else select(v); }, destroy: () => wrap.remove() };
};

/* ---------- D · comparison lab ---------- */
const ICON = {
  pol: `<rect x="14" y="6" width="52" height="44" rx="14" fill="#6E6152"/>${[0, 1, 2, 3, 4].map((i) => `<line x1="${22 + i * 9}" y1="10" x2="${22 + i * 9}" y2="46" stroke="#D8CFBF" stroke-width="2"/>`).join("")}`,
  tint: `<rect x="14" y="6" width="52" height="44" rx="14" fill="#7A6450"/>`,
  uv: `<rect x="6" y="20" width="22" height="16" fill="#C9B6E6"/><rect x="28" y="20" width="46" height="16" fill="#E6D23A"/><path d="M8,16 L26,40 M26,16 L8,40" stroke="#A9472F" stroke-width="3"/>`,
  mirror: `<rect x="14" y="6" width="52" height="44" rx="14" fill="#5B8FD6"/><path d="M20,18 L54,12" stroke="#fff" stroke-width="5" opacity=".8"/>`,
  ar: `<rect x="14" y="6" width="52" height="44" rx="14" fill="#DCE7EE" stroke="currentColor" stroke-width="2"/><ellipse cx="34" cy="22" rx="10" ry="4" fill="#9BE3B0" opacity=".7"/>`,
  fog: `<rect x="14" y="6" width="52" height="44" rx="14" fill="#E6EDF1" stroke="currentColor" stroke-width="2"/>${[0, 1, 2, 3, 4, 5].map((i) => `<circle cx="${24 + (i % 3) * 14}" cy="${18 + Math.floor(i / 3) * 16}" r="4" fill="#fff" stroke="#A59E91"/>`).join("")}`,
  hydro: `<rect x="8" y="38" width="64" height="8" fill="#9AA6AF"/><circle cx="40" cy="26" r="12" fill="#5A9BD5"/>`,
  oleo: `<rect x="14" y="6" width="52" height="44" rx="14" fill="#DCE7EE"/>${[4, 8, 12].map((r) => `<ellipse cx="40" cy="28" rx="${r}" ry="${r + 3}" fill="none" stroke="#8C7860" stroke-width="2"/>`).join("")}`,
  blue: `<path d="M6,44 L22,44 L30,30 L42,22 L74,20" fill="none" stroke="#2F6B8F" stroke-width="3"/><rect x="22" y="48" width="52" height="5" fill="#3355DD"/>`,
  photo: `<rect x="14" y="6" width="52" height="44" rx="14" fill="#DCE7EE"/><path d="M40,6 L66,6 Q66,6 66,20 L66,36 Q66,50 52,50 L40,50Z" fill="#6E6152"/><circle cx="12" cy="10" r="6" fill="#E3B24A"/>`,
  hard: `<path d="M40,6 L64,14 L62,34 Q56,46 40,52 Q24,46 18,34 L16,14Z" fill="#C9A24E"/>`,
  rx: `<path d="M20,8 Q40,22 60,8 L60,48 Q40,34 20,48Z" fill="#C8D9E3" stroke="currentColor" stroke-width="2"/>`,
};
const icon = (k) => `<svg viewBox="0 0 80 56" class="ico" aria-hidden="true">${ICON[k] || ""}</svg>`;
SIMS._icon = icon;
SIMS.compare = (host, ctx) => {
  const C = L.comp; let pick = ["pol", "nonpol"], preset = 0;
  const wrap = h(`<div class="wdg compare"><div class="cmp-pre" role="group" aria-label="Required comparisons"></div><div class="cmp-chips" role="group" aria-label="Pick up to three"></div><div class="cmp-table"></div></div>`); host.appendChild(wrap);
  const preEl = wrap.querySelector(".cmp-pre"), chipEl = wrap.querySelector(".cmp-chips"), tabEl = wrap.querySelector(".cmp-table");
  function render() {
    preEl.innerHTML = `<span class="seg-l">Compare</span>` + L.compPresets.map(([n], i) => `<button type="button" data-p="${i}" aria-pressed="${preset === i}">${esc(n)}</button>`).join("");
    chipEl.innerHTML = `<span class="seg-l">Or pick 2–3</span>` + Object.entries(C).map(([k, x]) => `<button type="button" data-c="${k}" aria-pressed="${pick.includes(k)}">${esc(x.n)}</button>`).join("");
    const cols = pick.map((k) => C[k]);
    tabEl.innerHTML = `<table><thead><tr><th></th>${cols.map((c) => `<th>${icon(c.vis)}<span>${esc(c.n)}</span></th>`).join("")}</tr></thead><tbody>${L.compAttrs.map(([k, lab]) => `<tr><th>${esc(lab)}</th>${cols.map((c) => `<td>${k === "kind" ? kindChip(c.kind) : esc(c[k])}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
    live(ctx, `<p class="sec">How to use it</p><p class="txt">Start with one of the nine comparisons, or pick any two or three technologies. Read across a row to explain the difference in one sentence.</p><p class="sec">Types</p><p class="txt">${Object.keys(L.kinds).map(kindChip).join(" ")}</p>`);
  }
  function setPreset(i) { preset = i; pick = L.compPresets[i][1].slice(); render(); ctx.changed(); }
  function toggle(k) { preset = -1; if (pick.includes(k)) { if (pick.length > 1) pick = pick.filter((x) => x !== k); } else { pick.push(k); if (pick.length > 3) pick.shift(); } render(); ctx.changed(); }
  wrap.addEventListener("click", (e) => { const p = e.target.closest("[data-p]"), c = e.target.closest("[data-c]"); if (p) setPreset(+p.dataset.p); else if (c) toggle(c.dataset.c); });
  render();
  return { acts: () => L.compPresets.map(([n], i) => ["p:" + i, n, preset === i]), act(a) { setPreset(+a.slice(2)); }, destroy: () => wrap.remove() };
};

/* ---------- E · care: illustrated sequence, mistakes, scenarios ---------- */
const GL = (x, y, s, o = "") => `<g transform="translate(${x},${y}) scale(${s})" ${o}><path d="M-150,-40 Q-150,-62 -128,-62 L-36,-62 Q-14,-62 -14,-40 L-14,10 Q-14,46 -54,46 L-110,46 Q-150,46 -150,10Z M14,-40 Q14,-62 36,-62 L128,-62 Q150,-62 150,-40 L150,10 Q150,46 110,46 L54,46 Q14,46 14,10Z" fill="rgba(200,220,232,.7)" stroke="currentColor" stroke-width="8"/><path d="M-14,-36 Q0,-50 14,-36" fill="none" stroke="currentColor" stroke-width="8"/></g>`;
const CARE_ART = [
  `<path d="M150,40 L150,90 Q150,110 170,110 L230,110" fill="none" stroke="currentColor" stroke-opacity=".55" stroke-width="18" stroke-linecap="round"/><rect x="216" y="100" width="40" height="22" rx="4" fill="currentColor" fill-opacity=".62"/>${[0, 1, 2, 3, 4].map((i) => `<circle class="drip" style="animation-delay:${i * .25}s" cx="${226 + (i % 3) * 8}" cy="140" r="6" fill="#5A9BD5"/>`).join("")}${GL(240, 300, 1.1)}<text x="240" y="400" text-anchor="middle" class="art-t">lukewarm water lifts the grit</text>`,
  `<rect x="70" y="120" width="70" height="140" rx="12" fill="#C9A24E"/><rect x="88" y="90" width="34" height="34" fill="currentColor" fill-opacity=".62"/><path d="M122,98 L160,92" stroke="currentColor" stroke-opacity=".55" stroke-width="10"/>${[0, 1, 2, 3, 4, 5].map((i) => `<circle class="mist" style="animation-delay:${i * .15}s" cx="${190 + i * 12}" cy="${92 + (i % 3) * 8}" r="4" fill="#9CC7F4"/>`).join("")}${GL(330, 260, .9)}<text x="240" y="400" text-anchor="middle" class="art-t">lens spray or mild lotion-free soap</text>`,
  `${GL(240, 220, 1.3)}<circle class="spin" cx="160" cy="220" r="46" fill="rgba(201,162,78,.35)" stroke="#8A6B32" stroke-width="3" stroke-dasharray="10 8"/><text x="240" y="400" text-anchor="middle" class="art-t">clean microfibre, light circles, both sides</text>`,
  `<path d="M150,40 L150,90 Q150,110 170,110 L230,110" fill="none" stroke="currentColor" stroke-opacity=".55" stroke-width="18" stroke-linecap="round"/><rect x="216" y="100" width="40" height="22" rx="4" fill="currentColor" fill-opacity=".62"/>${[0, 1, 2].map((i) => `<circle class="drip" style="animation-delay:${i * .3}s" cx="${230 + i * 6}" cy="140" r="6" fill="#5A9BD5"/>`).join("")}${GL(240, 300, 1.1)}<text x="240" y="400" text-anchor="middle" class="art-t">rinse if the cleaner's instructions say so</text>`,
  `${GL(240, 220, 1.3)}<rect class="pat" x="120" y="150" width="120" height="90" rx="14" fill="rgba(201,162,78,.55)"/><text x="240" y="400" text-anchor="middle" class="art-t">pat dry with a clean, dry microfibre</text>`,
  `<path d="M90,250 Q240,330 390,250 L390,210 Q240,280 90,210Z" fill="#2B2A28"/><path d="M90,210 Q240,140 390,210" fill="none" stroke="#2B2A28" stroke-width="10"/>${GL(240, 205, .8)}<text x="240" y="400" text-anchor="middle" class="art-t">in the case — out of heat, never lens-down</text>`,
];
SIMS.care = (host, ctx) => {
  let i = 0; const wrap = h(`<div class="wdg care"><svg viewBox="0 0 480 420" class="care-art" role="img"></svg><ol class="care-steps"></ol></div>`); host.appendChild(wrap);
  const art = wrap.querySelector(".care-art"), ol = wrap.querySelector(".care-steps");
  function render() { const c = L.care[i]; art.innerHTML = CARE_ART[i]; art.setAttribute("aria-label", c.t + ": " + c.d);
    ol.innerHTML = L.care.map((s, k) => `<li class="${k === i ? "on" : k < i ? "done" : ""}"><button type="button" data-k="${k}"><b>${k + 1}</b>${esc(s.t)}</button></li>`).join("");
    live(ctx, `<p class="sec">Step ${i + 1} of 6</p><p class="txt"><b>${esc(c.t)}.</b> ${esc(c.d)}</p><p class="txt" style="margin-top:.4cqw;color:var(--gold)">Why: ${esc(c.why)} ${refLink(c.ref)}</p><p class="note">${esc(L.careNote)}</p>`); }
  function go(k) { i = clamp(k, 0, 5); render(); ctx.changed(); }
  wrap.addEventListener("click", (e) => { const b = e.target.closest("[data-k]"); if (b) go(+b.dataset.k); });
  render();
  return { acts: () => L.care.map((c, k) => ["s:" + k, k + 1 + " · " + c.t, k === i]), act(a) { go(+a.slice(2)); }, destroy: () => wrap.remove() };
};
const MIS_ART = {
  dry: `${GL(60, 46, .28)}<circle cx="40" cy="44" r="3" fill="#8C6E3A"/><circle cx="70" cy="40" r="3" fill="#8C6E3A"/><path d="M20,70 L100,70" stroke="#A9472F" stroke-width="4"/>`,
  shirt: `<path d="M30,20 L50,12 Q60,22 70,12 L90,20 L100,40 L86,46 L86,90 L34,90 L34,46 L20,40Z" fill="#9AA6AF"/>`,
  glass: `<rect x="40" y="34" width="40" height="60" rx="8" fill="#5A9BD5"/><rect x="50" y="18" width="20" height="18" fill="currentColor" fill-opacity=".62"/><text x="60" y="72" text-anchor="middle" font-size="14" fill="#fff" font-family="Inter" font-weight="700">NH₃</text>`,
  car: `<rect x="14" y="50" width="92" height="30" rx="10" fill="#9C2F25"/><path d="M30,50 L44,30 L80,30 L94,50Z" fill="#9C2F25"/><circle cx="96" cy="16" r="10" fill="#E3B24A"/><circle cx="34" cy="82" r="8" fill="#222"/><circle cx="88" cy="82" r="8" fill="#222"/>`,
  down: `<rect x="10" y="74" width="100" height="10" fill="#B9A27A"/>${GL(60, 62, .3)}`,
  abr: `<rect x="24" y="40" width="72" height="40" rx="8" fill="#5E8A4E"/><rect x="24" y="40" width="72" height="14" fill="#E3C14A"/>`,
  chem: `<path d="M44,20 L76,20 L76,34 L92,90 L28,90 L44,34Z" fill="#B9CCD8" stroke="currentColor" stroke-width="3"/><path d="M40,60 L80,60" stroke="#A9472F" stroke-width="4"/>`,
};
SIMS.mistakes = (host, ctx) => {
  let sel = null; const seen = new Set();
  const wrap = h(`<div class="wdg mistk"></div>`); host.appendChild(wrap);
  function render() { wrap.innerHTML = L.mistakes.map((m) => `<button type="button" class="mtile ${sel === m.id ? "on" : ""} ${seen.has(m.id) ? "seen" : ""}" data-m="${m.id}"><svg viewBox="0 0 120 100" aria-hidden="true">${MIS_ART[m.id]}<path d="M8,8 L112,92 M112,8 L8,92" stroke="#A9472F" stroke-width="3" opacity=".18"/></svg><span>${esc(m.t)}</span></button>`).join("");
    const m = L.mistakes.find((x) => x.id === sel);
    live(ctx, m ? `<p class="sec">Mistake</p><p class="txt"><b>${esc(m.t)}.</b> ${esc(m.d)} ${refLink(m.ref)}</p><p class="sec">Do this instead</p><p class="txt" style="color:var(--green)"><b>${esc(m.fix)}</b></p><p class="note">${esc(L.careNote)}</p>` : `<p class="sec">Tap a mistake</p><p class="txt">${seen.size} of ${L.mistakes.length} explored. Ask the room which ones they've seen customers make.</p>`); }
  function pick(id) { sel = id; seen.add(id); render(); ctx.changed(); }
  wrap.addEventListener("click", (e) => { const b = e.target.closest("[data-m]"); if (b) pick(b.dataset.m); });
  render();
  return { acts: () => L.mistakes.map((m) => ["m:" + m.id, m.t, sel === m.id]), act(a) { pick(a.slice(2)); }, destroy: () => wrap.remove() };
};
SIMS.careq = (host, ctx) => {
  const Q = L.careQuiz, res = {}; let i = 0;
  const wrap = h(`<div class="wdg careq"></div>`); host.appendChild(wrap);
  function render() { const q = Q[i], r = res[i];
    wrap.innerHTML = `<p class="eyebrow">Scenario ${i + 1} of ${Q.length}</p><h3>${esc(q.s)}</h3><div class="opts">${q.o.map((o, k) => `<button type="button" class="opt ${r != null ? (k === q.a ? "ok" : k === r ? "no" : "") : ""}" data-k="${k}" ${r != null ? "disabled" : ""}><b>${"ABC"[k]}</b>${esc(o)}</button>`).join("")}</div>${r != null ? `<p class="fb ${r === q.a ? "ok" : "no"}">${r === q.a ? "Safest choice." : "Not the safest."} ${esc(q.e)}</p>` : ""}<div class="dz-btns">${i > 0 ? `<button type="button" class="sbtn ghost" data-n="-1">‹ Previous</button>` : ""}${i < Q.length - 1 ? `<button type="button" class="sbtn ${r != null ? "ink" : ""}" data-n="1">Next scenario ›</button>` : ""}</div>`;
    const ok = Object.entries(res).filter(([k, v]) => v === Q[k].a).length;
    live(ctx, `<p class="sec">Score</p><p class="big-s">${ok}<small>/${Object.keys(res).length} answered</small></p><p class="note">${esc(L.careNote)}</p>`); }
  function ans(k) { if (res[i] != null) return; res[i] = k; render(); ctx.changed(); }
  function nav(d) { i = clamp(i + d, 0, Q.length - 1); render(); ctx.changed(); }
  wrap.addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return; if (b.dataset.k != null) ans(+b.dataset.k); else if (b.dataset.n) nav(+b.dataset.n); });
  render();
  return { acts: () => [...(res[i] == null ? Q[i].o.map((o, k) => ["a:" + k, "ABC"[k] + " · " + o]) : []), ...(i < Q.length - 1 ? [["n:1", "Next scenario"]] : []), ...(i ? [["n:-1", "Previous"]] : [])], act(a) { const [k, v] = a.split(":"); k === "a" ? ans(+v) : nav(+v); }, destroy: () => wrap.remove() };
};

/* ---------- F · consultation simulator ---------- */
const CONS_SCENE = { drive: "road", fish: "water", office: "office", travel: "city", premium: "beach", sport: "golf" };
SIMS.consult = (host, ctx) => {
  const CS = L.consult; let cur = 0, phase = "ask", asked = new Set(), checked = false, choice = null; const done = new Set();
  const wrap = h(`<div class="wdg consult"><div class="cs-tabs" role="group" aria-label="Customers"></div><div class="cs-body"><canvas class="cs-scene" aria-hidden="true"></canvas><div class="cs-main"></div></div></div>`); host.appendChild(wrap);
  const tabs = wrap.querySelector(".cs-tabs"), main = wrap.querySelector(".cs-main"), cv = wrap.querySelector(".cs-scene");
  function scene() { const c = CS[cur], r = cv.getBoundingClientRect(); if (!r.width) return; const dpr = Math.min(2, devicePixelRatio || 1); cv.width = r.width * dpr; cv.height = r.height * dpr; const g = cv.getContext("2d"), W = 1140, H = Math.round(W * r.height / r.width); g.setTransform(cv.width / W, 0, 0, cv.width / W, 0, 0); paintScene(g, W, H, 1200, { kind: CONS_SCENE[c.scene], glare: 1, cut: 0, hy: c.scene === "office" ? 0 : .42 }); }
  function render() { const c = CS[cur];
    tabs.innerHTML = CS.map((x, k) => `<button type="button" data-c="${k}" aria-pressed="${k === cur}">${done.has(k) ? "✓ " : ""}${esc(x.n)}</button>`).join("");
    let body = `<p class="eyebrow">Customer ${cur + 1} · ${esc(c.n)}</p><p class="brief">${esc(c.brief)}</p>`;
    if (phase === "ask") body += `<p class="sec">1 · Which questions would you ask? <small>tap all that help</small></p><div class="qs">${c.qs.map(([q, good], k) => `<button type="button" class="qchip ${asked.has(k) ? "on" : ""} ${checked ? (good ? "good" : "off") : ""}" data-q="${k}" aria-pressed="${asked.has(k)}">${esc(q)}${checked ? `<small>${good ? "needs-based" : "not about their needs"}</small>` : ""}</button>`).join("")}</div><div class="dz-btns">${!checked ? `<button type="button" class="sbtn ink" data-a="check">Check my questions</button>` : `<button type="button" class="sbtn ink" data-a="rec">2 · Recommend ›</button>`}</div>`;
    else { body += `<p class="sec">2 · Which recommendation fits best?</p><div class="opts">${c.opts.map((o, k) => `<button type="button" class="opt ${choice != null ? (o.best ? "ok" : o.ok ? "mid" : k === choice ? "no" : "") : ""}" data-o="${k}" ${choice != null ? "disabled" : ""}><b>${"ABCD"[k]}</b><span>${esc(o.t)}${choice != null ? `<small>${o.best ? "Strongest fit — " : o.ok ? "Acceptable — " : "Trade-off — "}${esc(o.why)} ${refLink(o.ref)}</small>` : ""}</span></button>`).join("")}</div>`;
      if (choice != null) body += `<p class="sec">Say it like this</p><p class="say">${esc(c.say)}</p>`;
      body += `<div class="dz-btns"><button type="button" class="sbtn ghost" data-a="ask">‹ Questions</button>${choice != null && cur < CS.length - 1 ? `<button type="button" class="sbtn ink" data-a="next">Next customer ›</button>` : ""}</div>`; }
    main.innerHTML = body;
    live(ctx, `<p class="sec">Needs-based selling</p><p class="txt">Ask before you recommend. Explain why the strongest option fits and be open about trade-offs. Never default to the most expensive lens.</p><p class="sec">Progress</p><p class="big-s">${done.size}<small>/${CS.length} customers</small></p>`);
    requestAnimationFrame(scene);
  }
  function setCust(k) { cur = k; phase = "ask"; asked = new Set(); checked = false; choice = null; render(); ctx.changed(); }
  wrap.addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return;
    if (b.dataset.c != null) setCust(+b.dataset.c);
    else if (b.dataset.q != null) { const k = +b.dataset.q; asked.has(k) ? asked.delete(k) : asked.add(k); render(); }
    else if (b.dataset.o != null) { choice = +b.dataset.o; if (CS[cur].opts[choice].best) done.add(cur); render(); ctx.changed(); }
    else if (b.dataset.a === "check") { checked = true; render(); ctx.changed(); }
    else if (b.dataset.a === "rec") { phase = "rec"; render(); ctx.changed(); }
    else if (b.dataset.a === "ask") { phase = "ask"; render(); ctx.changed(); }
    else if (b.dataset.a === "next") setCust(cur + 1); });
  let ro; try { ro = new ResizeObserver(scene); ro.observe(cv); } catch (e) {}
  render();
  return { acts: () => [...CS.map((c, k) => ["c:" + k, c.n, k === cur]), ...(phase === "ask" ? [checked ? ["rec", "Go to recommendation"] : ["check", "Check questions"]] : choice == null ? CS[cur].opts.map((o, k) => ["o:" + k, "ABCD"[k] + " · " + o.t]) : [])],
    act(a) { const [k, v] = a.split(":"); if (k === "c") setCust(+v); else if (k === "o") { choice = +v; if (CS[cur].opts[choice].best) done.add(cur); render(); } else if (k === "check") { checked = true; render(); } else if (k === "rec") { phase = "rec"; render(); } },
    destroy: () => { try { ro && ro.disconnect(); } catch (e) {} wrap.remove(); } };
};

/* ---------- G · assessment (presentation only; logic in Assess) ---------- */
SIMS.assess = (host, ctx) => {
  let S = Assess.session(ASSESS_BANK), pending = null, match = {}, held = null;
  const wrap = h(`<div class="wdg assess"></div>`); host.appendChild(wrap);
  let last = null; try { last = JSON.parse(localStorage.getItem("ilg-lens-assess") || "null"); } catch (e) {}
  function picture(q) { const c = document.createElement("canvas"); c.className = "qpic"; c.width = 1140; c.height = 420; const g = c.getContext("2d");
    if (q.pic.k === "pair") { [0, 1].forEach((s) => { g.save(); g.beginPath(); g.rect(s * 580, 0, 560, 420); g.clip(); g.translate(s * 580, 0); g.scale(560 / 1140, 1); paintScene(g, 1140, 420, 900, { kind: "water", glare: 1, cut: s, hy: .2 }); if (s) KIT.tintRect(g, 0, 0, 1140, 420, [100, 86, 66], .4); g.restore(); KIT.pill(g, s ? "Right" : "Left", s * 580 + 20, 30, { size: 20 }); }); }
    else { g.fillStyle = "#E8E1D4"; g.fillRect(0, 0, 1140, 420); [470, 670].forEach((x) => { g.fillStyle = "rgba(80,70,58,.45)"; g.beginPath(); g.arc(x, 210, 160, 0, 7); g.fill(); }); g.save(); g.beginPath(); g.arc(470, 210, 160, 0, 7); g.clip(); g.fillStyle = "rgba(8,8,8,.9)"; g.beginPath(); g.arc(670, 210, 160, 0, 7); g.fill(); g.restore(); [470, 670].forEach((x) => { g.strokeStyle = "#16140F"; g.lineWidth = 8; g.beginPath(); g.arc(x, 210, 160, 0, 7); g.stroke(); }); KIT.pill(g, "turned 90°", 770, 40, { size: 20 }); }
    return c; }
  function render() {
    if (Assess.done(S)) return results();
    const q = S.bank[S.i], r = S.res[q.id];
    let body = `<div class="as-head"><span>Question ${S.i + 1} of ${S.bank.length}</span><span>${esc(q.topic)}</span></div><div class="as-prog"><i style="width:${(S.i / S.bank.length) * 100}%"></i></div><h3>${esc(q.q)}</h3><div class="as-body"></div>`;
    wrap.innerHTML = body; const B = wrap.querySelector(".as-body");
    if (q.type === "pic") B.appendChild(picture(q));
    if (q.type === "mcq" || q.type === "pic") B.insertAdjacentHTML("beforeend", `<div class="opts">${q.o.map((o, k) => `<button type="button" class="opt ${r ? (k === q.a ? "ok" : k === r.r ? "no" : "") : ""}" data-r="${k}" ${r ? "disabled" : ""}><b>${"ABCD"[k]}</b>${esc(o)}</button>`).join("")}</div>`);
    if (q.type === "tf") B.insertAdjacentHTML("beforeend", `<div class="opts tf2">${[["1", "True"], ["0", "False"]].map(([v, t]) => `<button type="button" class="opt ${r ? ((v === "1") === q.a ? "ok" : (v === "1") === r.r ? "no" : "") : ""}" data-r="${v}" ${r ? "disabled" : ""}>${t}</button>`).join("")}</div>`);
    if (q.type === "layer") { const all = new Set(L.presets.sun.on); B.insertAdjacentHTML("beforeend", `<div class="as-xs">${SIMS._xsec(all, r ? q.a : null, { noLabels: !r })}</div>`); }
    if (q.type === "match") { B.insertAdjacentHTML("beforeend", `<div class="mt"><div class="mt-items">${q.items.filter(([lab]) => !match[lab]).map(([lab]) => `<button type="button" class="mt-i ${held === lab ? "held" : ""}" draggable="true" data-mi="${esc(lab)}">${esc(lab)}</button>`).join("")}</div><div class="mt-keys">${q.keys.map((k) => `<div class="mt-k" data-k="${k}" tabindex="0" role="button" aria-label="Drop on ${esc(L.kinds[k].n)}"><p>${kindChip(k)}</p>${Object.entries(match).filter(([, v]) => v === k).map(([lab]) => { const ok = r ? q.items.find((x) => x[0] === lab)[1] === k : null; return `<span class="mt-p ${ok == null ? "" : ok ? "ok" : "no"}" data-u="${esc(lab)}">${esc(lab)}</span>`; }).join("")}</div>`).join("")}</div>${!r ? `<p class="hint2">Drag each item onto its type — or tap an item, then tap the type.</p><div class="dz-btns"><button type="button" class="sbtn ink" data-check ${Object.keys(match).length < q.items.length ? "disabled" : ""}>Check</button></div>` : ""}</div>`); }
    if (r) B.insertAdjacentHTML("beforeend", `<p class="fb ${r.ok ? "ok" : r.score > 0 ? "mid" : "no"}">${r.ok ? "Correct." : r.score > 0 ? `Partly right (${Math.round(r.score * 100)}%).` : "Not quite."} ${esc(q.e)}</p><div class="dz-btns"><button type="button" class="sbtn ink" data-next>${S.i < S.bank.length - 1 ? "Next question ›" : "See results ›"}</button></div>`);
    live(ctx, `<p class="sec">Assessment</p><p class="txt">${S.bank.length} questions, mixed types: pictures, true/false, drag-and-drop, the cross-section and customer scenarios. Immediate feedback after each answer.</p>${last ? `<p class="sec">Last attempt on this device</p><p class="txt">${Math.round(last.pct * 100)}% · ${esc(last.status)}</p>` : ""}`);
  }
  function results() { const R = Assess.results(S), pct = Math.round(R.pct * 100);
    try { localStorage.setItem("ilg-lens-assess", JSON.stringify({ pct: R.pct, status: R.status, at: Date.now() })); } catch (e) {}
    const secName = (id) => { const s = (window.DECK && DECK.SLIDES || []).find((x) => x.id === id); return s && DECK.titleOf ? DECK.titleOf(s) : id; };
    wrap.innerHTML = `<div class="as-res"><div class="ring" style="--p:${pct}"><b>${pct}%</b><small>${R.score} / ${R.max}</small></div><div><p class="eyebrow">${esc(R.status)}</p><h3>${R.passed ? "Well done." : R.pct >= .5 ? "Good effort — a little revision." : "Let’s revisit the key sections."}</h3>
      <p class="sec">Topics</p><ul class="tops">${R.topics.map((t) => `<li class="${t.got / t.n >= Assess.PASS ? "ok" : "no"}"><span>${esc(t.topic)}</span><b>${Math.round(t.got * 10) / 10}/${t.n}</b></li>`).join("")}</ul>
      ${R.sections.length ? `<p class="sec">Revisit</p><div class="dz-btns">${R.sections.map((s) => `<button type="button" class="sbtn" data-go="${esc(s)}">${esc(secName(s))} ›</button>`).join("")}</div>` : ""}
      <div class="dz-btns" style="margin-top:1cqw"><button type="button" class="sbtn ink" data-again>Retake</button></div></div></div>
      <details class="as-list"><summary>Answers: ${R.correct.length} correct · ${R.wrong.length} to review</summary><ol>${S.bank.map((q) => { const r = S.res[q.id]; return `<li class="${r && r.ok ? "ok" : "no"}">${esc(q.q)} <small>${esc(q.e)}</small></li>`; }).join("")}</ol></details>`;
    live(ctx, `<p class="sec">Result</p><p class="big-s">${pct}%<small> ${esc(R.status)}</small></p>${R.revise.length ? `<p class="sec">Revise</p><p class="txt">${R.revise.map(esc).join(" · ")}</p>` : `<p class="txt">No topics below ${Assess.PASS * 100}%.</p>`}`);
  }
  function answer(v) { const q = S.bank[S.i]; if (!q || S.res[q.id]) return; Assess.answer(S, v); render(); ctx.changed(); }
  function next() { match = {}; held = null; Assess.next(S); render(); ctx.changed(); }
  function place(lab, key) { const q = S.bank[S.i]; if (!q || q.type !== "match" || S.res[q.id]) return; match[lab] = key; held = null; render(); ctx.changed(); }
  wrap.addEventListener("click", (e) => { const t = e.target;
    const b = t.closest("[data-r]"); if (b) { const q = S.bank[S.i]; return answer(q.type === "tf" ? b.dataset.r === "1" : +b.dataset.r); }
    if (t.closest("[data-next]")) return next();
    if (t.closest("[data-again]")) { S = Assess.session(ASSESS_BANK); match = {}; render(); ctx.changed(); return; }
    const gg = t.closest("[data-go]"); if (gg) return ctx.go(gg.dataset.go);
    const l = t.closest(".as-xs [data-l]"); if (l) return answer(l.dataset.l);
    const it = t.closest("[data-mi]"); if (it) { held = it.dataset.mi; render(); return; }
    const u = t.closest("[data-u]"); if (u && !held && !S.res[S.bank[S.i].id]) { delete match[u.dataset.u]; render(); return; }
    const k = t.closest("[data-k]"); if (k && held) return place(held, k.dataset.k);
    if (t.closest("[data-check]")) return answer(Object.assign({}, match)); });
  wrap.addEventListener("keydown", (e) => { if (e.key !== "Enter" && e.key !== " ") return; const l = e.target.closest && e.target.closest(".as-xs [data-l]"), k = e.target.closest && e.target.closest("[data-k]"); if (l) { e.preventDefault(); e.stopPropagation(); answer(l.dataset.l); } else if (k && held) { e.preventDefault(); e.stopPropagation(); place(held, k.dataset.k); } });
  wrap.addEventListener("dragstart", (e) => { const it = e.target.closest("[data-mi]"); if (it) { e.dataTransfer.setData("text/plain", it.dataset.mi); held = it.dataset.mi; } });
  wrap.addEventListener("dragover", (e) => { if (e.target.closest("[data-k]")) e.preventDefault(); });
  wrap.addEventListener("drop", (e) => { const k = e.target.closest("[data-k]"); if (!k) return; e.preventDefault(); const lab = e.dataTransfer.getData("text/plain") || held; if (lab) place(lab, k.dataset.k); });
  render();
  return {
    acts() { if (Assess.done(S)) return [["again", "Retake"]]; const q = S.bank[S.i], r = S.res[q.id]; if (r) return [["next", S.i < S.bank.length - 1 ? "Next question" : "See results"]];
      if (q.type === "mcq" || q.type === "pic") return q.o.map((o, k) => ["r:" + k, "ABCD"[k] + " · " + o]);
      if (q.type === "tf") return [["r:1", "True"], ["r:0", "False"]];
      if (q.type === "layer") return L.layers.map((l) => ["l:" + l.id, l.n.split(" (")[0]]);
      return Object.keys(match).length === q.items.length ? [["check", "Check matches"]] : []; },
    act(a) { const [k, v] = a.split(":"); const q = S.bank[S.i];
      if (k === "r") answer(q.type === "tf" ? v === "1" : +v); else if (k === "l") answer(v); else if (k === "next") next(); else if (k === "check") answer(Object.assign({}, match)); else if (k === "again") { S = Assess.session(ASSESS_BANK); match = {}; render(); } },
    destroy: () => wrap.remove() };
};
})();
