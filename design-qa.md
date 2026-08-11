# 67VERSE Master City — Design QA

## Source of truth

- Approved aerial layout reference: `/tmp/codex-remote-attachments/019fbafb-ac9c-7883-b039-7e39958a743b/5F84663A-65AB-4E69-8FF8-DDC93C8E6F58/1-Fotoğraf-1.jpg` (588 × 1280; map crop 588 × 589).
- User-requested deviation: the broken west-side water channel must not cross roads or buildings. The implementation intentionally uses a continuous dry city grid there.
- Existing 67VERSE English UI, live district pins, economy controls, and character selector are product constraints rather than elements copied from the reference image.

## Implementation evidence

- Final full view: `/Users/oscarbrendon/Documents/Codex/2026-08-01/e/artifacts/world-map-final.png`
- Reference/implementation comparison: `/Users/oscarbrendon/Documents/Codex/2026-08-01/e/artifacts/world-map-comparison-final.png`
- North landmark detail: `/Users/oscarbrendon/Documents/Codex/2026-08-01/e/artifacts/world-map-focus-north.png`
- Stadium and Green Park detail: `/Users/oscarbrendon/Documents/Codex/2026-08-01/e/artifacts/world-map-focus-east.png`
- Browser viewport: 1280 × 720 CSS px, device scale factor 1.
- State: selected Gorilla 67, entered the live world, opened the live Three.js map, and traveled through district buttons.

## Comparison history

### Iteration 1

- **P0 layout:** a self-intersecting water polygon produced large blue triangles through four roads, crosswalks, parcel pads, Race Loop, and multiple buildings.
- **P1 content:** the top sports/amusement band, skatepark silhouette, stadium, central density, western neighborhood, and Green Park were too sparse compared with the source.
- **Fix:** removed the broken channel and its bridge slabs, revealing the continuous road and parcel geometry already underneath. Added ordered west-side buildings without road overlap.

### Iteration 2

- **P1 landmarks:** stadium tiers were hidden inside one another; the skatepark read as four rings; Green Park lacked a bridge/play area; the waterfront lacked a lighthouse; sports lacked baseball detail.
- **Fix:** added a banked snake bowl, visible stepped stadium tiers and pitch markings, baseball diamond/backstop, playground, walkable pond bridge, lighthouse, denser neighborhood blocks, and stronger district landscaping.
- **P1 collisions:** several generic edge buildings touched roads or duplicated venue footprints; the original Green Park spawn was in the pond.
- **Fix:** removed/repositioned the conflicting buildings, moved the Green Park spawn to `(67, 69)`, and separated playground furniture and trees.

### Iteration 3

- **P1 behavior:** raised public areas were only visual, leaving the player feet below the baseball field, stadium pitch, city park, amusement pad, and bridge.
- **Fix:** registered deterministic world-surface heights for every new raised playable area and added blockers for playground toys and the baseball backstop.
- **P2 depth:** the exact top-down camera hid stadium tiers, trees, building height, and much of the ride structure.
- **Fix:** changed the orthographic overview to a restrained diorama angle and corrected district-pin vertical projection.

## Final findings

- **Layout:** the single-city composition now preserves the source hierarchy: northwest race loop; sports and skate zones across the north; rides and marina in the northeast; dense central/old-town blocks; stadium east-center; market and Green Park in the south-center; residential blocks along the lower edge.
- **Spacing:** road bands remain continuous and separate from all audited building/venue footprints. The west side is intentionally dry and ordered per the user's correction.
- **Color and surfaces:** warm clay parcels, cream buildings, muted coral/mint/blue accents, soft shadows, and restrained PBR response match the supplied soft-diorama direction.
- **Landmarks:** the new bowl, tiered stadium, baseball field, pond bridge, playground, docks, rides, and lighthouse remain readable at overview scale.
- **Typography/icons:** existing Figtree/Geist product typography and Phosphor controls remain coherent, English, and accessible. District buttons retain explicit accessible names.
- **Core interaction:** map pins close the overlay and teleport to the selected live district. Sports Campus travel landed at `(-67, -54)`; Green Park landed safely at `(67, 69)` with raised ground height `0.39`.
- **Accessibility:** map controls are semantic buttons with descriptive labels; active state and close control remain keyboard-addressable. No new unlabeled UI was introduced.
- **Implementation integrity:** the map is rendered from live Three.js geometry. No screenshot or flat map image is used in the game.

## Verification

- Repository-wide `npx tsc --noEmit`: still reports pre-existing errors in `app/lobby`, Cloudflare worker typings, and the separate `work/public-network-local` Electron/Bun workspace; filtering the project diagnostics shows no error in `app/world/page.tsx`.
- `npm run build`: passed (existing chunk-size advisory only).
- `git diff --check -- app/world/page.tsx`: passed.
- Browser core-flow test: hero entry, map open, Sports Campus travel, Green Park travel, and map reopen passed.

## Tall mixed-use streetscape and mobile control pass

### Source of truth

- Tall mixed-use street reference: `/tmp/codex-remote-attachments/019fbafb-ac9c-7883-b039-7e39958a743b/643AD614-C5EC-488A-B034-346454FBCF96/1-Fotoğraf-1.jpg` (1200 × 675).
- Intentional product constraint: the reference supplies street proportion, storefront hierarchy, and camera scale. The live implementation keeps the established soft-pastel 67VERSE materials, Gorilla 67 character, English premium HUD, and Three.js geometry instead of copying the Roblox avatar or interface.

### Implementation evidence

- Final browser-rendered street view: `/Users/oscarbrendon/Documents/Codex/2026-08-01/e/artifacts/streetscape-final.png`
- Required combined reference/implementation comparison: `/Users/oscarbrendon/Documents/Codex/2026-08-01/e/artifacts/streetscape-comparison-final.png`
- Browser viewport: 1280 × 720 CSS px, device scale factor 1.
- State: Gorilla 67 entered the world, opened the live map, traveled to Market Square, spawned in the road facing the new shop row, approached Cloud Cafe, and entered its generated 3D interior.

### Comparison history

#### Iteration 1

- **P1 streetscape:** procedural buildings were short, blank pastel blocks with sparse windows and no readable ground-floor commercial hierarchy.
- **Fix:** preserved every footprint and collider while converting the buildings to three-to-five storeys with four-sided window rows, floor bands, roof detail, broad storefront glazing, dark doors, awnings, and cached English shop signs.

#### Iteration 2

- **P1 camera:** the high, distant camera made Gorilla 67 and the storefronts too small; lowering it without collision handling could place the camera inside a building.
- **Fix:** moved free-world play to a closer third-person camera, raised its aim toward the taller façades, and added a collider probe that retracts the camera before walls and smoothly restores the chosen distance.
- **P1 arrival composition:** Market Square initially spawned on an empty parcel with the shop row off-axis.
- **Fix:** moved the safe spawn to the road at `(0, 82)` and gave that district a street-facing arrival yaw. The live result now places the character in the road with the tall storefront row directly across it, matching the reference hierarchy.

#### Iteration 3

- **P1 venue truthfulness:** the centered `Cloud Cafe` façade was initially a decorative generic building despite looking enterable.
- **Fix:** promoted it to a real venue, preserved its block position, and connected it to the cafe interior, barista counter, products, stools, checkout, wallet, and inventory flow.
- **P1 mobile controls:** the old four-button D-pad provided only binary movement, lost diagonal continuity, and could cancel one held direction when another finger released.
- **Fix:** replaced it with a 360-degree PUBG-style radial joystick using pointer capture, a 13% dead zone, remapped analog strength, diagonal normalization, analog speed, spring return, landscape coarse-pointer support, and safe-area spacing. WASD remains full-speed and takes deterministic precedence.
- **P2 input lifecycle:** blur, lost pointer capture, and modal transitions could leave camera drag, keyboard movement, or boost latched.
- **Fix:** added blur/visibility cleanup for keys, boost, joystick, and camera pointer capture; all gameplay overlays clear analog movement and boost.

### Final findings

- **Hierarchy and scale:** three-to-five-storey mixed-use buildings now form a continuous readable city edge without changing road widths, parcel footprints, or collision plans.
- **Storefront quality:** dark teal glazing, dark doors, full-width awnings, and individual English signs provide the ground-floor contrast visible in the reference while retaining the softer 67VERSE palette.
- **Street composition:** the tested Market Square arrival shows Gorilla 67 on the marked road, a full sidewalk buffer, and a centered enterable shop row. No building sits on the road.
- **Camera:** the lower view makes the character and shop entrances useful at gameplay scale. Collider probing prevents the requested close view from passing through tall façades.
- **Interaction:** keyboard movement changed world coordinates from `(-74.00, 29.00)` to `(-74.39, 31.30)` in a live test. At Market Square, the character reached `(0.00, 64.74)`, received `ENTER CLOUD CAFE`, entered successfully, and reported `data-activity="interior"`. Interior movement changed `z` from `7.50` to `6.84`.
- **Analog math:** center and inner-dead-zone samples resolve to `0`; half displacement resolves to `0.4253`; full diagonal resolves to normalized magnitude `1`; full-left resolves to `x=-1`.
- **Responsive controls:** the joystick is present once in the DOM with an explicit accessible label/description. Its UI is enabled at `max-width: 960px` and for coarse pointers, including landscape phones, with horizontal notch safe areas.
- **Runtime integrity:** no browser console warning or error was produced by the final street, travel, venue-entry, or movement flows. The city and storefronts remain live Three.js geometry; no reference screenshot is embedded in the product.

## Integrated city, interior, and master-skatepark pass

### Additional sources of truth

- Large skatepark structure reference: `/tmp/codex-remote-attachments/019fbafb-ac9c-7883-b039-7e39958a743b/C29DCEFE-1403-482A-A7DB-63CA578C6A0D/1-Fotoğraf-1.jpg`.
- Soft dollhouse-interior reference: `/tmp/codex-remote-attachments/019fbafb-ac9c-7883-b039-7e39958a743b/EF12FF8D-B661-437A-A53E-FB326DC19510/6-Fotoğraf-6.jpg`.
- Intentional deviation: the skate reference supplies bowl, coping, stair, rail, and hubba language. The live park is larger, traversable, and integrated into the online city rather than reproduced as a small isolated tile.

### Final combined visual evidence

- City reference/implementation in one image: `/Users/oscarbrendon/Documents/Codex/2026-08-01/e/artifacts/final-city-reference-comparison.png`.
- Skatepark reference/live-map implementation in one image: `/Users/oscarbrendon/Documents/Codex/2026-08-01/e/artifacts/final-skate-reference-comparison.png`.
- Interior reference/Hair & Nails implementation in one image: `/Users/oscarbrendon/Documents/Codex/2026-08-01/e/artifacts/final-interior-reference-comparison.png`.
- Live 390 × 844 street with analog joystick: `/Users/oscarbrendon/Documents/Codex/2026-08-01/e/artifacts/final-old-town-street.png`.
- Live 390 × 844 Hair & Nails interior: `/Users/oscarbrendon/Documents/Codex/2026-08-01/e/artifacts/final-mobile-hair-nails.png`.
- Live 3D world overview: `/Users/oscarbrendon/Documents/Codex/2026-08-01/e/artifacts/final-skatepark-map.png`.

### Final design findings

- **Typography and copy:** the English Figtree/Geist hierarchy stays compact, legible, and consistent across the premium HUD, district map, venue prompts, wallet, inventory, and character studio. Venue and action labels are descriptive rather than placeholder copy.
- **Layout and spacing:** audited road pieces meet at dedicated junctions rather than overlapping. Crosswalks, stop lines, gutters, curbs, sidewalks, and parking bays form one ordered street system. Sixty-three building/venue footprints have no building-building or building-asphalt overlap.
- **Color and tokens:** cream plaster, muted coral, teal, mint, pale blue, and warm wood remain shared across the city, interiors, and skate geometry. Dark ink/glass HUD surfaces provide the intended Apple-like contrast without breaking the soft model direction.
- **Model quality:** tall buildings now read as three-to-five-storey mixed-use blocks with framed windows, ground-floor glazing, doors, awnings, roof bands, and English signs. The skatepark uses live Three.js geometry for two recessed organic bowls, a broad S-shaped snake run, quarter pipes, five-step sets, landings, handrails, hubba, and flat bars.
- **Skate geometry integrity:** the final snake surface has zero self-intersections, inverted triangles, or longitudinal height jumps. Bowl holes and rims share the same sampled boundary, curved grind registration stays within 0.8 cm of the visible coping, and the `67` mark is a flush visual floor print rather than a hidden platform.
- **Interior completeness:** cafe, market, skate shop, fashion, salon, arcade, and club treatments use venue-specific counters, displays, equipment, lighting, staff, products, seats, and collision plans. Spawn, exit, service counter, product anchors, and all defined seats are reachable.
- **Interaction:** the tested flow passed from hero selection to live map, Old Town travel, `ENTER HAIR & NAILS`, `SIT · STYLING CHAIR`, and `STAND UP`. Skate/walk/bike switching, attraction state, shop checkout, credits, and inventory remain connected to the existing world systems.
- **Responsive controls:** at 390 × 844, the HUD keeps safe margins and exposes one labeled 360-degree joystick plus boost, jump, and interact controls. The analog stick uses pointer capture, dead-zone remapping, partial-speed movement, diagonal normalization, spring return, and cleanup on blur, lost capture, and modal transitions.
- **Accessibility:** district travel, character parts, wallet, inventory, products, interaction, and mobile controls remain semantic buttons/groups with explicit accessible names. Focus-visible treatment and keyboard controls are preserved.
- **Runtime quality:** the final production build and whitespace check pass. A clean browser run produced no warning or error logs. Local and LAN `/world?release=overnight-final` requests both returned HTTP 200.

## Final result

passed

## Exact soft-pastel product family and oblique aerial pass

### Source and combined review input

- Green Park product reference: `/tmp/codex-remote-attachments/019fbafb-ac9c-7883-b039-7e39958a743b/946B697F-58D9-4906-A55D-47570A1E6F4B/1-Fotoğraf-1.jpg`.
- Full-city aerial reference: `/tmp/codex-remote-attachments/019fbafb-ac9c-7883-b039-7e39958a743b/946B697F-58D9-4906-A55D-47570A1E6F4B/2-Fotoğraf-2.jpg`.
- Final live city capture: `/Users/oscarbrendon/Documents/Codex/2026-08-01/e/artifacts/reference-match-city-final.png`.
- Final Green Park capture: `/Users/oscarbrendon/Documents/Codex/2026-08-01/e/artifacts/reference-match-green-park.png`.
- Required source/implementation comparison input: `/Users/oscarbrendon/Documents/Codex/2026-08-01/e/artifacts/design-qa-reference-match-final.png`.

### Comparison findings and fixes

- **P1 flat map camera:** the previous orthographic view presented the world as a plan and hid the model massing that defines the supplied city image.
- **Fix:** the live map now uses a responsive south-to-north perspective camera. Desktop crops the near edge like the source and exposes building fronts; portrait uses a steeper board angle so the square city remains usable on a phone.
- **P1 detached map labels:** fixed percentage positions no longer matched landmarks after the camera changed.
- **Fix:** each district button is projected every frame from its actual Three.js world coordinate through the live overview camera. Pins remain aligned at every tested aspect ratio.
- **P1 incomplete Green Park product set:** the park lacked the reference's coherent kidney pond, secondary water feature, curved paths, picnic furniture, waste bin, stones, grass tufts, play arches, and dense edge planting.
- **Fix:** all of those elements are authored live Three.js geometry using one warm-ivory, sage, dusty-mauve, powder-blue, coral, butter, blush, and pale-wood palette. The existing rideable spring pigs, swimming, bridge walking, seating, and collision systems remain connected.
- **P1 missing civic foreground landmark:** the southern city edge lacked the domed civic silhouette visible in the aerial source.
- **Fix:** a molded warm-ivory civic hall with a dome, drum, cornice, columns, framed windows, canopy, and safe collider now anchors Southside without moving its spawn or entering a road.
- **P1 Ferris-wheel silhouette:** the wheel plane faced sideways to the city camera and disappeared at aerial scale.
- **Fix:** the wheel now faces the southern aerial/gameplay approach, spins on the correct axis, retains its cabin seat anchor and dismount, and uses updated support blockers.
- **P2 low residential massing:** two-floor procedural blocks made the city read flatter and emptier than the source.
- **Fix:** procedural blocks now start at three floors, while the two southern central buildings become taller molded towers. Footprints, entrances, roads, and collider dimensions are unchanged.

### Final findings

- The city keeps the source hierarchy: race and sports at northwest; skatepark north-center; amusement/marina northeast; tall central square; stadium east; Green Park southeast; civic dome in the near south.
- Shared geometry now uses the same molded edges, opaque smoky windows, matte roughness, restrained pastel accents, soft blob vegetation, and rounded miniature props throughout the world.
- Green Park's bridge still overlaps both banks, has a registered walkable deck and physical rails, and is excluded from the pond swim volume. The revised kidney water remains swimmable outside that deck lane.
- The map remains an interactive live Three.js scene. No supplied screenshot is embedded as the terrain or used as a flat map.
- Desktop hero entry, map opening, district travel to Green Park and Waterfront, park/bridge inspection, and mobile map layout were exercised. The final audited browser run reported no console warning or error.
- `npm run build` and `git diff --check` pass. The production build retains only the existing chunk-size advisory.
- No remaining actionable P0, P1, or P2 issue was found in this reference-match scope.

final result: passed

## Pastel molded-building and recessed-window pass

### Source and visual evidence

- Primary source of truth: `/Users/oscarbrendon/.codex/state/plugins/product-design/assets/67verse-soft-pastel-city-model-quality-reference.jpg` (`1280 × 960`).
- Enlarged reference crops: `/Users/oscarbrendon/Documents/Codex/2026-08-01/e/artifacts/reference-buildings-zoom-left.jpg` and `/Users/oscarbrendon/Documents/Codex/2026-08-01/e/artifacts/reference-buildings-zoom-central.jpg`.
- Final live city overview: `/Users/oscarbrendon/Documents/Codex/2026-08-01/e/artifacts/buildings-final-overview.png` (`1280 × 960`, CSS density `1`).
- Final live Old Town street view: `/Users/oscarbrendon/Documents/Codex/2026-08-01/e/artifacts/buildings-final-old-town.png` (`1280 × 960`, CSS density `1`).
- Required full-map comparison: `/Users/oscarbrendon/Documents/Codex/2026-08-01/e/artifacts/pastel-buildings-full-comparison-final.png`.
- Required close-building comparison: `/Users/oscarbrendon/Documents/Codex/2026-08-01/e/artifacts/pastel-buildings-focused-comparison-final.png`.
- Tested state: selected hero entered the live Three.js world, opened the district map, and traveled to Market Square, Old Town, and 67 Central for aerial and street-level inspection.

### Comparison history and fixes

- **P1 repetitive storefronts:** nearly every generic building previously used oversized teal storefront glass, an awning, and a sign, even when it represented housing or an office.
- **Fix:** authored venues always remain recognizable shops; only a deterministic approximately `20%` of generic buildings are mixed-use commercial buildings. The rest use residential/office entrances and smaller windows without fake shop signs.
- **P1 sticker-like windows:** panes previously read as large colored rectangles placed on the facade rather than modeled openings.
- **Fix:** each upper window now has a recessed reveal, muted tinted pane, four-piece warm-ivory frame, and projecting sill. Window proportions were reduced to match the close reference.
- **P1 square and repetitive massing:** baseline blocks shared similar straight roof treatment and strong horizontal bands on every floor.
- **Fix:** warm-ivory molded shells now use thinner seams, softened corners, controlled setbacks, four roof/crown variants, skylights or compact rooftop units, and rounded smoky-glass tower bands only on tall skyline buildings.
- **P2 color flattening:** an early correction pushed every facade too close to the same grey-white.
- **Fix:** the final `0.74` softening mix retains subtle blush, mint, pale blue, and sand hues while keeping the reference's warm-ivory city base.
- **Geometry safety:** authored venue +Z doors, arrival points, x/z positions, footprints, roads, and collider dimensions are unchanged. Commercial canopy and balcony projections remain inside the existing `+0.70` collider margin.

### Final findings

- **Typography and copy:** interface typography and English venue copy were not redesigned in this pass. Authored venue signs remain readable and tied to their real interiors; generic residences no longer carry misleading shop copy.
- **Layout and spacing:** building locations, parcel spacing, sidewalks, road clearances, entrance anchors, and collision plans remain unchanged.
- **Color and materials:** matte warm ivory dominates, with low-saturation pastel accents and smoky blue/warm window variation. No transparent glass or expensive post-processing was added.
- **Model quality:** live Three.js buildings now read as softly molded diorama architecture with real window depth, framed glass, roof undercuts, tower variety, and restrained storefront use. The source image is not embedded in the product.
- **Performance:** facade details reuse shared geometry/materials and are grouped into per-building instanced meshes; removing unnecessary generic signs, awnings, and storefront panels offsets the added window depth.
- **Runtime quality:** the final browser reload at `http://127.0.0.1:5173/world?qa=pastel-buildings-before` produced no warning or error logs.

## Final result

passed

## Sparse crossings and soft-pastel palm pass

### Source and visual evidence

- User reference: `/tmp/codex-remote-attachments/019fbafb-ac9c-7883-b039-7e39958a743b/11875CC0-B756-4417-8256-0D767D7E5F5B/1-Fotoğraf-1.jpg` (`588 × 1280`, app-owned viewport cropped to `588 × 1046`).
- App-only source crop: `/Users/oscarbrendon/Documents/Codex/2026-08-01/e/artifacts/source-palm-crosswalk-mobile.png`.
- Live mobile palm view: `/Users/oscarbrendon/Documents/Codex/2026-08-01/e/artifacts/street-palm-mobile.png`.
- Live mobile city overview: `/Users/oscarbrendon/Documents/Codex/2026-08-01/e/artifacts/street-markings-overview.png`.
- Required combined comparison input: `/Users/oscarbrendon/Documents/Codex/2026-08-01/e/artifacts/street-palm-comparison.png`.
- Browser viewport and state: `588 × 1046`; Gorilla 67 entered the live world, traveled to Waterfront, walked to the coastal palm, rotated the gameplay camera for a close model inspection, then opened the live Three.js city map for the complete road-marking audit.

### Comparison history and fixes

- **P1 crossing clutter:** each of the 16 intersections previously rendered four complete zebra sets with seven bright bars per set plus four stop lines. The supplied street view showed this as a dense, repeated white grid.
- **Fix:** every junction now has one explicitly planned pedestrian crossing directed toward an active parcel. Each crossing uses five wider warm-grey bars and one paired stop line. Zebra meshes drop from `448` to `80` (approximately `82%`), and stop lines drop from `64` to `16` (`75%`) without changing road, sidewalk, vehicle, spawn, or collision geometry.
- **P1 palm style mismatch:** the imported realistic coconut-palm GLB produced a pale, thin trunk and high-detail fronds that did not belong to the rounded 67VERSE diorama language.
- **Fix:** removed the live Meshy palm load and replaced it with authored Three.js palms using warm clay rounded trunk segments, compact mint/olive molded leaves, matte materials, soft shadows, three deterministic variations, and a smaller silhouette. The four landscaped placements remain unchanged.

### Final findings

- The live city overview shows one small crossing per junction rather than four competing zebra blocks, making streets and parcels readable at mobile scale.
- The close waterfront view confirms that the former white photoreal palm is absent. Its replacement uses the same rounded construction, muted palette, and soft-shadow treatment as the city trees, boats, shops, and attractions.
- The palm remains clear of asphalt and neighboring buildings. Road generation, sidewalk support heights, parked-car blockers, district travel, movement, and the mobile joystick are unchanged.
- The implementation remains live Three.js geometry; neither reference screenshot is embedded into the product.
- Final browser warning/error logs are empty.

## Final result

passed

No remaining actionable P0, P1, or P2 issue was found for the integrated city-road, tall-building, venue-interior, master-skatepark, mobile-control, or tested interaction scope.

## Soft-pastel diorama model-quality pass

### Source of truth

- Final close aerial reference: `/Users/oscarbrendon/.codex/state/plugins/product-design/assets/67verse-soft-pastel-city-model-quality-reference.jpg`.
- Required language: warm ivory molded forms, low-saturation coral/mint/blue accents, rounded stacked massing, small authored props, soft shadows, and readable landmark silhouettes.
- Required product constraint: every map element remains live Three.js geometry with the current interaction, ride-anchor, teleport, seating, purchase, and collision systems intact.

### Implemented model standard

- **Buildings:** three-to-seven-storey rounded silhouettes, controlled setbacks, roof crowns, balconies, opaque batched window groups, warm storefront glass, awnings, and readable English signs. Existing footprints and collider plans were preserved.
- **Street world:** warm mauve-gray roads, coherent junctions and sidewalks, eleven parked rounded vehicles with audited blockers, and varied blob-tree silhouettes.
- **Landmarks:** an architectural open stadium bowl, twin-rail coaster and loading station, structural Ferris wheel, striped carousel, authored marina docks and sailboats, detailed lighthouse, pond/pool rims, playground toys, and the functional large skatepark now share the same diorama palette and rounded construction language.
- **Rendering:** powder-blue fog/background, softer balanced hemisphere and sun lighting, adaptive pixel ratio, cached shared materials/geometries, and per-building instanced window groups improve consistency and mobile cost without changing gameplay geometry.

### Final verification

- Correct local route: `http://127.0.0.1:5173/world?qa=soft-city-v1`.
- Final live overview: `/Users/oscarbrendon/Documents/Codex/2026-08-01/e/artifacts/qa-soft-city-overview.png`.
- Required side-by-side visual QA: `/Users/oscarbrendon/Documents/Codex/2026-08-01/e/artifacts/qa-soft-city-comparison.jpg`.
- Desktop hero entry, live-world map, district travel, storefront/interior flow, waterfront, stadium, and master-skatepark views passed.
- Mobile 390 × 844 analog joystick movement, spring return, action controls, and responsive HUD passed.
- Final browser reload produced no warning or error logs; only Vite connection and React development information appeared.
- `npm run build` and `git diff --check -- app/world/page.tsx app/world/world.module.css` passed. The build retains only the existing chunk-size optimization advisory.

## Playground spring-pig ride pass

### Source and visual evidence

- User reference: `/tmp/codex-remote-attachments/019fbafb-ac9c-7883-b039-7e39958a743b/F31DE871-C11F-4C86-8FF6-9BA5A6705F1E/1-Fotoğraf-1.jpg`.
- Combined reference/live implementation comparison: `/Users/oscarbrendon/Documents/Codex/2026-08-01/e/artifacts/pig-ride-comparison.jpg`.
- Live mobile mounted state at 390 × 844: `/Users/oscarbrendon/Documents/Codex/2026-08-01/e/artifacts/pig-ride-mobile.png`.
- Live desktop mounted state at 1280 × 720: `/Users/oscarbrendon/Documents/Codex/2026-08-01/e/artifacts/pig-ride-desktop.png`.

### Final interaction findings

- All three authored playground pigs remain in the scene and are individually detected as `SUNNY PIG`, `BERRY PIG`, and `SKY PIG`; no duplicate ride model is created.
- Near a pig, the action changes to `RIDE · <PIG NAME>`. Keyboard E and the semantic mobile Interact control enter the dedicated mounted state; E exits again.
- Mounted pigs use the same camera-relative WASD/PUBG joystick steering as the rest of the world, with a dedicated normal speed, boost speed, spring hop, speed HUD, and `PIG RIDE` movement label.
- The Gorilla is switched into its seated pose and raised above the rounded back so its torso and legs do not disappear into the toy.
- The moving pig uses a 1.45 m collision footprint sampled at its center and eight perimeter points. Other pigs and world blockers stay physical while the active pig's former static blocker is ignored.
- Dismount checks eight candidate directions and only exits to a collision-free point; the tested Sky Pig dismount returned the player to free movement at `(52.31, 71.32)` with zero speed.
- Mobile travel reached `data-nearby-pig="spring-pig-3"`, mounted with `data-activity="mounted"`, moved the pig by 2.33 m with only 0.21 m sideways drift under forward analog input, changed heading by 2.859 radians under right-stick input, and safely returned to `data-activity="free"`.
- Customize, map, and inventory remain disabled during the mounted activity. Refresh does not persist a mounted state.
- Browser console warning/error log was empty after the final mobile mount, steer, turn, and dismount flow.
- `npm run build` and `git diff --check -- app/world/page.tsx app/world/world.module.css design-qa.md` passed; the build retains only the existing chunk-size advisory.

## Final result

passed

## Swimming, connected bridge, and compact skateboard pass

### Source and visual evidence

- User reference: `/tmp/codex-remote-attachments/019fbafb-ac9c-7883-b039-7e39958a743b/484BECFD-9A21-4DF2-85E5-0E33BCFB609A/1-Fotoğraf-1.jpg` (`588 × 1280`, with the app-owned viewport cropped to `588 × 1046`).
- Required side-by-side comparison: `/Users/oscarbrendon/Documents/Codex/2026-08-01/e/artifacts/water-bridge-comparison.jpg`.
- Live connected-bridge state: `/Users/oscarbrendon/Documents/Codex/2026-08-01/e/artifacts/water-bridge-mobile.png`.
- Live swimming state: `/Users/oscarbrendon/Documents/Codex/2026-08-01/e/artifacts/swimming-mobile.png`.
- Live compact-skateboard state: `/Users/oscarbrendon/Documents/Codex/2026-08-01/e/artifacts/skateboard-scale-mobile.png`.

### Final interaction findings

- The Green Park bridge now spans `21 × 3.5` world units and overlaps both banks by approximately `0.9` units, eliminating the visible water gap at either abutment. The park-to-deck rise is `0.28`, below the walk step limit of `0.34`.
- The walkable bridge surface exactly follows the deck footprint. Both ends remain open, both side rails are physical, and the complete deck lane is excluded from the pond swimming volume.
- Walking onto the bridge produced `data-activity="free"` at `y=0.67`; pushing sideways was stopped by the rail without entering swimming mode.
- Pond, pool, and marina water now start a dedicated swimming activity. Water entry stows skate/bike, exposes the SWIM HUD, hides the ground shadow, applies a visible upper-body swim pose and buoyancy, and changes the mobile actions to swim boost and kick.
- The first live pass exposed two P1 defects: the decorative terrain beneath the water hid too much of the swimmer, and the grounded step-height rule pinned planar movement at the shoreline. The swimmer depth was raised to `0.24` below the waterline and swimming now bypasses only that terrain step check while retaining all authored blockers.
- After the correction, joystick movement changed the swimmer from `z=63.17` to `z=60.19` while retaining `data-activity="swimming"`, `data-ride-mode="swim"`, and `data-swim-zone="green-park-pond"`. Leaving the water returned to `data-activity="free"` on a dry authored support surface.
- The skateboard was reduced to a `0.78 × 0.28 × 0.07` compact deck, with a `0.51` wheelbase, smaller wheels, and a `0.16` rider offset. It remains the shared live board used by every hero and shop display; ollie, boost, grinding, and steering code were not changed.
- The Gorilla bounds calculation now ignores meshes below hidden authored prop parents, so the removed hat and flower cannot distort future character-to-item fitting.
- The final `588 × 1046` mobile run used the visible PUBG-style analog joystick and semantic Interact control. Browser warning/error logs were empty.

## Final result

passed
