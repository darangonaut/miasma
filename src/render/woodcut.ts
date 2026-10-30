import { Filter, GlProgram, defaultFilterVert } from 'pixi.js';

/**
 * Stredoveký drevorez: celá scéna sa prekreslí na zažltnutý papier čiernymi ryhami.
 * Svetlé miesta ostanú papierom, tiene sa šrafujú (čím tmavšie, tým hustejšie a krížom),
 * tma je plná čerň. Farbu majú len oheň (rumelka) a mor (medenková zeleň), ako na
 * ručne kolorovaných tlačiach tanca smrti. Ryhy sú ukotvené k svetu, nie k obrazovke,
 * takže sa pri pohybe kamery „neplazia“.
 */
const fragment = /* glsl */ `
in vec2 vTextureCoord;
out vec4 finalColor;

uniform sampler2D uTexture;
uniform vec4 uInputSize;
uniform vec2 uCam;
uniform float uSpacing;
uniform float uStrength;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
    f.y
  );
}

// Ryha: 1 na čiare, 0 mimo; w je hrúbka čiary (0–1 z rozostupu), aa vyhladenie.
float groove(float coord, float w, float aa) {
  if (w <= 0.0) return 0.0;
  float d = abs(fract(coord) - 0.5) * 2.0;
  return smoothstep(1.0 - w - aa, 1.0 - w + aa, d);
}

void main(void) {
  vec4 c = texture(uTexture, vTextureCoord);
  vec2 p = vTextureCoord * uInputSize.xy + uCam;
  float sp = uSpacing;
  float L = dot(c.rgb, vec3(0.299, 0.587, 0.114));
  // Hra je tmavá: stredné tóny sa zdvihnú, aby sa svetlo fakle vytlačilo ako papier.
  // Siluety a tma (L < 0,05) sú plná čerň, osvetlené pozadie (L okolo 0,2–0,4) papier.
  float t = smoothstep(0.036, 0.13, L);
  t += (vnoise(p / (sp * 0.8)) - 0.5) * 0.08;

  // Ručne rezané čiary sa jemne vlnia.
  float wob = (vnoise(p / (sp * 10.0)) - 0.5) * 1.2;
  float aa = 2.0 / sp;
  float r2 = 0.7071 / sp;
  float h1 = groove((p.x + p.y) * r2 + wob, clamp((0.8 - t) * 1.4, 0.0, 0.9), aa);
  float h2 = groove((p.x - p.y) * r2 - wob * 0.7, clamp((0.52 - t) * 1.7, 0.0, 0.9), aa);
  float h3 = groove(p.y / sp + wob * 0.5, clamp((0.3 - t) * 2.6, 0.0, 0.9), aa);
  float ink = max(h1, max(h2, h3));
  ink = max(ink, smoothstep(0.1, 0.02, t));

  vec3 paper = vec3(0.89, 0.83, 0.68) * (0.92 + 0.08 * vnoise(p / (sp * 4.0)));
  vec3 inkColor = vec3(0.07, 0.05, 0.045);
  vec3 col = mix(paper, inkColor, ink);

  // Farebné akcenty: oheň rumelkou, mor medenkou; najsvetlejšie jadro ostane papierom.
  float mx = max(c.r, max(c.g, c.b));
  float mn = min(c.r, min(c.g, c.b));
  float sat = (mx - mn) / (mx + 0.001);
  float bright = smoothstep(0.3, 0.6, mx);
  float warm = smoothstep(0.5, 0.8, sat) * smoothstep(0.02, 0.12, c.r - c.b) * bright;
  float sick = smoothstep(0.02, 0.08, c.g - max(c.r, c.b)) * smoothstep(0.06, 0.2, mx);
  float core = smoothstep(0.78, 0.98, L);
  vec3 red = mix(vec3(0.74, 0.13, 0.06), paper, core) * (1.0 - ink * 0.45);
  vec3 green = vec3(0.26, 0.46, 0.27) * (1.0 - ink * 0.35);
  col = mix(col, red, warm);
  col = mix(col, green, sick * (1.0 - warm));

  finalColor = vec4(mix(c.rgb, col, uStrength), 1.0);
}
`;

export class Woodcut {
  readonly filter: Filter;

  constructor() {
    this.filter = new Filter({
      glProgram: GlProgram.from({
        vertex: defaultFilterVert,
        fragment,
        name: 'woodcut',
        preferredFragmentPrecision: 'highp',
      }),
      resources: {
        woodcut: {
          uCam: { value: new Float32Array(2), type: 'vec2<f32>' },
          uSpacing: { value: 5, type: 'f32' },
          uStrength: { value: 1, type: 'f32' },
        },
      },
      resolution: 'inherit',
      antialias: 'off',
    });
  }

  /** Posun sveta (px obrazovky) a rozostup rýh podľa priblíženia. */
  update(worldX: number, worldY: number, zoom: number, resolution: number): void {
    const u = this.filter.resources.woodcut.uniforms;
    const cam = u.uCam as Float32Array;
    cam[0] = -worldX * resolution;
    cam[1] = -worldY * resolution;
    u.uSpacing = Math.max(3, zoom * resolution * 1.25);
  }
}
