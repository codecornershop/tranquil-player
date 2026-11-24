export const LIQUID_GLASS_VERTEX_SHADER = `
  attribute vec2 a_pos;
  varying vec2 v_uv;

  void main() {
    v_uv = a_pos * 0.5 + 0.5;
    gl_Position = vec4(a_pos, 0.0, 1.0);
  }
`;

export const LIQUID_GLASS_FRAGMENT_SHADER = `
  precision highp float;
  varying vec2 v_uv;
  uniform sampler2D u_bg;
  uniform vec2 u_res;
  uniform vec2 u_element_pos;
  uniform vec2 u_element_size;
  uniform float u_radius;
  uniform float u_time;

  float sdRoundBox4(vec2 p, vec2 halfSize, vec4 r) {
    r.xy = (p.x > 0.0) ? r.xy : r.zw;
    r.x = (p.y < 0.0) ? r.x : r.y;
    vec2 q = abs(p) - halfSize + r.x;
    return min(max(q.x, q.y), 0.0) + length(max(q.x, 0.0)) - r.x;
  }

  vec2 fragToScreenUV() {
    vec2 screenPx = u_element_pos + v_uv * u_element_size;
    vec2 uv = screenPx / u_res;
    return vec2(uv.x, 1.0 - uv.y);
  }

  void main() {
    vec2 pxSize = u_element_size;
    vec2 halfSize = pxSize * 0.5;
    vec2 p = (v_uv - 0.5) * pxSize;

    float d = sdRoundBox4(p, halfSize, vec4(u_radius, 0.0, u_radius, 0.0));
    vec2 baseUV = fragToScreenUV();

    // Thin rim right around d == 0
    float edgeRing = smoothstep(2.0, 0.0, abs(d)) * step(d, 1.5);

    // Depth 0 at rim -> 1 inward, curved with 0.25 power like a lens
    float depth01 = clamp(-d / max(min(halfSize.x, halfSize.y), 1.0), 0.0, 1.0);
    float lensHeight = pow(depth01, 0.25);
    float bend = (1.0 - lensHeight) * 0.025;

    vec2 fromCenter = normalize(p + vec2(1e-5));
    vec2 refractedUV = clamp(baseUV - fromCenter * bend, 0.001, 0.999);

    float disp = 0.003 * (1.0 - lensHeight);
    vec3 refracted = vec3(
      texture2D(u_bg, clamp(refractedUV + fromCenter * disp, 0.001, 0.999)).r,
      texture2D(u_bg, refractedUV).g,
      texture2D(u_bg, clamp(refractedUV - fromCenter * disp, 0.001, 0.999)).b
    );

    // Schlick Fresnel approximation
    float f0 = 0.04;
    float cosTheta = clamp(1.0 - (1.0 - lensHeight) * 0.85, 0.0, 1.0);
    float fresnel = f0 + (1.0 - f0) * pow(1.0 - cosTheta, 5.0);

    vec3 glass = mix(refracted, vec3(0.85, 0.88, 0.95), fresnel * 0.18);
    glass += vec3(1.0) * edgeRing * 0.22;

    float insideMask = (1.0 - smoothstep(-1.0, 0.5, d)) * 0.55;
    gl_FragColor = vec4(glass, insideMask);
  }
`;
