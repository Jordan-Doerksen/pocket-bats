# ARCHITECTURE.md — Pocket Bats

One-page map. Open only the file that owns the work. One responsibility per file.

## Files

| File | Responsibility |
|---|---|
| `index.html` | Semantic content. All facts are readable with JS off. |
| `styles/night.tokens.css` | Every colour token and every type token. The only place a colour may be defined. |
| `styles/site.css` | Composition only. It consumes the tokens. |
| `js/config.js` | All game tunables and all motion tunables. |
| `js/echo-ping.js` | The Echo ping game. Canvas. Touch and keyboard. |
| `js/site.js` | Small: reduced-motion wiring and progressive-enhancement flags. |
| `design/` | Mockups and approval artifacts. |
| `docs/` | This document set. |

## Data flow

- The HTML is the source of truth for the content.
- The JS only enhances. It never carries an essential fact.
- The game code reads `js/config.js`. No code writes to `js/config.js`.
