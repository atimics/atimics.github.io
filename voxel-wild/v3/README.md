# Voxel Wild 3.0 — The Living World Update

Play: https://atimics.github.io/voxel-wild/v3/

Working examples: https://atimics.github.io/voxel-wild/v3/?workshop=1

An original single-player browser voxel sandbox. This release adds shaped crafting, flowing water/lava and a small deterministic automation system to the V2 survival game. It is not full Minecraft parity or a Minecraft-compatible client.

## Start here

Open **Workshop playground** from the menu, then **Enter the Workshop**. Flip the lever near the wire: the lamp lights and a delayed sticky piston moves a block. Walk onto the pressure plate or use the button. The fountain shows falling and spreading water. A preloaded chest/hopper/furnace tower smelts iron and transfers the results into the bottom chest without inventory injection.

For a fresh survival game, select Survival and a different seed. Gather wood, make a workbench and stone pickaxe, mine signal ore, and turn its dust into wire. Use the recipe list to load a pattern, then press the output button to craft. Ingredients can also be arranged manually.

Controls: WASD move; mouse look; Space jump; Shift sprint/sneak-use; hold left click mine; right click use/place; E inventory; Q drop; 1–9 hotbar; R rotate a retracted piston or repeater. Creative mode adds F flight. Touch movement, look, mining, use and inventory are supported. Touch rotation is not implemented.

## New in this release

- Shaped 2×2 hand crafting and 3×3 workbench crafting, translated/mirrored recipes, explicit result pickup and inventory conservation. Forty-four total recipes.
- Scheduled falling/spreading/draining water and lava, source/flow distinction and water/lava reactions.
- Signal ore and dust, wire, levers, timed buttons, pressure plates, lamps and directional delay repeaters.
- Ordinary/sticky pistons, twelve-block push limit, one-block sticky pull, protected machine/storage blocks and collision checks.
- Five-slot hoppers, downward storage transfer, furnace input/fuel routing, output extraction and signal-powered pausing.
- Stone/oak slabs, half-block auto-step, separate V3 local saves and V2 JSON import.

The survival world, tools, mobs, farming and other V2 systems remain available. Original V1 and V2 URLs and local save namespaces are not modified. Sharing a URL shares a seed/mode, not a multiplayer session or your builds. Export important saves; browser storage quotas apply.

## Run and test

In this Git repository, V3 is a hash-pinned delta against the unchanged V2 source. Generate the complete runtime with Node 22 or later:

```sh
node voxel-wild/v3/build.cjs /tmp/voxel-wild-3
node --test /tmp/voxel-wild-3/core.test.cjs /tmp/voxel-wild-3/systems.test.cjs
python -m http.server 8000 --directory /tmp/voxel-wild-3
```

The expanded source ZIP already contains index.html and all six scripts; serve its directory directly. The deployed static site also serves these plain source files. No runtime package install, external assets, telemetry or account is required.

Optional browser checks need Python Playwright, Chromium at /usr/bin/chromium, and Xvfb:

```sh
xvfb-run -a python /tmp/voxel-wild-3/browser-tests.py
xvfb-run -a python /tmp/voxel-wild-3/expansion-browser.py
```

Verified locally: **82 passing core tests (37 inherited + 45 new), 34 inherited browser checks and 29 new browser checks**. Browser tests use actual local-source WebGL rendering, an in-memory Storage fixture, a deterministic clock and staged scenarios. They are not a live-site load test, independent full survival playthrough, physical iPhone certification or large-world performance certification. Pages CI also retains the original redirect and V2 test suites.

Read PARITY.md for the precise behavior contract, bounds and remaining gaps. Original code/procedural materials; MIT-0 repository license. No Mojang assets, protocols or save formats.
