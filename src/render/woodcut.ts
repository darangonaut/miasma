import { Filter, GlProgram, defaultFilterVert } from 'pixi.js';

/**
 * Stredoveký drevorez: celá scéna sa prekreslí na zažltnutý papier čiernymi ryhami.
 * Svetlé miesta ostanú papierom, tiene sa šrafujú (čím tmavšie, tým hustejšie a krížom),
 * tma je plná čerň. Farbu majú len oheň (rumelka) a mor (medenková zeleň), ako na
 * ručne kolorovaných tlačiach tanca smrti. Ryhy sú ukotvené k svetu, nie k obrazovke,
 * takže sa pri pohybe kamery „neplazia“.
 */
/** Fragment shader drevorezu (GLSL ES 3.0); zdieľa ho hra aj úvodná obrazovka. */
export const WOODCUT_FRAGMENT = /* glsl */ `
in vec2 vTextureCoord;
out vec4 finalColor;

uniform sampler2D uTexture;
uniform vec4 uInputSize;
uniform vec2 uCam;
uniform float uSpacing;
uniform float uStrength;
/** Rozsah jasu, z ktorého sa robí čerň (uLow) až papier (uHigh). */
uniform float uLow;
uniform float uHigh;

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
  float t = smoothstep(uLow, uHigh, L);
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
        fragment: WOODCUT_FRAGMENT,
        name: 'woodcut',
        preferredFragmentPrecision: 'highp',
      }),
      resources: {
        woodcut: {
          uCam: { value: new Float32Array(2), type: 'vec2<f32>' },
          uSpacing: { value: 5, type: 'f32' },
          uStrength: { value: 1, type: 'f32' },
          uLow: { value: 0.036, type: 'f32' },
          uHigh: { value: 0.13, type: 'f32' },
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

/**
 * Ten istý drevorez pre obyčajné plátno (úvodná obrazovka): obrázok z 2D plátna sa
 * nahrá ako textúra a vykreslí cez shader do WebGL2 plátna. Bez WebGL2 vráti null.
 */
export class WoodcutCanvas {
  private gl: WebGL2RenderingContext;
  private program: WebGLProgram;
  private texture: WebGLTexture;
  private loc: Record<string, WebGLUniformLocation | null> = {};

  static create(canvas: HTMLCanvasElement): WoodcutCanvas | null {
    const gl = canvas.getContext('webgl2', { antialias: false, premultipliedAlpha: false });
    if (!gl) return null;
    try {
      return new WoodcutCanvas(gl);
    } catch {
      return null;
    }
  }

  private constructor(gl: WebGL2RenderingContext) {
    this.gl = gl;
    const vertex = `#version 300 es
in vec2 aPos;
out vec2 vTextureCoord;
void main() {
  vTextureCoord = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;
    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type)!;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh)!);
      return sh;
    };
    const program = gl.createProgram();
    gl.attachShader(program, compile(gl.VERTEX_SHADER, vertex));
    gl.attachShader(
      program,
      compile(gl.FRAGMENT_SHADER, `#version 300 es\nprecision highp float;\n${WOODCUT_FRAGMENT}`),
    );
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('woodcut link');
    this.program = program;
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const pos = gl.getAttribLocation(program, 'aPos');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
    this.texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    for (const [k, v] of [
      [gl.TEXTURE_MIN_FILTER, gl.LINEAR],
      [gl.TEXTURE_MAG_FILTER, gl.LINEAR],
      [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE],
      [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE],
    ])
      gl.texParameteri(gl.TEXTURE_2D, k!, v!);
    for (const name of ['uTexture', 'uInputSize', 'uCam', 'uSpacing', 'uStrength', 'uLow', 'uHigh'])
      this.loc[name] = gl.getUniformLocation(program, name);
  }

  render(source: HTMLCanvasElement, spacing: number, low: number, high: number): void {
    const gl = this.gl;
    const { width, height } = source;
    gl.viewport(0, 0, width, height);
    gl.useProgram(this.program);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
    gl.uniform1i(this.loc.uTexture!, 0);
    gl.uniform4f(this.loc.uInputSize!, width, height, 1 / width, 1 / height);
    gl.uniform2f(this.loc.uCam!, 0, 0);
    gl.uniform1f(this.loc.uSpacing!, spacing);
    gl.uniform1f(this.loc.uStrength!, 1);
    gl.uniform1f(this.loc.uLow!, low);
    gl.uniform1f(this.loc.uHigh!, high);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
}
