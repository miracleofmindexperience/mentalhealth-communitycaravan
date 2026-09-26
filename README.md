# Caravan Flyer Maker

A small web page for the **World Mental Health Day Community Caravan** (Miracle of Mind). Volunteers fill in their city's caravan details, and the page builds a shareable flyer image (with RSVP QR code) plus a matching WhatsApp message.

Plain HTML/CSS/JS. No framework, no build step.

## Run it locally

The page uses JavaScript modules, so it has to be served. Opening `index.html` directly from disk won't work.

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Publish (GitHub Pages)

Settings → Pages → Deploy from branch → `main` / root. The `.nojekyll` file makes Pages serve the files as they are.

## Where to change things

| I want to change… | Edit |
|---|---|
| Any text on the flyer (badge, title, tagline, caravan description, safety line, RSVP labels…) | `js/config.js` → `FLYER_TEXT` |
| "Route instructions will be shared…" choices | `js/config.js` → `ROUTE_INFO` |
| Route types (Start → finish / Loop) and the default for new locations | `js/config.js` → `ROUTE_TYPES`, `NEW_LOCATION_TYPE` |
| The WhatsApp message wording | `js/config.js` → `MESSAGE_TEXT` |
| Flyer colors | `js/config.js` → `COLORS` |
| The Miracle of Mind link / logo | `js/config.js` → `MOM_URL`, `LOGO_SRC` (`assets/mom-logo.png`) |
| Max number of locations | `js/config.js` → `MAX_LOCATIONS` |
| Add a city's example (date, time, spots) | `js/config.js` → `PRESETS`, then share `?preset=<key>` |
| Page look (form, buttons, dark mode) | `css/styles.css` |
| Form fields / page text | `index.html` |
| Flyer layout or artwork | `js/flyer.js` (one function per section) |

### Adding a city preset

Add an entry to `PRESETS` in `js/config.js`:

```js
bayarea: {
  label: "Bay Area",
  data: {
    date: "Sat, Oct 10", time: "10 – 11 AM", note: "", area: "the Bay Area", rsvp: "https://forms.gle/…",
    routeInfo: "meetup",
    locs: [
      { city: "San Jose", spot: "…", type: "oneway", end: "…" },  // end: "" = shared with route instructions
      { city: "Fremont", spot: "…", type: "loop" }
    ]
  }
}
```

Then send volunteers `https://<your-site>/?preset=bayarea`. That link always starts from the preset. Without `?preset=`, the page resumes the visitor's last draft (saved in their browser) or falls back to `DEFAULT_PRESET`.

## Project layout

```
index.html          page markup
css/styles.css      page styles (light + dark)
js/config.js        all editable content, colors, presets
js/state.js         draft save/load, presets, validation
js/message.js       builds the WhatsApp message
js/flyer.js         draws the flyer on a canvas, section by section
js/lib/canvas.js    generic canvas helpers (rounded rects, text fitting, QR)
js/app.js           connects the form, preview and buttons
vendor/qrcode.js    qrcode-generator 1.4.4 (MIT, Kazuhiko Arase)
assets/mom-logo.png Miracle of Mind logo
```
