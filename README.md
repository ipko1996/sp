# Zóna Étterem — heti ajánlat

One HTML file that **is** the poster. You open it, click the text on the poster and type; there
is no form and no server. Two buttons: print to A4, and save a PNG.

This is the small version of [`postrr`](../postrr), which renders the same poster through a
Handlebars template, an RJSF form and a Hono API. The design is not re-invented here —
`src/features/poster/poster.css` is that project's `templates/zona/public/styles.css`, unchanged,
and the React port renders **pixel-identical** to it — 0 differing pixels out of 4,257,152 at 2×,
once the date line is held equal. The shipped line differs by one deliberate character: its
spacing is normalised to `2026. 08. 31. – 09. 04.`, so the week controls do not silently reformat
it on first use. That is the only intentional difference from the reference (0.11% of pixels).

## Running it

```bash
pnpm install
pnpm dev        # http://localhost:5173
pnpm build      # -> dist/index.html, one self-contained file (~470KB)
pnpm verify     # drives the built file over file:// in Chrome and Firefox
```

`pnpm typecheck`, `pnpm lint` and `pnpm format` work as usual. `pnpm assets` regenerates the
inlined fonts and placeholder photos; `dev` and `build` run it for you.

## Using it

Double-click `dist/index.html`. Everything visible on the poster is editable — brand, address,
badge, side prices, dates, dish names, prices, the footer lines. Edits save to `localStorage` as
you go; **Alaphelyzet** (twice) throws them away and restores the shipped week.

- **Új hét** — clears the board for next week: the date line moves to the week after this one,
  every day reopens and the dish names empty out. **The prices are kept on purpose** — they track
  the kind of dish rather than the dish itself (1700 for a főzelék, 2000 for a main, 1400 for a
  tészta) and are the same most weeks, so clearing them would mean retyping eighteen numbers to
  get back where you started. Takes two clicks, like Alaphelyzet.
- **Ártípusok** — the panel to the left of the poster holds the prices that recur week to week
  (Főzelék 1700, Főétel 2000, Tészta 1400). Add, rename, reprice or remove them freely; the list
  is saved with everything else. Hover any price on the poster and the list appears as a row of
  pills — click one and it writes that price in. The MENÜ price sits below a rule because every
  day has a MENÜ row, so it cannot be removed; the MENÜ row's own picker offers just that one.
  The panel and the pills are editor furniture and never reach a print or a PNG.
- **Rows** — hover a day for `+` and `×` in the right-hand margin. A day holds 2 to 5 dishes and
  the buttons disable at both ends, because the page height depends on it. The MENÜ row is
  separate and does not count towards either bound.
- **A hét** — hover the header for `‹ Előző`, `Most` and `Következő ›` under the date line. They
  step the week by seven days rather than making you retype five date parts; `Most` jumps to the
  current week. The written form is `YYYY. MM. DD. – MM. DD.`, with the year repeated only when
  a week straddles a new one. The line stays freely editable either way.
- **Zárva** — the toggle under each day label. The dishes are kept while a day is shut, so
  turning it back off restores the week exactly as it was.
- **Ünnepnapok** — when a weekday of the written week falls on a Hungarian public holiday, that
  day's toggle turns rust and reads `Ünnep · Zárva?`, without waiting for a hover. Clicking it
  closes the day and fills the reason in the poster's own wording — `ÁLLAMI ÜNNEP · AUGUSZTUS 20.`
  It suggests; it never closes a day on its own. It will replace wording it wrote itself when you
  move to another week, but never a reason you typed yourself. See below for what it does not
  know.
- **Photos** — click a slot, pick an image, then **copy that file into an `images/` folder next
  to the HTML**. Only the path is stored, so the poster picks it up again next time.
- **Nyomtatás** — one A4 page, edge to edge. Pick "Background graphics" if your browser asks.
  The poster is a 1.50 proportion and A4 is 1.41, so filling the sheet costs a 6.15% horizontal
  stretch — see below. The PNG is unaffected.
- **PNG mentése** — 1684×2528 (2× the poster's 842×1264).
- **Ablakhoz / Teljes méret** — screen zoom only, and shown only when the window is narrower
  than the poster's 842px. In a wider window the two are the same thing, so they are hidden.

## Why it is built the way it is

The target is `file://` — double-clicked, in Chrome and Firefox. That is a far more hostile
origin than a dev server, and it decided most of the architecture. Measured, not assumed:

|                                    | Chrome  | Firefox |
| ---------------------------------- | ------- | ------- |
| `localStorage`, survives reload    | yes     | yes     |
| relative `<img>` beside the HTML   | yes     | yes     |
| `fetch()` of a neighbouring file   | **no**  | yes     |
| canvas tainted by a relative image | **yes** | no      |
| `<script type="module">`           | **no**  | **no**  |

Consequences:

- **The bundle is a classic IIFE, injected at the end of `<body>`.** Module scripts do not load
  over `file://` in either browser. Dropping `type="module"` also drops its implicit defer, and
  inline scripts ignore `defer`, so Vite's usual `<head>` placement would run before `#root`
  exists. `vite.config.ts` handles both.
- **Every default asset is a `data:` URI.** `fetch()` is blocked, so `scripts/inline-assets.ts`
  bakes the four woff2 faces and both placeholder photos into source as base64 rather than
  leaving Vite to decide what is small enough to inline. This is also why there is no CDN: a
  cross-origin image would taint the export canvas.
- **Photo slots keep a downscaled copy alongside the path.** Chrome taints the canvas for
  anything loaded off `file://`, so the exporter can never read `images/leves.jpg` itself — it
  only ever gets the bytes while the file picker still holds them. The path stays the source of
  truth and is what renders; the cache is a slot-sized JPEG (~60–100KB) used only during export.
  Without it, "PNG mentése" would work exactly once per photo, in the session you picked it.

### Printing to A4

The poster is 842×1264px, a 1.50 proportion, where A4 is 1.41. It cannot be undistorted,
uncropped and full-bleed at the same time — only two of the three.

Cropping is the worst of them: filling the width leaves 69px of height over, and neither end is
expendable — taking it off the top cuts the logo, off the bottom halves the Facebook bar. So the
page is filled by scaling the axes separately, 0.94264 across and 0.88805 down. Everything comes
out 6.15% wider relative to its height, which makes the badge and the logo ring ellipses rather
than circles, by about 10px in 176.

That is the price of the ticket and the photos actually reaching the paper's edge, the way the
design draws them. Printing uniformly instead leaves about 6mm of paper down each side and those
bleeding elements stop short of it. To switch back, `print.css` says exactly what to change.

**Only printing is affected.** The PNG export captures the poster from the screen, undistorted at
842×1264.

### Public holidays

`src/lib/holidays.ts` computes them rather than shipping a table. The fixed dates are a list, and
the four moveable ones — Nagypéntek, Húsvéthétfő, Pünkösdhétfő — all hang off Easter, which is
exact arithmetic (Anonymous Gregorian). So there is no data file and nothing to update each year,
which matters for something handed over as one file and then left alone.

It **suggests** rather than closing the day itself, because whether to open on a holiday is a
business decision, not a calendar fact — plenty of restaurants open on a big one. The failure
mode is also asymmetric: a wrong auto-close prints a poster saying ZÁRVA for a day the kitchen is
actually working, and nobody re-reads a field they did not fill in.

**Not covered: `munkanap-áthelyezés`** — the swapped working days that bridge a holiday to the
weekend. Those are set by decree each year and cannot be derived from anything, so they would
need a hand-maintained table per year and would cost the zero-maintenance property above. The
algorithm catches Aug 20 but not a Friday bridged next to it; that costs one click on a toggle
that already exists.

Two more things worth knowing before editing the code:

- **`EditableText` is uncontrolled on purpose.** React writes the text in once and never touches
  the node while it has focus. Feeding `value` back as children on each keystroke would rebuild
  the text node under the caret and send it to position 0 — the usual reason contentEditable
  feels broken. Nothing reaches state until blur, so typing costs no renders.
- **Edit chrome is hidden by CSS, never unmounted.** `data-mode` on the poster root switches it
  off synchronously; a React re-render would race the screenshot. That is why every control is
  absolutely positioned — anything in normal flow would shift the layout when hidden, and the
  page is tuned to the pixel. `print.css` is imported last in `main.tsx` for the same reason:
  it overrides the stylesheets above it and loses the cascade anywhere earlier.

## Layout

```
src/
  features/poster/    the poster: one component per Handlebars partial, plus poster.css
                      (verbatim), editing.css (chrome) and print.css (A4)
  features/menu/      state, actions, guarded localStorage, the dish-type panel
  features/export/    print and PNG
  components/         editable-text, editable-price, price-picker, photo-slot, toolbar
  lib/                formatting, text fitting, downscaling, generated assets
  types/menu.ts       the data shape, matching postrr's templates/zona/data/menu.json
```

`scripts/verify.ts` is the real test: it drives the **built** file over `file://` in both
engines and checks geometry, typing, persistence, the 2–5 cap, closed days, the photo round
trip, that no edit control survives an export, the PNG's dimensions, and that printing produces
exactly one A4 page. The dev server is a friendlier environment than the target, so passing
there proves less.
