# Lumen

A silhouette platformer for the browser about a little girl with a lantern in a world that has gone dark.
Light is everything: it shows the way, keeps the shades at bay and makes bridges of light solid.
But the oil in the lantern is slowly running out.

**▶ Play online: https://darangonaut.github.io/lumen/**

![Lumen title screen](docs/screenshots/title.png)

## Seven worlds

24 levels in six worlds, each with its own mechanic, plus a bonus seventh world unlocked after the finale.

| World                 | What awaits you                                   |
| --------------------- | ------------------------------------------------- |
| Misty Forest          | bridges of light, the first shades                |
| Flooded Caves         | icy water, crumbling stones, moths                |
| Marshes               | glowing mushrooms that launch you high            |
| Frozen Peaks          | slippery ice and icicles that break off           |
| Forgotten Tower       | moving platforms, chained with timed jumps        |
| Heart of Darkness     | great shades that take three hits, and the finale |
| Stormy Peak _(bonus)_ | wind gusts, shelter behind rocks, lightning       |

|     ![Misty Forest](docs/screenshots/forest.png)      |      ![Flooded Caves](docs/screenshots/caves.png)      |
| :---------------------------------------------------: | :----------------------------------------------------: |
|         Misty Forest — a lamp is a checkpoint         | Flooded Caves — a shade waits at the edge of the light |
|        ![Marshes](docs/screenshots/swamp.png)         |       ![Frozen Peaks](docs/screenshots/ice.png)        |
|   Marshes — reeds, dead trees and will-o'-the-wisps   |     Frozen Peaks — icicles hang over slippery ice      |
|    ![Forgotten Tower](docs/screenshots/tower.png)     |    ![Heart of Darkness](docs/screenshots/abyss.png)    |
| Forgotten Tower — arches, chains and moving platforms |     Heart of Darkness — the last and darkest world     |
|      ![Stormy Peak](docs/screenshots/storm.png)       |   ![Flaring the lantern](docs/screenshots/flare.png)   |
|        Stormy Peak — rain, gusts and lightning        |       Flaring the lantern burns the shades away        |

## How to play

- **Oil** in your lantern slowly burns away. **Fireflies** refill it. When it runs out, the darkness takes you.
- **Bridges of light** only exist in the light. Where your lantern doesn't reach, you can't step.
- **Flaring** the lantern makes the light bigger, reveals distant platforms and burns shades — but it uses a lot of oil.
- **Shades** circle at the edge of the light and wait for you to falter. Their touch steals oil.
  Defeat them by **jumping on their heads**, throwing a **spark** (costs a little oil) or flaring the lantern.
- **Moths** chase the light and drink oil from your lantern.
- **Lamps** on posts are checkpoints and refill your oil. Next to a lit lamp you are safe from shades.
- Light the **campfire** at the end of every level. Those who look around will find hidden **crystals**.
- On Stormy Peak the **wind** blows in gusts: it pushes you in mid-air, but it can't move you while you stand still.
  Wait behind a rock, and jump when the wind dies down.

## Controls

| Action                     | Keyboard      | Touch |
| -------------------------- | ------------- | ----- |
| Walk                       | ← → / A D     | ◀ ▶   |
| Jump (hold to jump higher) | Space / ↑ / W | ⤒     |
| Drop through a ledge       | ↓ / S         |       |
| Throw a spark              | C / F         | ✸     |
| Flare the lantern          | Shift / X     | ✦     |
| Pause                      | Esc / P       | ❚❚    |

The game is available in **English**, **Slovak** and **Czech**, and works on phones held sideways.

<p align="center"><img src="docs/screenshots/mobile.png" alt="Lumen on a phone with touch controls" width="640"></p>

## Development

Built with TypeScript, Vite and PixiJS 8. All graphics are vector silhouettes drawn in code
(`src/render/vector.ts`): a black foreground against a glowing sky, where only light has colour.
Sound is synthesized with the Web Audio API — the game has no image or audio files.

- `src/game/` — pure game logic in TypeScript, with no PixiJS or DOM (enforced by ESLint).
- `src/game/levels.ts` — levels as ASCII maps; the legend is in `src/game/level.ts`.
- `src/render/` — rendering: terrain, darkness with light cut-outs, parallax backgrounds, particles.
- `src/ui/` — title scene and translations (`i18n.ts`).
- `tests/` — logic tests and a bot that plays every level to prove it can be completed.

```bash
npm install
npm run dev          # development server
npm test             # logic tests and level completion bot
npm run deploy:pages # deploy to GitHub Pages
```

Debugging: `?debug&level=N` starts directly at level N (1–28).
