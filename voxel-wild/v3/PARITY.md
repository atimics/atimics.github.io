# Voxel Wild 3.0 — behavior contract and remaining gaps

**Status: original single-player survival sandbox plus a bounded simulation/automation expansion. Not full Minecraft feature parity.** No percentage is reported because no edition/version-wide acceptance denominator exists. The existing V2 baseline remains in `../v2/PARITY.md`.

## Implemented contract

| System | Exact release behavior | Reproducible coverage |
|---|---|---|
| Crafting | 2×2 hand or 3×3 placed-workbench grid; bounding-box translation and horizontal mirror matching, not rotation. Recipe buttons fill the grid rather than grant output. Output requires available bag space. Pending grid items return to the bag or drops on close/load/death. | All 44 pattern/cost definitions; selected matching and station gates; extra/wrong items; full output bag; atomic fill/result; DOM recipe→grid→output; save/death conservation. |
| Fluid updates | 100 ms simulation ticks, at most 256 queued cell updates per tick. Water falls before lateral propagation, reaching level seven; lava reaches three and is serviced every third tick. Removing a source drains unsupported flow. Offscreen work remains queued. Flowing fluids render variable top heights and sides. | Downward/lateral propagation, seven/three-level limits, falling-column behavior, source removal, negative coordinates, unload/reload, bounded queue, stable basin plus 1,000 extra ticks, render/physics checks. |
| Reactions | Water touching a lava source yields obsidian; contact with flowing lava yields cobblestone. Only source blocks can be collected in a bucket. | Lava-source reaction fixture; flowing water swimming/air supply. Flow reaction and bucket behavior are implemented but not separately covered by the new automated suite. |
| Signals | Lever/button/plate sources output strength 15. Each successive wire loses one. Six-neighbor graph propagation with no unpowered self-latching loop. Lamps emit local light while powered. | Attenuation, disconnected loops, multiple sources, toggle, plate/button timing, actual Workshop lamp. |
| Repeater | Four horizontal orientations; power accepted from the rear and emitted forward. Adjustable delay of 1–4 simulation ticks, with pending transitions persisted. R rotates; Use changes delay. | Direction, delay, off transition and mid-transition save/load. |
| Pistons | Four horizontal directions. Push up to 12 ordinary solid blocks; sticky retract pulls one. Refuse protected blocks, storage/machines, fluids, world-bound violations or actor intersections. Extended pistons cannot rotate. Breaking a head breaks its owning base and clears the head. | Push counts/limit, blocked operations stay atomic, sticky pull, body collision, protected storage, state reload, rotation handler. |
| Hoppers | Five slots, vertical output only, serviced each fourth simulation tick. Can send one item below and pull one above during that tick. Furnaces accept smeltables as input and fuel as fuel; extraction only from output. Powered hoppers pause. | Full destinations, conservation, fuel/input routing, output extraction, powered pause, five-slot UI/split/overflow, autonomous Workshop smelting. |
| Building | Stone/oak half-height slabs; appropriate half-height collision; auto-step up to 0.6 blocks, subject to head clearance. Wire/repeater/lever/plate/button/hopper meshes and icons. | Full-block non-step, slab traversal, head clearance, WebGL render and mobile layout. |
| Saves | Separate V3 seed/mode namespace. Import of V2 JSON copies the state into V3 without changing V2 storage. Logic, flow metadata, queue and pending repeater state persist. Failed semantic imports roll back. | Round-trip and malformed-state fixtures, source-key preservation, durability, crafting grid and station inventory conservation. |
| Workshop | A separate persistent creative seed with a circuit, button/plate lamps, sticky piston, finite waterfall basin, workbench and chest→hopper→furnace→hopper→chest chain. | Actual UI entry/toggle, game ticks, flow and output generation, screenshot. |

## Resource bounds and deliberate simplifications

World height remains 64 blocks; horizontal movement is bounded around ±1,000,000. At most 4,096 registered circuit machines and 65,536 queued update cells/flow records are accepted by extension-state validation. Simulation is active near the player, with a maximum four catch-up ticks per game frame. Queue saturation is bounded, not a guarantee that arbitrary huge simultaneous edits retain every update. Generation and meshing remain synchronous; no worker system or transactional IndexedDB migration is claimed.

The signal model is original and intentionally smaller than redstone. There are no comparators, signal torches, quasi-connectivity, observers, exact Java/Bedrock update-order guarantees, piston entity pushing, directional hopper routing, minecart hoppers or item-entity collection. Touch controls do not yet expose machine rotation. Blocks moved by a piston use conservative full-cell safety tests. Doors are not signal-controlled.

Fluids are not Minecraft timing/shape compatible. There is no general fluid item-transport/washout system, waterlogging or claimed infinite-source parity. Existing procedural pools remain sources. The solver does not imply a full ecosystem block-update implementation. Torch lighting remains a local approximation rather than a propagated light graph.

The 44-recipe catalog, ores, equipment and mob AI are still simplified. There is no multiplayer backend, additional dimensions/portals/bosses, villages/trading, enchanting, brewing, animal breeding/taming, boats/minecarts, weather, complete content registry, mod API, Minecraft network protocol or Minecraft save-format support.

## Verification and release process

- **82 Node tests**: 37 previous core tests plus 45 new system tests.
- **63 local browser checks**: 34 previous checks plus 29 expansion checks. No unhandled JavaScript or WebGL errors observed in those scenarios.
- Desktop viewport 1280×720, touch viewport 390×844. Exact-source Chromium with SwiftShader, deterministic simulation ticks, in-memory Storage and staged resources; not live-site browser access or physical-device certification.
- `build.cjs` checks SHA-256 of seven pinned V2 inputs before applying code-point-indexed source deltas, then checks all seven expected output hashes before writing. Six runtime scripts load locally from the generated static site; no dynamically fetched dependencies.
- Pages CI retains the existing redirect checks and V2 core tests, then builds V3 and runs its 82 Node tests before publication.
- Original V1/V2 source files and saves remain unchanged. Important worlds should be exported before import; local browser quota and the existing 8 MB import limit still apply.

## Next slices

Worker-based generation/meshing and measured memory budgets; durable transactional persistence; propagated lighting; expanded actor navigation/combat; structures/villages; additional dimensions with tested travel; authoritative multiplayer and server-side inventory ownership. Each needs its own behavior contract and fixtures rather than a blanket parity claim.
