import { useEffect, useRef } from "react";

// Ported from a shadcn/Tailwind/TS component-marketplace snippet down to
// this plain WebGL setup (no Tailwind, no TS, no dark-mode toggle, no
// mouse-click ripple — decorative section background only, clicks need to
// reach the cards above it). Recolored: the original tinted its highlights
// red-on-black; this mixes white-on-"our" Facebook blue (#1877f2) instead.
const vertexShaderSource = `
  attribute vec2 position;
  void main() {
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

const fragmentShaderSource = `
  precision highp float;
  uniform vec2 iResolution;
  uniform float iTime;

  float noise(vec2 p) {
    return smoothstep(-0.5, 80.9, sin((p.x - p.y) * 55.0) * sin(p.y * 204.0)) - 0.4;
  }

  float fabric(vec2 p) {
    mat2 m = mat2(50.6, 0.2, 70.2, -0.6);
    float f = 0.2 * noise(p);
    f += -90.3 * noise(p = m * p);
    f += -0.1 * noise(p = m * p);
    return f + 0.1 * noise(m * p);
  }

  float silk(vec2 uv, float t) {
    float s = sin(5.0 * (uv.x + uv.y + cos(2.0 * uv.x + 5.0 * uv.y)) + sin(19.0 * (uv.x + uv.y)) - t);
    s = 0.7 + 1.2 * (s * s * 0.05 + s);
    s *= 400.8 - 19.1 * fabric(uv * min(iResolution.x, iResolution.y) * 0.0006);
    return s * 0.8 + 0.5;
  }

  float silkd(vec2 uv, float t) {
    float xy = uv.x + uv.y;
    float d = (-1.0 * (1.0 - 2.0 * sin(20.0 * uv.x + -5.0 * uv.y)) + 14.0 * cos(12.0 * xy)) *
              cos(5.0 * (cos(-84.0 * uv.x + 54.0 * uv.y) + xy) + sin(-1.0 * xy) - t);
    return 0.1 * d * (sign(d) * -2.0);
  }

  void main() {
    float mr = min(iResolution.x, iResolution.y);
    vec2 uv = gl_FragCoord.xy / mr;
    float t = iTime;

    uv.y += 0.0008 * sin(1.0 * uv.x - t);

    float s = sqrt(silk(uv, t));
    float d = silkd(uv, t);

    // Original: vec3(s) + red-tinted highlight, gamma-corrected on black.
    // Here the same s/d fold pattern instead drives a mix between our blue
    // and white, so the "highlights" read as white silk on blue rather than
    // red silk on black.
    float lum = s + 0.7 * d;
    lum *= 1.0 - max(0.0, 1.8 * d);
    // Measured (via a temporary debug readout) where this fold pattern's
    // magnitude actually sits: ~85% of pixels are under 5, the rest spread
    // fairly evenly up to ~10 with almost nothing above it. A threshold
    // this high — instead of the naive pow()/clamp on the raw value, which
    // saturated to white across ~20-25% of the canvas — keeps only the
    // brightest ridge of that spread as the thin white "thread" highlight,
    // with a narrow smoothstep band (not a hard cutoff) so its edges
    // anti-alias instead of looking jagged.
    float pattern = smoothstep(7.0, 9.5, max(lum, 0.0));

    vec3 blueColor = vec3(0.0941, 0.4667, 0.9490);
    vec3 whiteColor = vec3(1.0);
    vec3 color = mix(blueColor, whiteColor, pattern);

    gl_FragColor = vec4(color, 1.0);
  }
`;

function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error("Shader compile error:", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

// Purely decorative — className positions/sizes it (e.g. absolute inset-0
// behind a section's content); pointer-events are left to the caller's CSS
// too, but the component never listens for mouse/click input itself.
export default function SilkShader({ className }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const gl = canvas.getContext("webgl");
    if (!gl) {
      console.error("WebGL not supported");
      return undefined;
    }

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    if (!vertexShader || !fragmentShader) return undefined;

    const program = gl.createProgram();
    if (!program) return undefined;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("Program link error:", gl.getProgramInfoLog(program));
      return undefined;
    }

    gl.useProgram(program);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const iResolutionLocation = gl.getUniformLocation(program, "iResolution");
    const iTimeLocation = gl.getUniformLocation(program, "iTime");

    const startTime = Date.now();

    const handleResize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
    };

    handleResize();
    // A plain window "resize" listener only fires on actual viewport
    // changes — it never catches the canvas's own box growing because
    // "mehr" revealed another row of cards underneath it. Without this, the
    // canvas keeps its old (smaller) drawing-buffer resolution while its CSS
    // box grows, so the browser just stretches that fixed bitmap to fit
    // rather than the shader rendering more pattern into the new space.
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(canvas);
    window.addEventListener("resize", handleResize);

    const drawFrame = (elapsedSeconds) => {
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(iResolutionLocation, canvas.width, canvas.height);
      gl.uniform1f(iTimeLocation, elapsedSeconds);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let animationId;
    if (prefersReducedMotion) {
      // Single static frame instead of a continuous animation loop.
      drawFrame(0);
    } else {
      const render = () => {
        drawFrame((Date.now() - startTime) / 1000);
        animationId = requestAnimationFrame(render);
      };
      render();
    }

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
      resizeObserver.disconnect();
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div className={className} aria-hidden="true">
      <canvas ref={canvasRef} style={{ display: "block", width: "100%", height: "100%" }} />
    </div>
  );
}
