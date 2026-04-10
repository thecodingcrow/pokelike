// battle-anim-types.ts — Per-type particle builders for battle animations

import { Particle, angleBetween, distBetween, randomInRange } from './battle-anim';

// ---- Duration map -----------------------------------------------------------

export const TYPE_DURATIONS: Record<string, number> = {
  fire: 580,
  water: 680,
  electric: 500,
  grass: 580,
  ice: 600,
  fighting: 380,
  poison: 540,
  ground: 600,
  flying: 720,
  psychic: 700,
  bug: 500,
  rock: 500,
  ghost: 600,
  dragon: 700,
  dark: 650,
  steel: 400,
  normal: 450,
};

// ---- Coordinate helpers -----------------------------------------------------

function midpoint(a: { x: number; y: number }, b: { x: number; y: number }) {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

function lerpPt(
  a: { x: number; y: number },
  b: { x: number; y: number },
  t: number,
) {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

// ---- Custom particle subclasses ---------------------------------------------

/** Renders as a line segment (wind blade, slash streak) */
class LineParticle extends Particle {
  length: number;

  constructor(
    opts: Partial<Particle> & { x: number; y: number; life: number } & {
      length?: number;
    },
  ) {
    const { length, ...rest } = opts;
    super(rest);
    this.length = length ?? 12;
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this.delay > 0 || this.alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    ctx.strokeStyle = this.color;
    ctx.lineWidth = this.size;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-this.length / 2, 0);
    ctx.lineTo(this.length / 2, 0);
    ctx.stroke();
    ctx.restore();
  }
}

/** Renders as a ring (hollow circle) */
class RingParticle extends Particle {
  draw(ctx: CanvasRenderingContext2D) {
    if (this.delay > 0 || this.alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = this.alpha * 0.6;
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, this.size, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

/** Particle that oscillates alpha as a sine wave */
class WispParticle extends Particle {
  private phaseOffset: number;

  constructor(
    opts: Partial<Particle> & { x: number; y: number; life: number } & {
      phaseOffset?: number;
    },
  ) {
    const { phaseOffset, ...rest } = opts;
    super(rest);
    this.phaseOffset = phaseOffset ?? 0;
  }

  tick(dt: number) {
    super.tick(dt);
    if (this.delay <= 0) {
      const t = this.age / this.life;
      this.alpha = Math.max(0, Math.sin(t * Math.PI) * (0.5 + 0.5 * Math.sin(t * Math.PI * 4 + this.phaseOffset)));
    }
  }
}

/** Ground particle that applies gravity */
class GravParticle extends Particle {
  gravity: number;

  constructor(
    opts: Partial<Particle> & { x: number; y: number; life: number } & {
      gravity?: number;
    },
  ) {
    const { gravity, ...rest } = opts;
    super(rest);
    this.gravity = gravity ?? 0.4;
  }

  tick(dt: number) {
    if (this.delay > 0) {
      this.delay -= dt;
      return;
    }
    this.vy += this.gravity * (dt / 16);
    super.tick(dt);
    // restore alpha after super overwrites it — gravity particles fade on approach
    this.alpha = Math.max(0, 1 - this.age / this.life);
  }
}

/** Particle with sinusoidal y-axis wobble */
class WobbleParticle extends Particle {
  private wobbleAmp: number;
  private wobbleFreq: number;
  private baseY: number;

  constructor(
    opts: Partial<Particle> & { x: number; y: number; life: number } & {
      wobbleAmp?: number;
      wobbleFreq?: number;
    },
  ) {
    const { wobbleAmp, wobbleFreq, ...rest } = opts;
    super(rest);
    this.wobbleAmp = wobbleAmp ?? 6;
    this.wobbleFreq = wobbleFreq ?? 3;
    this.baseY = rest.y;
  }

  tick(dt: number) {
    super.tick(dt);
    if (this.delay <= 0) {
      this.y = this.baseY + this.vy * (this.age / 16) + Math.sin((this.age / this.life) * Math.PI * this.wobbleFreq) * this.wobbleAmp;
    }
  }
}

// ---- Builder functions per type ---------------------------------------------

function buildFire(from: { x: number; y: number }, to: { x: number; y: number }): Particle[] {
  const angle = angleBetween(from, to);
  const dist = distBetween(from, to);
  const speed = dist / (580 / 16);
  const colors = ['#ffffff', '#ffff80', '#ffaa00', '#ff6600', '#ff2200'];
  const particles: Particle[] = [];

  for (let i = 0; i < 30; i++) {
    const t = i / 29;
    const colorIdx = Math.floor(t * (colors.length - 1));
    const color = colors[colorIdx];
    const spread = randomInRange(-0.25, 0.25);
    const vx = Math.cos(angle + spread) * speed * randomInRange(0.8, 1.2);
    const vy = Math.sin(angle + spread) * speed * randomInRange(0.8, 1.2) - randomInRange(0.5, 1.5);
    particles.push(
      new Particle({
        x: from.x,
        y: from.y,
        vx,
        vy,
        life: 380 + randomInRange(0, 120),
        size: randomInRange(3, 6),
        color,
        delay: i * 15,
        rotationSpeed: randomInRange(-0.1, 0.1),
      }),
    );
  }

  return particles;
}

function buildWater(from: { x: number; y: number }, to: { x: number; y: number }): Particle[] {
  const angle = angleBetween(from, to);
  const dist = distBetween(from, to);
  const speed = dist / (680 / 16);
  const mainColors = ['#6ab4f5', '#3b82f6', '#ffffff'];
  const particles: Particle[] = [];

  for (let i = 0; i < 25; i++) {
    const t = i / 24;
    const color = mainColors[i % mainColors.length];
    const sineOffset = Math.sin(t * Math.PI * 4) * 12;
    const perp = angle + Math.PI / 2;
    const ox = Math.cos(perp) * sineOffset;
    const oy = Math.sin(perp) * sineOffset;
    const vx = Math.cos(angle) * speed * randomInRange(0.9, 1.1);
    const vy = Math.sin(angle) * speed * randomInRange(0.9, 1.1);

    particles.push(
      new Particle({
        x: from.x + ox,
        y: from.y + oy,
        vx,
        vy,
        life: 520 + randomInRange(0, 100),
        size: randomInRange(2.5, 5),
        color,
        delay: i * 10,
      }),
    );
  }

  // 8 foam bubbles near target
  for (let i = 0; i < 8; i++) {
    particles.push(
      new Particle({
        x: to.x + randomInRange(-15, 15),
        y: to.y + randomInRange(-15, 15),
        vx: randomInRange(-1.5, 1.5),
        vy: randomInRange(-2, -0.5),
        life: 300 + randomInRange(0, 150),
        size: randomInRange(2, 4),
        color: '#ffffff',
        delay: randomInRange(200, 450),
      }),
    );
  }

  return particles;
}

function buildElectric(from: { x: number; y: number }, to: { x: number; y: number }): Particle[] {
  const colors = ['#f8d030', '#fffacd', '#ffffff'];
  const particles: Particle[] = [];
  const numBolts = 3;
  const perBolt = Math.ceil(20 / numBolts);

  for (let b = 0; b < numBolts; b++) {
    const boltDelay = b * 50;
    for (let i = 0; i < perBolt; i++) {
      const t = i / (perBolt - 1);
      const base = lerpPt(from, to, t);
      const angle = angleBetween(from, to);
      const perp = angle + Math.PI / 2;
      const jitter = randomInRange(-18, 18) * (1 - Math.abs(t - 0.5) * 0.5);
      const ox = Math.cos(perp) * jitter;
      const oy = Math.sin(perp) * jitter;

      const color = colors[Math.floor(Math.random() * colors.length)];
      const dist = distBetween(from, to);
      const speed = dist / (500 / 16);
      const vx = Math.cos(angle) * speed * randomInRange(0.8, 1.2);
      const vy = Math.sin(angle) * speed * randomInRange(0.8, 1.2);

      particles.push(
        new Particle({
          x: base.x + ox,
          y: base.y + oy,
          vx: vx * (1 - t) * 0.3,
          vy: vy * (1 - t) * 0.3,
          life: 180 + randomInRange(0, 120),
          size: randomInRange(2, 3),
          color,
          delay: boltDelay + i * 8,
        }),
      );
    }
  }

  return particles;
}

function buildGrass(from: { x: number; y: number }, to: { x: number; y: number }): Particle[] {
  const angle = angleBetween(from, to);
  const dist = distBetween(from, to);
  const speed = dist / (580 / 16);
  const colors = ['#78c850', '#4a8a30', '#a0d860'];
  const particles: Particle[] = [];

  // 20 leaf particles along 2 bezier-ish curves
  for (let i = 0; i < 20; i++) {
    const curve = i % 2;
    const t = (i / 2) / 9;
    const perp = angle + Math.PI / 2;
    const curveOffset = (curve === 0 ? 1 : -1) * 14;
    const startPt = lerpPt(from, to, t);
    const ox = Math.cos(perp) * curveOffset;
    const oy = Math.sin(perp) * curveOffset;
    const color = colors[i % colors.length];
    const vx = Math.cos(angle) * speed * randomInRange(0.9, 1.1);
    const vy = Math.sin(angle) * speed * randomInRange(0.9, 1.1) + randomInRange(-0.3, 0.3);

    particles.push(
      new Particle({
        x: startPt.x + ox,
        y: startPt.y + oy,
        vx,
        vy,
        life: 440 + randomInRange(0, 100),
        size: randomInRange(3, 5),
        color,
        delay: i * 22,
        rotation: randomInRange(0, Math.PI * 2),
        rotationSpeed: randomInRange(-0.12, 0.12),
      }),
    );
  }

  // 5 sparkle particles at target
  for (let i = 0; i < 5; i++) {
    particles.push(
      new Particle({
        x: to.x + randomInRange(-10, 10),
        y: to.y + randomInRange(-10, 10),
        vx: randomInRange(-1, 1),
        vy: randomInRange(-2, -0.5),
        life: 280 + randomInRange(0, 100),
        size: randomInRange(1.5, 3),
        color: '#e8ff80',
        delay: randomInRange(300, 500),
        rotationSpeed: randomInRange(-0.2, 0.2),
      }),
    );
  }

  return particles;
}

function buildIce(from: { x: number; y: number }, to: { x: number; y: number }): Particle[] {
  const angle = angleBetween(from, to);
  const dist = distBetween(from, to);
  const speed = dist / (600 / 16);
  const colors = ['#98d8d8', '#b0f0f0', '#ffffff'];
  const particles: Particle[] = [];

  for (let i = 0; i < 16; i++) {
    const spread = randomInRange(-0.12, 0.12);
    const color = colors[i % colors.length];
    const vx = Math.cos(angle + spread) * speed * randomInRange(0.85, 1.15);
    const vy = Math.sin(angle + spread) * speed * randomInRange(0.85, 1.15);

    particles.push(
      new Particle({
        x: from.x,
        y: from.y,
        vx,
        vy,
        life: 420 + randomInRange(0, 100),
        size: randomInRange(2, 4),
        color,
        delay: i * 18,
      }),
    );
  }

  // 6 crystal particles with rotation
  for (let i = 0; i < 6; i++) {
    const spread = randomInRange(-0.1, 0.1);
    const vx = Math.cos(angle + spread) * speed * randomInRange(0.9, 1.1);
    const vy = Math.sin(angle + spread) * speed * randomInRange(0.9, 1.1);

    particles.push(
      new Particle({
        x: from.x,
        y: from.y,
        vx,
        vy,
        life: 500 + randomInRange(0, 80),
        size: randomInRange(5, 7),
        color: '#d8f8f8',
        delay: i * 30 + randomInRange(0, 40),
        rotation: randomInRange(0, Math.PI * 2),
        rotationSpeed: randomInRange(-0.08, 0.08),
      }),
    );
  }

  return particles;
}

function buildFighting(_from: { x: number; y: number }, to: { x: number; y: number }): Particle[] {
  const colors = ['#c03028', '#ff4040', '#ff8060'];
  const particles: Particle[] = [];

  // 15 impact particles bursting radially from target
  for (let i = 0; i < 15; i++) {
    const burstAngle = (i / 15) * Math.PI * 2 + randomInRange(-0.2, 0.2);
    const spd = randomInRange(3, 7);
    const color = colors[i % colors.length];

    particles.push(
      new Particle({
        x: to.x,
        y: to.y,
        vx: Math.cos(burstAngle) * spd,
        vy: Math.sin(burstAngle) * spd,
        life: 280 + randomInRange(0, 80),
        size: randomInRange(2.5, 5),
        color,
        delay: randomInRange(0, 40),
      }),
    );
  }

  // 3 shockwave ring particles
  for (let i = 0; i < 3; i++) {
    particles.push(
      new RingParticle({
        x: to.x,
        y: to.y,
        vx: 0,
        vy: 0,
        life: 300 + i * 60,
        size: 8 + i * 10,
        color: '#ff6040',
        delay: i * 60,
      }),
    );
  }

  return particles;
}

function buildPoison(from: { x: number; y: number }, to: { x: number; y: number }): Particle[] {
  const angle = angleBetween(from, to);
  const dist = distBetween(from, to);
  const speed = dist / (540 / 16);
  const colors = ['#a040a0', '#c060c0', '#e080e0'];
  const particles: Particle[] = [];

  for (let i = 0; i < 18; i++) {
    const spread = randomInRange(-0.3, 0.3);
    const color = colors[i % colors.length];
    const vx = Math.cos(angle + spread) * speed * randomInRange(0.8, 1.2);
    const vy = Math.sin(angle + spread) * speed * randomInRange(0.8, 1.2);

    particles.push(
      new WobbleParticle({
        x: from.x,
        y: from.y,
        vx,
        vy,
        life: 380 + randomInRange(0, 120),
        size: randomInRange(3, 8),
        color,
        delay: i * 20,
        wobbleAmp: randomInRange(4, 10),
        wobbleFreq: randomInRange(2, 5),
      }),
    );
  }

  return particles;
}

function buildGround(from: { x: number; y: number }, to: { x: number; y: number }): Particle[] {
  const angle = angleBetween(from, to);
  const dist = distBetween(from, to);
  const speed = dist / (600 / 16);
  const colors = ['#e0c068', '#b8882c', '#d4a84c'];
  const particles: Particle[] = [];

  // 15 rock particles from below
  for (let i = 0; i < 15; i++) {
    const spread = randomInRange(-0.3, 0.3);
    const color = colors[i % colors.length];
    const spd = speed * randomInRange(0.9, 1.3);
    const vx = Math.cos(angle + spread) * spd;
    const vy = Math.sin(angle + spread) * spd - randomInRange(1, 3); // upward initial kick

    particles.push(
      new GravParticle({
        x: from.x + randomInRange(-8, 8),
        y: from.y,
        vx,
        vy,
        life: 440 + randomInRange(0, 100),
        size: randomInRange(4, 7),
        color,
        delay: i * 25,
        rotation: randomInRange(0, Math.PI * 2),
        rotationSpeed: randomInRange(-0.1, 0.1),
        gravity: randomInRange(0.25, 0.5),
      }),
    );
  }

  // 3 quake particles at target
  for (let i = 0; i < 3; i++) {
    particles.push(
      new GravParticle({
        x: to.x + randomInRange(-20, 20),
        y: to.y,
        vx: randomInRange(-2, 2),
        vy: randomInRange(-4, -1),
        life: 360 + i * 60,
        size: randomInRange(8, 14),
        color: '#c8a840',
        delay: 300 + i * 80,
        gravity: 0.3,
      }),
    );
  }

  return particles;
}

function buildFlying(from: { x: number; y: number }, to: { x: number; y: number }): Particle[] {
  const angle = angleBetween(from, to);
  const dist = distBetween(from, to);
  const speed = dist / (720 / 16);
  const colors = ['#a890f0', '#c8b8ff', '#e0d8ff'];
  const particles: Particle[] = [];

  for (let i = 0; i < 12; i++) {
    const arcOffset = (i % 3 - 1) * 20;
    const perp = angle + Math.PI / 2;
    const ox = Math.cos(perp) * arcOffset;
    const oy = Math.sin(perp) * arcOffset;
    const color = colors[i % colors.length];
    const vx = Math.cos(angle) * speed * randomInRange(0.9, 1.1);
    const vy = Math.sin(angle) * speed * randomInRange(0.9, 1.1);

    particles.push(
      new LineParticle({
        x: from.x + ox,
        y: from.y + oy,
        vx,
        vy,
        life: 540 + randomInRange(0, 120),
        size: randomInRange(1.5, 2.5),
        color,
        delay: i * 45,
        rotation: angle,
        rotationSpeed: 0,
        length: randomInRange(14, 24),
      }),
    );
  }

  return particles;
}

function buildPsychic(from: { x: number; y: number }, to: { x: number; y: number }): Particle[] {
  const colors = ['#f85888', '#ff80b0', '#ffc0d8'];
  const particles: Particle[] = [];
  const mid = midpoint(from, to);

  // 15 expanding ring particles from attacker
  for (let i = 0; i < 15; i++) {
    const ringAngle = (i / 15) * Math.PI * 2;
    const radius = 20 + (i % 3) * 12;
    const vx = Math.cos(ringAngle) * randomInRange(0.8, 1.5);
    const vy = Math.sin(ringAngle) * randomInRange(0.8, 1.5);
    const color = colors[i % colors.length];

    particles.push(
      new Particle({
        x: from.x + Math.cos(ringAngle) * 5,
        y: from.y + Math.sin(ringAngle) * 5,
        vx,
        vy,
        life: 500 + randomInRange(0, 120),
        size: randomInRange(2.5, 5),
        color,
        delay: Math.floor(i / 5) * 80,
      }),
    );
    void radius;
  }

  // 5 orbiting spark particles around midpoint
  for (let i = 0; i < 5; i++) {
    const orbitAngle = (i / 5) * Math.PI * 2;
    const orbitR = 18;
    const orbitSpeed = randomInRange(0.06, 0.12) * (Math.random() > 0.5 ? 1 : -1);

    // approximate orbit by giving tangential velocity
    const vx = -Math.sin(orbitAngle) * orbitR * orbitSpeed * 16;
    const vy = Math.cos(orbitAngle) * orbitR * orbitSpeed * 16;

    particles.push(
      new Particle({
        x: mid.x + Math.cos(orbitAngle) * orbitR,
        y: mid.y + Math.sin(orbitAngle) * orbitR,
        vx,
        vy,
        life: 600 + randomInRange(0, 80),
        size: randomInRange(2, 3.5),
        color: '#ff80b0',
        delay: 100 + i * 60,
      }),
    );
  }

  return particles;
}

function buildBug(from: { x: number; y: number }, to: { x: number; y: number }): Particle[] {
  const angle = angleBetween(from, to);
  const dist = distBetween(from, to);
  const speed = dist / (500 / 16);
  const colors = ['#a8b820', '#c8d840', '#e0f060'];
  const particles: Particle[] = [];

  for (let i = 0; i < 25; i++) {
    const spread = randomInRange(-0.25, 0.25);
    const color = colors[i % colors.length];
    const vx = Math.cos(angle + spread) * speed * randomInRange(0.85, 1.15);
    const vy = Math.sin(angle + spread) * speed * randomInRange(0.85, 1.15);

    particles.push(
      new WobbleParticle({
        x: from.x,
        y: from.y,
        vx,
        vy,
        life: 340 + randomInRange(0, 120),
        size: randomInRange(2, 4),
        color,
        delay: i * 12,
        wobbleAmp: randomInRange(3, 7),
        wobbleFreq: randomInRange(3, 6),
      }),
    );
  }

  return particles;
}

function buildRock(from: { x: number; y: number }, to: { x: number; y: number }): Particle[] {
  const angle = angleBetween(from, to);
  const dist = distBetween(from, to);
  const speed = dist / (500 / 16);
  const colors = ['#b8a038', '#8a7828', '#d0b848'];
  const particles: Particle[] = [];

  // 10 rock particles
  for (let i = 0; i < 10; i++) {
    const spread = randomInRange(-0.2, 0.2);
    const color = colors[i % colors.length];
    const spd = speed * randomInRange(0.9, 1.3);
    const vx = Math.cos(angle + spread) * spd;
    const vy = Math.sin(angle + spread) * spd;

    particles.push(
      new Particle({
        x: from.x,
        y: from.y,
        vx,
        vy,
        life: 360 + randomInRange(0, 100),
        size: randomInRange(5, 8),
        color,
        delay: i * 30,
        rotation: randomInRange(0, Math.PI * 2),
        rotationSpeed: randomInRange(-0.12, 0.12),
      }),
    );
  }

  // debris at target
  for (let i = 0; i < 6; i++) {
    particles.push(
      new Particle({
        x: to.x + randomInRange(-12, 12),
        y: to.y + randomInRange(-12, 12),
        vx: randomInRange(-2.5, 2.5),
        vy: randomInRange(-3, 0.5),
        life: 280 + randomInRange(0, 80),
        size: randomInRange(2, 3),
        color: '#c0a840',
        delay: randomInRange(250, 420),
        rotationSpeed: randomInRange(-0.15, 0.15),
      }),
    );
  }

  return particles;
}

function buildGhost(from: { x: number; y: number }, to: { x: number; y: number }): Particle[] {
  const angle = angleBetween(from, to);
  const dist = distBetween(from, to);
  const speed = dist / (600 / 16) * 0.6; // slower, floaty
  const colors = ['#705898', '#9878c0', '#c0a8e8'];
  const particles: Particle[] = [];

  for (let i = 0; i < 12; i++) {
    const spread = randomInRange(-0.35, 0.35);
    const color = colors[i % colors.length];
    const vx = Math.cos(angle + spread) * speed * randomInRange(0.7, 1.3);
    const vy = Math.sin(angle + spread) * speed * randomInRange(0.7, 1.3);

    particles.push(
      new WispParticle({
        x: from.x,
        y: from.y,
        vx,
        vy,
        life: 460 + randomInRange(0, 120),
        size: randomInRange(4, 8),
        color,
        delay: i * 35,
        rotationSpeed: randomInRange(-0.05, 0.05),
        phaseOffset: randomInRange(0, Math.PI * 2),
      }),
    );
  }

  return particles;
}

function buildDragon(from: { x: number; y: number }, to: { x: number; y: number }): Particle[] {
  const angle = angleBetween(from, to);
  const dist = distBetween(from, to);
  const speed = dist / (700 / 16);
  const rainbowColors = ['#ff0000', '#ff8800', '#ffff00', '#00ff00', '#0088ff', '#8800ff'];
  const particles: Particle[] = [];
  const linesPerColor = Math.ceil(25 / rainbowColors.length);

  for (let c = 0; c < rainbowColors.length; c++) {
    const color = rainbowColors[c];
    const perp = angle + Math.PI / 2;
    const lineOffset = (c - (rainbowColors.length - 1) / 2) * 5;
    const ox = Math.cos(perp) * lineOffset;
    const oy = Math.sin(perp) * lineOffset;

    for (let i = 0; i < linesPerColor; i++) {
      const particleIdx = c * linesPerColor + i;
      if (particleIdx >= 25) break;

      const microSpread = randomInRange(-0.04, 0.04);
      const vx = Math.cos(angle + microSpread) * speed * randomInRange(0.95, 1.05);
      const vy = Math.sin(angle + microSpread) * speed * randomInRange(0.95, 1.05);

      particles.push(
        new Particle({
          x: from.x + ox,
          y: from.y + oy,
          vx,
          vy,
          life: 500 + randomInRange(0, 120),
          size: randomInRange(2.5, 4),
          color,
          delay: particleIdx * 20,
        }),
      );
    }
  }

  return particles;
}

function buildDark(from: { x: number; y: number }, to: { x: number; y: number }): Particle[] {
  const angle = angleBetween(from, to);
  const dist = distBetween(from, to);
  const speed = dist / (650 / 16) * 1.4; // fast
  const colors = ['#705848', '#a08068', '#ff80b0'];
  const particles: Particle[] = [];

  for (let i = 0; i < 15; i++) {
    const spread = randomInRange(-0.15, 0.15);
    const color = colors[i % colors.length];
    const spd = speed * randomInRange(0.9, 1.2);
    const vx = Math.cos(angle + spread) * spd;
    const vy = Math.sin(angle + spread) * spd;

    particles.push(
      new LineParticle({
        x: from.x,
        y: from.y,
        vx,
        vy,
        life: 300 + randomInRange(0, 100),
        size: randomInRange(1.5, 3),
        color,
        delay: i * 28,
        rotation: angle + spread,
        rotationSpeed: 0,
        length: randomInRange(16, 30),
      }),
    );
  }

  return particles;
}

function buildSteel(from: { x: number; y: number }, to: { x: number; y: number }): Particle[] {
  void from;
  const colors = ['#b8b8d0', '#d8d8e8', '#ffffff'];
  const particles: Particle[] = [];

  for (let i = 0; i < 20; i++) {
    const burstAngle = randomInRange(0, Math.PI * 2);
    const spd = randomInRange(3, 8);
    const color = colors[i % colors.length];

    particles.push(
      new Particle({
        x: to.x + randomInRange(-5, 5),
        y: to.y + randomInRange(-5, 5),
        vx: Math.cos(burstAngle) * spd,
        vy: Math.sin(burstAngle) * spd,
        life: 180 + randomInRange(0, 80),
        size: randomInRange(2, 4),
        color,
        delay: randomInRange(0, 60),
      }),
    );
  }

  return particles;
}

function buildNormal(from: { x: number; y: number }, to: { x: number; y: number }): Particle[] {
  const angle = angleBetween(from, to);
  const dist = distBetween(from, to);
  const speed = dist / (450 / 16);
  const colors = ['#a8a878', '#d0d0b0', '#ffffff'];
  const particles: Particle[] = [];

  for (let i = 0; i < 8; i++) {
    const t = i / 7;
    const color = colors[Math.floor(t * (colors.length - 1))];
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;

    particles.push(
      new Particle({
        x: from.x,
        y: from.y,
        vx,
        vy,
        life: 350,
        size: 4 - t * 1.5,
        color,
        delay: i * 10,
      }),
    );
  }

  return particles;
}

// ---- Main dispatcher --------------------------------------------------------

const BUILDERS: Record<string, (from: { x: number; y: number }, to: { x: number; y: number }) => Particle[]> = {
  fire: buildFire,
  water: buildWater,
  electric: buildElectric,
  grass: buildGrass,
  ice: buildIce,
  fighting: buildFighting,
  poison: buildPoison,
  ground: buildGround,
  flying: buildFlying,
  psychic: buildPsychic,
  bug: buildBug,
  rock: buildRock,
  ghost: buildGhost,
  dragon: buildDragon,
  dark: buildDark,
  steel: buildSteel,
  normal: buildNormal,
};

export function buildParticles(
  type: string,
  from: { x: number; y: number },
  to: { x: number; y: number },
): Particle[] {
  const builder = BUILDERS[type.toLowerCase()];
  if (!builder) return buildNormal(from, to);
  return builder(from, to);
}
