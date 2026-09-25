# ILG Academy — The Catalogue (view-only web app)

Static site: no server code, no database, no logins, no downloads.

| File | What it is |
|---|---|
| `index.html` | The whole catalogue (data, photos, logos, HOROLOGY LAB, manuals) |
| `vercel.json` | Security headers (blocks outside scripts, framing, tracking) |
| `manifest.webmanifest` + icons | "Add to Home Screen" name and icon |
| `robots.txt` | Keeps the site out of Google |

## Update the catalogue
Replace `index.html` in GitHub (Add file → Upload files → Commit). Vercel redeploys automatically in about a minute.

## Replace the app icon
Swap `icon-192.png`, `icon-512.png`, `apple-touch-icon.png` (180×180) and `favicon.png` with the official ILG logo, same file names.
