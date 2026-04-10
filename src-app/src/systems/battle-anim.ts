// battle-anim.ts — Core animation engine for battle effects

// ---- Helpers ----------------------------------------------------------------

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function angleBetween(
  from: { x: number; y: number },
  to: { x: number; y: number },
): number {
  return Math.atan2(to.y - from.y, to.x - from.x);
}

export function distBetween(
  from: { x: number; y: number },
  to: { x: number; y: number },
): number {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function randomInRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ---- Type color map ---------------------------------------------------------

export const TYPE_COLORS: Record<string, string> = {
  fire: '#ff7c5c',
  water: '#6ab4f5',
  grass: '#78c850',
  electric: '#f8d030',
  psychic: '#f85888',
  normal: '#a8a878',
  ghost: '#705898',
  dragon: '#7038f8',
  ice: '#98d8d8',
  fighting: '#c03028',
  poison: '#a040a0',
  ground: '#e0c068',
  flying: '#a890f0',
  bug: '#a8b820',
  rock: '#b8a038',
  dark: '#705848',
  steel: '#b8b8d0',
};

// ---- runCanvas --------------------------------------------------------------

export function runCanvas(
  ctx: CanvasRenderingContext2D,
  duration: number,
  drawFn: (ctx: CanvasRenderingContext2D, t: number) => void,
  speed: number = 1,
): Promise<void> {
  return new Promise((resolve) => {
    const scaledDuration = duration / speed;
    const start = performance.now();

    function frame() {
      const elapsed = performance.now() - start;
      const t = Math.min(elapsed / scaledDuration, 1);
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      drawFn(ctx, t);
      if (t < 1) {
        requestAnimationFrame(frame);
      } else {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        resolve();
      }
    }

    requestAnimationFrame(frame);
  });
}

// ---- Particle ---------------------------------------------------------------

export class Particle {
  x!: number;
  y!: number;
  vx!: number;
  vy!: number;
  life!: number;
  age: number = 0;
  size!: number;
  color!: string;
  alpha: number = 1;
  rotation: number = 0;
  rotationSpeed: number = 0;
  delay: number = 0;

  constructor(opts: Partial<Particle> & { x: number; y: number; life: number }) {
    Object.assign(this, { vx: 0, vy: 0, size: 4, color: '#fff', ...opts });
  }

  tick(dt: number) {
    if (this.delay > 0) {
      this.delay -= dt;
      return;
    }
    this.age += dt;
    this.x += this.vx * (dt / 16);
    this.y += this.vy * (dt / 16);
    this.rotation += this.rotationSpeed * (dt / 16);
    this.alpha = Math.max(0, 1 - this.age / this.life);
  }

  get isAlive(): boolean {
    return this.age < this.life && this.delay <= 0 || this.delay > 0;
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this.delay > 0 || this.alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    ctx.beginPath();
    ctx.arc(0, 0, this.size, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.restore();
  }
}

// ---- runParticleCanvas ------------------------------------------------------

export function runParticleCanvas(
  ctx: CanvasRenderingContext2D,
  particles: Particle[],
  duration: number,
  speed: number = 1,
): Promise<void> {
  return new Promise((resolve) => {
    const scaledDuration = duration / speed;
    let lastTime = performance.now();
    const start = lastTime;

    function frame() {
      const now = performance.now();
      const dt = (now - lastTime) * speed;
      lastTime = now;
      const elapsed = now - start;

      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      for (const p of particles) {
        p.tick(dt);
        if (p.isAlive) p.draw(ctx);
      }

      const anyAlive = particles.some((p) => p.isAlive);
      if (elapsed < scaledDuration || anyAlive) {
        requestAnimationFrame(frame);
      } else {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        resolve();
      }
    }

    requestAnimationFrame(frame);
  });
}
