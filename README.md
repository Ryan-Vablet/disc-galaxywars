# Node Wars

A fast-paced planetary conquest game in the browser. Capture planets, build fleets, and eliminate your opponents. Built with TypeScript, Vite, and Canvas.

---

## What you get

- **Conquest loop:** Select your planets, drag to a target, release to send a fleet. No extra steps.
- **Planet types:** Different worlds with distinct unit caps and production rates. Capture the high-value ones and defend your homeworld.
- **Single-player vs bots:** Choose bot count (0–7) and difficulty. Tune map size and game speed from the title screen.
- **Camera:** Pan, zoom, and rotate the map. Reset the view to your homeworld with Home or F.
- **Web tech:** Canvas 2D and WebGL for planet rendering. No framework; vanilla TypeScript.

Match length depends on map size and speed settings. Win by capturing all enemy planets and fleets.

---

## Tech

- **Client:** TypeScript, Vite, Canvas 2D, WebGL (Three.js for planet shaders). Lives in `game/client`.
- **Server:** Node in `game/server` (minimal for now).

---

## Development

**Requirements:** Node 18+.

```bash
# Install
npm install

# Run client and server
npm run dev

# Client only (default: http://localhost:5173)
npm run dev:client

# Build
npm run build

# Deploy client to GitHub Pages
npm run deploy:gh-pages

# Test and lint
npm run test
npm run lint
```

Work is done in `game/client` for the game and `game/server` for the backend.
