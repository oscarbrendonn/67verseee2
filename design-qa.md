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
- **Resolved P1 — Road layers overlapped at intersections.** Central Park side streets now terminate exactly at the north and south road envelopes, while every district uses one uninterrupted intersection surface with split approach roads and split sidewalks. Lane dashes stop before crossings; pedestrian stripes and stop bars occupy dedicated approach zones without stacked asphalt or pavement meshes.
- **Resolved P2 — Cars looked like simple boxes.** Every parked and moving vehicle now uses a fully modeled compact-car silhouette with beveled bodywork, sloped roofline, separate windshield and side glass, mirrors, bumpers, grille, headlights, tail lights, plates, chassis, four tires and metallic wheel rims.
- **Resolved P2 — Online state was too easy to miss.** The top bar now presents a persistent green `ONLINE · PUBLIC` session indicator on both desktop and mobile.
- **Resolved P2 — Lawn trees looked crowded and irregular.** Duplicate trees were removed. Each large lawn now has one balanced three-tree group, while the two narrow side lawns use matching pairs.
- **Resolved P2 — Vegetation looked overly synthetic.** The existing ground and buildings remain untouched. Central deciduous trees now use irregular multi-lobe canopies with natural color variation, while the coast world swaps its placeholder palms for the user's textured Meshy palm export, optimized from 44 MB to about 1 MB for web play.
- **Resolved P1 — Other worlds leaked into the Central Park map.** Central Park and the four destination districts now live in separate render groups. Only the active world is visible; district geometry appears only after the player selects it from the map and teleports there.
- **Resolved P2 — Every outer map looked the same.** The four open districts now have distinct architecture and daily-life destinations: Gullcrest Coast has palms, sand and boardwalk shops; Hedgemont Heights has detached homes and neighborhood services; Market Mile has towers, a cinema and night club; Brickswich Works has brick warehouses, studios and a brewery.
- **Resolved P1 — Districts did not yet read as complete lived-in neighborhoods.** Every destination now shares a consistent public-realm layer: marked pedestrian crossings, paired bus shelters, route signs, waste bins, benches, lamps, parked vehicles and walking residents. Theme-specific details remain separate: boardwalk cafe seating in Gullcrest, community gardens in Hedgemont and working cargo stacks in Brickswich.
- **Resolved P1 — Market Mile lacked a real shopping destination.** A walk-in shopping center now occupies a dedicated parcel clear of both roads. Market Mile Galleria has an open entrance, collision-safe walls, a central hall, seating, a kiosk, interior shoppers and four visible store units for fashion, technology, food and arcade uses.
- **Resolved P2 — The mall was not connected to venue progression.** Its entrance now triggers the same interaction and discovery flow as the sixteen street shops, bringing the city total to seventeen discoverable venues.
- **Resolved P2 — Commercial interiors still felt unstaffed.** Central Park storefronts and all sixteen district shops now include a visible attendant behind the counter. Hedgemont residences use warm porch lighting so homes read as occupied without incorrectly turning every house into a store.
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

---

# Public Network Games UI, Bowl Visibility, and Creator Preview — Visual QA

## Evidence

- Source shell and market visual truth: `/Users/oscarbrendon/Documents/Codex/2026-08-01/e/work/public-network-local/tests/visual/figma-baselines/348-9553.png` (`1080 × 1080`).
- Source compact-card visual truth: `/Users/oscarbrendon/Documents/Codex/2026-08-01/e/work/public-network-local/tests/visual/figma-baselines/348-8817.png` (`1080 × 1080`).
- Games menu implementation: `/Users/oscarbrendon/Documents/Codex/2026-08-01/e/work/public-network-games-menu-final.png` (`1280 × 720`, `/games`, public playlist state).
- Match-intro implementation: `/Users/oscarbrendon/Documents/Codex/2026-08-01/e/work/public-network-games-intro-1080.png` (`1080 × 784`, `/games`, Tag intro state).
- Combined shell comparison: `/Users/oscarbrendon/Documents/Codex/2026-08-01/e/work/public-network-games-comparison.png`.
- Combined compact-card comparison: `/Users/oscarbrendon/Documents/Codex/2026-08-01/e/work/public-network-intro-comparison.png`.
- Locked-world state: `/Users/oscarbrendon/Documents/Codex/2026-08-01/e/work/lobby-world-locks.png` (`1280 × 784`, `/lobby`, overhead map state).
- Skate Shop interior: `/Users/oscarbrendon/Documents/Codex/2026-08-01/e/work/skate-shop-interior-final.png` (`1280 × 784`, `/lobby`, entered venue state).
- Bowl rider/camera check: `/Users/oscarbrendon/Documents/Codex/2026-08-01/e/work/bowl-character-fix.png` (`1280 × 784`, `/lobby`, rider on bowl wall).

## Comparison history

1. The first `/games` pass still carried the earlier glossy party-game language: large gradients, heavy shadows, oversized cards and a separate visual system.
2. The implementation was rebuilt against the checked-out Public Network source tokens and Figma baselines: white canvas, 74 px rail, sparse top bar, centered identity, hairline separators, Figtree typography, flat content columns, compact cards and restrained shadows.
3. The menu and intro screenshots were paired side by side with their source references. The remaining differences are content-specific—game choices and a playable 3D arena replace the market imagery and identity data—while the shared shell, spacing, density, radii and control treatment now match.
4. Desktop and `390 × 844` responsive states were rendered. No cropped controls, horizontal overflow, console error or warning remained in the final clean browser sessions.

## Findings and resolved issues

- **Resolved P1 — `/games` did not read as Public Network.** The route now uses the real Public Network shell grammar: thin left navigation rail, quiet white surface, centered 67 identity, compact online state, floating bottom navigation and low-contrast separators.
- **Resolved P1 — Match overlays looked like unrelated game UI.** The intro card now follows the source ID-card proportions and density; the in-match HUD remains legible without gradients or heavy glass effects.
- **Resolved P1 — The bowl hid part of the rider.** Bowl proximity now switches to a closer, higher follow-camera composition. The board follows the full surface normal, while the rider receives a restrained slope tilt and lift so neither the wall nor the pose clips half the character.
- **Resolved P1 — The moving car travelled backward.** Its heading now matches the positive-X lane animation and the modeled vehicle's local `-Z` nose direction.
- **Resolved P1 — The central Skate Shop was only scenery.** Its reachable storefront now exposes an `E`/touch proximity action and loads a separate real-time 3D room with wall-mounted boards, complete setups, display plinths, lights, counter and attendant.
- **Resolved P1 — Unreleased districts were publicly enterable.** All four world gates now show visible lock states in both the physical portals and map selector, and travel is rejected with a locked-world notice.
- **Resolved P2 — Venue details obscured the 3D shop on desktop.** The Skate Shop information panel moves to the right edge on wide screens so the room and merchandise remain visible; it returns to a centered compact sheet on mobile.
- No actionable P0/P1/P2 findings remain in the requested scope.

## Interaction and technical verification

- Public playlist → Tag intro → `JOIN PUBLIC MATCH`: passed.
- Online public match HUD and Three.js arena start: passed.
- Mobile public playlist at `390 × 844`: passed.
- Map open/close and four locked destination rows: passed.
- Skate Shop proximity prompt → enter → inventory panel → back-to-street flow: passed.
- Fresh browser console errors/warnings after the Timer migration: `0`.
- `npx eslint app/games/page.tsx app/lobby/page.tsx`: passed with one pre-existing unused helper warning in the lobby.
- `npm run build`: passed.
- Final result: passed.
