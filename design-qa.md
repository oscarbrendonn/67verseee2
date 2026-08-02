# 67VERSE Three.js Skate Lobby — Visual and Control QA

## Evidence

- Source visual truth: `/Users/oscarbrendon/Documents/Codex/2026-08-01/e/outputs/67verse-map-concepts/tutorial-map-threejs-style-v3.png`
- Final implementation capture: `/Users/oscarbrendon/Documents/Codex/2026-08-01/e/work/lobby-skate-final.png`
- Left-skate interaction capture: `/Users/oscarbrendon/Documents/Codex/2026-08-01/e/work/lobby-skate-left-test.png`
- Route and state: `/lobby`, initial third-person gameplay plus directional skating.
- Browser viewport: `1280 × 720`.

## Findings and resolved issues

- **Resolved P1 — The avatar walked instead of riding.** Character animation time is now frozen in the idle stance. The whole avatar and board translate and turn together, so the body does not run, bend, or break while skating.
- **Resolved P1 — The avatar had no skateboard.** A native Three.js skateboard was added beneath the feet with a rounded deck, underside, trucks and four separate wheels. Wheel pivots rotate from actual horizontal speed.
- **Resolved P1 — Directional input felt reversed.** Movement is camera-relative and the model heading uses the corrected `-Z` forward convention. Left, right, forward and backward now agree with the viewed direction.
- **Resolved P1 — Diagonal input drifted while the follow camera caught up.** Movement no longer reads the lagging camera transform. It uses the stable orbit yaw directly, so `W+A` stays forward-left instead of sliding backward or sideways.
- **Resolved P1 — Ramps and bowl were visual-only obstacles.** The park now has matching surface-height and surface-normal calculations for both curved ramps and the circular bowl. The skateboard follows those slopes, receives downhill acceleration and keeps upward slope velocity when it leaves a lip.
- **Resolved P2 — The skate park felt too small.** The skate pad, plaza, road frontage, lawns, ramps, rails, landscaping and playable bounds were expanded by roughly 20–25% while keeping the compact Three.js game scale.
- **Resolved P2 — Movement felt like walking.** Input now accelerates into a smooth glide and decelerates with skating inertia. The former roll action is a short skateboard push/boost instead of a body somersault.
- **Resolved P1 — The skate plaza obstacles were mostly visual.** Central Park now has a rideable elevated deck, a five-step stair set, a connected bank ramp, a stair handrail and two functional grind rails. Jumping onto either flat rail snaps the board into a constrained grind and jumping again exits it.
- **Resolved P1 — The rider needed a real acceleration mode.** Holding Shift or the mobile lightning button now accelerates smoothly to a much higher top speed; the first press also supplies a push impulse.
- **Resolved P2 — Buildings and grass parcels overlapped illogically.** Base terrain is now neutral hardscape; grass exists only as defined raised parcels. Storefronts sit on a continuous promenade, side residences sit on separate paved lots, and the buildings were moved clear of the lawn bounds.
- **Resolved P1 — One edge of Central Park was visually empty.** A complete south street, sidewalk, paved foundation and nine-building skyline now close the missing edge. Extra corner buildings extend both side rows, so the park reads as a square city block from every camera direction without exposing blank terrain.
- **Resolved P1 — Corner buildings overlapped the south road.** Both side skylines now stop at `z = 32`, leaving a clear intersection buffer before the road envelope. The south skyline is centered on a symmetric grid and remains fully inside its paved foundation.
- **Resolved P1 — Side buildings still read as irregular objects beside the park.** East and west now have complete streets with lane markings, inner and outer sidewalks, continuous building foundations, equal setbacks and evenly spaced five-building rows. North and south skylines use centered nine-building grids with consistent depth and no stagger into the road.
- **Resolved P2 — Streets lacked believable city activity.** Central Park now has only three deliberately parked compact cars at curb-side positions plus one low-speed car using the north travel lane. Intersections, crossings and every road envelope remain free of buildings.
- **Resolved P2 — Lawn trees looked crowded and irregular.** Duplicate trees were removed. Each large lawn now has one balanced three-tree group, while the two narrow side lawns use matching pairs.
- **Resolved P2 — Vegetation looked overly synthetic.** The existing ground and buildings remain untouched. Central deciduous trees now use irregular multi-lobe canopies with natural color variation, while the coast world swaps its placeholder palms for the user's textured Meshy palm export, optimized from 44 MB to about 1 MB for web play.
- **Resolved P1 — Other worlds leaked into the Central Park map.** Central Park and the four destination districts now live in separate render groups. Only the active world is visible; district geometry appears only after the player selects it from the map and teleports there.
- **Resolved P2 — Every outer map looked the same.** The four open districts now have distinct architecture and daily-life destinations: Gullcrest Coast has palms, sand and boardwalk shops; Hedgemont Heights has detached homes and neighborhood services; Market Mile has towers, a cinema and night club; Brickswich Works has brick warehouses, studios and a brewery.
- **Resolved P2 — District entry lacked believable street placement.** Each destination opens at a sidewalk/street arrival point inside its neighborhood, with traversable road grids, parcels, lamps, benches, trees and shops rather than exposing the district from outside.
- **Resolved P2 — District storefronts were visual shells.** All sixteen venues now have open doorways, lit interiors, floors, counters, shelving and category-colored displays. Wall collisions keep the rider inside the room while leaving the entrance physically traversable.
- **Resolved P2 — Streets felt unoccupied.** Each district now includes animated low-poly pedestrians following sidewalk routes and parked 3D vehicles that inherit the neighborhood palette.
- **Resolved P2 — Venues had no gameplay feedback.** Entering a shop reveals a proximity interaction on keyboard and touch, opens a venue-specific activity card, and records local discovery progress across all sixteen locations.
- **Resolved P2 — Mobile framing and touch controls.** The lobby uses device-width viewport settings, safe-area offsets, a portrait camera composition, a captured directional pad, and separate push/jump buttons. Portrait `390 × 844` and landscape-height rules were checked.
- No actionable P0/P1/P2 findings remain in the requested scope.

## Fidelity surfaces

- Typography: the existing English 67VERSE interface hierarchy is preserved.
- Layout: the larger park keeps the approved storefront, road, bowl, ramp, rail, stair, lawn, tree, bench and light hierarchy.
- Color: the soft blue-gray atmosphere, neutral concrete, muted lawns and warm ramps remain aligned with the selected concept.
- Geometry: the environment and skateboard are rendered from native Three.js meshes rather than a background image or CSS approximation.
- World structure: Central Park remains an independent main lobby. Coast, suburb, downtown and industrial environments load independently and are entered from the map selector rather than existing around the park.
- Copy: the gameplay prompt now reads `WASD TO SKATE`.

## Control verification

- Direction mapping: `left → (-1, 0)`, `right → (1, 0)`, `forward → (0, -1)`, `back → (0, 1)` in the tested initial camera state.
- Camera-relative input uses the stable orbit yaw and its derived forward/right vectors.
- The avatar keeps a fixed idle pose while the board glides, turns and spins its wheels.
- Jump moves the complete rider-and-board assembly vertically; push supplies a short forward boost.
- Curved ramp and bowl normals tilt the deck while the rider pose remains frozen.

## Technical verification

- Browser console errors: `0` after the final reload.
- Visual browser pass: central park, overhead city map, coast, suburb, downtown and industrial district all checked at the playable route.
- `npm run build`: passed.
- Scoped `npx eslint app`: passed with one unrelated existing warning in `/play`.
- Final result: passed.
