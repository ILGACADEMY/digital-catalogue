#!/usr/bin/env python3
"""Build eyewear-lens-deck.html from the parts in this folder.

    python3 eyewear-src/build.py

The deck is one self-contained HTML file (like anatomy-deck.html), so it
deploys on Vercel by simply being in the repository. Edit the parts, not
the generated file:
  content.js    every learner/trainer-facing word + REFS (sources)
  assess.js     assessment questions (data) and scoring logic
  sims-*.js     simulations and interactive widgets
  app.js        the deck engine (slides, keys, remote, presenter)
  deck-base.css the shared Calibre deck theme (copied from anatomy-deck.html)
  deck-lens.css styles for this module
  vendor-peer-qr.js  PeerJS + qrcode (copied from anatomy-deck.html)
"""
import pathlib
here = pathlib.Path(__file__).resolve().parent
rd = lambda n: (here / n).read_text(encoding="utf-8")
out = rd("shell.html")
def put(key, text):
    global out
    token = "/*__%s__*/" % key
    assert out.count(token) == 1, key
    assert "</script" not in text.lower() or key == "CSS", key + " contains a closing script tag"
    out = out.replace(token, text)
put("CSS", rd("deck-base.css") + "\n" + rd("deck-lens.css"))
put("VENDOR", rd("vendor-peer-qr.js"))
put("CONTENT", rd("content.js"))
put("ASSESS", rd("assess.js"))
put("SIMS", "\n".join(rd(n) for n in ["sims-core.js", "sims-pol.js", "sims-tech.js", "sims-learn.js"]))
put("APP", rd("app.js"))
dest = here.parent / "eyewear-lens-deck.html"
dest.write_text(out, encoding="utf-8")
print("wrote", dest.name, f"{len(out.encode('utf-8'))/1024:.0f} KB")
