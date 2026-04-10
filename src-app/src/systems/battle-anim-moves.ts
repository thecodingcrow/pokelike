// battle-anim-moves.ts — Named move animations + top-level dispatch

import {
  runCanvas,
  runParticleCanvas,
  lerp,
  angleBetween,
  distBetween,
  randomInRange,
  hexToRgba,
  TYPE_COLORS,
} from './battle-anim';
import { buildParticles, TYPE_DURATIONS } from './battle-anim-types';

// ---- Coord alias ------------------------------------------------------------

type Pt = { x: number; y: number };

// ---- Bezier helper ----------------------------------------------------------

function quadBezier(p0: Pt, p1: Pt, p2: Pt, t: number): Pt {
  const mt = 1 - t;
  return {
    x: mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x,
    y: mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y,
  };
}

// ---- Named physical moves ---------------------------------------------------

// 1. Body Slam — large circle travels from→to, then 4 impact sparks at to
function bodySlam(
  ctx: CanvasRenderingContext2D,
  from: Pt,
  to: Pt,
  speed: number,
): Promise<void> {
  const color = TYPE_COLORS['normal'];
  return runCanvas(
    ctx,
    400,
    (c, t) => {
      if (t < 0.65) {
        // Travel phase
        const tTravel = t / 0.65;
        const x = lerp(from.x, to.x, tTravel);
        const y = lerp(from.y, to.y, tTravel);
        const size = lerp(8, 20, tTravel);
        c.beginPath();
        c.arc(x, y, size, 0, Math.PI * 2);
        c.fillStyle = hexToRgba(color, 0.85);
        c.fill();
        // Trailing ghost
        const tx2 = lerp(from.x, to.x, Math.max(0, tTravel - 0.15));
        const ty2 = lerp(from.y, to.y, Math.max(0, tTravel - 0.15));
        c.beginPath();
        c.arc(tx2, ty2, size * 0.6, 0, Math.PI * 2);
        c.fillStyle = hexToRgba(color, 0.3);
        c.fill();
      } else {
        // Impact sparks
        const tImpact = (t - 0.65) / 0.35;
        for (let i = 0; i < 4; i++) {
          const angle = (i / 4) * Math.PI * 2 + Math.PI * 0.25;
          const dist = tImpact * 28;
          const alpha = Math.max(0, 1 - tImpact * 1.4);
          c.beginPath();
          c.arc(
            to.x + Math.cos(angle) * dist,
            to.y + Math.sin(angle) * dist,
            lerp(5, 2, tImpact),
            0,
            Math.PI * 2,
          );
          c.fillStyle = hexToRgba(color, alpha);
          c.fill();
        }
        // Fading impact flash
        c.beginPath();
        c.arc(to.x, to.y, lerp(20, 4, tImpact), 0, Math.PI * 2);
        c.fillStyle = hexToRgba('#ffffff', Math.max(0, 0.6 - tImpact * 0.6));
        c.fill();
      }
    },
    speed,
  );
}

// 2. Fire Punch — fist arc from→to, fire trail
function firePunch(
  ctx: CanvasRenderingContext2D,
  from: Pt,
  to: Pt,
  speed: number,
): Promise<void> {
  const ctrl: Pt = { x: (from.x + to.x) / 2, y: Math.min(from.y, to.y) - 40 };
  const fireColors = ['#ff2200', '#ff6600', '#ffaa00', '#ffff80'];
  return runCanvas(
    ctx,
    380,
    (c, t) => {
      const tClamp = Math.min(t, 1);
      const pos = quadBezier(from, ctrl, to, tClamp);
      // Trail
      for (let i = 3; i >= 0; i--) {
        const tTrail = Math.max(0, tClamp - i * 0.06);
        const trailPos = quadBezier(from, ctrl, to, tTrail);
        const trailAlpha = (0.4 - i * 0.08) * (1 - tClamp * 0.5);
        c.beginPath();
        c.arc(trailPos.x, trailPos.y, lerp(10, 6, i / 3), 0, Math.PI * 2);
        c.fillStyle = hexToRgba(fireColors[i], Math.max(0, trailAlpha));
        c.fill();
      }
      // Main fist circle
      const mainColor = fireColors[Math.floor(tClamp * (fireColors.length - 1))];
      c.beginPath();
      c.arc(pos.x, pos.y, 12, 0, Math.PI * 2);
      c.fillStyle = hexToRgba(mainColor, 0.9);
      c.fill();
      // Core white
      c.beginPath();
      c.arc(pos.x, pos.y, 5, 0, Math.PI * 2);
      c.fillStyle = hexToRgba('#ffffff', 0.7 * (1 - tClamp * 0.8));
      c.fill();
    },
    speed,
  );
}

// 3. Waterfall — water column rises then slams
function waterfall(
  ctx: CanvasRenderingContext2D,
  from: Pt,
  to: Pt,
  speed: number,
): Promise<void> {
  void from;
  const waterColors = ['#6ab4f5', '#3b82f6', '#93c5fd', '#ffffff'];
  // Pre-generate particle positions for determinism across frames
  const drops = Array.from({ length: 15 }, (_, i) => ({
    ox: randomInRange(-20, 20),
    delay: i * 0.04,
    color: waterColors[i % waterColors.length],
    size: randomInRange(3, 6),
  }));
  return runCanvas(
    ctx,
    450,
    (c, t) => {
      // Rise phase (0→0.5): particles shoot up from below to
      // Slam phase (0.5→1): particles fall back / burst
      for (const drop of drops) {
        const tLocal = Math.max(0, t - drop.delay);
        if (tLocal <= 0) continue;
        if (tLocal < 0.5) {
          // Rising
          const tRise = tLocal / 0.5;
          const x = to.x + drop.ox;
          const y = lerp(to.y + 60, to.y - 30, tRise);
          c.beginPath();
          c.arc(x, y, drop.size, 0, Math.PI * 2);
          c.fillStyle = hexToRgba(drop.color, 0.8 * tRise);
          c.fill();
        } else {
          // Slamming down
          const tSlam = (tLocal - 0.5) / 0.5;
          const x = to.x + drop.ox;
          const y = lerp(to.y - 30, to.y + 20, tSlam * tSlam);
          c.beginPath();
          c.arc(x, y, drop.size * (1 + tSlam * 0.5), 0, Math.PI * 2);
          c.fillStyle = hexToRgba(drop.color, Math.max(0, 0.8 - tSlam * 0.8));
          c.fill();
        }
      }
      // Impact splash rings at slam time
      if (t > 0.55) {
        const tSplash = (t - 0.55) / 0.45;
        for (let r = 0; r < 3; r++) {
          const rDelay = r * 0.2;
          const tRing = Math.max(0, tSplash - rDelay);
          if (tRing <= 0) continue;
          const ringAlpha = Math.max(0, 0.6 - tRing * 0.6);
          c.beginPath();
          c.arc(to.x, to.y, tRing * 30 + r * 6, 0, Math.PI * 2);
          c.strokeStyle = hexToRgba('#6ab4f5', ringAlpha);
          c.lineWidth = 2;
          c.stroke();
        }
      }
    },
    speed,
  );
}

// 4. Thunder Punch — arc + zigzag sparks at impact
function thunderPunch(
  ctx: CanvasRenderingContext2D,
  from: Pt,
  to: Pt,
  speed: number,
): Promise<void> {
  const ctrl: Pt = { x: (from.x + to.x) / 2, y: Math.min(from.y, to.y) - 40 };
  const elecColors = ['#f8d030', '#fffacd', '#ffffff'];
  return runCanvas(
    ctx,
    380,
    (c, t) => {
      const tClamp = Math.min(t, 1);
      const pos = quadBezier(from, ctrl, to, tClamp);
      // Electric trail — jittery
      for (let i = 2; i >= 0; i--) {
        const tTrail = Math.max(0, tClamp - i * 0.08);
        const trailPos = quadBezier(from, ctrl, to, tTrail);
        c.beginPath();
        c.arc(trailPos.x + randomInRange(-3, 3), trailPos.y + randomInRange(-3, 3), lerp(9, 5, i / 2), 0, Math.PI * 2);
        c.fillStyle = hexToRgba(elecColors[i], 0.35 - i * 0.1);
        c.fill();
      }
      // Main orb
      c.beginPath();
      c.arc(pos.x, pos.y, 11, 0, Math.PI * 2);
      c.fillStyle = hexToRgba('#f8d030', 0.9);
      c.fill();
      c.beginPath();
      c.arc(pos.x, pos.y, 5, 0, Math.PI * 2);
      c.fillStyle = hexToRgba('#ffffff', 0.8 * (1 - tClamp * 0.7));
      c.fill();
      // Zigzag sparks at impact
      if (tClamp > 0.75) {
        const tSpark = (tClamp - 0.75) / 0.25;
        for (let s = 0; s < 3; s++) {
          const baseAngle = (s / 3) * Math.PI * 2;
          const len = tSpark * 20;
          c.beginPath();
          c.moveTo(to.x, to.y);
          c.lineTo(
            to.x + Math.cos(baseAngle) * len * 0.5 + randomInRange(-5, 5),
            to.y + Math.sin(baseAngle) * len * 0.5 + randomInRange(-5, 5),
          );
          c.lineTo(
            to.x + Math.cos(baseAngle) * len + randomInRange(-4, 4),
            to.y + Math.sin(baseAngle) * len + randomInRange(-4, 4),
          );
          c.strokeStyle = hexToRgba('#f8d030', Math.max(0, 0.8 - tSpark * 0.8));
          c.lineWidth = 2;
          c.stroke();
        }
      }
    },
    speed,
  );
}

// 5. Razor Leaf — 5 green ellipses spread pattern
function razorLeaf(
  ctx: CanvasRenderingContext2D,
  from: Pt,
  to: Pt,
  speed: number,
): Promise<void> {
  const angle = angleBetween(from, to);
  const leafOffsets = [-0.25, -0.12, 0, 0.12, 0.25];
  const delays = [0.05, 0.02, 0, 0.02, 0.05];
  const green = TYPE_COLORS['grass'];
  return runCanvas(
    ctx,
    400,
    (c, t) => {
      for (let i = 0; i < 5; i++) {
        const tLocal = Math.max(0, (t - delays[i]) / (1 - delays[i]));
        const spreadAngle = angle + leafOffsets[i];
        const x = lerp(from.x, to.x + Math.cos(spreadAngle) * 10, tLocal);
        const y = lerp(from.y, to.y + Math.sin(spreadAngle) * 10, tLocal);
        const alpha = tLocal < 0.8 ? 0.9 : Math.max(0, 0.9 - (tLocal - 0.8) / 0.2 * 0.9);
        c.save();
        c.translate(x, y);
        c.rotate(spreadAngle + tLocal * Math.PI * 2);
        c.globalAlpha = alpha;
        c.beginPath();
        c.ellipse(0, 0, 10, 4, 0, 0, Math.PI * 2);
        c.fillStyle = green;
        c.fill();
        c.restore();
      }
    },
    speed,
  );
}

// 6. Ice Punch — arc + crystal sparkle at impact
function icePunch(
  ctx: CanvasRenderingContext2D,
  from: Pt,
  to: Pt,
  speed: number,
): Promise<void> {
  const ctrl: Pt = { x: (from.x + to.x) / 2, y: Math.min(from.y, to.y) - 40 };
  const iceColors = ['#98d8d8', '#b0f0f0', '#ffffff'];
  return runCanvas(
    ctx,
    380,
    (c, t) => {
      const tClamp = Math.min(t, 1);
      const pos = quadBezier(from, ctrl, to, tClamp);
      // Frosty trail
      for (let i = 2; i >= 0; i--) {
        const tTrail = Math.max(0, tClamp - i * 0.07);
        const tp = quadBezier(from, ctrl, to, tTrail);
        c.beginPath();
        c.arc(tp.x, tp.y, lerp(9, 4, i / 2), 0, Math.PI * 2);
        c.fillStyle = hexToRgba(iceColors[i % iceColors.length], 0.3 - i * 0.08);
        c.fill();
      }
      // Main orb
      c.beginPath();
      c.arc(pos.x, pos.y, 12, 0, Math.PI * 2);
      c.fillStyle = hexToRgba('#98d8d8', 0.88);
      c.fill();
      c.beginPath();
      c.arc(pos.x, pos.y, 5, 0, Math.PI * 2);
      c.fillStyle = hexToRgba('#ffffff', 0.7 * (1 - tClamp * 0.6));
      c.fill();
      // Crystal sparkles at impact
      if (tClamp > 0.72) {
        const tCrystal = (tClamp - 0.72) / 0.28;
        for (let s = 0; s < 6; s++) {
          const ang = (s / 6) * Math.PI * 2;
          const r = tCrystal * 22;
          const sparkAlpha = Math.max(0, 0.9 - tCrystal * 0.9);
          // Draw small diamond
          c.save();
          c.translate(to.x + Math.cos(ang) * r, to.y + Math.sin(ang) * r);
          c.rotate(ang);
          c.globalAlpha = sparkAlpha;
          c.beginPath();
          c.moveTo(0, -4);
          c.lineTo(2, 0);
          c.lineTo(0, 4);
          c.lineTo(-2, 0);
          c.closePath();
          c.fillStyle = '#d8f8f8';
          c.fill();
          c.restore();
        }
      }
    },
    speed,
  );
}

// 7. Close Combat — 5 rapid impact flashes at to, staggered
function closeCombat(
  ctx: CanvasRenderingContext2D,
  from: Pt,
  to: Pt,
  speed: number,
): Promise<void> {
  void from;
  const impactColors = ['#c03028', '#ff4040', '#ff8060', '#ff4040', '#c03028'];
  const offsets: Pt[] = [
    { x: -12, y: -8 },
    { x: 10, y: -14 },
    { x: 0, y: 0 },
    { x: -8, y: 10 },
    { x: 14, y: 6 },
  ];
  return runCanvas(
    ctx,
    500,
    (c, t) => {
      for (let i = 0; i < 5; i++) {
        const window = 0.18;
        const tStart = i * 0.16;
        const tLocal = (t - tStart) / window;
        if (tLocal <= 0 || tLocal > 1.5) continue;
        const alpha = tLocal < 0.5
          ? tLocal * 2
          : Math.max(0, 1 - (tLocal - 0.5) * 1.33);
        const size = lerp(4, 16, Math.min(tLocal, 1));
        c.beginPath();
        c.arc(to.x + offsets[i].x, to.y + offsets[i].y, size, 0, Math.PI * 2);
        c.fillStyle = hexToRgba(impactColors[i], alpha * 0.85);
        c.fill();
        // Cross lines
        const cx = to.x + offsets[i].x;
        const cy = to.y + offsets[i].y;
        c.save();
        c.globalAlpha = alpha * 0.7;
        c.strokeStyle = '#ffffff';
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(cx - size, cy);
        c.lineTo(cx + size, cy);
        c.stroke();
        c.beginPath();
        c.moveTo(cx, cy - size);
        c.lineTo(cx, cy + size);
        c.stroke();
        c.restore();
      }
    },
    speed,
  );
}

// 8. Poison Jab — thin line extends from→to, purple glow at tip
function poisonJab(
  ctx: CanvasRenderingContext2D,
  from: Pt,
  to: Pt,
  speed: number,
): Promise<void> {
  const purple = TYPE_COLORS['poison'];
  return runCanvas(
    ctx,
    350,
    (c, t) => {
      const tExtend = Math.min(t * 2, 1);
      const tFade = t < 0.5 ? 0 : (t - 0.5) / 0.5;
      const endX = lerp(from.x, to.x, tExtend);
      const endY = lerp(from.y, to.y, tExtend);
      const lineAlpha = Math.max(0, 1 - tFade * 0.8);
      // Stab line
      c.save();
      c.globalAlpha = lineAlpha;
      c.strokeStyle = purple;
      c.lineWidth = 3;
      c.lineCap = 'round';
      c.beginPath();
      c.moveTo(from.x, from.y);
      c.lineTo(endX, endY);
      c.stroke();
      // Tip glow
      const glowAlpha = tExtend * (1 - tFade);
      c.beginPath();
      c.arc(endX, endY, lerp(4, 8, tExtend) * (1 - tFade * 0.6), 0, Math.PI * 2);
      c.fillStyle = hexToRgba('#e080e0', Math.max(0, glowAlpha * 0.7));
      c.fill();
      c.restore();
    },
    speed,
  );
}

// 9. Earthquake — horizontal oscillating lines across canvas
function earthquake(
  ctx: CanvasRenderingContext2D,
  from: Pt,
  to: Pt,
  speed: number,
): Promise<void> {
  void from;
  void to;
  const brown = '#b08838';
  const cw = ctx.canvas.width / devicePixelRatio;
  const ch = ctx.canvas.height / devicePixelRatio;
  return runCanvas(
    ctx,
    600,
    (c, t) => {
      const intensity = t < 0.5 ? t * 2 : Math.max(0, 1 - (t - 0.5) * 2);
      const numLines = 8;
      for (let i = 0; i < numLines; i++) {
        const baseY = (i / numLines) * ch + ch / (numLines * 2);
        const phaseShift = (i * 1.4) + t * Math.PI * 8;
        const amp = intensity * (6 + (i % 3) * 3);
        c.save();
        c.globalAlpha = intensity * 0.6;
        c.strokeStyle = brown;
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(0, baseY + Math.sin(phaseShift) * amp);
        for (let x = 0; x <= cw; x += 8) {
          const y = baseY + Math.sin((x / cw) * Math.PI * 3 + phaseShift) * amp;
          c.lineTo(x, y);
        }
        c.stroke();
        c.restore();
      }
      // Crack radiating from to (center-ish)
      if (t > 0.1) {
        const tCrack = Math.min((t - 0.1) / 0.6, 1);
        const crackLen = tCrack * 40;
        const crackAlpha = intensity * 0.7;
        const cx = cw / 2;
        const cy = ch * 0.55;
        const crackAngles = [0, Math.PI / 3, -Math.PI / 3, Math.PI * 2 / 3];
        c.save();
        c.globalAlpha = crackAlpha;
        c.strokeStyle = '#8a6828';
        c.lineWidth = 2;
        for (const ang of crackAngles) {
          c.beginPath();
          c.moveTo(cx, cy);
          c.lineTo(cx + Math.cos(ang) * crackLen, cy + Math.sin(ang) * crackLen);
          c.stroke();
        }
        c.restore();
      }
    },
    speed,
  );
}

// 10. Aerial Ace — fast diagonal slash across to, light blue
function aerialAce(
  ctx: CanvasRenderingContext2D,
  from: Pt,
  to: Pt,
  speed: number,
): Promise<void> {
  void from;
  const flying = TYPE_COLORS['flying'];
  return runCanvas(
    ctx,
    400,
    (c, t) => {
      const tFade = t < 0.4 ? t / 0.4 : Math.max(0, 1 - (t - 0.4) / 0.6);
      const slashLen = 45;
      const angle = -Math.PI / 4; // diagonal
      c.save();
      c.globalAlpha = tFade * 0.9;
      c.strokeStyle = flying;
      c.lineWidth = 3;
      c.lineCap = 'round';
      c.beginPath();
      c.moveTo(to.x - Math.cos(angle) * slashLen, to.y - Math.sin(angle) * slashLen);
      c.lineTo(to.x + Math.cos(angle) * slashLen, to.y + Math.sin(angle) * slashLen);
      c.stroke();
      // Glow blur
      c.lineWidth = 7;
      c.globalAlpha = tFade * 0.25;
      c.beginPath();
      c.moveTo(to.x - Math.cos(angle) * slashLen, to.y - Math.sin(angle) * slashLen);
      c.lineTo(to.x + Math.cos(angle) * slashLen, to.y + Math.sin(angle) * slashLen);
      c.stroke();
      c.restore();
    },
    speed,
  );
}

// 11. Zen Headbutt — pink pulsing energy ball travels from→to
function zenHeadbutt(
  ctx: CanvasRenderingContext2D,
  from: Pt,
  to: Pt,
  speed: number,
): Promise<void> {
  const pink = TYPE_COLORS['psychic'];
  return runCanvas(
    ctx,
    400,
    (c, t) => {
      const x = lerp(from.x, to.x, t);
      const y = lerp(from.y, to.y, t);
      const pulse = 1 + Math.sin(t * Math.PI * 6) * 0.3;
      const alpha = t < 0.85 ? 0.9 : Math.max(0, 0.9 - (t - 0.85) / 0.15 * 0.9);
      // Outer aura
      c.beginPath();
      c.arc(x, y, 16 * pulse, 0, Math.PI * 2);
      c.fillStyle = hexToRgba(pink, alpha * 0.35);
      c.fill();
      // Main orb
      c.beginPath();
      c.arc(x, y, 10 * pulse, 0, Math.PI * 2);
      c.fillStyle = hexToRgba(pink, alpha * 0.9);
      c.fill();
      // Core
      c.beginPath();
      c.arc(x, y, 4, 0, Math.PI * 2);
      c.fillStyle = hexToRgba('#ffffff', alpha * 0.8);
      c.fill();
    },
    speed,
  );
}

// 12. X-Scissor — two crossing slash lines at to, green
function xScissor(
  ctx: CanvasRenderingContext2D,
  from: Pt,
  to: Pt,
  speed: number,
): Promise<void> {
  void from;
  const bugColor = TYPE_COLORS['bug'];
  return runCanvas(
    ctx,
    400,
    (c, t) => {
      const tFade = t < 0.35 ? t / 0.35 : Math.max(0, 1 - (t - 0.35) / 0.65);
      const slashLen = 36;
      c.save();
      c.globalAlpha = tFade * 0.92;
      c.strokeStyle = bugColor;
      c.lineWidth = 3;
      c.lineCap = 'round';
      // First slash: top-left to bottom-right
      c.beginPath();
      c.moveTo(to.x - slashLen, to.y - slashLen);
      c.lineTo(to.x + slashLen, to.y + slashLen);
      c.stroke();
      // Second slash: top-right to bottom-left
      c.beginPath();
      c.moveTo(to.x + slashLen, to.y - slashLen);
      c.lineTo(to.x - slashLen, to.y + slashLen);
      c.stroke();
      // Glow layer
      c.lineWidth = 7;
      c.globalAlpha = tFade * 0.2;
      c.beginPath();
      c.moveTo(to.x - slashLen, to.y - slashLen);
      c.lineTo(to.x + slashLen, to.y + slashLen);
      c.stroke();
      c.beginPath();
      c.moveTo(to.x + slashLen, to.y - slashLen);
      c.lineTo(to.x - slashLen, to.y + slashLen);
      c.stroke();
      c.restore();
    },
    speed,
  );
}

// 13. Rock Slide — 6 rocks fall from top toward to, with dust
function rockSlide(
  ctx: CanvasRenderingContext2D,
  from: Pt,
  to: Pt,
  speed: number,
): Promise<void> {
  void from;
  const rockColors = ['#b8a038', '#8a7828', '#d0b848', '#a09030', '#c8b040', '#907020'];
  const cw = ctx.canvas.width / devicePixelRatio;
  const rocks = Array.from({ length: 6 }, (_, i) => ({
    x: to.x + (i - 2.5) * 20 + randomInRange(-8, 8),
    startY: -20,
    endY: to.y + randomInRange(-10, 15),
    size: randomInRange(8, 16),
    delay: i * 0.08 + randomInRange(0, 0.05),
    color: rockColors[i],
    rot: randomInRange(0, Math.PI * 2),
  }));
  void cw;
  return runCanvas(
    ctx,
    500,
    (c, t) => {
      for (const rock of rocks) {
        const tLocal = Math.max(0, (t - rock.delay) / (1 - rock.delay));
        if (tLocal <= 0) continue;
        const tDrop = Math.min(tLocal * 1.2, 1);
        const y = lerp(rock.startY, rock.endY, tDrop * tDrop); // gravity feel
        const alpha = tDrop < 0.85 ? 0.9 : Math.max(0, 0.9 - (tDrop - 0.85) / 0.15 * 0.9);
        // Rock shape (rotated square-ish)
        c.save();
        c.translate(rock.x, y);
        c.rotate(rock.rot + tLocal * 1.5);
        c.globalAlpha = alpha;
        c.beginPath();
        c.rect(-rock.size / 2, -rock.size / 2, rock.size, rock.size * 0.8);
        c.fillStyle = rock.color;
        c.fill();
        c.strokeStyle = '#50401a';
        c.lineWidth = 1;
        c.stroke();
        c.restore();
        // Dust on impact
        if (tDrop > 0.85) {
          const tDust = (tDrop - 0.85) / 0.15;
          for (let d = 0; d < 3; d++) {
            const dustAngle = (d / 3) * Math.PI + Math.PI * 0.5;
            const dustR = tDust * 12;
            c.beginPath();
            c.arc(
              rock.x + Math.cos(dustAngle) * dustR,
              rock.endY + Math.sin(dustAngle) * dustR * 0.3,
              3 * (1 - tDust),
              0,
              Math.PI * 2,
            );
            c.fillStyle = hexToRgba('#c8a840', (1 - tDust) * 0.5);
            c.fill();
          }
        }
      }
    },
    speed,
  );
}

// 14. Shadow Claw — 3 dark purple slash arcs at to
function shadowClaw(
  ctx: CanvasRenderingContext2D,
  from: Pt,
  to: Pt,
  speed: number,
): Promise<void> {
  void from;
  const darkPurple = '#7038a8';
  const slashData = [
    { angle: -0.6, dx: -10, dy: -5, delay: 0 },
    { angle: -0.1, dx: 5, dy: 0, delay: 0.12 },
    { angle: 0.4, dx: 10, dy: 8, delay: 0.24 },
  ];
  return runCanvas(
    ctx,
    380,
    (c, t) => {
      for (const slash of slashData) {
        const tLocal = Math.max(0, (t - slash.delay) / (1 - slash.delay));
        if (tLocal <= 0) continue;
        const tFade = tLocal < 0.4 ? tLocal / 0.4 : Math.max(0, 1 - (tLocal - 0.4) / 0.6);
        const slashLen = 32;
        c.save();
        c.translate(to.x + slash.dx, to.y + slash.dy);
        c.rotate(slash.angle);
        c.globalAlpha = tFade * 0.88;
        c.strokeStyle = darkPurple;
        c.lineWidth = 3;
        c.lineCap = 'round';
        c.beginPath();
        c.moveTo(-slashLen, 0);
        c.lineTo(slashLen, 0);
        c.stroke();
        // Slight arc
        c.beginPath();
        c.arc(0, slashLen * 0.3, slashLen, Math.PI + 0.3, -0.3);
        c.globalAlpha = tFade * 0.3;
        c.stroke();
        c.restore();
      }
    },
    speed,
  );
}

// 15. Dragon Claw — 3 violet/indigo slash arcs at to
function dragonClaw(
  ctx: CanvasRenderingContext2D,
  from: Pt,
  to: Pt,
  speed: number,
): Promise<void> {
  void from;
  const violet = TYPE_COLORS['dragon'];
  const slashData = [
    { angle: -0.5, dx: -12, dy: -8, delay: 0 },
    { angle: 0.0, dx: 3, dy: 2, delay: 0.13 },
    { angle: 0.5, dx: 12, dy: 10, delay: 0.26 },
  ];
  return runCanvas(
    ctx,
    400,
    (c, t) => {
      for (const slash of slashData) {
        const tLocal = Math.max(0, (t - slash.delay) / (1 - slash.delay));
        if (tLocal <= 0) continue;
        const tFade = tLocal < 0.38 ? tLocal / 0.38 : Math.max(0, 1 - (tLocal - 0.38) / 0.62);
        const slashLen = 34;
        c.save();
        c.translate(to.x + slash.dx, to.y + slash.dy);
        c.rotate(slash.angle);
        c.globalAlpha = tFade * 0.9;
        c.strokeStyle = violet;
        c.lineWidth = 3;
        c.lineCap = 'round';
        c.beginPath();
        c.moveTo(-slashLen, 0);
        c.lineTo(slashLen, 0);
        c.stroke();
        // Dragon-energy arc
        c.beginPath();
        c.arc(0, slashLen * 0.25, slashLen, Math.PI + 0.25, -0.25);
        c.globalAlpha = tFade * 0.35;
        c.lineWidth = 5;
        c.stroke();
        c.restore();
      }
    },
    speed,
  );
}

// ---- Named special moves ----------------------------------------------------

// 1. Hyper Voice — 4 sound wave rings from from toward to
function hyperVoice(
  ctx: CanvasRenderingContext2D,
  from: Pt,
  to: Pt,
  speed: number,
): Promise<void> {
  const angle = angleBetween(from, to);
  const normal = TYPE_COLORS['normal'];
  return runCanvas(
    ctx,
    450,
    (c, t) => {
      for (let r = 0; r < 4; r++) {
        const tRing = Math.max(0, (t - r * 0.12) / (1 - r * 0.12));
        if (tRing <= 0) continue;
        const dist = distBetween(from, to);
        const cx = lerp(from.x, to.x, tRing * 0.8);
        const cy = lerp(from.y, to.y, tRing * 0.8);
        const radius = tRing * dist * 0.35 + 6;
        const alpha = Math.max(0, 1 - tRing * 1.1);
        // Arc facing toward target
        c.save();
        c.translate(cx, cy);
        c.rotate(angle);
        c.globalAlpha = alpha * 0.7;
        c.strokeStyle = normal;
        c.lineWidth = 2.5;
        c.beginPath();
        c.arc(0, 0, radius, -Math.PI * 0.55, Math.PI * 0.55);
        c.stroke();
        c.restore();
      }
    },
    speed,
  );
}

// 2. Aura Sphere — blue glowing orb from→to
function auraSphere(
  ctx: CanvasRenderingContext2D,
  from: Pt,
  to: Pt,
  speed: number,
): Promise<void> {
  const fighting = TYPE_COLORS['fighting'];
  const auraBlue = '#4488ff';
  return runCanvas(
    ctx,
    500,
    (c, t) => {
      const x = lerp(from.x, to.x, t);
      const y = lerp(from.y, to.y, t);
      const pulse = 1 + Math.sin(t * Math.PI * 5) * 0.25;
      const alpha = t < 0.85 ? 0.9 : Math.max(0, 0.9 - (t - 0.85) / 0.15 * 0.9);
      // Outer aura ring
      c.beginPath();
      c.arc(x, y, 20 * pulse, 0, Math.PI * 2);
      c.strokeStyle = hexToRgba(auraBlue, alpha * 0.45);
      c.lineWidth = 3;
      c.stroke();
      // Aura fill
      c.beginPath();
      c.arc(x, y, 14 * pulse, 0, Math.PI * 2);
      c.fillStyle = hexToRgba(auraBlue, alpha * 0.5);
      c.fill();
      // Core
      c.beginPath();
      c.arc(x, y, 8, 0, Math.PI * 2);
      c.fillStyle = hexToRgba(fighting, alpha * 0.9);
      c.fill();
      c.beginPath();
      c.arc(x, y, 3, 0, Math.PI * 2);
      c.fillStyle = hexToRgba('#ffffff', alpha);
      c.fill();
    },
    speed,
  );
}

// 3. Sludge Bomb — 6 purple blobs arc to to, splatter
function sludgeBomb(
  ctx: CanvasRenderingContext2D,
  from: Pt,
  to: Pt,
  speed: number,
): Promise<void> {
  const poison = TYPE_COLORS['poison'];
  const blobs = Array.from({ length: 6 }, (_, i) => ({
    delay: i * 0.07,
    ox: randomInRange(-18, 18),
    oy: randomInRange(-8, 8),
    size: randomInRange(6, 11),
    arcH: randomInRange(30, 55),
  }));
  return runCanvas(
    ctx,
    450,
    (c, t) => {
      for (const blob of blobs) {
        const tLocal = Math.max(0, (t - blob.delay) / (1 - blob.delay));
        if (tLocal <= 0) continue;
        const tFly = Math.min(tLocal, 0.75) / 0.75;
        const x = lerp(from.x, to.x + blob.ox, tFly);
        const y = lerp(from.y, to.y + blob.oy, tFly) - Math.sin(tFly * Math.PI) * blob.arcH;
        const alpha = tLocal < 0.75 ? 0.85 : Math.max(0, 0.85 - (tLocal - 0.75) / 0.25 * 0.85);
        c.beginPath();
        c.arc(x, y, blob.size * (1 - tFly * 0.2), 0, Math.PI * 2);
        c.fillStyle = hexToRgba(poison, alpha);
        c.fill();
        // Splatter at impact
        if (tLocal > 0.75) {
          const tSplat = (tLocal - 0.75) / 0.25;
          for (let s = 0; s < 4; s++) {
            const sa = (s / 4) * Math.PI * 2 + blob.delay * 10;
            const sr = tSplat * 14;
            c.beginPath();
            c.arc(
              to.x + blob.ox + Math.cos(sa) * sr,
              to.y + blob.oy + Math.sin(sa) * sr,
              blob.size * 0.4 * (1 - tSplat),
              0,
              Math.PI * 2,
            );
            c.fillStyle = hexToRgba('#c060c0', (1 - tSplat) * 0.7);
            c.fill();
          }
        }
      }
    },
    speed,
  );
}

// 4. Earth Power — golden cracks radiating from to
function earthPower(
  ctx: CanvasRenderingContext2D,
  from: Pt,
  to: Pt,
  speed: number,
): Promise<void> {
  void from;
  const golden = TYPE_COLORS['ground'];
  const crackAngles = [0, Math.PI / 4, Math.PI / 2, (Math.PI * 3) / 4, Math.PI,
    (Math.PI * 5) / 4, (Math.PI * 3) / 2, (Math.PI * 7) / 4];
  return runCanvas(
    ctx,
    550,
    (c, t) => {
      // Ground upwelling glow
      const glowAlpha = t < 0.3 ? t / 0.3 * 0.4 : Math.max(0, 0.4 - (t - 0.3) / 0.7 * 0.4);
      c.beginPath();
      c.arc(to.x, to.y, lerp(8, 45, t), 0, Math.PI * 2);
      c.fillStyle = hexToRgba(golden, glowAlpha);
      c.fill();
      // Cracks radiating out
      for (let i = 0; i < crackAngles.length; i++) {
        const crackDelay = i * 0.04;
        const tCrack = Math.max(0, (t - crackDelay) / (1 - crackDelay));
        if (tCrack <= 0) continue;
        const crackLen = tCrack * (40 + (i % 3) * 10);
        const crackAlpha = tCrack < 0.7 ? 0.85 : Math.max(0, 0.85 - (tCrack - 0.7) / 0.3 * 0.85);
        const ang = crackAngles[i];
        // Main crack line with slight wobble
        c.save();
        c.globalAlpha = crackAlpha;
        c.strokeStyle = golden;
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(to.x, to.y);
        const midX = to.x + Math.cos(ang) * crackLen * 0.5 + Math.sin(ang) * 5;
        const midY = to.y + Math.sin(ang) * crackLen * 0.5 - Math.cos(ang) * 5;
        c.quadraticCurveTo(midX, midY, to.x + Math.cos(ang) * crackLen, to.y + Math.sin(ang) * crackLen);
        c.stroke();
        c.restore();
      }
    },
    speed,
  );
}

// 5. Air Slash — crescent slash traveling from→to
function airSlash(
  ctx: CanvasRenderingContext2D,
  from: Pt,
  to: Pt,
  speed: number,
): Promise<void> {
  const flying = TYPE_COLORS['flying'];
  const angle = angleBetween(from, to);
  return runCanvas(
    ctx,
    400,
    (c, t) => {
      const x = lerp(from.x, to.x, t);
      const y = lerp(from.y, to.y, t);
      const alpha = t < 0.7 ? 0.9 : Math.max(0, 0.9 - (t - 0.7) / 0.3 * 0.9);
      // Crescent: two arcs offset slightly
      c.save();
      c.translate(x, y);
      c.rotate(angle + Math.PI / 2);
      c.globalAlpha = alpha;
      c.strokeStyle = flying;
      c.lineWidth = 3;
      // Outer arc
      c.beginPath();
      c.arc(4, 0, 14, Math.PI * 0.6, Math.PI * 1.4);
      c.stroke();
      // Inner arc (creates crescent)
      c.strokeStyle = hexToRgba(flying, 0.4);
      c.beginPath();
      c.arc(-2, 0, 12, Math.PI * 0.55, Math.PI * 1.45);
      c.stroke();
      c.restore();
    },
    speed,
  );
}

// 6. Bug Buzz — concentric green rings pulsing from from
function bugBuzz(
  ctx: CanvasRenderingContext2D,
  from: Pt,
  to: Pt,
  speed: number,
): Promise<void> {
  void to;
  const bugColor = TYPE_COLORS['bug'];
  return runCanvas(
    ctx,
    450,
    (c, t) => {
      for (let r = 0; r < 5; r++) {
        const tRing = Math.max(0, (t - r * 0.1) / (1 - r * 0.1));
        if (tRing <= 0) continue;
        const radius = tRing * 55;
        const alpha = Math.max(0, (1 - tRing) * 0.7);
        c.beginPath();
        c.arc(from.x, from.y, radius, 0, Math.PI * 2);
        c.strokeStyle = hexToRgba(bugColor, alpha);
        c.lineWidth = 2.5;
        c.stroke();
      }
    },
    speed,
  );
}

// 7. Power Gem — spark at from, then beam to to
function powerGem(
  ctx: CanvasRenderingContext2D,
  from: Pt,
  to: Pt,
  speed: number,
): Promise<void> {
  const rock = TYPE_COLORS['rock'];
  return runCanvas(
    ctx,
    400,
    (c, t) => {
      if (t < 0.35) {
        // Charge spark at from
        const tCharge = t / 0.35;
        const sparkRadius = lerp(4, 18, tCharge);
        c.beginPath();
        c.arc(from.x, from.y, sparkRadius, 0, Math.PI * 2);
        c.fillStyle = hexToRgba(rock, tCharge * 0.6);
        c.fill();
        // Bright core
        c.beginPath();
        c.arc(from.x, from.y, sparkRadius * 0.4, 0, Math.PI * 2);
        c.fillStyle = hexToRgba('#ffffff', tCharge * 0.9);
        c.fill();
        // Gem facets
        const numFacets = 6;
        for (let i = 0; i < numFacets; i++) {
          const ang = (i / numFacets) * Math.PI * 2 + tCharge * Math.PI;
          c.beginPath();
          c.moveTo(from.x, from.y);
          c.lineTo(
            from.x + Math.cos(ang) * sparkRadius * 1.4,
            from.y + Math.sin(ang) * sparkRadius * 1.4,
          );
          c.strokeStyle = hexToRgba('#d0b848', tCharge * 0.6);
          c.lineWidth = 1.5;
          c.stroke();
        }
      } else {
        // Beam from→to
        const tBeam = (t - 0.35) / 0.65;
        const endX = lerp(from.x, to.x, tBeam);
        const endY = lerp(from.y, to.y, tBeam);
        const beamAlpha = tBeam < 0.8 ? 0.85 : Math.max(0, 0.85 - (tBeam - 0.8) / 0.2 * 0.85);
        c.save();
        c.globalAlpha = beamAlpha;
        c.strokeStyle = rock;
        c.lineWidth = 4;
        c.lineCap = 'round';
        c.beginPath();
        c.moveTo(from.x, from.y);
        c.lineTo(endX, endY);
        c.stroke();
        // Glow
        c.lineWidth = 8;
        c.globalAlpha = beamAlpha * 0.25;
        c.beginPath();
        c.moveTo(from.x, from.y);
        c.lineTo(endX, endY);
        c.stroke();
        c.restore();
      }
    },
    speed,
  );
}

// 8. Shadow Ball — dark orb with wisps from→to
function shadowBall(
  ctx: CanvasRenderingContext2D,
  from: Pt,
  to: Pt,
  speed: number,
): Promise<void> {
  const ghost = TYPE_COLORS['ghost'];
  return runCanvas(
    ctx,
    500,
    (c, t) => {
      const x = lerp(from.x, to.x, t);
      const y = lerp(from.y, to.y, t);
      const alpha = t < 0.8 ? 0.9 : Math.max(0, 0.9 - (t - 0.8) / 0.2 * 0.9);
      // Swirling wisp trails (3 offset wisps rotating)
      for (let w = 0; w < 3; w++) {
        const wAngle = t * Math.PI * 4 + (w / 3) * Math.PI * 2;
        const wR = 9;
        c.beginPath();
        c.arc(x + Math.cos(wAngle) * wR, y + Math.sin(wAngle) * wR, 4, 0, Math.PI * 2);
        c.fillStyle = hexToRgba('#9878c0', alpha * 0.55);
        c.fill();
      }
      // Main orb
      c.beginPath();
      c.arc(x, y, 14, 0, Math.PI * 2);
      c.fillStyle = hexToRgba(ghost, alpha * 0.85);
      c.fill();
      // Dark core
      c.beginPath();
      c.arc(x, y, 7, 0, Math.PI * 2);
      c.fillStyle = hexToRgba('#2a1a40', alpha);
      c.fill();
    },
    speed,
  );
}

// 9. Dragon Pulse — wide energy beam from→to with particle spray
function dragonPulse(
  ctx: CanvasRenderingContext2D,
  from: Pt,
  to: Pt,
  speed: number,
): Promise<void> {
  const dragon = TYPE_COLORS['dragon'];
  const angle = angleBetween(from, to);
  return runCanvas(
    ctx,
    550,
    (c, t) => {
      const beamEnd = {
        x: lerp(from.x, to.x, t),
        y: lerp(from.y, to.y, t),
      };
      const beamAlpha = t < 0.75 ? 0.85 : Math.max(0, 0.85 - (t - 0.75) / 0.25 * 0.85);
      // Wide beam
      c.save();
      c.globalAlpha = beamAlpha;
      c.strokeStyle = dragon;
      c.lineWidth = 8;
      c.lineCap = 'round';
      c.beginPath();
      c.moveTo(from.x, from.y);
      c.lineTo(beamEnd.x, beamEnd.y);
      c.stroke();
      // Bright core beam
      c.strokeStyle = '#c0a0ff';
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(from.x, from.y);
      c.lineTo(beamEnd.x, beamEnd.y);
      c.stroke();
      c.restore();
      // Particle spray along the beam
      if (t > 0.1) {
        for (let p = 0; p < 5; p++) {
          const tPos = (t * 0.8 + p * 0.04) % 1.0;
          const px = lerp(from.x, beamEnd.x, tPos);
          const py = lerp(from.y, beamEnd.y, tPos);
          const perp = angle + Math.PI / 2;
          const jitter = Math.sin(t * 20 + p * 2) * 8;
          c.beginPath();
          c.arc(px + Math.cos(perp) * jitter, py + Math.sin(perp) * jitter, 2.5, 0, Math.PI * 2);
          c.fillStyle = hexToRgba('#a060ff', beamAlpha * 0.65);
          c.fill();
        }
      }
    },
    speed,
  );
}

// 10. Solar Beam — charging circle at from, then beam to to
function solarBeam(
  ctx: CanvasRenderingContext2D,
  from: Pt,
  to: Pt,
  speed: number,
): Promise<void> {
  const grass = TYPE_COLORS['grass'];
  return runCanvas(
    ctx,
    600,
    (c, t) => {
      if (t < 0.45) {
        // Charge phase: growing glowing circle at from
        const tCharge = t / 0.45;
        const radius = lerp(4, 28, tCharge);
        // Outer glow
        c.beginPath();
        c.arc(from.x, from.y, radius * 1.5, 0, Math.PI * 2);
        c.fillStyle = hexToRgba('#ffff80', tCharge * 0.3);
        c.fill();
        // Main glow
        c.beginPath();
        c.arc(from.x, from.y, radius, 0, Math.PI * 2);
        c.fillStyle = hexToRgba(grass, tCharge * 0.75);
        c.fill();
        // Bright core
        c.beginPath();
        c.arc(from.x, from.y, radius * 0.45, 0, Math.PI * 2);
        c.fillStyle = hexToRgba('#ffffff', tCharge * 0.95);
        c.fill();
        // Energy lines converging
        for (let r = 0; r < 8; r++) {
          const ang = (r / 8) * Math.PI * 2 + tCharge * Math.PI * 2;
          const outerR = radius * (2.5 - tCharge);
          c.save();
          c.globalAlpha = tCharge * 0.45;
          c.strokeStyle = '#f8d030';
          c.lineWidth = 1.5;
          c.beginPath();
          c.moveTo(from.x + Math.cos(ang) * outerR, from.y + Math.sin(ang) * outerR);
          c.lineTo(from.x + Math.cos(ang) * radius, from.y + Math.sin(ang) * radius);
          c.stroke();
          c.restore();
        }
      } else {
        // Fire phase: beam from→to
        const tBeam = (t - 0.45) / 0.55;
        const endX = lerp(from.x, to.x, tBeam);
        const endY = lerp(from.y, to.y, tBeam);
        const beamAlpha = tBeam < 0.75 ? 0.9 : Math.max(0, 0.9 - (tBeam - 0.75) / 0.25 * 0.9);
        c.save();
        c.globalAlpha = beamAlpha;
        // Wide outer beam (yellow)
        c.strokeStyle = '#f8d030';
        c.lineWidth = 12;
        c.lineCap = 'round';
        c.beginPath();
        c.moveTo(from.x, from.y);
        c.lineTo(endX, endY);
        c.stroke();
        // Main beam (green)
        c.strokeStyle = grass;
        c.lineWidth = 7;
        c.beginPath();
        c.moveTo(from.x, from.y);
        c.lineTo(endX, endY);
        c.stroke();
        // Bright core
        c.strokeStyle = '#ffffff';
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(from.x, from.y);
        c.lineTo(endX, endY);
        c.stroke();
        c.restore();
      }
    },
    speed,
  );
}

// ---- Utility moves ----------------------------------------------------------

// Splash — 5 water droplets arc up then fall from from
function splash(
  ctx: CanvasRenderingContext2D,
  from: Pt,
  to: Pt,
  speed: number,
): Promise<void> {
  void to;
  const water = TYPE_COLORS['water'];
  const drops = Array.from({ length: 5 }, (_, i) => ({
    ox: (i - 2) * 14,
    arcH: randomInRange(35, 60),
    delay: i * 0.06,
    size: randomInRange(4, 7),
  }));
  return runCanvas(
    ctx,
    400,
    (c, t) => {
      for (const drop of drops) {
        const tLocal = Math.max(0, (t - drop.delay) / (1 - drop.delay));
        if (tLocal <= 0) continue;
        // Arc up (0→0.5) then down (0.5→1)
        const x = from.x + drop.ox;
        const y = from.y - Math.sin(tLocal * Math.PI) * drop.arcH;
        const alpha = tLocal < 0.85 ? 0.85 : Math.max(0, 0.85 - (tLocal - 0.85) / 0.15 * 0.85);
        c.beginPath();
        c.arc(x, y, drop.size * (1 - tLocal * 0.4), 0, Math.PI * 2);
        c.fillStyle = hexToRgba(water, alpha);
        c.fill();
        // Shine dot
        c.beginPath();
        c.arc(x - drop.size * 0.25, y - drop.size * 0.25, drop.size * 0.3, 0, Math.PI * 2);
        c.fillStyle = hexToRgba('#ffffff', alpha * 0.6);
        c.fill();
      }
    },
    speed,
  );
}

// Teleport — 3 concentric purple rings expand from from, fading out
function teleport(
  ctx: CanvasRenderingContext2D,
  from: Pt,
  to: Pt,
  speed: number,
): Promise<void> {
  void to;
  const psychic = TYPE_COLORS['psychic'];
  return runCanvas(
    ctx,
    500,
    (c, t) => {
      for (let r = 0; r < 3; r++) {
        const tRing = Math.max(0, (t - r * 0.15) / (1 - r * 0.15));
        if (tRing <= 0) continue;
        const radius = tRing * 55;
        const alpha = Math.max(0, (1 - tRing) * 0.75);
        c.beginPath();
        c.arc(from.x, from.y, radius, 0, Math.PI * 2);
        c.strokeStyle = hexToRgba(psychic, alpha);
        c.lineWidth = 2.5;
        c.stroke();
        // Inner fill glow
        c.beginPath();
        c.arc(from.x, from.y, radius * 0.5, 0, Math.PI * 2);
        c.fillStyle = hexToRgba(psychic, alpha * 0.15);
        c.fill();
      }
    },
    speed,
  );
}

// ---- Generic physical fallback ----------------------------------------------

function genericPhysical(
  ctx: CanvasRenderingContext2D,
  moveType: string,
  from: Pt,
  to: Pt,
  speed: number,
): Promise<void> {
  const color = TYPE_COLORS[moveType.toLowerCase()] ?? TYPE_COLORS['normal'];
  return runCanvas(
    ctx,
    350,
    (c, t) => {
      // Streak extending from→to
      const streakEnd = {
        x: lerp(from.x, to.x, Math.min(t * 1.5, 1)),
        y: lerp(from.y, to.y, Math.min(t * 1.5, 1)),
      };
      const streakAlpha = t < 0.6 ? 0.85 : Math.max(0, 0.85 - (t - 0.6) / 0.4 * 0.85);
      c.save();
      c.globalAlpha = streakAlpha;
      c.strokeStyle = color;
      c.lineWidth = 4;
      c.lineCap = 'round';
      c.beginPath();
      c.moveTo(from.x, from.y);
      c.lineTo(streakEnd.x, streakEnd.y);
      c.stroke();
      c.restore();
      // 3 expanding impact rings at to
      for (let r = 0; r < 3; r++) {
        const tRing = Math.max(0, t - r * 0.15 - 0.3);
        if (tRing <= 0) continue;
        const ringAlpha = Math.max(0, (0.7 - tRing * 0.7));
        c.beginPath();
        c.arc(to.x, to.y, tRing * 28 + r * 5, 0, Math.PI * 2);
        c.strokeStyle = hexToRgba(color, ringAlpha);
        c.lineWidth = 2;
        c.stroke();
      }
    },
    speed,
  );
}

// ---- Named move dispatch table ----------------------------------------------

type MoveAnimFn = (
  ctx: CanvasRenderingContext2D,
  from: Pt,
  to: Pt,
  speed: number,
) => Promise<void>;

const NAMED_MOVES: Record<string, MoveAnimFn> = {
  // Physical
  'body slam':     bodySlam,
  'fire punch':    firePunch,
  'waterfall':     waterfall,
  'thunder punch': thunderPunch,
  'razor leaf':    razorLeaf,
  'ice punch':     icePunch,
  'close combat':  closeCombat,
  'poison jab':    poisonJab,
  'earthquake':    earthquake,
  'aerial ace':    aerialAce,
  'zen headbutt':  zenHeadbutt,
  'x-scissor':     xScissor,
  'rock slide':    rockSlide,
  'shadow claw':   shadowClaw,
  'dragon claw':   dragonClaw,
  // Special
  'hyper voice':   hyperVoice,
  'aura sphere':   auraSphere,
  'sludge bomb':   sludgeBomb,
  'earth power':   earthPower,
  'air slash':     airSlash,
  'bug buzz':      bugBuzz,
  'power gem':     powerGem,
  'shadow ball':   shadowBall,
  'dragon pulse':  dragonPulse,
  'solar beam':    solarBeam,
  // Utility
  'splash':        splash,
  'teleport':      teleport,
};

// ---- Top-level export -------------------------------------------------------

export async function playAttackAnimation(
  ctx: CanvasRenderingContext2D,
  moveType: string,
  from: Pt,
  to: Pt,
  isSpecial: boolean,
  moveName: string,
  speed: number,
): Promise<void> {
  const key = moveName.toLowerCase().trim();

  // 1. Named move match
  const namedFn = NAMED_MOVES[key];
  if (namedFn) {
    return namedFn(ctx, from, to, speed);
  }

  // 2. Special — use type particle system
  if (isSpecial) {
    const particles = buildParticles(moveType, from, to);
    const duration = TYPE_DURATIONS[moveType.toLowerCase()] ?? 500;
    return runParticleCanvas(ctx, particles, duration, speed);
  }

  // 3. Generic physical fallback
  return genericPhysical(ctx, moveType, from, to, speed);
}
