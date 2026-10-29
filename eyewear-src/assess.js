/* =====================================================================
   ILG Academy · Eyewear Lens Technology — ASSESSMENT
   ---------------------------------------------------------------------
   ASSESS_BANK is data (questions, answers, feedback, topic, section).
   Assess is pure logic: it never touches the page. The deck's
   assessment widget (sims.js → W.assess) only renders what Assess
   returns, so questions can be added or edited here without touching
   any interface code.
   Question types
     mcq      { q, o:[...], a:index }
     tf       { q, a:true|false }
     pic      { q, pic:{...}, o:[...], a:index }      image identification
     match    { q, items:[[label, key]...], keys:[key...] }  drag & drop
     layer    { q, a:layerId }                         click the cross-section
   Every question: id, topic, sec (slide id to revisit), e (feedback).
   ===================================================================== */
const ASSESS_BANK = [
  { id: "q1", type: "pic", topic: "Polarisation basics", sec: "glare", q: "Which view is through a polarised lens?",
    pic: { k: "pair" }, o: ["Left", "Right"], a: 1, e: "The polarised view keeps the scene but takes much of the white sheen off the water, so you see below the surface." },
  { id: "q2", type: "mcq", topic: "Polarisation basics", sec: "filter", q: "Reflected glare off a lake is mostly…",
    o: ["Unpolarised, like direct sunlight", "Partly polarised, vibrating mostly horizontally", "Ultraviolet light", "Blue light"], a: 1, e: "Reflection from a flat surface is partly polarised, mainly horizontally. A vertical filter blocks much of it." },
  { id: "q3", type: "mcq", topic: "Polarisation basics", sec: "sim", q: "In the simulator, when does a polarised lens cut water glare the most?",
    o: ["Looking straight down at the water", "Looking ahead and down at roughly Brewster's angle", "At night", "Always exactly the same"], a: 1, e: "Near Brewster's angle (about 53° from vertical for water) the reflection is most strongly polarised. The effect depends on the angle." },
  { id: "q4", type: "pic", topic: "Identification", sec: "test", q: "Two lenses, one in front of the other. One is turned 90°. The overlap went almost black. What does it show?",
    pic: { k: "crossed" }, o: ["Both lenses are polarised", "Both lenses block UV", "The lenses are category 4", "The lenses are photochromic"], a: 0, e: "Two polarisers crossed at 90° block most light. It proves polarisation — nothing about UV or category." },
  { id: "q5", type: "tf", topic: "Identification", sec: "test", q: "If a lens passes the LCD screen test, its UV protection is confirmed.", a: false, e: "The screen test only demonstrates polarisation. UV is checked on the label and specification." },
  { id: "q6", type: "tf", topic: "Polarisation vs UV", sec: "uv", q: "A lens can be polarised without adequate UV protection.", a: true, e: "They are separate properties. Always check the UV specification." },
  { id: "q7", type: "tf", topic: "Myths", sec: "myths", q: "All dark sunglasses are polarised.", a: false, e: "Darkness is tint. Polarisation can be in light or dark lenses — and many dark lenses are not polarised." },
  { id: "q8", type: "mcq", topic: "Suitability", sec: "trade", q: "A customer is a private pilot. What is the safest advice?",
    o: ["Polarised: less glare in the cockpit", "Follow aviation guidance: usually non-polarised, neutral grey", "Photochromic: adapts to altitude", "Category 4: the sun is brighter up there"], a: 1, e: "Aviation authorities advise against polarised (and photochromic) lenses for flying; instruments and operational rules come first." },
  { id: "q9", type: "match", topic: "Technology types", sec: "comp", q: "Drag each technology to its type.",
    items: [["Polarising film", "filter"], ["Anti-reflective", "coating"], ["Polycarbonate", "material"], ["Gradient", "tint"], ["UV absorber", "filter"], ["Hydrophobic top coat", "coating"]], keys: ["material", "tint", "filter", "coating"], e: "Material is the body of the lens; tints change colour and darkness; filters select light (polarisation, UV, blue); coatings are thin surface treatments." },
  { id: "q10", type: "layer", topic: "Lens anatomy", sec: "anat", q: "Tap the layer that blocks much of the reflected glare.", a: "pol", e: "The polarising film — an embedded layer in polarised lenses only." },
  { id: "q11", type: "layer", topic: "Lens anatomy", sec: "anat", q: "Tap the outermost layer that helps water and fingerprints wipe away.", a: "top", e: "The hydrophobic / oleophobic top coat sits over the other surface treatments." },
  { id: "q12", type: "mcq", topic: "Coatings", sec: "comp", q: "Hydrophobic vs oleophobic:",
    o: ["Hydrophobic repels water; oleophobic repels oils", "They are the same thing", "Oleophobic stops scratches", "Hydrophobic stops fog"], a: 0, e: "Different jobs, often combined in one top coat." },
  { id: "q13", type: "mcq", topic: "Coatings", sec: "b-blue", q: "What can you honestly say about blue-light filtering lenses?",
    o: ["They prevent eye damage from screens", "They cure digital eye strain", "Some people like them; evidence doesn't show they reduce eye strain or improve sleep", "They are the same as UV protection"], a: 2, e: "A 2023 Cochrane review found no clear short-term benefit for eye strain; sleep and eye-health effects are uncertain." },
  { id: "q14", type: "mcq", topic: "Coatings", sec: "b-photo", q: "Why might standard photochromic lenses stay light in a car?",
    o: ["The car is too hot", "Most windscreens block the UV that activates them", "They only work on water", "Polarisation stops them"], a: 1, e: "Windscreens block most activating UV; some products are designed to darken behind a windscreen." },
  { id: "q15", type: "mcq", topic: "Lens care", sec: "care", q: "Sand on the lens. First step?",
    o: ["Wipe with microfibre", "Rinse under clean lukewarm water", "Use glass cleaner", "Blow on it and polish"], a: 1, e: "Rinse grit off first — wiping it is the classic scratch." },
  { id: "q16", type: "tf", topic: "Lens care", sec: "mist", q: "Leaving sunglasses on a hot dashboard can damage the coatings.", a: true, e: "Heat can cause crazing: fine cracks in the coating that can't be cleaned away." },
  { id: "q17", type: "mcq", topic: "Consultation", sec: "cons", q: "A commuter has wet-road glare and a head-up display. Best approach?",
    o: ["Category 4 mirror", "Polarised category 3 grey — and check the HUD through a demo pair", "Standard photochromic for the car", "Blue-light lenses"], a: 1, e: "Solves the glare and checks the display trade-off. Category 4 isn't for driving; standard photochromics darken little in cars." },
  { id: "q18", type: "mcq", topic: "Consultation", sec: "cons", q: "A premium buyer believes ‘the mirror makes them scratch-proof and UV-safe’. You…",
    o: ["Agree — it's premium", "Explain each feature separately: mirror is the look; hard coat helps with wear; UV is on the spec", "Recommend the most expensive lens", "Say mirror lenses are polarised"], a: 1, e: "Needs-based, accurate claims. No lens is scratch-proof; mirror colour says nothing about UV." },
];

const Assess = (function () {
  "use strict";
  const PASS = 0.8;
  function session(bank) { return { bank: bank.slice(), i: 0, res: {} }; }
  /* response: index for mcq/pic, boolean for tf, layer id for layer, {label:key} for match */
  function check(q, r) {
    if (q.type === "mcq" || q.type === "pic") return { ok: r === q.a, score: r === q.a ? 1 : 0, right: q.o[q.a] };
    if (q.type === "tf") return { ok: r === q.a, score: r === q.a ? 1 : 0, right: q.a ? "True" : "False" };
    if (q.type === "layer") return { ok: r === q.a, score: r === q.a ? 1 : 0, right: q.a };
    if (q.type === "match") { let n = 0; const wrong = [];
      q.items.forEach(([lab, key]) => { if (r && r[lab] === key) n++; else wrong.push(lab); });
      const score = n / q.items.length; return { ok: score === 1, score, wrong, right: q.items.map(([l, k]) => l + " → " + k).join(" · ") }; }
    return { ok: false, score: 0 };
  }
  function answer(S, r) { const q = S.bank[S.i]; if (!q || S.res[q.id]) return S.res[q && q.id]; const c = check(q, r); S.res[q.id] = Object.assign({ r }, c); return S.res[q.id]; }
  function next(S) { if (S.i < S.bank.length) S.i++; return S.i; }
  const done = (S) => S.i >= S.bank.length;
  function results(S) {
    let score = 0; const correct = [], wrong = [], topics = {}, secs = [];
    S.bank.forEach((q) => { const r = S.res[q.id]; const s = r ? r.score : 0; score += s;
      (s === 1 ? correct : wrong).push(q);
      topics[q.topic] = topics[q.topic] || { topic: q.topic, n: 0, got: 0 }; topics[q.topic].n++; topics[q.topic].got += s;
      if (s < 1 && !secs.includes(q.sec)) secs.push(q.sec); });
    const max = S.bank.length, pct = max ? score / max : 0;
    const revise = Object.values(topics).filter((t) => t.got / t.n < PASS).map((t) => t.topic);
    return { score: Math.round(score * 10) / 10, max, pct, correct, wrong, topics: Object.values(topics), revise, sections: secs, passed: pct >= PASS, status: pct >= PASS ? "Complete — passed" : done(S) ? "Complete — revision recommended" : "In progress" };
  }
  return { session, check, answer, next, done, results, PASS };
})();
