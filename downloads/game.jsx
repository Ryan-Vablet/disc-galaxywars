import { useState, useEffect, useRef, useCallback } from "react";

// ─── CONFIG ────────────────────────────────────────────────────────────
const COLORS = {
  player: { main: "#00e5ff", glow: "rgba(0,229,255,0.4)", dark: "#006064", trail: "#00bcd4" },
  enemy: { main: "#ff1744", glow: "rgba(255,23,68,0.4)", dark: "#7f0000", trail: "#ff5252" },
  neutral: { main: "#78909c", glow: "rgba(120,144,156,0.25)", dark: "#37474f", trail: "#90a4ae" },
  bg: "#05080f",
  stars: "#ffffff",
  grid: "rgba(0,229,255,0.03)",
  text: "#e0f7fa",
  accent: "#00e5ff",
};

const PLANET_MIN_R = 28;
const PLANET_MAX_R = 52;
const PRODUCTION_BASE = 0.35;
const FLEET_SPEED = 2.2;
const SEND_RATIO = 0.55;
const AI_TICK = 1800;
const PARTICLE_LIMIT = 600;
const TRAIL_LIMIT = 1200;

// ─── HELPERS ───────────────────────────────────────────────────────────
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (min, max) => Math.random() * (max - min) + min;
const randInt = (min, max) => Math.floor(rand(min, max + 1));
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

function ownerColors(owner) {
  if (owner === 0) return COLORS.player;
  if (owner === 1) return COLORS.enemy;
  return COLORS.neutral;
}

// ─── MAP GENERATION ────────────────────────────────────────────────────
function generatePlanets(w, h, count = 12) {
  const planets = [];
  const pad = 80;
  const attempts = 2000;

  // Player home
  planets.push({
    id: 0, x: pad + 60, y: h / 2, r: PLANET_MAX_R,
    owner: 0, units: 30, maxUnits: 100,
    prodRate: PRODUCTION_BASE * 1.1, pulse: 0, captureFlash: 0,
  });
  // Enemy home
  planets.push({
    id: 1, x: w - pad - 60, y: h / 2, r: PLANET_MAX_R,
    owner: 1, units: 30, maxUnits: 100,
    prodRate: PRODUCTION_BASE * 1.1, pulse: 0, captureFlash: 0,
  });

  for (let i = 2; i < count; i++) {
    for (let a = 0; a < attempts; a++) {
      const r = rand(PLANET_MIN_R, PLANET_MAX_R);
      const x = rand(pad + r, w - pad - r);
      const y = rand(pad + r, h - pad - r);
      let valid = true;
      for (const p of planets) {
        if (dist({ x, y }, p) < p.r + r + 50) { valid = false; break; }
      }
      if (valid) {
        planets.push({
          id: i, x, y, r, owner: -1,
          units: randInt(4, 18), maxUnits: Math.floor(40 + r * 1.2),
          prodRate: PRODUCTION_BASE * (0.7 + (r / PLANET_MAX_R) * 0.6),
          pulse: rand(0, Math.PI * 2), captureFlash: 0,
        });
        break;
      }
    }
  }
  return planets;
}

// ─── AI ────────────────────────────────────────────────────────────────
function aiDecision(planets, fleets) {
  const myPlanets = planets.filter(p => p.owner === 1);
  const targets = planets.filter(p => p.owner !== 1);
  if (myPlanets.length === 0 || targets.length === 0) return null;

  // Incoming threat assessment
  const incomingPlayer = {};
  fleets.filter(f => f.owner === 0).forEach(f => {
    incomingPlayer[f.toId] = (incomingPlayer[f.toId] || 0) + f.units;
  });

  // Score targets
  let bestScore = -Infinity;
  let bestFrom = null;
  let bestTo = null;

  for (const from of myPlanets) {
    const available = Math.floor(from.units * SEND_RATIO);
    if (available < 4) continue;

    for (const to of targets) {
      const d = dist(from, to);
      const travelTime = d / FLEET_SPEED;
      const futureUnits = to.owner === -1 ? to.units : to.units + to.prodRate * travelTime * 0.3;
      const needed = futureUnits + 2;

      if (available < needed * 0.7) continue;

      let score = 0;
      // Prefer weaker targets
      score += (available - needed) * 3;
      // Prefer closer targets
      score -= d * 0.15;
      // Prefer larger planets
      score += to.r * 0.8;
      // Prefer neutral over player
      score += to.owner === -1 ? 15 : -5;
      // Defend against incoming
      if (incomingPlayer[from.id]) {
        score -= 40;
      }

      if (score > bestScore) {
        bestScore = score;
        bestFrom = from;
        bestTo = to;
      }
    }
  }

  if (bestFrom && bestTo && bestScore > -20) {
    return { from: bestFrom.id, to: bestTo.id };
  }
  return null;
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────
export default function GalconGame() {
  const canvasRef = useRef(null);
  const stateRef = useRef(null);
  const frameRef = useRef(null);
  const [screen, setScreen] = useState("menu"); // menu | playing | help | victory | defeat
  const [winner, setWinner] = useState(null);
  const screenRef = useRef(screen);
  screenRef.current = screen;

  // ─── GAME STATE ────────────────────────────────────────────────────
  const initGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = canvas.width;
    const h = canvas.height;
    const planets = generatePlanets(w, h, 14);

    stateRef.current = {
      planets,
      fleets: [],
      particles: [],
      trails: [],
      stars: Array.from({ length: 180 }, () => ({
        x: rand(0, w), y: rand(0, h),
        size: rand(0.4, 2), brightness: rand(0.2, 0.8),
        twinkleSpeed: rand(0.005, 0.03), twinklePhase: rand(0, Math.PI * 2),
      })),
      nebulae: Array.from({ length: 5 }, () => ({
        x: rand(0, w), y: rand(0, h),
        r: rand(100, 300), color: Math.random() > 0.5 ? "cyan" : "red",
        alpha: rand(0.015, 0.04),
      })),
      selection: null,
      dragLine: null,
      hoverPlanet: null,
      time: 0,
      aiTimer: 0,
      shakeTime: 0,
      shakeIntensity: 0,
    };
  }, []);

  // ─── INPUT HANDLING ────────────────────────────────────────────────
  const getCanvasPos = useCallback((e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }, []);

  const findPlanet = useCallback((pos) => {
    const s = stateRef.current;
    if (!s) return null;
    for (const p of s.planets) {
      if (dist(pos, p) < p.r + 10) return p;
    }
    return null;
  }, []);

  const handleDown = useCallback((e) => {
    e.preventDefault();
    if (screenRef.current !== "playing") return;
    const pos = getCanvasPos(e);
    const planet = findPlanet(pos);
    if (planet && planet.owner === 0) {
      stateRef.current.selection = planet.id;
      stateRef.current.dragLine = { x: pos.x, y: pos.y };
    }
  }, [getCanvasPos, findPlanet]);

  const handleMove = useCallback((e) => {
    e.preventDefault();
    if (screenRef.current !== "playing") return;
    const pos = getCanvasPos(e);
    const s = stateRef.current;
    if (!s) return;
    s.hoverPlanet = findPlanet(pos);
    if (s.selection !== null && s.dragLine) {
      s.dragLine.x = pos.x;
      s.dragLine.y = pos.y;
    }
  }, [getCanvasPos, findPlanet]);

  const sendFleet = useCallback((fromId, toId, owner) => {
    const s = stateRef.current;
    const from = s.planets.find(p => p.id === fromId);
    const to = s.planets.find(p => p.id === toId);
    if (!from || !to || from.id === to.id) return;
    const sendUnits = Math.floor(from.units * SEND_RATIO);
    if (sendUnits < 1) return;
    from.units -= sendUnits;

    const angle = Math.atan2(to.y - from.y, to.x - from.x);
    const d = dist(from, to);

    s.fleets.push({
      fromId, toId, owner, units: sendUnits,
      x: from.x, y: from.y,
      tx: to.x, ty: to.y,
      angle, totalDist: d, traveled: 0,
      particles: [],
    });

    // Launch burst particles
    const c = ownerColors(owner);
    for (let i = 0; i < 12; i++) {
      const a = angle + rand(-0.6, 0.6);
      s.particles.push({
        x: from.x + Math.cos(angle) * from.r,
        y: from.y + Math.sin(angle) * from.r,
        vx: Math.cos(a) * rand(1, 3),
        vy: Math.sin(a) * rand(1, 3),
        life: 1, decay: rand(0.02, 0.04),
        size: rand(1.5, 4), color: c.main,
      });
    }
  }, []);

  const handleUp = useCallback((e) => {
    e.preventDefault();
    if (screenRef.current !== "playing") return;
    const s = stateRef.current;
    if (s.selection !== null && s.dragLine) {
      const pos = e.changedTouches ? {
        x: (e.changedTouches[0].clientX - canvasRef.current.getBoundingClientRect().left) * (canvasRef.current.width / canvasRef.current.getBoundingClientRect().width),
        y: (e.changedTouches[0].clientY - canvasRef.current.getBoundingClientRect().top) * (canvasRef.current.height / canvasRef.current.getBoundingClientRect().height),
      } : getCanvasPos(e);
      const target = findPlanet(pos);
      if (target && target.id !== s.selection) {
        sendFleet(s.selection, target.id, 0);
      }
    }
    s.selection = null;
    s.dragLine = null;
  }, [getCanvasPos, findPlanet, sendFleet]);

  // ─── GAME LOOP ─────────────────────────────────────────────────────
  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const s = stateRef.current;
    if (!canvas || !ctx || !s) { frameRef.current = requestAnimationFrame(gameLoop); return; }

    const w = canvas.width;
    const h = canvas.height;
    s.time += 1;
    const dt = 1;

    if (screenRef.current === "playing") {
      // ── Production ──
      for (const p of s.planets) {
        if (p.owner !== -1) {
          p.units = Math.min(p.maxUnits, p.units + p.prodRate * 0.016 * dt);
        }
        p.pulse += 0.04;
        if (p.captureFlash > 0) p.captureFlash -= 0.03;
      }

      // ── Fleets ──
      for (let i = s.fleets.length - 1; i >= 0; i--) {
        const f = s.fleets[i];
        const speed = FLEET_SPEED * dt;
        f.x += Math.cos(f.angle) * speed;
        f.y += Math.sin(f.angle) * speed;
        f.traveled += speed;

        // Trail particles
        if (s.trails.length < TRAIL_LIMIT && s.time % 2 === 0) {
          const c = ownerColors(f.owner);
          s.trails.push({
            x: f.x + rand(-4, 4), y: f.y + rand(-4, 4),
            life: 1, decay: rand(0.025, 0.05),
            size: rand(1, 2.5), color: c.trail,
          });
        }

        // Arrival
        const target = s.planets.find(p => p.id === f.toId);
        if (target && dist(f, target) < target.r + 5) {
          if (target.owner === f.owner) {
            target.units += f.units;
          } else {
            target.units -= f.units;
            if (target.units < 0) {
              // Capture!
              target.owner = f.owner;
              target.units = Math.abs(target.units);
              target.captureFlash = 1;
              s.shakeTime = 12;
              s.shakeIntensity = 4;
              // Capture explosion
              const c = ownerColors(f.owner);
              for (let j = 0; j < 30; j++) {
                const a = rand(0, Math.PI * 2);
                const spd = rand(1, 5);
                s.particles.push({
                  x: target.x, y: target.y,
                  vx: Math.cos(a) * spd, vy: Math.sin(a) * spd,
                  life: 1, decay: rand(0.015, 0.035),
                  size: rand(2, 6), color: c.main,
                });
              }
            } else {
              // Impact particles
              const c = ownerColors(f.owner);
              for (let j = 0; j < 10; j++) {
                const a = rand(0, Math.PI * 2);
                s.particles.push({
                  x: target.x + Math.cos(a) * target.r,
                  y: target.y + Math.sin(a) * target.r,
                  vx: Math.cos(a) * rand(0.5, 2), vy: Math.sin(a) * rand(0.5, 2),
                  life: 1, decay: rand(0.03, 0.06),
                  size: rand(1, 3), color: c.main,
                });
              }
            }
          }
          s.fleets.splice(i, 1);
          continue;
        }

        // Off screen check
        if (f.traveled > f.totalDist + 100) {
          s.fleets.splice(i, 1);
        }
      }

      // ── Particles ──
      for (let i = s.particles.length - 1; i >= 0; i--) {
        const p = s.particles[i];
        p.x += p.vx; p.y += p.vy;
        p.vx *= 0.97; p.vy *= 0.97;
        p.life -= p.decay;
        if (p.life <= 0) s.particles.splice(i, 1);
      }
      while (s.particles.length > PARTICLE_LIMIT) s.particles.shift();

      for (let i = s.trails.length - 1; i >= 0; i--) {
        s.trails[i].life -= s.trails[i].decay;
        if (s.trails[i].life <= 0) s.trails.splice(i, 1);
      }
      while (s.trails.length > TRAIL_LIMIT) s.trails.shift();

      // ── AI ──
      s.aiTimer += 16;
      if (s.aiTimer >= AI_TICK) {
        s.aiTimer = 0;
        const decision = aiDecision(s.planets, s.fleets);
        if (decision) sendFleet(decision.from, decision.to, 1);
      }

      // ── Win/Lose ──
      const playerPlanets = s.planets.filter(p => p.owner === 0).length;
      const enemyPlanets = s.planets.filter(p => p.owner === 1).length;
      const playerFleets = s.fleets.filter(f => f.owner === 0).length;
      const enemyFleets = s.fleets.filter(f => f.owner === 1).length;

      if (playerPlanets === 0 && playerFleets === 0) {
        setWinner(1);
        setScreen("defeat");
      } else if (enemyPlanets === 0 && enemyFleets === 0) {
        setWinner(0);
        setScreen("victory");
      }

      // Screen shake
      if (s.shakeTime > 0) s.shakeTime--;
    }

    // ─── RENDER ──────────────────────────────────────────────────────
    ctx.save();

    // Shake
    if (s.shakeTime > 0) {
      ctx.translate(rand(-s.shakeIntensity, s.shakeIntensity), rand(-s.shakeIntensity, s.shakeIntensity));
    }

    // Background
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(-10, -10, w + 20, h + 20);

    // Nebulae
    for (const nb of s.nebulae) {
      const grad = ctx.createRadialGradient(nb.x, nb.y, 0, nb.x, nb.y, nb.r);
      const c = nb.color === "cyan" ? "0,180,220" : "180,30,60";
      grad.addColorStop(0, `rgba(${c},${nb.alpha * 1.5})`);
      grad.addColorStop(0.5, `rgba(${c},${nb.alpha * 0.5})`);
      grad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(nb.x - nb.r, nb.y - nb.r, nb.r * 2, nb.r * 2);
    }

    // Stars
    for (const star of s.stars) {
      const twinkle = 0.5 + 0.5 * Math.sin(s.time * star.twinkleSpeed + star.twinklePhase);
      ctx.globalAlpha = star.brightness * twinkle;
      ctx.fillStyle = COLORS.stars;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Grid lines (subtle)
    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 0.5;
    for (let x = 0; x < w; x += 60) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 0; y < h; y += 60) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    // ── Drag line ──
    if (s.selection !== null && s.dragLine) {
      const from = s.planets.find(p => p.id === s.selection);
      if (from) {
        ctx.save();
        ctx.strokeStyle = "rgba(0,229,255,0.35)";
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 6]);
        ctx.lineDashOffset = -s.time * 0.5;
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(s.dragLine.x, s.dragLine.y);
        ctx.stroke();
        ctx.restore();
      }
    }

    // ── Trails ──
    for (const t of s.trails) {
      ctx.globalAlpha = t.life * 0.6;
      ctx.fillStyle = t.color;
      ctx.beginPath();
      ctx.arc(t.x, t.y, t.size * t.life, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // ── Fleets ──
    for (const f of s.fleets) {
      const c = ownerColors(f.owner);
      // Fleet glow
      const grad = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, 14);
      grad.addColorStop(0, c.main);
      grad.addColorStop(0.4, c.glow);
      grad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(f.x, f.y, 14, 0, Math.PI * 2);
      ctx.fill();

      // Fleet core
      ctx.fillStyle = c.main;
      ctx.beginPath();
      ctx.arc(f.x, f.y, 4, 0, Math.PI * 2);
      ctx.fill();

      // Unit count
      ctx.fillStyle = "#fff";
      ctx.font = "bold 10px 'Courier New', monospace";
      ctx.textAlign = "center";
      ctx.fillText(f.units, f.x, f.y - 10);
    }

    // ── Planets ──
    for (const p of s.planets) {
      const c = ownerColors(p.owner);
      const pulseScale = 1 + 0.03 * Math.sin(p.pulse);
      const isSelected = s.selection === p.id;
      const isHover = s.hoverPlanet && s.hoverPlanet.id === p.id;

      // Outer glow
      const glowR = p.r * 1.8 * pulseScale;
      const grad = ctx.createRadialGradient(p.x, p.y, p.r * 0.6, p.x, p.y, glowR);
      grad.addColorStop(0, c.glow);
      grad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, glowR, 0, Math.PI * 2);
      ctx.fill();

      // Capture flash
      if (p.captureFlash > 0) {
        ctx.globalAlpha = p.captureFlash * 0.5;
        ctx.fillStyle = c.main;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 2.5 * (1 - p.captureFlash * 0.5), 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // Planet body (dark interior for avatar)
      ctx.fillStyle = p.owner === -1 ? "#1a2333" : c.dark;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * pulseScale, 0, Math.PI * 2);
      ctx.fill();

      // Inner gradient
      const innerGrad = ctx.createRadialGradient(
        p.x - p.r * 0.25, p.y - p.r * 0.25, 0,
        p.x, p.y, p.r * pulseScale
      );
      innerGrad.addColorStop(0, "rgba(255,255,255,0.08)");
      innerGrad.addColorStop(1, "rgba(0,0,0,0.3)");
      ctx.fillStyle = innerGrad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * pulseScale, 0, Math.PI * 2);
      ctx.fill();

      // Ring border
      ctx.strokeStyle = c.main;
      ctx.lineWidth = isSelected ? 3.5 : isHover ? 2.5 : 1.8;
      ctx.globalAlpha = isSelected ? 1 : 0.8;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * pulseScale, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;

      // Selection ring
      if (isSelected) {
        ctx.strokeStyle = c.main;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.5 + 0.3 * Math.sin(s.time * 0.1);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 1.35, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      // Avatar placeholder icon
      ctx.fillStyle = c.main;
      ctx.globalAlpha = 0.25;
      const iconR = p.r * 0.35;
      // Head
      ctx.beginPath();
      ctx.arc(p.x, p.y - iconR * 0.35, iconR * 0.45, 0, Math.PI * 2);
      ctx.fill();
      // Body
      ctx.beginPath();
      ctx.arc(p.x, p.y + iconR * 0.55, iconR * 0.65, Math.PI, 0);
      ctx.fill();
      ctx.globalAlpha = 1;

      // Production ring (shows unit capacity)
      if (p.owner !== -1) {
        const pct = clamp(p.units / p.maxUnits, 0, 1);
        ctx.strokeStyle = c.main;
        ctx.lineWidth = 2.5;
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r + 6, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * pct);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      // Unit count
      ctx.fillStyle = "#fff";
      ctx.font = `bold ${p.r > 35 ? 16 : 13}px 'Courier New', monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = "rgba(0,0,0,0.8)";
      ctx.shadowBlur = 4;
      ctx.fillText(Math.floor(p.units), p.x, p.y + p.r * 0.55 + 14);
      ctx.shadowBlur = 0;
    }

    // ── Particles ──
    for (const p of s.particles) {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // ── HUD ──
    if (screenRef.current === "playing") {
      const playerCount = s.planets.filter(p => p.owner === 0).length;
      const enemyCount = s.planets.filter(p => p.owner === 1).length;
      const neutralCount = s.planets.filter(p => p.owner === -1).length;
      const totalUnitsP = Math.floor(s.planets.filter(p => p.owner === 0).reduce((a, p) => a + p.units, 0));
      const totalUnitsE = Math.floor(s.planets.filter(p => p.owner === 1).reduce((a, p) => a + p.units, 0));

      // Top bar
      ctx.fillStyle = "rgba(5,8,15,0.7)";
      ctx.fillRect(0, 0, w, 42);
      ctx.strokeStyle = "rgba(0,229,255,0.15)";
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, 42); ctx.lineTo(w, 42); ctx.stroke();

      ctx.font = "bold 13px 'Courier New', monospace";
      ctx.textBaseline = "middle";

      // Player stats
      ctx.textAlign = "left";
      ctx.fillStyle = COLORS.player.main;
      ctx.fillText(`⬡ YOU`, 16, 21);
      ctx.fillStyle = "#aaa";
      ctx.fillText(`${playerCount} planets  ·  ${totalUnitsP} units`, 80, 21);

      // Enemy stats
      ctx.textAlign = "right";
      ctx.fillStyle = COLORS.enemy.main;
      ctx.fillText(`BOT ⬡`, w - 16, 21);
      ctx.fillStyle = "#aaa";
      ctx.fillText(`${enemyCount} planets  ·  ${totalUnitsE} units`, w - 80, 21);

      // Center
      ctx.textAlign = "center";
      ctx.fillStyle = "#546e7a";
      ctx.fillText(`${neutralCount} neutral`, w / 2, 21);
    }

    ctx.restore();

    frameRef.current = requestAnimationFrame(gameLoop);
  }, [sendFleet]);

  // ─── LIFECYCLE ─────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const container = canvas.parentElement;
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      if (screenRef.current === "menu") initGame();
    };
    resize();
    window.addEventListener("resize", resize);

    initGame();
    frameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(frameRef.current);
    };
  }, [initGame, gameLoop]);

  // Reattach input handlers
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const opts = { passive: false };
    canvas.addEventListener("mousedown", handleDown, opts);
    canvas.addEventListener("mousemove", handleMove, opts);
    canvas.addEventListener("mouseup", handleUp, opts);
    canvas.addEventListener("touchstart", handleDown, opts);
    canvas.addEventListener("touchmove", handleMove, opts);
    canvas.addEventListener("touchend", handleUp, opts);
    return () => {
      canvas.removeEventListener("mousedown", handleDown);
      canvas.removeEventListener("mousemove", handleMove);
      canvas.removeEventListener("mouseup", handleUp);
      canvas.removeEventListener("touchstart", handleDown);
      canvas.removeEventListener("touchmove", handleMove);
      canvas.removeEventListener("touchend", handleUp);
    };
  }, [handleDown, handleMove, handleUp]);

  const startGame = () => {
    initGame();
    setScreen("playing");
  };

  const btnBase = {
    background: "transparent",
    border: "1px solid rgba(0,229,255,0.5)",
    color: COLORS.accent,
    padding: "12px 36px",
    fontSize: 15,
    fontFamily: "'Courier New', monospace",
    fontWeight: "bold",
    cursor: "pointer",
    letterSpacing: 2,
    textTransform: "uppercase",
    transition: "all 0.3s",
    borderRadius: 0,
  };

  // ─── OVERLAY SCREENS ──────────────────────────────────────────────
  const overlayBase = {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    background: "rgba(5,8,15,0.92)", zIndex: 10,
    fontFamily: "'Courier New', monospace", color: COLORS.text,
  };

  return (
    <div style={{ width: "100%", height: "100vh", background: COLORS.bg, position: "relative", overflow: "hidden" }}>
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />

      {/* MENU SCREEN */}
      {screen === "menu" && (
        <div style={overlayBase}>
          <div style={{ textAlign: "center" }}>
            <div style={{
              fontSize: 11, letterSpacing: 8, color: "#546e7a",
              marginBottom: 8, textTransform: "uppercase",
            }}>
              DISCORD ACTIVITY
            </div>
            <h1 style={{
              fontSize: 52, fontWeight: 900, margin: 0,
              color: COLORS.accent,
              textShadow: `0 0 40px rgba(0,229,255,0.4), 0 0 80px rgba(0,229,255,0.15)`,
              letterSpacing: 4, lineHeight: 1,
            }}>
              NODE WARS
            </h1>
            <div style={{
              fontSize: 13, color: "#78909c", marginTop: 8, letterSpacing: 3,
              textTransform: "uppercase",
            }}>
              Galactic Conquest
            </div>
            <div style={{
              width: 60, height: 1, background: `linear-gradient(90deg, transparent, ${COLORS.accent}, transparent)`,
              margin: "24px auto",
            }} />
            <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 16 }}>
              <button
                onClick={startGame}
                style={{ ...btnBase, background: "rgba(0,229,255,0.1)" }}
                onMouseEnter={e => { e.target.style.background = "rgba(0,229,255,0.25)"; e.target.style.borderColor = COLORS.accent; }}
                onMouseLeave={e => { e.target.style.background = "rgba(0,229,255,0.1)"; e.target.style.borderColor = "rgba(0,229,255,0.5)"; }}
              >
                ▶ PLAY vs BOT
              </button>
              <button
                onClick={() => setScreen("help")}
                style={btnBase}
                onMouseEnter={e => { e.target.style.background = "rgba(0,229,255,0.15)"; }}
                onMouseLeave={e => { e.target.style.background = "transparent"; }}
              >
                ? HOW TO PLAY
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HELP SCREEN */}
      {screen === "help" && (
        <div style={overlayBase}>
          <div style={{ maxWidth: 520, padding: "0 24px", textAlign: "left" }}>
            <h2 style={{
              fontSize: 28, color: COLORS.accent, margin: "0 0 20px 0",
              letterSpacing: 3, textAlign: "center",
            }}>
              HOW TO PLAY
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {[
                { icon: "⬡", title: "CAPTURE PLANETS", desc: "Planets generate units over time. Capture all planets to win." },
                { icon: "⟶", title: "SEND FLEETS", desc: "Click & drag from your planet to any target. 55% of your units will launch." },
                { icon: "⚔", title: "COMBAT", desc: "Attacking units subtract from defenders. If attackers remain, the planet is captured." },
                { icon: "◉", title: "STRATEGY", desc: "Larger planets produce faster. Overwhelm weak targets. Don't overextend." },
                { icon: "◎", title: "AVATARS", desc: "In multiplayer, captured planets show your Discord avatar." },
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <div style={{
                    fontSize: 22, color: COLORS.accent, width: 32, textAlign: "center",
                    flexShrink: 0, lineHeight: "28px",
                  }}>
                    {item.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: "bold", color: COLORS.accent, letterSpacing: 1, marginBottom: 3 }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: 13, color: "#90a4ae", lineHeight: 1.5 }}>
                      {item.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ textAlign: "center", marginTop: 28 }}>
              <button
                onClick={() => setScreen("menu")}
                style={btnBase}
                onMouseEnter={e => { e.target.style.background = "rgba(0,229,255,0.15)"; }}
                onMouseLeave={e => { e.target.style.background = "transparent"; }}
              >
                ← BACK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VICTORY SCREEN */}
      {screen === "victory" && (
        <div style={overlayBase}>
          <div style={{ textAlign: "center" }}>
            <div style={{
              fontSize: 14, letterSpacing: 6, color: COLORS.player.main,
              marginBottom: 12, textTransform: "uppercase",
            }}>
              CONQUEST COMPLETE
            </div>
            <h2 style={{
              fontSize: 46, fontWeight: 900, color: "#fff", margin: 0,
              textShadow: `0 0 30px ${COLORS.player.glow}`,
            }}>
              VICTORY
            </h2>
            <div style={{
              width: 60, height: 1, background: `linear-gradient(90deg, transparent, ${COLORS.player.main}, transparent)`,
              margin: "20px auto",
            }} />
            <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
              <button
                onClick={startGame}
                style={{ ...btnBase, borderColor: COLORS.player.main, color: COLORS.player.main }}
                onMouseEnter={e => { e.target.style.background = "rgba(0,229,255,0.15)"; }}
                onMouseLeave={e => { e.target.style.background = "transparent"; }}
              >
                PLAY AGAIN
              </button>
              <button
                onClick={() => setScreen("menu")}
                style={btnBase}
                onMouseEnter={e => { e.target.style.background = "rgba(0,229,255,0.15)"; }}
                onMouseLeave={e => { e.target.style.background = "transparent"; }}
              >
                MENU
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DEFEAT SCREEN */}
      {screen === "defeat" && (
        <div style={overlayBase}>
          <div style={{ textAlign: "center" }}>
            <div style={{
              fontSize: 14, letterSpacing: 6, color: COLORS.enemy.main,
              marginBottom: 12, textTransform: "uppercase",
            }}>
              SYSTEMS OVERWHELMED
            </div>
            <h2 style={{
              fontSize: 46, fontWeight: 900, color: "#fff", margin: 0,
              textShadow: `0 0 30px ${COLORS.enemy.glow}`,
            }}>
              DEFEAT
            </h2>
            <div style={{
              width: 60, height: 1, background: `linear-gradient(90deg, transparent, ${COLORS.enemy.main}, transparent)`,
              margin: "20px auto",
            }} />
            <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
              <button
                onClick={startGame}
                style={{ ...btnBase, borderColor: COLORS.enemy.main, color: COLORS.enemy.main }}
                onMouseEnter={e => { e.target.style.background = "rgba(255,23,68,0.15)"; }}
                onMouseLeave={e => { e.target.style.background = "transparent"; }}
              >
                TRY AGAIN
              </button>
              <button
                onClick={() => setScreen("menu")}
                style={btnBase}
                onMouseEnter={e => { e.target.style.background = "rgba(0,229,255,0.15)"; }}
                onMouseLeave={e => { e.target.style.background = "transparent"; }}
              >
                MENU
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-game help button */}
      {screen === "playing" && (
        <button
          onClick={() => setScreen("help")}
          style={{
            position: "absolute", top: 8, left: "50%", transform: "translateX(-50%)",
            background: "rgba(5,8,15,0.5)", border: "1px solid rgba(0,229,255,0.2)",
            color: "#546e7a", fontSize: 11, fontFamily: "'Courier New', monospace",
            padding: "4px 14px", cursor: "pointer", zIndex: 5, letterSpacing: 1,
          }}
          onMouseEnter={e => { e.target.style.color = COLORS.accent; }}
          onMouseLeave={e => { e.target.style.color = "#546e7a"; }}
        >
          ?
        </button>
      )}
    </div>
  );
}
