import { ORB_FRAGMENT, ORB_VERTEX } from "./orbShader";
import { lookKey, NEUTRAL_COLOR, parseColor, uniformsOf, type OrbLook } from "./orbParams";

/**
 * One renderer for the whole app: a single WebGL context and one program draw every orb.
 * Lists get stills, painted once per look and cached; only the open sheet animates.
 */

const UNIFORMS = ["uRes", "uTime", "uSeed", "uDensity", "uGlow", "uLight", "uWeight", "uContour", "uT1", "uT2", "uC0", "uC1", "uC2", "uBg"] as const;
type UniformName = (typeof UNIFORMS)[number];

interface Gl {
  canvas: HTMLCanvasElement;
  gl: WebGLRenderingContext;
  u: Record<UniformName, WebGLUniformLocation | null>;
}

let shared: Gl | null | undefined;

function setup(): Gl | null {
  if (shared !== undefined) return shared;
  shared = null;
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  const gl = canvas.getContext("webgl", { preserveDrawingBuffer: true, premultipliedAlpha: false, antialias: false });
  if (!gl) return null;
  const compile = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? "orb shader failed");
    return s;
  };
  const program = gl.createProgram()!;
  gl.attachShader(program, compile(gl.VERTEX_SHADER, ORB_VERTEX));
  gl.attachShader(program, compile(gl.FRAGMENT_SHADER, ORB_FRAGMENT));
  gl.linkProgram(program);
  gl.useProgram(program);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const at = gl.getAttribLocation(program, "a");
  gl.enableVertexAttribArray(at);
  gl.vertexAttribPointer(at, 2, gl.FLOAT, false, 0, 0);
  const u = Object.fromEntries(UNIFORMS.map((k) => [k, gl.getUniformLocation(program, k)])) as Gl["u"];
  canvas.addEventListener("webglcontextlost", () => {
    shared = undefined;
    stills.clear();
  });
  shared = { canvas, gl, u };
  return shared;
}

export function canRenderOrbs(): boolean {
  return setup() !== null;
}

/** A colour as 0-1 RGB; what cannot be read falls back to the neutral grey, never to a guess. */
function rgb(css: string): [number, number, number] {
  return parseColor(css) ?? parseColor(NEUTRAL_COLOR)!;
}

/** Paints one frame of a look into `target` (a 2D canvas). `frame` is the frame colour as hex. */
export function paintOrb(target: HTMLCanvasElement, look: OrbLook, frame: string, time: number, seed: number): void {
  const ctx = target.getContext("2d");
  if (!ctx) return;
  const g = setup();
  if (!g) return paintFallback(ctx, target.width, look, frame);
  const { canvas, gl, u } = g;
  if (canvas.width !== target.width || canvas.height !== target.height) {
    canvas.width = target.width;
    canvas.height = target.height;
  }
  const v = uniformsOf(look);
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.uniform2f(u.uRes, canvas.width, canvas.height);
  gl.uniform1f(u.uTime, time);
  gl.uniform1f(u.uSeed, seed);
  gl.uniform1f(u.uDensity, v.density);
  gl.uniform1f(u.uGlow, v.glow);
  gl.uniform1f(u.uLight, v.light);
  gl.uniform1f(u.uWeight, v.weight);
  gl.uniform1f(u.uContour, v.contour);
  gl.uniform1f(u.uT1, v.t1);
  gl.uniform1f(u.uT2, v.t2);
  gl.uniform3fv(u.uC0, rgb(v.colors[0]));
  gl.uniform3fv(u.uC1, rgb(v.colors[1]));
  gl.uniform3fv(u.uC2, rgb(v.colors[2]));
  gl.uniform3fv(u.uBg, rgb(frame));
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  ctx.clearRect(0, 0, target.width, target.height);
  ctx.drawImage(canvas, 0, 0);
}

function paintFallback(ctx: CanvasRenderingContext2D, size: number, look: OrbLook, frame: string): void {
  const v = uniformsOf(look);
  ctx.fillStyle = frame;
  ctx.fillRect(0, 0, size, size);
  const r = size * 0.36;
  const g = ctx.createRadialGradient(size * 0.42, size * 0.4, r * 0.1, size / 2, size / 2, r);
  g.addColorStop(0, v.colors[0]);
  g.addColorStop(0.7, v.colors[1]);
  g.addColorStop(1, v.colors[2]);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, r, 0, Math.PI * 2);
  ctx.fill();
}

/* Stills: one image per look and size, kept in memory (least recently used out). */
const MAX_STILLS = 400;
const stills = new Map<string, HTMLCanvasElement>();

/** Draws the cached still of a look into `target`, painting it first if needed. */
export function drawStill(target: HTMLCanvasElement, look: OrbLook, frame: string, seed = 0): void {
  const key = `${lookKey(look, target.width)}|${frame}|${seed}`;
  let img = stills.get(key);
  if (img) {
    stills.delete(key);
  } else {
    img = document.createElement("canvas");
    img.width = target.width;
    img.height = target.height;
    paintOrb(img, look, frame, 3 + seed * 1.7, seed);
    if (stills.size >= MAX_STILLS) stills.delete(stills.keys().next().value!);
  }
  stills.set(key, img);
  const ctx = target.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, target.width, target.height);
  ctx.drawImage(img, 0, 0);
}
