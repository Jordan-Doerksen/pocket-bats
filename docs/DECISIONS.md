# DECISIONS.md — Pocket Bats

Owner: Jordan Doerksen. Date: 2026-08-04.
This file governs the project. Do not change a locked decision quietly. To supersede a locked
decision, write a Change Request and record it in the Change Log.

## Core Goal

One phone-first page that makes a reader like bats, through short true facts and small cute games.

## Non-Negotiable Constraints

These constraints come from the Award-Winning Web UI/UX Style Bible
(`C:\projects\award-winning-web-ui-ux-style-bible`), which is LAW for this page.

- One dominant idea per viewport. The centre is a stage.
- Maximum 3 persistent clusters. This site uses 1: the identity wordmark.
- Motion must orient, explain causality, confirm input, or express character. No ambient loops.
  Complete `prefers-reduced-motion` states.
- Essential content survives JavaScript failure and canvas failure. Every fact lives in semantic
  HTML. The games are enhancements.
- Responsive = re-authoring priority. The page is designed at 375px first. Desktop is the
  adaptation. No horizontal scroll at 375px.
- Accessibility: keyboard-complete (this includes the game), visible focus, text contrast ≥ 4.5:1.
- Every stated bat fact must be true and conservative. Show nothing rather than something false.
- All tunables live in `js/config.js` (config separate from logic). File-split rule: review a file
  at 300 lines, split it by 500 lines.

## Decisions

All decisions are locked 2026-08-04 by owner interview (five questions).

### D1 — Subject
Bats. This is a gift project for a friend.
**Change Rule:** owner only.

### D2 — Dominant idea
"Bats are wonderful — here is why, in your pocket." The page is an interactive explainer. The page
carries NO personal dedication.
**Change Rule:** owner only.

### D3 — Games
Three cute mini-games. Each game teaches one true bat fact.
- Echo ping (echolocation) ships in V1.
- Roost & rest (roosting) is a later chunk.
- Moth chase (insect appetite) is a later chunk.
- Pollinator run was rejected. Its fact survives as page copy.
**Change Rule:** a Change Request is required to add or remove a game.

### D4 — Look
"Night-sky cozy" — deep midnight indigo, warm moon-gold accent, soft teal sonar accent, static
stars, and a round friendly inline-SVG bat. One token file, `styles/night.tokens.css`, owns every
colour value and every type value.
**Change Rule:** token file edits are free. A new direction needs owner approval.

### D5 — Hosting
A standalone repo, `pocket-bats`, with its own GitHub Pages ON. This is a recorded exception to
the per-repo-Pages-off rule in AI-Brain (owner approved 2026-08-04). The site is not listed in the
portfolio registry. URL: `jordan-doerksen.github.io/pocket-bats/`.
**Change Rule:** owner only.

### D6 — Generation contract
Record this JSON verbatim.

```json
{ "site_type": "interactive_explainer", "dominant_idea": "Bats are wonderful — here is why, in your pocket.", "primary_patterns": ["interactive_explainer", "editorial_rhythm", "motion_choreography"], "narrative_sequence": ["promise (night sky, one bat)", "reframe (not blind, not scary, only flying mammal)", "play (Echo ping: see with sound)", "facts in rhythm (appetite, roosting, pollination)", "what is next (two more games, honest note)", "resolution (colophon)"], "persistent_clusters": ["identity_wordmark"], "card_policy": "No cards in V1. When all three games exist, the game rack may use cards because the games are true peers.", "responsive_transformations": ["authored at 375px; desktop widens measure and letterboxes the game canvas"], "reduced_motion_equivalent": "Static stars stay static; sonar ripple becomes a fast fade highlight; reveals render in place with no transform" }
```

**Change Rule:** a Change Request is required.

### D7 — Voice
Page copy uses the dry deadpan project-page voice (understatement, no exclamation marks). The docs
use STE.
**Change Rule:** owner only.

## Build Timeline

- **Chunk 1 (V1, now):** page + tokens + Echo ping. Local mockup gate. Owner approval.
- **Chunk 2:** Roost & rest.
- **Chunk 3:** Moth chase + the game rack.
- **Chunk 4:** Pages ON + send the link.

## Open Questions

- Confirm the final repo name before the GitHub push.
- Decide if a share/OG image is wanted.

## Change Log

- 2026-08-04 — Repo created. D1–D7 locked by owner interview.
- 2026-08-04 — V1 approved by owner. Desktop fact-column overlap fixed. Display type moved to an editorial serif. GitHub repo created, Pages ON, live at https://jordan-doerksen.github.io/pocket-bats/ (D5 executed).
- 2026-08-04 — OG/share image added (design/og.html rendered to og.png by headless Chrome). Open question closed.
- 2026-08-04 — Chunk 2 shipped: Roost & rest (drag to roost before sunrise, keyboard-complete). Coming index down to Moth chase.
- 2026-08-04 — Field notes added before each game (four notes per game, definition list, no cards). Owner asked for more real information ahead of play.
