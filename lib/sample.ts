export const SAMPLE_CODE = `// Paste your own code, or explore this sample.
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

class ParticleField {
  private particles: Particle[] = [];

  constructor(count: number) {
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
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > 1) p.vx *= -1;
      if (p.y < 0 || p.y > 1) p.vy *= -1;
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
`;
