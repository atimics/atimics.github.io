# Voxel Wild 2.0 — implementation and parity ledger

**Release status:** playable single-player survival foundation, not full Minecraft feature parity.

This is original code and original procedural graphics/audio. It does not use Mojang code, textures, music, characters, account services or network protocols. It is not a Minecraft-compatible client or save editor.

## Implemented and exercised

| System | Voxel Wild 2.0 implementation |
|---|---|
| World | Seeded 16×16×64 chunks, streamed and evicted around the player; edited chunks regenerate with their changes; negative coordinates work. Horizontal movement limited to approximately ±1,000,000 blocks. |
| Terrain | Forest, meadow, coast, desert and alpine classifications; trees, cactus, grass, flowers, snow, sand, clay, cave cavities and surface ravines. No authored structures. |
| Resources | 35 registered block types and 73 total block/item definitions; coal, iron, gold and diamond deposits; obsidian from water/lava source contact. |
| Mining | Hold-to-mine hardness; pickaxe tier gates; faster appropriate tools; individual tool durability; actual drops and pickup; bedrock protection. |
| Inventory | 36 slots including a nine-slot hotbar, stack limits, splitting, swapping, item dropping; 27-slot chests and shift-transfer. |
| Crafting | 32 data-driven recipes; hand recipes and placed-workbench gating; atomic ingredient consumption and output-capacity checks. Recipe-list interface, not a shaped crafting grid. |
| Progression | Wood, stone, iron and diamond pickaxes, axes, shovels, swords and hoes. Gold is smeltable but no gold tool tier. |
| Furnace | Separate input/fuel/output, six-second smelts, fuel accounting, blocked-output handling and saved progress. Furnace simulation continues while its panel is open. |
| Survival | Health, hunger, food, regeneration, air supply, drowning, fall/lava damage, one iron armor item, death drops, respawn, bed spawn and night skip when hostiles are absent. |
| Mobs | Pigs, sheep and original box-rig night wanderers; wandering, pursuit, basic melee, drops, cooldowns and daylight burning. Simple obstacle stepping, not pathfinding parity. |
| Farming | Hoe earth, plant seeds, irrigation within four blocks, wheat growth, bread, sapling growth. Growth runs near the player. |
| Building | Placement collision checks, doors that open, glass, beds, workbenches, furnaces, chests, local torch lights and event-driven falling sand. |
| Creative | All-items catalog, free placement, rapid breaking, damage immunity and toggled flight. |
| Presentation | Native WebGL, procedural pixel materials, fog, sun/moon/cloud geometry, a twelve-minute day cycle and synthesized interaction sounds. |
| Persistence | Versioned, seed- and mode-scoped local saves; world/inventory/station export/import; input validation; v1 storage and URL untouched. |
| Input | Keyboard/mouse, pointer-lock fallback, touch movement/look/mining/use/inventory. |

## Deliberate simplifications and known limits

- Single player only. Sharing a URL shares the terrain seed and mode. Export/import shares a saved world; it is not concurrent multiplayer.
- No claim of feature, content, timing, physics, behavior or bug compatibility with any Minecraft Java or Bedrock version. Choose a specific edition/version before writing parity acceptance fixtures.
- Terrain generation is original and not Minecraft seed-compatible. The vertical world is only 64 blocks. Cave lighting is an approximation of surface exposure plus up to eight nearby light sources; there is no propagated skylight/block-light graph or occlusion-aware torch shadowing.
- Water/lava are placed source blocks, not a flowing fluid solver. Source contact can form obsidian. Falling sand is event-driven around edits, not a general block-update scheduler. There is no gravel, leaf decay or complete support-dependent block logic.
- Crafting recipes and furnace processing are simplified. No shaped 2×2/3×3 grids, recipe unlocking, complete block-state registry, exact item catalog or complete combat/equipment system.
- No dimensions, portals, bosses, villages, trading, redstone, enchanting, brewing, animal breeding/taming, boats, minecarts, maps, fishing, weather, advanced structures, multiplayer, accounts, skins, mods or Minecraft save/protocol compatibility.
- Mob AI is intentionally basic. No navigation mesh/A*, line-of-sight pursuit policy, sophisticated swim/climb behavior or exact spawn ecology.
- Browser storage quotas apply. Export important worlds. Imported files are limited to 8 MB. Source data is validated, but importing a save is not a network security boundary or an anti-cheat system.
- Mobile checks use a Chromium touch viewport, not a physical iPhone/Safari certification. Large builds and long sessions need further hardware profiling.

## Next implementation slices toward parity

### P0 — formal contract and engine foundations

1. Pin a target edition/version and an explicit feature manifest. Every item needs a status, reproducible fixture and comparison tolerance; never report a percentage without a defined denominator.
2. Replace transient synchronous generation with worker jobs, cancellable meshing and a measured memory budget. Migrate saves to IndexedDB with transactional snapshots and recovery.
3. Build block-state/shape registries, neighbor-update queues, per-face/voxel lighting and fluid propagation. Include negative-coordinate, unload/reload and deterministic replay fixtures.
4. Add shaped crafting, precise recipe and loot registries, complete equipment slots and controlled resource conservation tests.

### P1 — richer survival and world content

5. Expand hostile/passive mob ecology, obstacle-aware navigation, projectiles, armor, shields, breeding, taming and drops.
6. Add authored/generated structures, villages, trading and exploration rewards. Extend vertical terrain and biome transitions.
7. Build additional dimensions and portal travel with inventories, spawn points and chunk persistence tested across transitions.
8. Add enchantments, experience spending, brewing, effects and progression encounters.

### P2 — simulation and shared worlds

9. Implement redstone-like signal graphs, scheduled ticks, repeaters/comparators, pistons and storage automation against the pinned behavior contract.
10. Add authoritative multiplayer: server-owned inventory/crafting/combat, snapshot/delta protocol, interest management, reconnect, reconciliation and concurrent edit tests. Static hosting alone is not a multiplayer backend.
11. Add transport, weather, maps, advanced construction shapes and remaining registry content.
12. Run compatibility/soak/performance suites, physical-mobile tests, accessibility and release regression gates.

## Verification for this release

- `node --test core.test.cjs`: **37 passing tests**.
- `xvfb-run -a python browser-tests.py`: **34 passing browser checks**, no unhandled JavaScript errors and no WebGL errors. Uses Playwright, Chromium and software rendering.
- Browser checks load the exact source files into a local document. They use a test Storage fixture and a deterministic simulation clock; some world positions/resources are deliberately staged to test mechanics. This is not a live-site load test or an unassisted playthrough.
- Desktop layout: 1280×720. Touch layout: 390×844.
- The Pages workflow also retains the existing redirect regression tests.
