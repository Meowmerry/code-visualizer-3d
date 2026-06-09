export const SAMPLE_CODE = `// Paste your own code, or explore this sample.
// Each construct below maps to a different 3D geometry.
import { readFile } from "fs/promises";
import { EventEmitter } from "events";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

const GRAVITY = 0.002;

class ParticleField extends EventEmitter {
  private particles: Particle[] = [];

  constructor(count: number) {
    super();
    for (let i = 0; i < count; i++) {
      this.particles.push(this.spawn());
    }
  }

  spawn(): Particle {
    return {
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random() - 0.5) * 0.01,
      vy: (Math.random() - 0.5) * 0.01,
    };
  }

  step() {
    for (const p of this.particles) {
      p.vy += GRAVITY;
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > 1) {
        p.vx *= -1;
      } else if (p.y > 1) {
        p.vy *= -0.8;
      }
    }
  }

  async loadPreset(path: string) {
    try {
      const raw = await readFile(path, "utf8");
      const preset = await JSON.parse(raw);
      this.particles = preset.particles;
    } catch (err) {
      console.error("preset failed", err);
    }
  }
}

function createField(count: number) {
  const field = new ParticleField(count);
  return field;
}

const animate = (field: ParticleField) => {
  field.step();
  requestAnimationFrame(() => animate(field));
};

export { ParticleField, createField, animate };
`;
