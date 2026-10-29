/* Writes meridian-lens-quiz.txt from the four-option questions in assess.js.
   Run:  node eyewear-src/meridian-export.js   (the build does not need it) */
const fs = require("fs"), path = require("path"), vm = require("vm");
const ctx = {}; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, "assess.js"), "utf8") + ";this.B=ASSESS_BANK;", ctx);
const diff = { "Polarisation basics": "Easy", "Identification": "Medium", "Suitability": "Medium", "Coatings": "Medium", "Lens care": "Easy", "Consultation": "Hard" };
const out = ctx.B.filter((q) => (q.type === "mcq" || q.type === "pic") && q.o.length === 4).map((q) =>
  [`Q: ${q.q}`, ...q.o.map((o, i) => `${"ABCD"[i]}) ${o}`), `Correct: ${"ABCD"[q.a]}`, `Explanation: ${q.e}`, "Category: Eyewear Lens Technology", `Difficulty: ${diff[q.topic] || "Medium"}`, `Topic: ${q.topic}`].join("\n")).join("\n\n") + "\n";
fs.writeFileSync(path.join(__dirname, "meridian-lens-quiz.txt"), out);
console.log("wrote meridian-lens-quiz.txt", out.split("\nQ: ").length, "questions");
