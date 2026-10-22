# Ichimai 一枚

An interactive origami catalog. Every model folds step by step in an animation that takes up the top half of the screen, with a searchable, filterable catalog below. *Ichimai* means "one sheet": every model starts from a single piece of paper.

Built with Claude Code (Claude Opus 5.5) in one session, 21–22 Oct 2026. The full prompt history is in [PROMPTS.md](PROMPTS.md), and token usage and estimated cost are in [TOKEN-USAGE.md](TOKEN-USAGE.md).

## Features

- **Animated folds:** each fold hinges the paper along its fold line. Valley folds are drawn as dashed lines and mountain folds as dash-dot lines, with arrows showing which way the paper moves.
- **Step controls:** Previous, Replay step, and Next step buttons; numbered steps with pagination for long models; a loop toggle; and slow motion. Keyboard: `←` `→` change step, `R` replays, `L` loops, `/` jumps to search.
- **Paper sides shown:** step 1 of every model turns the sheet over, so both faces are visible before folding starts. One-sided paper shows color + white; two-sided models show a second color.
- **Catalog filters:** difficulty, paper shape (square, A4, 3:5), paper color (one- or two-sided), and category (animals, nature, objects, multi-component). Search matches names, Japanese names, and keywords.
- **Light and dark themes**, a phone layout, and a "reduced motion" mode that skips the animation for viewers who have it turned on.

## Models

| Difficulty | Models |
| --- | --- |
| Beginner | Dog Face, Cat Face, Tulip, Drinking Cup, Whale, Dart Plane (A4), Letter Envelope (3:5) |
| Intermediate | Penguin, Fortune Teller, Samurai Helmet, Simple Heart |
| Advanced | Crane (20 steps, through the preliminary and bird bases), Sonobe Cube (6 units) |

## Build and run

There are no dependencies beyond Node.js.

```bash
node build.js
open dist/index.html
```

`build.js` inlines the three scripts into a single page and writes two copies:

- `dist/index.html` – standalone page for any static host
- `index.html` – page body only, for publishing as a Claude artifact (the host adds `<head>`)

## Project layout

| Path | Contents |
| --- | --- |
| `src/engine.js` | Fold engine. Paper is a set of flat facets, each with an affine matrix; folds reflect facets across a line, and in-between frames use a partial reflection (a projected 3D hinge). Supports layer selection by tag, region filters, and reverse folds. |
| `src/models.js` | The catalog: each model's metadata and its steps as fold operations in view coordinates. |
| `src/app.js` | Player (timing, camera, guides, controls) and catalog (filters, search, cards). |
| `src/index.src.html` | Markup and styles. Colors and fonts are defined as tokens at the top of the stylesheet. |
| `build.js` | Build script described above. |

## Adding a model

1. Add an entry to `src/models.js` with metadata (`difficulty`, `shape`, `category`, `sides`, `colors`) and a `steps` array.
2. Write each step as fold operations: a fold line, a point on the side that moves, valley or mountain, and optional layer tags.
3. Run `node build.js` and step through the model in the browser to check every fold.

## Known limitations

- **Flat-fold geometry:** steps that are 3D (opening the Drinking Cup, puffing the crane's body) are described in the step text rather than animated.
- **Simplified tucks:** the Sonobe unit's "tuck under the flap" moves are in the text, not the animation.
- **Invented model:** the Letter Envelope is an original design, because no traditional model that starts from a 3:5 sheet was found.
