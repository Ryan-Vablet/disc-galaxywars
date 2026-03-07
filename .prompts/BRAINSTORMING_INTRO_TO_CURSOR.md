Here are the main lead-developer pushbacks that would affect implementation or scope:
1. Design Bible vs code: world dimensions
SOLAR_DOMINION_DESIGN_BIBLE.md says:
Small: 1200×900, Medium: 1800×1200, Large: 2600×1600
Current code (game/client/src/constants/game.ts) uses square maps:
Small: 1200×1200, Medium: 1800×1800, Large: 2600×2600
So either the Bible is outdated or we intentionally moved to square and didn’t update the doc. We should align doc and code and treat one as source of truth (likely the square “fair play” choice in code).
2. Solar Flares — underspecified for implementation
“Sector near the Sun”: Is it an angle (e.g. 90° arc), a radius band, or a polygon? Need a precise definition for “in zone” checks (which planets/fleets are affected).
“Fleet movement slowed in zone”: Is that a multiplier (e.g. 0.5×) on existing speed, or a cap? Does it apply only to fleets that enter during the 5s, or to any fleet that’s inside at any moment? This affects FleetSystem / movement math and edge cases.
“5–8 second warning”: Fixed 6s, or random in [5,8]? Ties into event scheduling and predictability.
Worth locking this in a short “Solar Flares — implementation spec” before coding so we don’t rework it later.
3. Comeback bonus — average definition
Formula uses avgPlanets. Need a strict definition:
Average over all players (including eliminated)?
Only non-eliminated players?
Only enemies (so you’re compared to opponents)?
Example: 4 players, two eliminated with 0 planets. Does avgPlanets include those zeros? It changes who gets the bonus and how strong it is. One line in the Bible (“average over non-eliminated players” or similar) is enough.
4. Ship production (Phase 4) — combat and data model
The design is implementable; the main cost is breadth of change:
Combat: Switching to power-based resolution with proportional survival by type is a new code path and needs tests (pure Raider vs Fighter, mixed vs mixed, shield interaction, ties).
Data model: Every place that today uses planet.units / fleet.units must use garrison / composition (or a small abstraction). That touches production, combat, AI, telemetry, and UI.
I’m not pushing back on the design, but I’d keep the “30–50 matches + telemetry” gate and treat Phase 4 as a proper milestone with a dedicated “data model + combat refactor” sub-phase so we don’t half-ship it.
5. HUD growth and viewport
Phase 3 adds: bottom bar, sun banner, production rate on planets (at zoom threshold). We already have top bar, zoom/rotation, mute, help. On small viewports (e.g. Discord overlay or mobile), that’s a lot of persistent UI. I’d add a constraint: e.g. “Bottom bar may collapse to a single summary line on height &lt; 600px” or “Sun banner is one compact line,” and keep that in mind when laying out Phase 3 so we don’t have to rework later.
6. Fonts (Exo 2, Orbitron)
“Load via Google Fonts, ensure fonts loaded before first render” can cause a blank or FOUT flash if we’re not careful. I’d plan for one of: preload in HTML, or don’t block first paint and accept a short FOUT with a fallback stack. Deciding up front avoids a last-minute “wait for fonts” that delays first frame.
Summary: No objection to the shift to 5–15 minute, nuanced-but-fast strategy or to the ship production design. The main pushbacks are: doc/code alignment on world size, tightening the Solar Flares and comeback specs so we can implement without guesswork, keeping the Phase 4 gate and refactor scope explicit, and being deliberate about HUD density and font loading so Phase 3 doesn’t create rework. I can turn any of these into a short “implementation notes” section for the Bible or ROADMAP if you want.