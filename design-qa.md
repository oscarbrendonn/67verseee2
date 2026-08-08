**Comparison Target**

- Source visual truth: `/Users/oscarbrendon/Documents/Codex/2026-08-01/e/outputs/67verse-online-skatepark-master-v4.png`
- Browser-rendered implementation: `/Users/oscarbrendon/Documents/Codex/2026-08-01/e/work/park-v4-implementation.png`
- Full-view comparison: `/Users/oscarbrendon/Documents/Codex/2026-08-01/e/work/park-v4-comparison.png`
- Focused park comparison: `/Users/oscarbrendon/Documents/Codex/2026-08-01/e/work/park-v4-focus-comparison.png`
- Route/state: `/park-v4`, desktop aerial overview, skate mode selected, online/public status visible.
- Viewport: 1252 × 720 CSS px at the in-app browser's native density.
- Source pixels: 1672 × 941. The source was center-cropped to the implementation aspect ratio and downsampled to 1252 × 720 for comparison.
- Implementation pixels: 1252 × 720. No additional density scaling was applied.

**Findings**

- No actionable P0, P1, or P2 differences remain for this first playable Three.js translation.
- [P3] Runtime materials are intentionally cleaner and less textured than the concept render.
  Location: concrete, building façades, vegetation, and small street props.
  Evidence: the reference uses offline-rendered texture detail and denser façade dressing; the implementation uses lightweight realtime materials and simplified geometry while retaining the same warm concrete, terracotta, asphalt, grass, and muted brick palette.
  Impact: the scene reads as a stylized web-game version rather than an offline architectural render.
  Fix: replace selected procedural props with optimized authored GLB assets and compressed PBR textures after gameplay profiling.
- [P3] The main bowl is a three-lobed playable contour rather than the reference's larger multi-pocket bowl.
  Location: west bowl zone.
  Evidence: both versions retain an organic deep bowl plus a separate smaller flow bowl, terracotta aprons, coping, and downhill surfaces, but the exact contour is simplified for predictable realtime collision sampling.
  Impact: visual identity and gameplay zoning match; advanced transfer lines differ.
  Fix: add a signed-distance collision surface and a denser authored bowl mesh in the next geometry pass.

**Required Fidelity Surfaces**

- Fonts and typography: the reference is an environment concept with only storefront labels; the implementation's English HUD follows the existing 67VERSE compact sans/mono hierarchy. Weight, casing, line height, and small-label hierarchy are consistent and readable.
- Spacing and layout rhythm: the park fills the viewport with a high three-quarter crop; four roads form one continuous ring; buildings maintain consistent setbacks; trees remain inside grass strips; HUD panels stay clear of the core play area.
- Colors and visual tokens: warm concrete, restrained terracotta, charcoal asphalt, soft grass, muted brick façades, green online state, and dark premium controls follow the source palette.
- Image quality and asset fidelity: the implementation is native Three.js geometry rather than a rasterized background. Bowls have actual depth, ramps and stairs are three-dimensional, cars/trees/lamps/buildings are separate 3D objects, and the scene remains playable from the chase camera.
- Copy and content: all visible game copy is English and concise: `67VERSE`, `ONLINE · PUBLIC`, `MASTER PARK`, `WALK`, `SKATE`, `BIKE`, `RIDE VIEW`, and `CLASSIC PARK`.

**Focused Region Evidence**

- The focused comparison verifies the three most important spatial signatures at readable size: the west bowl cluster, the central street/rail field, and the east transition/ramp zone.
- It also confirms the terracotta perimeter and flow ribbon, continuous roads, planted buffers, evenly spaced buildings, crosswalks, cars, and street furniture.

**Comparison History**

1. Initial comparison found a P1 bowl-visibility defect, a P2 top-bar wrap, and P2 under-scaled park framing. The plaza/base surfaces covered the bowl walls, `CLASSIC PARK` wrapped onto a second row, and the camera showed too much empty perimeter. Fixes: cut bowl-shaped openings into the plaza, corrected the four-column header grid without modifying the existing lobby styles, and moved the overview camera closer.
2. The second comparison found P2 generic elliptical bowl silhouettes and P2 low obstacle density. Fixes: replaced ellipses with organic clover/bean contours, added terracotta bowl aprons and a curved flow ribbon, added more ledges/rails, and enlarged the playable visual footprint.
3. The third comparison found the remaining P1 flat-bowl appearance. Evidence showed the lowered bowl meshes were being occluded by the metropolitan base slab. Fix: moved the base below the deepest bowl, revealing the full gradient walls and playable bowl floors. The revised browser capture shows both bowls as visibly sunken 3D forms.
4. Final full-view and focused comparisons found only the P3 realtime-material and advanced-contour refinements listed above.

**Primary Interactions Tested**

- Aerial overview ↔ chase-camera toggle.
- Walk, skate, and bicycle selection; selected state returns correctly to skate.
- Canvas focus and keyboard movement input, including automatic exit from overview into ride view.
- `CLASSIC PARK` points back to `/lobby`; both `/park-v4` and `/lobby` return HTTP 200.
- Desktop responsive layout, HUD visibility, and keyboard focus states.
- Mobile direction, jump, and boost controls are present with touch/pointer handlers; the responsive CSS breakpoint keeps ride selection and core HUD controls visible.

**Implementation Checklist**

- [x] Preserve the existing `/lobby` route and implementation.
- [x] Add the independent `/park-v4` route.
- [x] Build continuous roads and orderly building setbacks around the park.
- [x] Keep every tree inside planted grass strips.
- [x] Implement deep bowls, street obstacles, ramps, stairs, rails, lamps, benches, cars, and storefront buildings as 3D scene objects.
- [x] Add walk, skate, and bicycle modes.
- [x] Add desktop and touch controls, boost, jump, orbit camera, overview camera, and zone labels.
- [x] Verify lint, production build, browser rendering, and route availability.

**Follow-up Polish**

- Replace high-visibility façades, cars, and vegetation with optimized authored GLBs once the final asset kit is available.
- Add concrete normal/roughness maps after GPU profiling on the target phone tier.
- Upgrade the main bowl to a denser authored collision mesh for advanced transfer lines.

final result: passed

---

# 67VERSE World — Live Map QA v2

## Comparison target

- Selected visual truth: `outputs/67verse-master-map-reference-layout-v1.png` at 1254 × 1254.
- Browser implementation: `/world`, with the live world camera switched to its orthographic map state at 1254 × 1254.
- Same-input comparison inspected at `/tmp/67verse-reference-vs-live-final.png`.
- Mobile implementation inspected at 390 × 844.

## Fidelity and implementation findings

- No raster map, screenshot or image placeholder is present in the runtime map. The browser inspection returned `0` image elements while the map was open.
- The visible map is the same playable Three.js scene used by the chase camera. Roads, sidewalks, crosswalks, buildings, canal, bridges, sports campus, race loop, skatepark, waterfront rides, marina, stadium, market blocks, park, southern housing and landscaping are separate 3D objects.
- The world reproduces the selected reference's major spatial hierarchy: northwest race loop; upper sports, skate and amusement districts; middle old town, central plaza and stadium; lower commercial blocks and green park; southern housing; and a continuous road grid.
- The responsive live-map UI adds ten accessible district targets without obscuring the underlying city structure. Mobile labels remain readable and do not overflow the viewport.
- The lighter realtime material finish is an intentional web-performance interpretation of the more densely textured offline reference. It preserves the approved soft-model palette and large-scale composition while avoiding a static background.
- No actionable P0, P1 or P2 visual differences remain for the live Three.js translation.

## Functional checks

- The initial player spawn is a clear central plaza position outside every building collider; the first interaction is `SWITCH TO SKATE`, not a venue-entry prompt.
- Desktop forward movement changes the player's position and faces the character away from the camera in the travel direction.
- The GLB's native `idle`, `walk`, `run`, `jump` and `fall` clips are selected from actual movement state.
- Map input pauses player movement and touch input; closing it restores normal play.
- Ten district travel controls were found in the browser. `Waterfront` and `Master Skatepark` teleports were executed successfully and returned the player to their safe entrance points.
- The 390 × 844 state exposes direction, jump and interact controls; the live map fits the phone viewport and contains no raster image.
- Browser console errors: `0`.

final result: passed

---

# 67VERSE World — Design QA (legacy v1, superseded by Live Map QA v2)

## Target and implementation

- Reference: `outputs/67verse-master-map-reference-layout-v1.png` (1254 × 1254)
- Implementation: `/world`, master map overlay at a 1440 × 1100 desktop viewport
- Implementation capture: `outputs/world-map-qa.png`
- Focused crop: `outputs/world-map-qa-crop.png` (750 × 750)
- Same-input comparison: `outputs/design-qa-comparison.png`
- Mobile capture: `outputs/world-mobile.png` (390 × 844)

## State compared

The reference is a top-down master-city map, so the matched implementation state is the in-game **MAP** overlay. Building interiors are intentionally separate states that open after approaching an entrance and pressing **E**.

## Visual findings

- The city footprint, skatepark, sports courts, residential blocks, downtown axis, stadium, waterfront amusement district, beach, river, bridges, roads and outer housing all match the selected reference.
- This legacy capture used the source artwork. The current v2 implementation removes that runtime artwork entirely and renders the playable Three.js world from an orthographic camera.
- The current live-map state adds the 67VERSE product frame, close control, online state and interactive district travel targets over real scene geometry.
- Desktop hierarchy, spacing, corner radii, translucent surfaces and typography remain coherent with the existing premium 67VERSE interface.
- The 390 × 844 state preserves the 3D viewport and exposes dedicated directional, jump and interact controls without horizontal overflow.

## Functional checks

- `/world` loads a playable Three.js scene with zero console errors in a fresh browser tab.
- `E`/Interact enters the separate 67 Skate Shop interior from the city.
- Repeated forward input moves the character from the entrance to the counter; the contextual prompt changes from `EXPLORE INTERIOR` to `OPEN STORE`.
- The store exposes three real catalog items with unique prices and descriptions.
- A test purchase reduced the balance from 7,300 CR to 7,040 CR and persisted one owned item in the inventory.
- Google Play and Web3 Wallet are visibly distinct checkout adapters. The Web3 adapter selection state was verified.
- Checkout explicitly states that the prototype sends no real payment and no blockchain transaction.
- The classic `/lobby` route remains intact and links to the new world.

## Build verification

- `vinext build` completed successfully.
- Route report includes `/world` alongside the pre-existing routes.
- Build emitted only the existing large-chunk optimization warning; no build error occurred.

## Comparison history

1. First desktop load revealed an SSR/client locale mismatch in the credit counter; formatting was made deterministic with `en-US`.
2. A missing local credit value was interpreted as zero; the storage guard was corrected.
3. Persisted inventory initially caused an SSR hydration mismatch; inventory hydration was moved to a mount effect.
4. A fresh-tab retest produced zero console errors and the final side-by-side visual comparison showed no actionable mismatch.

final result: passed
