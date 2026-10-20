# ILG Academy — The Catalogue (view-only web app)

Static site: no server code, no database, no logins, no downloads.

| File | What it is |
|---|---|
| `index.html` | The whole catalogue (data, photos, logos, HOROLOGY LAB, manuals) |
| `vercel.json` | Security headers (blocks outside scripts, framing, tracking) |
| `manifest.webmanifest` + icons | "Add to Home Screen" name and icon |
| `robots.txt` | Keeps the site out of Google |
| `tools/audit.js` | Data audit: `node tools/audit.js` rewrites `docs/DATA_AUDIT.md` |
| `docs/DATA_AUDIT.md` | Latest audit of missing and conflicting specifications |

## Update the catalogue
Replace `index.html` in GitHub (Add file → Upload files → Commit). Vercel redeploys automatically in about a minute.

## Replace the app icon
Swap `icon-192.png`, `icon-512.png`, `apple-touch-icon.png` (180×180) and `favicon.png` with the official ILG logo, same file names.

## How the product data is organised (inside `index.html`)
- **`CATALOG_DATA`**: every product model and reference (SKU) exactly as supplied. Each model has a `calibre` field naming its calibre, for example `"calibre": "6S20-0AQ"` (a list when a set has two movements).
- **`CALIBRE_DB`** (in the `catalogue-model` script): one record per calibre, holding manufacturer, type, specification, sub-dials, jewels, power reserve, frequency, accuracy, battery and sources. Product pages, cards, comparison, the Calibre index, search and the audit all read it, so **correct a calibre once here and every product updates**.
- **`PRODUCT_NOTES`**: facts that belong to one model only, each with its source (for example the Ducati Desmo case is turned 90°).
- **`TERMS`**: the tap-to-explain technical vocabulary.
- Unknown values are left empty (`null`) and show as “Not specified”. Do not fill them in without a source. PVD, IP, DLC and plating are surface treatments, never case materials.

## Check the data
In the app: **Catalogue → Data audit**. From a terminal: `node tools/audit.js`.
