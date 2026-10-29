const MERIDIAN_URL = "https://ilgquiz.vercel.app";
const CALIBRE_URL = "./";
/* =====================================================================
   ILG Academy · Eyewear Lens Technology — training deck
   The same engine as the Watch Anatomy deck (anatomy-deck.html):
   slides with steps, presenter clicker, presenter view, contents,
   black screen, swipe, and Caliber Remote on a phone (direct link with
   a public relay as backup). The watch's 3D frames are replaced by
   in-page simulations (sims-*.js) that expose their controls to the
   phone remote through acts().
   Content: content.js · Assessment logic: assess.js
   ===================================================================== */
(function () {
"use strict";
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const H = new URLSearchParams(location.hash.slice(1));
const ROLE = H.has("remote") ? "remote" : H.has("presenter") ? "presenter" : "deck";
const PEER_PARAM = new URLSearchParams(location.search).get("peer") || H.get("peer") || "";
const PEERCFG = (() => { if (!PEER_PARAM) return { debug: 0 };
  const [host, port] = PEER_PARAM.split(":"); return { host, port: +port || 443, path: "/", secure: !/^(localhost|127\.|192\.168\.|10\.)/.test(host) && +port !== 9000, debug: 0 }; })();
const CH_NAME = "ilg-lens-deck";
const PFX = "lns-";
const DECK_VERSION = "v1 · Oct 2026";
const toastEl = document.createElement("div"); toastEl.className = "toast"; toastEl.setAttribute("role", "status"); document.body.appendChild(toastEl);
let toastT = 0;
const toast = (t) => { toastEl.textContent = t; toastEl.classList.add("on"); clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove("on"), 2600); };

/* ---------------- slides (words come from LENS in content.js) ---------------- */
const T = LENS.slides, TX = LENS.tech;
const refLink = (k) => (k && REFS[k] ? ` <a class="ref" href="${esc(REFS[k].u)}" target="_blank" rel="noopener" title="${esc(REFS[k].t)}">source</a>` : "");
const KCOL = { coating: "#C9A24E", filter: "#2F6B8F", tint: "#8A5A36", material: "#9AA6AF" };
const kchip = (k) => `<span class="kchip" style="--k:${KCOL[k]}">${esc(LENS.kinds[k].n)}</span>`;
const SLIDES = [];
const add = (s) => SLIDES.push(s);
const splitSide = (k, body = "") => `<div class="side"><p class="eyebrow">${esc(T[k].eyebrow)}</p><h2>${esc(T[k].h)}</h2>${body}<div data-live></div></div>`;
const figBox = (cls = "") => `<div class="fig ${cls}"><span data-fig></span></div>`;

add({ id: "title", sec: "ILG Academy · Lens technology", layout: "L-title", fig: { sim: "glare", opt: { mini: true } },
  html: () => `<div><p class="eyebrow">${esc(T.title.eyebrow)}</p><h1>${esc(T.title.h)}</h1><p class="lead">${esc(T.title.lead)}</p><p class="cta">${esc(T.title.cta)}</p></div><div class="fig" style="height:62cqh"><span data-fig></span></div>`,
  notes: T.title.notes });
const PARTS = [["A", "Polarised lenses", "Glare, the filter, the simulator, who it suits, testing, myths", "glare"], ["B", "13 lens technologies", "Coatings, filters, tints and materials", "secB"], ["C", "Lens anatomy", "A conceptual cross-section", "anat"], ["D", "Comparison lab", "Any two or three, side by side", "comp"], ["E", "Lens care", "The safe sequence and common mistakes", "care"], ["F", "Consultation", "Six customers, needs-based", "cons"], ["G", "Assessment", "Applied questions with feedback", "assess"]];
add({ id: "agenda", sec: "Start", layout: "L-list",
  html: () => `<div><p class="eyebrow">${esc(T.agenda.eyebrow)}</p><h2>${esc(T.agenda.h)}</h2><div class="jumps">${PARTS.map(([n, a, b, id]) => `<button type="button" class="jump" data-jump="${id}"><b>${n}</b><span>${esc(a)}<small>${esc(b)}</small></span></button>`).join("")}</div></div>
    <div><p class="eyebrow">ILG Academy modules</p><div class="mods">${MODULES.map((m) => m.here ? `<div class="here"><em>You are here</em><b>${esc(m.name)}</b><small>${esc(m.note)}</small></div>` : m.href ? `<a href="${esc(m.href)}"><em>Open ›</em><b>${esc(m.name)}</b><small>${esc(m.note)}</small></a>` : `<div class="soon"><em>Coming</em><b>${esc(m.name)}</b><small>${esc(m.note)}</small></div>`).join("")}</div>
    <div class="keys" style="margin-top:1.6cqw;font-size:.95cqw"><kbd>→ / clicker</kbd><span>Next step, then next slide</span><kbd>R</kbd><span>Phone remote</span><kbd>O</kbd><span>Contents</span><kbd>P</kbd><span>Presenter view</span></div></div>`,
  notes: T.agenda.notes });

/* ---- A · polarised ---- */
const A_LESSONS = [["A1", "Where glare comes from", "glare"], ["A1", "A filter with a direction", "filter"], ["A2", "Lens simulator", "sim"], ["A3", "Who benefits", "who"], ["A4", "Trade-offs & decision guide", "trade"], ["A5", "Prove it's polarised", "test"], ["A6", "Polarisation vs UV", "uv"], ["A7", "Myth or fact", "myths"]];
add({ id: "secA", t: "A · Polarised lenses", sec: "A · Polarised", layout: "L-title",
  html: () => `<div><p class="eyebrow">${esc(T.secA.eyebrow)}</p><p class="big">${esc(T.secA.big)}</p><h2>${esc(T.secA.h)}</h2><p class="lead">${esc(T.secA.lead)}</p></div><div class="jumps">${A_LESSONS.map(([n, a, id]) => `<button type="button" class="jump" data-jump="${id}"><b>${n}</b><span>${esc(a)}</span></button>`).join("")}</div>`,
  notes: T.secA.notes });
const sim = (k, sm, opt, steps, extra = "", layout = "L-split") => add({ id: k, sec: "A · " + T[k].eyebrow.split(" · ")[1], layout, fig: { sim: sm, opt }, steps, html: () => figBox() + splitSide(k, extra), notes: T[k].notes });
sim("glare", "glare", {}, [...LENS.glareStages.map((s, i) => ({ l: s.t, run: (a) => a.act("st:" + (i + 1)) })), { l: "Split view", run: (a) => a.act("v:split") }],
  `<div class="caveats">${LENS.caveats.map((c) => `<p class="sec">${esc(c.t)}</p><p class="txt" style="font-size:1.05cqw">${esc(c.d)}${refLink(c.ref)}</p>`).join("")}</div>`);
sim("filter", "filter", {}, [{ l: "Turn the lens 45°", run: (a) => a.act("r:45") }, { l: "Turn it 90°", run: (a) => a.act("r:90") }, { l: "Back upright", run: (a) => a.act("r:0") }]);
sim("sim", "polsim", {}, [{ l: "Non-polarised lens", run: (a) => a.act("lens:non") }, { l: "Polarised lens", run: (a) => a.act("lens:pol") }, { l: "Look far ahead", run: (a) => a.act("look:8") }, { l: "Look straight down", run: (a) => a.act("look:65") }, { l: "Back to 37°, tilt the head", run: (a) => { a.act("look:37"); a.act("tilt:90"); } }, { l: "Head level, on a road", run: (a) => { a.act("tilt:0"); a.act("surf:road"); } }]);
sim("who", "profiles", {}, LENS.profiles.slice(1).map((p) => ({ l: p.n, run: (a) => a.act("p:" + p.id) })));
sim("trade", "trade", {}, LENS.tradeoffs.slice(1).map((x) => ({ l: x.n, run: (a) => a.act("t:" + x.id) })));
sim("decide", "decide", {}, []);
sim("test", "ident", {}, [{ l: "Test card: turn 45°", run: (a) => a.act("r:45") }, { l: "Two lenses, crossed", run: (a) => { a.act("m:cross"); a.act("r:90"); } }, { l: "LCD screen, turned", run: (a) => { a.act("m:lcd"); a.act("r:0"); setTimeout(() => a.act("r:90"), 600); } }, { l: "Mystery pair 1", run: (a) => { a.act("r:0"); a.act("g:m1"); } }]);
sim("uv", "uvq", {}, [], "", "L-wide");
sim("myths", "myths", {}, [], "", "L-wide");

/* ---- B · technologies ---- */
add({ id: "secB", t: "B · 13 lens technologies", sec: "B · Technologies", layout: "L-title",
  html: () => `<div><p class="eyebrow">${esc(T.secB.eyebrow)}</p><p class="big">${esc(T.secB.big)}</p><h2>${esc(T.secB.h)}</h2><p class="lead">${esc(T.secB.lead)}</p><div class="kinds">${Object.entries(LENS.kinds).map(([k, v]) => `<p>${kchip(k)} ${esc(v.d)}</p>`).join("")}</div></div>
    <div class="tgrid">${LENS.techOrder.map((k, i) => `<button type="button" class="jump" data-jump="b-${k}">${SIMS._icon(LENS.comp[{ ar: "ar", hard: "sres", hydro: "hydro", oleo: "oleo", stat: "ar", blue: "blue", photo: "photo", mirror: "mirror", fog: "fog", tint: "tintc", grad: "tintc", uv: "uv", rx: "mat" }[k]].vis)}<span>B${i + 1} · ${esc(TX[k].n)}<small>${kchip(TX[k].kind)}</small></span></button>`).join("")}</div>`,
  notes: T.secB.notes });
const TECH_STEPS = {
  ar: [["With AR", "on"], ["Compare", "cmp"]],
  hard: [["Sand, then wipe dry (coated)", ["grit", "wipe"]], ["Same on an uncoated lens", ["c:0", "grit", "wipe"]], ["Rinse first, then wipe", ["c:1", "grit", "rinse", "wipe"]]],
  hydro: [["Tilt the lens", "tilt"]], oleo: [["Wipe once", "wipe"], ["Wipe again", "wipe"]], stat: [["Rub with a dry cloth", "rub"]],
  blue: [["Add a yellow-tint lens", "yellow"]], photo: [["Step outdoors", "e:out"], ["A hot day", "t:1"], ["Get in the car", "e:car"], ["Back indoors", ["e:in", "t:0"]]],
  mirror: [["Gold finish", "f:gold"], ["The wearer's view", "v:in"]], fog: [["Walk into humid heat", "go"]], tint: [["Brown", "t:brown"], ["Category 4", "c:4"], ["Yellow, category 1", ["t:yellow", "c:1"]]],
  grad: [["Double gradient", "double"], ["Solid tint", "solid"]], uv: [["Dark, no UV filter", "darkno"], ["Dark + UV400", "darkuv"]], rx: [["Progressive", "t:prog"], ["High-index", "t:hi"], ["Polycarbonate", "t:pc"]],
};
LENS.techOrder.forEach((k, i) => { const x = TX[k];
  const steps = (TECH_STEPS[k] || []).map(([l, a]) => ({ l, run: (api) => [].concat(a).forEach((id) => api.act(id)) }));
  steps.push({ l: "Benefits", run: (a) => a.tab("ben") }, { l: "Limitations", run: (a) => a.tab("lim") }, { l: "Say it to a customer", run: (a) => a.tab("say") });
  add({ id: "b-" + k, t: "B" + (i + 1) + " · " + x.n, sec: "B · Technologies · B" + (i + 1), layout: "L-split", fig: { sim: "tech", opt: { k } }, steps,
    html: () => `${figBox()}<div class="side"><p class="eyebrow">B${i + 1} · ${esc(LENS.kinds[x.kind].n)} ${kchip(x.kind)}</p><h2>${esc(x.n)}</h2><p class="lead2">${esc(x.short)}</p>
      <div class="ttabs" role="tablist">${[["what", "What it is"], ["ben", "Benefits"], ["lim", "Limitations"], ["say", "Say it"]].map(([t, l], j) => `<button type="button" role="tab" data-tab="${t}" aria-selected="${j === 0}">${l}</button>`).join("")}</div>
      <div class="tpane show" data-pane="what"><p class="txt">${esc(x.what)}${refLink(x.ref)}${refLink(x.ref2)}</p></div>
      <div class="tpane" data-pane="ben"><ul>${x.ben.map((b) => `<li>${esc(b)}</li>`).join("")}</ul></div>
      <div class="tpane" data-pane="lim"><ul>${x.lim.map((b) => `<li>${esc(b)}</li>`).join("")}</ul></div>
      <div class="tpane" data-pane="say"><p class="say">${esc(x.say)}</p><span class="tcare"><b>Care:</b> ${esc(x.care)}</span></div>
      <div data-live></div></div>`,
    notes: `${x.n} (${LENS.kinds[x.kind].n.toLowerCase()}). ${x.short}. Run the demo, then reveal Benefits, Limitations and the customer line. Key limitation: ${x.lim[0]}.` }); });

/* ---- C–G ---- */
const part = (id, sec, sm, steps, layout = "L-split") => add({ id, sec, layout, fig: { sim: sm, opt: {} }, steps, html: () => figBox() + splitSide(id), notes: T[id].notes });
part("anat", "C · Lens anatomy", "anat", [{ l: "Basic lens", run: (a) => a.act("p:basic") }, { l: "Premium clear lens", run: (a) => a.act("p:clear") }, { l: "Polarised sun lens", run: (a) => { a.act("p:sun"); a.act("s:pol"); } }]);
part("comp", "D · Comparison lab", "compare", [{ l: "Polarisation vs UV", run: (a) => a.act("p:1") }, { l: "Polarised vs mirror", run: (a) => a.act("p:2") }, { l: "Blue-light vs UV", run: (a) => a.act("p:5") }], "L-wide");
part("care", "E · Lens care", "care", LENS.care.slice(1).map((c, k) => ({ l: c.t, run: (a) => a.act("s:" + (k + 1)) })));
part("mist", "E · Lens care", "mistakes", []);
part("careq", "E · Lens care", "careq", []);
part("cons", "F · Consultation", "consult", [], "L-wide");
part("assess", "G · Assessment", "assess", [], "L-wide");

const groupRefs = () => { const g = {}; Object.entries(REFS).forEach(([k, r]) => (g[r.k] = g[r.k] || []).push(r)); return Object.entries(g).map(([n, rs]) => `<h4>${esc(n)}</h4>${rs.map((r) => `<p><a href="${esc(r.u)}" target="_blank" rel="noopener">${esc(r.t)}</a><small>${esc(r.use)}</small></p>`).join("")}`).join(""); };
add({ id: "refs", t: "Sources", sec: "Trainer reference", layout: "L-center",
  html: () => `<div style="text-align:left;width:100%;align-self:start"><p class="eyebrow">${esc(T.refs.eyebrow)}</p><h2>${esc(T.refs.h)}</h2><p class="txt" style="margin-top:.6cqw;font-size:1.05cqw">Simulations are illustrative, not measurements. Where performance varies by product, check the manufacturer's documentation.</p><div class="refs">${groupRefs()}</div></div>`,
  notes: T.refs.notes });
add({ id: "next", t: "Keep learning", sec: "Finish", layout: "L-list",
  html: () => `<div><p class="eyebrow">${esc(T.next.eyebrow)}</p><h2>${esc(T.next.h)}</h2><div class="mods">${MODULES.map((m) => m.here ? `<div class="here"><em>You are here</em><b>${esc(m.name)}</b><small>${esc(m.note)}</small></div>` : m.href ? `<a href="${esc(m.href)}"><em>Open ›</em><b>${esc(m.name)}</b><small>${esc(m.note)}</small></a>` : `<div class="soon"><em>Coming</em><b>${esc(m.name)}</b><small>${esc(m.note)}</small></div>`).join("")}</div></div>
    <div style="text-align:center;align-self:center"><p class="eyebrow">${esc(T.quiz.eyebrow)}</p><h2>${esc(T.quiz.h)}</h2><p class="lead" style="margin:1cqw auto 1.6cqw">${esc(T.quiz.lead)}</p><div class="qr" data-qr="${esc(MERIDIAN_URL)}"></div><p class="txt" style="margin-top:1cqw">${esc(MERIDIAN_URL.replace(/^https?:\/\//, ""))}</p></div>`,
  notes: T.next.notes + " " + T.quiz.notes });

/* ---------------- deck state ---------------- */
const N = SLIDES.length;
let cur = -1, step = 0, black = false, simInst = null;
const deck = $("#deck");
const slideEl = (i) => deck.children[i];
function buildSlides() {
  deck.innerHTML = SLIDES.map((s, i) => `<section class="slide ${s.layout}" data-i="${i}" aria-label="Slide ${i + 1} of ${N}: ${esc(titleOf(s))}"><div class="top"><span>${esc(s.sec)}</span><span class="wm">ILG Academy</span></div>${s.html()}<div class="foot"><span>${esc(LENS.deckName)}</span><span class="fstep" data-steps></span><span><i class="dot" data-rdot></i>${i + 1} / ${N}</span></div><div class="bar" style="width:${((i + 1) / N) * 100}%"></div></section>`).join("");
  $$("[data-qr]").forEach((q) => (q.innerHTML = qrSvg(q.dataset.qr)));
  deck.addEventListener("click", (e) => {
    const st = e.target.closest("[data-steps] button"); if (st) next();
    const j = e.target.closest("[data-jump]"); if (j) goId(j.dataset.jump);
    const tb = e.target.closest("[data-tab]"); if (tb) API.tab(tb.dataset.tab);
  });
}
function stepsUI() {
  const S = SLIDES[cur], box = $("[data-steps]", slideEl(cur)); if (!box) return;
  if (!S.steps || !S.steps.length) { box.innerHTML = ""; return; }
  const n = S.steps.length;
  box.innerHTML = step < n ? `<button data-k="${step}" title="Run this step (→ or clicker)">Step ${step + 1} of ${n} · Next: <b>${esc(S.steps[step].l)}</b> ›</button>` : `<button data-k="${n}" title="Next slide">✓ All ${n} steps · next slide ›</button>`;
}
const simCtx = (i) => ({ slide: slideEl(i), side: slideEl(i).querySelector(".side") || slideEl(i), changed: () => sendState(), go: (id) => goId(id), toast });
function mountSim(i) {
  const S = SLIDES[i], hostSpan = $("[data-fig]", slideEl(i)); if (!S.fig || !hostSpan) return;
  const host = document.createElement("div"); host.className = "fig-host"; host.dataset.simHost = ""; hostSpan.replaceWith(host);
  try { simInst = SIMS[S.fig.sim](host, simCtx(i), S.fig.opt || {}); }
  catch (e) { console.warn(e); host.innerHTML = `<p class="txt" style="padding:2cqw">This demonstration could not start in this browser. The slide text and trainer notes still cover the content.</p>`; simInst = null; }
}
function unmountSim(i) { const s = slideEl(i), host = s && $("[data-sim-host]", s); if (!host) return; const sp = document.createElement("span"); sp.setAttribute("data-fig", ""); host.replaceWith(sp); }
function go(i, opts = {}) {
  i = Math.max(0, Math.min(N - 1, i)); if (i === cur && !opts.force) return;
  const prevI = cur, prevSim = simInst;
  if (prevI >= 0) { slideEl(prevI).classList.remove("on"); slideEl(prevI).classList.add("out"); setTimeout(() => { if (cur !== prevI) { slideEl(prevI).classList.remove("out"); try { prevSim && prevSim.destroy(); } catch (e) {} unmountSim(prevI); } }, 420); }
  cur = i; step = 0; simInst = null;
  const el = slideEl(i); el.classList.remove("out"); el.classList.add("on");
  mountSim(i); if (simInst) simInst._slide = i;
  API.tab("what", true);
  stepsUI(); ctrlUI();
  if (ROLE === "deck") try { history.replaceState(null, "", "#slide=" + (i + 1) + (PEER_PARAM ? "&peer=" + PEER_PARAM : "")); } catch (e) {}
  sendState();
}
function next() { const S = SLIDES[cur]; if (S.steps && step < S.steps.length) { runStep(step); step++; stepsUI(); ctrlUI(); sendState(); } else go(cur + 1); }
function prev() { go(cur - 1); }
function runTo(k) { const S = SLIDES[cur]; while (step < Math.min(k, (S.steps || []).length)) { runStep(step); step++; } stepsUI(); sendState(); }
function runStep(k) { const fn = SLIDES[cur].steps[k].run; try { fn(API); } catch (e) { console.warn(e); } }

/* what steps and remotes can do */
const API = {
  act(id) { if (simInst) try { simInst.act(id); } catch (e) { console.warn(e); } },
  tab(t, quiet) { const s = slideEl(cur); if (!s) return; const panes = $$("[data-pane]", s); if (!panes.length) return; if (!panes.some((p) => p.dataset.pane === t)) return;
    panes.forEach((p) => p.classList.toggle("show", p.dataset.pane === t)); $$("[data-tab]", s).forEach((b) => b.setAttribute("aria-selected", String(b.dataset.tab === t))); if (!quiet) sendState(); },
};

/* ---------------- keys (keyboard and presenter clickers) ---------------- */
let digits = "";
function key(e) {
  if (ROLE !== "deck") return;
  const k = e.key, ae = document.activeElement || {};
  if (/input|textarea|select/i.test(ae.tagName || "")) return;
  /* a focused control inside a slide keeps Enter and Space for itself */
  if ((k === " " || k === "Enter") && ae.closest && ae.closest("#deck") && ae.matches("button,[role=button],summary,a,[tabindex]")) return;
  if (!$("#ovl").hidden && k === "Escape") { closeOvl(); return; }
  if (/^[0-9]$/.test(k)) { digits += k; toast("Go to slide " + digits + " · Enter"); return; }
  if (k === "Enter" && digits) { go(+digits - 1); digits = ""; return; }
  if (black && !["b", "B", ".", "Escape"].includes(k)) { setBlack(false); return; }
  if (["ArrowRight", "PageDown", " ", "n", "N"].includes(k)) next();
  else if (["ArrowLeft", "PageUp", "Backspace"].includes(k)) prev();
  else if (k === "ArrowDown") go(cur + 1); else if (k === "ArrowUp") go(cur - 1);
  else if (k === "Home") go(0); else if (k === "End") go(N - 1);
  else if (["b", "B", "."].includes(k)) setBlack(!black);
  else if (k === "Escape") setBlack(false);
  else if (["f", "F", "F5"].includes(k)) fullscreen();
  else if (k === "p" || k === "P") openPresenter();
  else if (k === "r" || k === "R") openRemotePanel();
  else if (k === "o" || k === "O") openOverview();
  else if (k === "s" || k === "S") openSources();
  else if (["h", "H", "?"].includes(k)) openHelp();
  else return;
  e.preventDefault();
}
function setBlack(on) { black = on; $("#black").hidden = !on; sendState(); }
function fullscreen() { try { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen(); } catch (e) {} }
function closeOvl() { $("#ovl").hidden = true; $("#ovl").innerHTML = ""; }
const goId = (id) => { const j = SLIDES.findIndex((x) => x.id === id); if (j >= 0) go(j); };
const PARTS_OF = [["Start", ["title", "agenda"]], ["A · Polarised lenses", ["secA", "glare", "filter", "sim", "who", "trade", "decide", "test", "uv", "myths"]], ["B · Technologies", null, "b-", "secB"], ["C · Anatomy · D · Comparison", ["anat", "comp"]], ["E · Care", ["care", "mist", "careq"]], ["F · Consultation · G · Assessment", ["cons", "assess"]], ["Finish", ["refs", "next"]]];
const modRow = () => `<p class="glab">ILG Academy modules</p><div class="modrow">${MODULES.map((m) => m.here ? `<a class="here" aria-current="page">${esc(m.name)}</a>` : m.href ? `<a href="${esc(m.href)}">${esc(m.name)} ›</a>` : `<span>${esc(m.name)} · coming</span>`).join("")}</div>`;
function openOverview() {
  const o = $("#ovl"); o.hidden = false; o.dataset.kind = "sheet";
  const groups = PARTS_OF.map(([name, ids, pre, also]) => { const list = SLIDES.map((x, i) => [x, i]).filter(([x]) => (ids ? ids.includes(x.id) : x.id.startsWith(pre) || x.id === also));
    return `<p class="glab">${esc(name)}</p><div class="grid">${list.map(([x, i]) => `<button class="${i === cur ? "on" : ""}" data-go="${i}"><small>${i + 1}</small>${esc(titleOf(x))}</button>`).join("")}</div>`; }).join("");
  o.innerHTML = `<div class="sheet" role="dialog" aria-label="Contents"><button class="x" data-x>Close</button><h3>Contents</h3><p>Click any slide to go straight to it.</p>${groups}${modRow()}<div class="row" style="margin-top:16px;gap:10px"><button class="x" style="float:none" data-go="0">⌂ Back to the start</button><button class="x" style="float:none" data-src>Sources</button><a class="x" style="float:none;text-decoration:none;color:inherit" href="${CALIBRE_URL}">Exit to Calibre</a></div></div>`;
  o.onclick = (e) => { if (e.target.closest("[data-x]") || e.target === o) closeOvl();
    if (e.target.closest("[data-src]")) return openSources();
    const g = e.target.closest("[data-go]"); if (g) { closeOvl(); go(+g.dataset.go); } };
}
function openSources() { const o = $("#ovl"); o.hidden = false; o.dataset.kind = "sheet";
  o.innerHTML = `<div class="sheet" role="dialog" aria-label="Sources"><button class="x" data-x>Close</button><h3>Trainer reference · sources</h3><p>Every technical claim in this module links to one of these. Simulations are illustrative, not measurements. Where performance varies by product, check the manufacturer's documentation.</p><div class="refs">${groupRefs()}</div></div>`;
  o.onclick = (e) => { if (e.target.closest("[data-x]") || e.target === o) closeOvl(); }; }
function openHelp() {
  const o = $("#ovl"); o.hidden = false; o.dataset.kind = "sheet";
  o.innerHTML = `<div class="sheet" role="dialog" aria-label="Help"><button class="x" data-x>Close</button><h3>How to use this deck <small style="font-family:var(--sans);font-size:12px;letter-spacing:.12em;color:var(--mute)">${DECK_VERSION}</small></h3>
  <div class="row"><div style="flex:1;min-width:260px"><p class="glab">Mouse or touch</p><p><b>Control bar</b> at the bottom: Home, Contents, back and next, full screen, phone remote, presenter view and Exit. Move the mouse or tap to show it.</p><p><b>Next</b> first plays the slide's next step (a demonstration, a tab), then goes to the next slide. The footer button shows what comes next.</p><p><b>Simulations:</b> every button and slider under a figure works, and the same controls appear on the phone remote. Drag the divider or the glasses where the slide says so.</p><p><b>Touch screens:</b> swipe left or right on the text side to change slides.</p></div>
  <div style="flex:1;min-width:240px"><p class="glab">Keyboard and clicker</p><div class="keys" style="font-size:14px;gap:6px 12px"><kbd>→ / PgDn / Space</kbd><span>Next step, then next slide</span><kbd>← / PgUp</kbd><span>Previous slide</span><kbd>↓</kbd><span>Skip the steps</span><kbd>Tab</kbd><span>Move between controls on a slide</span><kbd>Home / End</kbd><span>First / last slide</span><kbd>B</kbd><span>Black screen</span><kbd>F</kbd><span>Full screen</span><kbd>O</kbd><span>Contents</span><kbd>S</kbd><span>Sources</span><kbd>P</kbd><span>Presenter view</span><kbd>R</kbd><span>Phone remote</span><kbd>Esc</kbd><span>Close this panel</span></div></div></div>${modRow()}</div>`;
  o.onclick = (e) => { if (e.target.closest("[data-x]") || e.target === o) closeOvl(); };
}
const titleOf = (s) => { if (s.t) return s.t; const el = document.createElement("div"); el.innerHTML = s.html(); const h = el.querySelector("h1,h2"); return h ? h.textContent.trim() : s.id; };
function openPresenter() { try { window.open(location.pathname + location.search + "#presenter" + (PEER_PARAM ? "&peer=" + PEER_PARAM : ""), "lenspresenter", "width=1180,height=780"); } catch (e) {} toast("Presenter view opened in a new window"); }

/* ---------------- remotes: phone (PeerJS) and presenter view (same computer) ---------------- */
let bc = null; try { bc = new BroadcastChannel(CH_NAME); } catch (e) {}
const conns = new Set();
let peer = null, peerId = "", peerErr = "", remotes = 0;
function snapshot() {
  const S = SLIDES[cur]; if (!S) return null;
  let acts = []; try { acts = simInst ? simInst.acts() || [] : []; } catch (e) { acts = []; }
  const panes = $$("[data-tab]", slideEl(cur)).map((b) => ["tab:" + b.dataset.tab, b.textContent, b.getAttribute("aria-selected") === "true"]);
  return { i: cur, n: N, id: S.id, sec: S.sec, title: titleOf(S), notes: S.notes || "", steps: (S.steps || []).map((x) => x.l), step, black, next: cur < N - 1 ? titleOf(SLIDES[cur + 1]) : "", acts: [...acts, ...panes], fig: "" };
}
let stTimer = 0;
function sendState() { if (ROLE !== "deck") return; clearTimeout(stTimer); stTimer = setTimeout(() => { const st = snapshot(); if (!st) return;
  const m = { state: st }; if (bc) bc.postMessage(m); conns.forEach((c) => { try { c.open && c.send(m); } catch (e) {} }); if (relayClients.size) relays.forEach((r) => r.ok && r.publish(relayTopic(peerId, "state"), m)); }, 40); }
setInterval(() => { if (ROLE === "deck" && (remotes || bc)) sendState(); }, 2500);
function onCmd(m) {
  if (!m || !m.cmd) return;
  const c = m.cmd;
  if (c === "next") next(); else if (c === "prev") prev(); else if (c === "skip") go(cur + 1); else if (c === "goto") go(+m.n);
  else if (c === "black") setBlack(!black); else if (c === "step") runTo(+m.k + 1);
  else if (c === "hello") sendState();
  else if (c === "act") { const a = String(m.a || ""); if (a.startsWith("tab:")) API.tab(a.slice(4)); else API.act(a); setTimeout(sendState, 120); }
}
if (bc) bc.onmessage = (e) => { if (ROLE === "deck") onCmd(e.data); };
/* ---------- backup link: a public relay (MQTT over a secure WebSocket) for networks that block direct phone-to-laptop links ---------- */
const RELAY_PARAM = new URLSearchParams(location.search).get("relay") || H.get("relay") || "";
const RELAYS = RELAY_PARAM ? [RELAY_PARAM] : ["wss://broker.emqx.io:8084/mqtt", "wss://broker.hivemq.com:8884/mqtt", "wss://test.mosquitto.org:8081/mqtt"];
const relayTopic = (id, k) => "ilg-lens-tech/" + id + "/" + k;
function mqttLink(url, onMsg, onState) {
  const enc = new TextEncoder(), dec = new TextDecoder();
  const str = (x) => { const b = enc.encode(x); return [b.length >> 8, b.length & 255, ...b]; };
  const vlen = (n) => { const o = []; do { let d = n % 128; n = Math.floor(n / 128); if (n > 0) d |= 128; o.push(d); } while (n > 0); return o; };
  const pkt = (h, body) => new Uint8Array([h, ...vlen(body.length), ...body]);
  let ws = null, ok = false, pid = 1, ping = 0, buf = new Uint8Array(0), closed = false, tries = 0;
  const subs = new Set();
  const sub = (t) => { if (ok) { ws.send(pkt(0x82, [(pid >> 8) & 255, pid & 255, ...str(t), 0])); pid = (pid % 60000) + 1; } };
  const api = { url, failed: false, get ok() { return ok; },
    publish(t, obj) { if (!ok) return; try { ws.send(pkt(0x30, [...str(t), ...enc.encode(JSON.stringify(obj))])); } catch (e) {} },
    subscribe(t) { subs.add(t); sub(t); }, close() { closed = true; clearInterval(ping); try { ws.close(); } catch (e) {} } };
  function open() {
    try { ws = new WebSocket(url, ["mqtt"]); } catch (e) { api.failed = true; onState(false); return; }
    ws.binaryType = "arraybuffer";
    const guard = setTimeout(() => { if (!ok) { api.failed = true; try { ws.close(); } catch (e) {} } }, 7000);
    ws.onopen = () => ws.send(pkt(0x10, [...str("MQTT"), 4, 0x02, 0, 60, ...str("lns" + Math.random().toString(36).slice(2, 12))]));
    ws.onmessage = (e) => {
      const d = new Uint8Array(e.data), nb = new Uint8Array(buf.length + d.length); nb.set(buf); nb.set(d, buf.length); buf = nb;
      for (;;) {
        if (buf.length < 2) break;
        let i = 1, mult = 1, rl = 0, b;
        do { if (i >= buf.length) return; b = buf[i++]; rl += (b & 127) * mult; mult *= 128; } while (b & 128);
        if (buf.length < i + rl) break;
        const h = buf[0], body = buf.slice(i, i + rl); buf = buf.slice(i + rl);
        const type = h >> 4;
        if (type === 2) { if (body[1] === 0) { ok = true; tries = 0; api.failed = false; clearTimeout(guard); subs.forEach(sub); clearInterval(ping); ping = setInterval(() => { try { ws.send(new Uint8Array([0xc0, 0])); } catch (x) {} }, 25000); onState(true); } else { api.failed = true; } }
        else if (type === 3) { const qos = (h >> 1) & 3, tl = (body[0] << 8) | body[1], topic = dec.decode(body.slice(2, 2 + tl));
          const off = 2 + tl + (qos ? 2 : 0); try { onMsg(topic, JSON.parse(dec.decode(body.slice(off)))); } catch (x) {} }
      }
    };
    ws.onclose = ws.onerror = () => { const was = ok; ok = false; clearInterval(ping); clearTimeout(guard); if (!was) api.failed = true; onState(false); if (!closed && tries++ < 20) setTimeout(open, Math.min(15000, 2000 * tries)); };
  }
  open(); return api;
}
const relays = [], relayClients = new Map();
function countRemotes() { const now = Date.now(); for (const [k, t] of relayClients) if (now - t > 15000) relayClients.delete(k);
  const before = remotes; remotes = [...conns].filter((x) => x.open).length + relayClients.size; if (remotes !== before) { dots(); renderRemotePanel(); } }
function startRelay() {
  if (relays.length || ROLE !== "deck" || typeof WebSocket === "undefined") return;
  const id = deckId();
  RELAYS.forEach((u) => { const r = mqttLink(u, (t, m) => { if (!m || !m.cmd) return; if (m.from) { const isNew = !relayClients.has(m.from); relayClients.set(m.from, Date.now()); if (isNew) { toast("Phone remote connected"); countRemotes(); } } if (m.cmd === "ping") return; if (m.cmd === "bye") { relayClients.delete(m.from); countRemotes(); return; } onCmd(m); }, () => renderRemotePanel());
    r.subscribe(relayTopic(id, "cmd")); relays.push(r); });
}
setInterval(() => { if (ROLE === "deck" && relays.length) countRemotes(); }, 4000);
function deckId() {
  if (peerId) return peerId;
  let id = ""; try { id = sessionStorage.getItem("lnsPeerId") || ""; } catch (e) {}
  if (!id) { id = PFX + Array.from(crypto.getRandomValues(new Uint8Array(6))).map((b) => "abcdefghjkmnpqrstuvwxyz23456789"[b % 31]).join(""); try { sessionStorage.setItem("lnsPeerId", id); } catch (e) {} }
  peerId = id; return id;
}
function startPeer() {
  if (peer || typeof Peer === "undefined") return;
  const id = deckId(); peerErr = "";
  try { peer = new Peer(id, PEERCFG); } catch (e) { peerErr = String(e); renderRemotePanel(); return; }
  peer.on("open", () => renderRemotePanel());
  peer.on("error", (e) => { peerErr = (e && e.type) || String(e); if (e && e.type === "unavailable-id") { try { sessionStorage.removeItem("lnsPeerId"); } catch (x) {} } renderRemotePanel(); });
  peer.on("disconnected", () => { try { peer.reconnect(); } catch (e) {} });
  peer.on("connection", (c) => { conns.add(c); c.on("open", () => { countRemotes(); toast("Phone remote connected"); sendState(); });
    c.on("data", (m) => onCmd(m)); c.on("close", () => { conns.delete(c); countRemotes(); toast("Phone remote disconnected"); }); });
}
const dots = () => $$("[data-rdot]").forEach((d) => d.classList.toggle("on", remotes > 0));
const remoteUrl = () => location.origin + location.pathname + location.search + "#remote=" + peerId.replace(PFX, "") + (PEER_PARAM ? "&peer=" + PEER_PARAM : "") + (RELAY_PARAM ? "&relay=" + encodeURIComponent(RELAY_PARAM) : "");
function openRemotePanel() { const o = $("#ovl"); o.hidden = false; o.dataset.kind = "remote"; o.onclick = (e) => { if (e.target.closest("[data-x]") || e.target === o) closeOvl(); if (e.target.closest("[data-pres]")) openPresenter(); }; if (location.protocol !== "file:") { startPeer(); startRelay(); } renderRemotePanel(); }
function renderRemotePanel() {
  const o = $("#ovl"); if (o.hidden || o.dataset.kind !== "remote") return;
  let body;
  if (location.protocol === "file:") body = `<p>The phone remote needs the deck to be opened from its <b>web address</b> (for example after uploading it to the Calibre site), not as a file on this computer — a phone cannot open a file on your laptop.</p><p>On this computer you can still use the <b>presenter view</b> and any presenter clicker.</p>`;
  else {
    const direct = peer && peer.open, relayOk = relays.some((r) => r.ok), relayDown = relays.length && relays.every((r) => r.failed && !r.ok), directDown = !!peerErr && !direct;
    const links = `<p style="font-size:13px;color:var(--mute)">Links: direct ${direct ? "<b style='color:#3E7A4A'>ready</b>" : directDown ? "blocked here" : "starting…"} · backup relay ${relayOk ? "<b style='color:#3E7A4A'>ready</b>" : relayDown ? "blocked here" : "starting…"}. The phone uses whichever works.</p>`;
    if (direct || relayOk) body = `<div class="row"><div class="qr">${qrSvg(remoteUrl())}</div><div style="flex:1;min-width:240px"><p><b>Scan with the phone camera.</b> The phone becomes Caliber Remote: next and back, every demonstration's controls, the tabs and the quiz answers.</p><p>Or open the deck on the phone and enter the code <code style="font-size:20px;letter-spacing:.2em">${esc(peerId.replace(PFX, "").toUpperCase())}</code></p>${links}<p style="font-size:13px;color:var(--mute)">Connected phones: ${remotes}. Keep this code to the trainer: anyone with it can control the deck. Leave this deck open; you can close this panel.</p></div></div>`;
    else if (directDown && relayDown) body = `<p><b>This network blocks both phone links.</b> Use a presenter clicker or the presenter view on this computer — or connect the laptop to a phone hotspot and press R again.</p>${links}`;
    else body = `<p>Starting the phone link…</p>${links}`;
  }
  o.innerHTML = `<div class="sheet" role="dialog" aria-label="Caliber Remote"><button class="x" data-x>Close</button><h3>Caliber Remote <small style="font-family:var(--sans);font-size:12px;letter-spacing:.12em;color:var(--mute)">${DECK_VERSION}</small></h3>${body}<p style="margin-top:14px"><button class="x" style="float:none" data-pres>Open presenter view on this computer</button></p></div>`;
}

/* ---------------- QR ---------------- */
function qrSvg(text) { try { const q = qrcode(0, "M"); q.addData(text); q.make(); return q.createSvgTag({ cellSize: 4, margin: 2, scalable: true }); } catch (e) { return ""; } }

/* =====================================================================
   REMOTE / PRESENTER UI
   ===================================================================== */
function remoteApp(mode) {
  document.body.style.background = "var(--paper)";
  $("#app").remove();
  const R = $("#rmt"); R.hidden = false; if (mode === "presenter") R.classList.add("pres");
  let S = null, send = () => {}, status = "Connecting…", ok = false, t0 = Date.now();
  if (mode === "presenter") { if (bc) { send = (m) => bc.postMessage(m); bc.onmessage = (e) => { if (e.data && e.data.state) { S = e.data.state; ok = true; status = "Linked to the deck"; draw(); } }; send({ cmd: "hello" }); } else status = "This browser cannot link windows"; draw(); }
  else {
    let code = (H.get("remote") || "").toLowerCase();
    const me = "ph" + Math.random().toString(36).slice(2, 10);
    let conn = null, relay = null, via = "", peerObj = null, relayList = [], pingT = 0, failT = 0;
    const setVia = (v) => { if (!ok || via !== v) { via = v; ok = true; status = v === "direct" ? "Connected · direct" : "Connected · relay"; } };
    send = (m) => { if (conn && conn.open) { try { conn.send(m); } catch (e) {} } else if (relay && relay.ok) relay.publish(relayTopic(PFX + code, "cmd"), Object.assign({ from: me }, m)); };
    const gotState = (m, v) => { if (m && m.state) { S = m.state; setVia(v); draw(); } };
    const connect = () => {
      try { peerObj && peerObj.destroy(); } catch (e) {} relayList.forEach((r) => r.close()); relayList = []; relay = null; conn = null; ok = false;
      status = "Connecting…"; draw();
      if (typeof Peer !== "undefined") {
        const p = new Peer(undefined, PEERCFG); peerObj = p;
        p.on("open", () => { const c = p.connect(PFX + code, { reliable: true });
          c.on("open", () => { conn = c; c.send({ cmd: "hello" }); });
          c.on("data", (m) => gotState(m, "direct"));
          c.on("close", () => { if (conn === c) conn = null; if (via === "direct") { ok = false; status = relay && relay.ok ? "Connected · relay" : "Reconnecting…"; if (relay && relay.ok) { via = "relay"; ok = true; relay.publish(relayTopic(PFX + code, "cmd"), { cmd: "hello", from: me }); } draw(); } }); });
        p.on("error", () => {});
      }
      RELAYS.forEach((u) => { const r = mqttLink(u, (t, m) => { if (relay === r) gotState(m, conn && conn.open ? "direct" : "relay"); }, (on) => {
        if (on && !relay) { relay = r; r.subscribe(relayTopic(PFX + code, "state")); setTimeout(() => r.publish(relayTopic(PFX + code, "cmd"), { cmd: "hello", from: me }), 300); relayList.filter((x) => x !== r).forEach((x) => x.close()); }
        else if (on && relay === r) { r.publish(relayTopic(PFX + code, "cmd"), { cmd: "hello", from: me }); } }); relayList.push(r); });
      clearInterval(pingT); pingT = setInterval(() => { if (relay && relay.ok) relay.publish(relayTopic(PFX + code, "cmd"), { cmd: "ping", from: me }); }, 5000);
      clearTimeout(failT); failT = setTimeout(() => { if (!ok) { status = "Can't reach the deck yet. On the big screen press R (or the Phone button) so the QR code is showing, check the code, then tap here to retry."; draw(); } }, 15000);
    };
    window.addEventListener("pagehide", () => { if (relay && relay.ok) relay.publish(relayTopic(PFX + code, "cmd"), { cmd: "bye", from: me }); });
    R.addEventListener("click", (e) => { if (e.target.closest("[data-retry]")) connect(); });
    if (code) connect(); else draw();
    R.addEventListener("submit", (e) => { e.preventDefault();
      const v = (R.querySelector("input") || {}).value || ""; code = v.trim().toLowerCase().replace(PFX, ""); if (code) { history.replaceState(null, "", "#remote=" + code + (PEER_PARAM ? "&peer=" + PEER_PARAM : "") + (RELAY_PARAM ? "&relay=" + encodeURIComponent(RELAY_PARAM) : "")); connect(); } });
  }
  function draw() {
    if (mode === "remote" && !(H.get("remote")) && !S && !ok && status === "Connecting…") { status = ""; }
    const head = `<div class="r-head"><span>${mode === "presenter" ? "Presenter view" : "Caliber Remote"} · Lens Technology · <b style="font-weight:500">${DECK_VERSION}</b></span><span class="st ${ok ? "ok" : ""}" ${!ok && mode === "remote" ? "data-retry" : ""}>${esc(status || "")}</span></div>`;
    if (!S) {
      R.innerHTML = head + (mode === "remote" && !H.get("remote") ? `<form class="r-pair"><p class="r-title">Enter the code</p><p class="r-sub">Shown on the deck after pressing R</p><input maxlength="12" autocomplete="off" autocapitalize="characters" placeholder="ABC123"><button>Connect</button></form>` : `<p class="r-title">Waiting for the deck…</p><p class="r-sub">${mode === "presenter" ? "Keep the deck open in the other window." : "Keep the deck open on the big screen."}</p>`);
      return;
    }
    const nav = `<div class="r-nav"><button data-c="prev">‹ Back</button><button class="go" data-c="next">${S.step < S.steps.length ? "Next step ›<small>" + esc(S.steps[S.step]) + "</small>" : "Next slide ›<small>" + esc(S.next || "End") + "</small>"}</button></div>`;
    const info = `<div><p class="r-sub">${S.i + 1} / ${S.n} · ${esc(S.sec)}</p><p class="r-title">${esc(S.title)}</p></div>`;
    const steps = S.steps.length ? `<p class="r-lab">Steps</p><div class="r-acts">${S.steps.map((l, k) => `<button class="${k < S.step ? "gold" : ""}" data-c="step" data-k="${k}">${k < S.step ? "✓ " : ""}${esc(l)}</button>`).join("")}<button data-c="skip">Skip to next slide</button></div>` : "";
    const acts = S.acts.length ? `<p class="r-lab">On screen</p><div class="r-acts">${S.acts.map(([a, t, on]) => `<button data-c="act" data-a="${esc(a)}" ${on ? 'aria-pressed="true"' : ""}>${esc(t)}</button>`).join("")}</div>` : "";
    const notes = S.notes ? `<p class="r-lab">Trainer notes</p><div class="r-notes">${esc(S.notes)}</div>` : "";
    const blk = `<div class="r-acts"><button data-c="black" ${S.black ? 'aria-pressed="true"' : ""}>${S.black ? "Show the screen" : "Black screen"}</button></div>`;
    if (mode === "presenter") R.innerHTML = `<div class="r-col">${head}${info}<div class="timer" data-timer title="Tap to restart">0:00</div><p class="r-next">Next: <b>${esc(S.next || "End of deck")}</b></p>${nav}${steps}${blk}</div><div class="r-col">${notes}${acts}</div>`;
    else R.innerHTML = head + info + nav + acts + steps + notes + blk;
    wire();
  }
  function wire() {
    R.querySelectorAll("[data-c]").forEach((b) => { const c = b.dataset.c;
      b.onclick = () => { const m = { cmd: c }; if (c === "step") m.k = b.dataset.k; if (c === "act") m.a = b.dataset.a; send(m); try { navigator.vibrate && navigator.vibrate(6); } catch (e) {} }; });
    const tm = R.querySelector("[data-timer]"); if (tm) tm.onclick = () => { t0 = Date.now(); };
  }
  setInterval(() => { const tm = R.querySelector("[data-timer]"); if (tm) { const s = Math.floor((Date.now() - t0) / 1000); tm.textContent = Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); } }, 1000);
}

/* ---------------- on-screen control bar (mouse and touch) ---------------- */
const ICON = { home: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>', menu: '<path d="M4 6h16M4 12h16M4 18h16"/>', prev: '<path d="M15 5l-7 7 7 7"/>', next: '<path d="M9 5l7 7-7 7"/>',
  full: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>', phone: '<rect x="7" y="2.5" width="10" height="19" rx="2"/><path d="M11 18.5h2"/>', pres: '<rect x="3" y="4" width="21" height="12" rx="1"/><path d="M8 20h8M12 16v4"/>', help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5v.7M12 17h.01"/>', exit: '<path d="M14 4h5a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-5M10 16l-4-4 4-4M6 12h10"/>', book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5"/>' };
const ico = (k) => `<svg viewBox="0 0 24 24" aria-hidden="true">${ICON[k]}</svg>`;
function buildCtrl() {
  const n = document.createElement("nav"); n.id = "ctrl"; n.className = "ctrl"; n.setAttribute("aria-label", "Deck controls");
  n.innerHTML = `<button data-k="home" title="Back to the first slide (Home)">${ico("home")}<span>Home</span></button><button data-k="menu" title="Contents: all slides and modules (O)">${ico("menu")}<span>Contents</span></button><i class="sep"></i>
    <button data-k="prev" title="Previous slide (←)" class="nav" aria-label="Previous">${ico("prev")}</button><span class="cnt" data-cnt></span><button data-k="next" title="Next step or slide (→)" class="nav go" aria-label="Next">${ico("next")}</button><i class="sep"></i>
    <button data-k="full" title="Full screen (F)">${ico("full")}<span>Full screen</span></button><button data-k="phone" title="Phone remote: scan a QR code (R)">${ico("phone")}<span>Phone</span></button><button data-k="pres" title="Presenter view with notes (P)">${ico("pres")}<span>Presenter</span></button><button data-k="src" title="Sources (S)">${ico("book")}<span>Sources</span></button><button data-k="help" title="How to use this deck (?)">${ico("help")}<span>Help</span></button><i class="sep"></i>
    <a data-k="exit" href="${CALIBRE_URL}" title="Leave the deck and go back to Calibre">${ico("exit")}<span>Exit</span></a>`;
  document.body.appendChild(n);
  n.addEventListener("click", (e) => { const b = e.target.closest("[data-k]"); if (!b) return;
    const k = b.dataset.k; if (k === "exit") return;
    ({ home: () => go(0), menu: openOverview, prev, next, full: fullscreen, phone: openRemotePanel, pres: openPresenter, src: openSources, help: openHelp })[k](); showCtrl(); });
  let t = 0;
  const app = $("#app");
  function showCtrl() { n.classList.add("on"); app.classList.remove("idle"); clearTimeout(t); t = setTimeout(() => { if (!n.matches(":hover") && !n.contains(document.activeElement)) { n.classList.remove("on"); app.classList.add("idle"); } }, 3200); }
  ["mousemove", "pointerdown", "touchstart"].forEach((ev) => document.addEventListener(ev, showCtrl, { passive: true }));
  n.addEventListener("focusin", showCtrl); showCtrl();
}
function ctrlUI() { const c = $("[data-cnt]"); if (c) c.textContent = (cur + 1) + " / " + N;
  const p = $('#ctrl [data-k="prev"]'), x = $('#ctrl [data-k="next"]'); if (p) p.disabled = cur <= 0; if (x) x.disabled = cur >= N - 1 && !(SLIDES[cur].steps && step < SLIDES[cur].steps.length); }
/* swipe between slides on touch screens (figures keep their own drags) */
(function swipe() { let sx = null, sy = 0; document.addEventListener("touchstart", (e) => { if (ROLE !== "deck" || e.touches.length !== 1 || e.target.closest(".fig,#ctrl,.ovl")) { sx = null; return; } sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
  document.addEventListener("touchend", (e) => { if (sx == null) return; const t = e.changedTouches[0], dx = t.clientX - sx, dy = t.clientY - sy; sx = null; if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) dx < 0 ? next() : prev(); }, { passive: true }); })();

/* ---------------- start ---------------- */
if (ROLE === "deck") {
  buildSlides(); buildCtrl();
  document.addEventListener("keydown", key);
  const s0 = Math.max(1, +(H.get("slide") || 1)); go(s0 - 1, { force: true });
  window.DECK = { go, next, prev, goId, titleOf, get cur() { return cur; }, get step() { return step; }, SLIDES, snapshot, onCmd, API, get sim() { return simInst; }, startPeer, get peerId() { return peerId; }, get remotes() { return remotes; } };
} else remoteApp(ROLE);
})();
