# Voxel Wild 2 — The Survival Update

A dependency-free, original browser voxel survival sandbox. Static files; no build step, login, remote asset dependency or backend.

Open `index.html` in a WebGL-capable browser, or serve the directory:

```sh
python3 -m http.server 8080
```

## First day

Hold left click (touch: Mine) on an oak log. Press E / Bag to turn logs into planks, then make sticks and a workbench. Put the workbench on your hotbar, place it with right click / Use, and Use the placed block to craft a wooden pickaxe. Mine stone, make a stone pickaxe and furnace, find coal and iron, then smelt the raw iron with fuel.

Leaves may drop apples. Animals drop meat; sheep also drop wool. Cook meat, craft torches and a bed, and build shelter before night. Use a hoe on earth to farm, then plant seeds near water. Creative mode provides an all-items catalog and flight.

WASD: move. Space: jump/swim up. Shift: sprint. Hold left click: mine/attack. Right click: use/place/eat. E: inventory. 1–9 or scroll: hotbar. Q: drop one item, or descend in creative flight. F: toggle creative flight. Escape: menu. Inventory uses click-to-carry, right-click splitting and shift-click chest transfers.

Saves are local and isolated from Voxel Wild v1. Export worlds to keep backups or share builds. Sharing a seed URL does not share saved builds or create multiplayer.

## Code

- `core.js`: registries, recipes, inventory, furnace, terrain, chunk persistence and raycasts.
- `render.js`: chunk meshing, procedural materials, lighting and entity geometry.
- `game.js`: fixed-step simulation, survival, entities, interaction and snapshots.
- `ui.js`: menus, inventory, crafting, input and import/export.

## Tests

```sh
node --test core.test.cjs
# Browser suite requires Python Playwright, Chromium, and on headless Linux Xvfb:
xvfb-run -a python browser-tests.py
```

See `PARITY.md` for precise implementation status, limitations and the remaining parity backlog. This release is a survival foundation, not full Minecraft parity. Original MIT-0 code, graphics and synthesized audio; not affiliated with Mojang or Microsoft.
