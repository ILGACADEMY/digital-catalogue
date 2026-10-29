# ILG Academy — The Catalogue (view-only web app)

Static site: no server code, no database, no logins, no downloads.

| File | What it is |
|---|---|
| `index.html` | The whole catalogue (data, photos, logos, HOROLOGY LAB, manuals) |
| `anatomy-deck.html` | Training deck: Interactive Watch Anatomy |
| `eyewear-lens-deck.html` | Training deck: Eyewear Lens Technology (generated — see below) |
| `eyewear-src/` | Source parts for the eyewear deck |
| `vercel.json` | Security headers (blocks outside scripts, framing, tracking) |
| `manifest.webmanifest` + icons | "Add to Home Screen" name and icon |
| `robots.txt` | Keeps the site out of Google |

## Update the catalogue
Replace `index.html` in GitHub (Add file → Upload files → Commit). Vercel redeploys automatically in about a minute.

## Replace the app icon
Swap `icon-192.png`, `icon-512.png`, `apple-touch-icon.png` (180×180) and `favicon.png` with the official ILG logo, same file names.

## Training decks
Both decks are single HTML files that run on any laptop browser, with the same controls: → / clicker for the next step, R for the phone remote (Caliber Remote), P for the presenter view, O for contents. Each deck's Contents panel links to the other module.

- **Interactive Watch Anatomy** — `anatomy-deck.html`
- **Eyewear Lens Technology** — `eyewear-lens-deck.html`: polarised lenses (glare, the filter, a simulator, who it suits, trade-offs, a decision guide, identification tests, UV, myths), 13 lens technologies, a conceptual lens cross-section, a comparison lab, lens care, a consultation simulator and an assessment. Sources are on the Sources slide and behind the S key.

### Edit the eyewear deck
Do not edit `eyewear-lens-deck.html` directly. Edit the parts in `eyewear-src/` and rebuild:

```
python3 eyewear-src/build.py
```

| Part | What it holds |
|---|---|
| `content.js` | Every learner- and trainer-facing word, plus `REFS` (the sources). Add `LENS_I18N.ar` and open the deck with `?lang=ar` for a translation. |
| `assess.js` | Assessment questions (`ASSESS_BANK`) and the scoring logic (`Assess`) |
| `sims-*.js` | Simulations and interactive widgets (canvas and SVG; no WebGL needed) |
| `app.js` | The deck engine, shared design with `anatomy-deck.html` |
| `deck-base.css`, `deck-lens.css` | Calibre theme and this module's styles |
| `vendor-peer-qr.js` | PeerJS and the QR code library, copied from `anatomy-deck.html` |
| `meridian-export.js` | Writes `meridian-lens-quiz.txt` (a Meridian import file) from the assessment |

To preview locally: `python3 -m http.server` in the repository folder, then open `http://localhost:8000/eyewear-lens-deck.html`. The phone remote needs the deck on its web address (Vercel), not opened as a file.
