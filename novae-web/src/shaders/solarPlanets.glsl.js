export const planetVertexShader = `
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec2 vUv;
  void main() {
    vPosition = normalize(position);
    vNormal = normalize(normalMatrix * normal);
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

export const noiseGLSL = `
  float hash(vec3 p) {
    return fract(sin(dot(p, vec3(17.1, 31.7, 47.3))) * 43758.5453);
  }
  float noise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x), mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
      mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x), mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y),
      f.z
    );
  }
  float fbm(vec3 p, int octaves) {
    float value = 0.0;
    float amplitude = 0.55;
    for (int i = 0; i < 6; i++) {
      if (i >= octaves) break;
      value += noise(p) * amplitude;
      p *= 2.02;
      amplitude *= 0.5;
    }
    return value;
  }
  float fbm2(vec2 p, int octaves) {
    return fbm(vec3(p, 0.0), octaves);
  }
`

export const earthFragmentShader = `
  uniform float uTime;
  uniform float uSeed;
  varying vec3 vPosition;
  varying vec3 vNormal;
  ${noiseGLSL}
  void main() {
    float continents = fbm(vPosition * 2.45 + vec3(uSeed * 0.01), 5);
    float coast = smoothstep(0.49, 0.56, continents);
    float mountains = fbm(vPosition * 7.0 + vec3(3.0), 3);
    vec3 oceanDeep = vec3(0.04, 0.16, 0.48);
    vec3 oceanShelf = vec3(0.08, 0.36, 0.72);
    vec3 forest = vec3(0.12, 0.42, 0.18);
    vec3 dryLand = vec3(0.47, 0.36, 0.19);
    vec3 ice = vec3(0.92, 0.95, 0.96);
    vec3 ocean = mix(oceanDeep, oceanShelf, fbm(vPosition * 6.0, 3));
    vec3 land = mix(forest, dryLand, smoothstep(0.45, 0.82, mountains));
    vec3 color = mix(ocean, land, coast);
    float polar = smoothstep(0.74, 0.96, abs(vPosition.y));
    color = mix(color, ice, polar * 0.85);
    float clouds = fbm(vPosition * 5.0 + vec3(uTime * 0.025, 0.0, uTime * 0.012), 4);
    float cloudMask = smoothstep(0.58, 0.78, clouds) * (1.0 - polar * 0.35);
    color = mix(color, vec3(1.0), cloudMask * 0.45);
    vec3 sunDir = normalize(vec3(1.0, 0.25, 0.45));
    float diff = max(dot(normalize(vNormal), sunDir), 0.0);
    gl_FragColor = vec4(color * (0.12 + diff * 0.88), 1.0);
  }
`

export const solarPlanetFragments = {
  Mercury: `
    uniform float uTime;
    varying vec3 vPosition;
    varying vec3 vNormal;
    ${noiseGLSL}
    void main() {
      float surface = fbm(vPosition * 3.0, 4);
      float craters = 0.0;
      for (int i = 0; i < 8; i++) {
        vec3 craterPos = normalize(vec3(sin(float(i) * 2.399), cos(float(i) * 1.618), sin(float(i) * 3.141)));
        float d = distance(normalize(vPosition), craterPos);
        float rim = smoothstep(0.08, 0.06, d) * smoothstep(0.04, 0.06, d);
        float floor = smoothstep(0.06, 0.04, d);
        craters += rim * 0.3 - floor * 0.15;
      }
      vec3 baseColor = mix(vec3(0.42, 0.38, 0.35), vec3(0.62, 0.58, 0.55), surface);
      baseColor += craters;
      vec3 sunDir = normalize(vec3(1.0, 0.3, 0.5));
      float diffuse = max(dot(normalize(vNormal), sunDir), 0.0);
      float terminator = smoothstep(0.0, 0.15, diffuse);
      gl_FragColor = vec4(baseColor * (0.05 + terminator * 0.95), 1.0);
    }
  `,
  Venus: `
    uniform float uTime;
    varying vec3 vPosition;
    varying vec3 vNormal;
    ${noiseGLSL}
    void main() {
      float cloud1 = fbm(vPosition * 1.5 + vec3(uTime * 0.008, 0.0, 0.0), 5);
      float cloud2 = fbm(vPosition * 2.8 + vec3(0.0, uTime * 0.005, 0.0), 4);
      float cloud3 = fbm(vPosition * 0.8 + vec3(uTime * 0.003), 3);
      float clouds = cloud1 * 0.5 + cloud2 * 0.3 + cloud3 * 0.2;
      vec3 color = mix(vec3(0.85, 0.72, 0.35), vec3(0.72, 0.52, 0.18), clouds);
      color = mix(color, vec3(0.55, 0.35, 0.10), clouds * clouds);
      vec3 sunDir = normalize(vec3(1.0, 0.2, 0.4));
      float diff = max(dot(normalize(vNormal), sunDir), 0.0);
      gl_FragColor = vec4(color * (0.15 + diff * 0.85), 1.0);
    }
  `,
  Mars: `
    uniform float uTime;
    varying vec3 vPosition;
    varying vec3 vNormal;
    ${noiseGLSL}
    void main() {
      float terrain = fbm(vPosition * 2.2, 5);
      float dust = fbm(vPosition * 6.0 + vec3(uTime * 0.01, 0.0, 0.0), 3) * 0.3;
      vec3 color = mix(vec3(0.55, 0.18, 0.08), vec3(0.75, 0.32, 0.12), terrain);
      color = mix(color, vec3(0.88, 0.52, 0.28), dust);
      color = mix(color, vec3(0.40, 0.22, 0.15), step(0.65, terrain) * 0.4);
      float lat = vPosition.y;
      float iceSouth = smoothstep(0.72, 0.82, -lat);
      float iceNorth = smoothstep(0.78, 0.88, lat);
      color = mix(color, vec3(0.92, 0.88, 0.85), clamp(iceSouth + iceNorth, 0.0, 1.0));
      float canyonLine = 1.0 - smoothstep(0.025, 0.085, abs(vPosition.y - 0.05));
      float canyonLength = smoothstep(0.08, 0.62, abs(vPosition.x));
      color = mix(color, vec3(0.28, 0.13, 0.08), canyonLine * canyonLength * 0.45);
      vec3 sunDir = normalize(vec3(1.0, 0.2, 0.5));
      float diff = max(dot(normalize(vNormal), sunDir), 0.0);
      gl_FragColor = vec4(color * (0.08 + diff * 0.92), 1.0);
    }
  `,
  Jupiter: `
    uniform float uTime;
    varying vec3 vPosition;
    varying vec3 vNormal;
    ${noiseGLSL}
    void main() {
      float lat = vPosition.y;
      float warp = fbm(vPosition * 1.5 + vec3(uTime * 0.015, 0.0, 0.0), 3) * 0.15;
      float band = sin((lat + warp) * 10.0);
      vec3 color = mix(vec3(0.88, 0.80, 0.62), vec3(0.62, 0.42, 0.22), smoothstep(-0.2, 0.2, band));
      color = mix(color, vec3(0.78, 0.52, 0.28), smoothstep(0.3, 0.7, band) * 0.6);
      color = mix(color, vec3(0.42, 0.28, 0.16), step(0.7, abs(band)) * 0.4);
      vec2 grsCenter = vec2(0.30, 0.38);
      vec2 planetUV = vec2(atan(vPosition.z, vPosition.x) / 6.28318 + 0.5, vPosition.y * 0.5 + 0.5);
      vec2 grsDist = (planetUV - grsCenter) * vec2(1.0, 2.2);
      float grs = smoothstep(0.12, 0.06, length(grsDist));
      color = mix(color, vec3(0.72, 0.22, 0.12), grs);
      float grsBorder = smoothstep(0.14, 0.12, length(grsDist)) - smoothstep(0.12, 0.06, length(grsDist));
      color = mix(color, vec3(0.97, 0.88, 0.68), grsBorder * 0.6);
      vec3 sunDir = normalize(vec3(1.0, 0.1, 0.3));
      float diff = max(dot(normalize(vNormal), sunDir), 0.0);
      gl_FragColor = vec4(color * (0.12 + diff * 0.88), 1.0);
    }
  `,
  Saturn: `
    uniform float uTime;
    varying vec3 vPosition;
    varying vec3 vNormal;
    ${noiseGLSL}
    void main() {
      float warp = fbm(vPosition * 1.2 + vec3(uTime * 0.01, 0.0, 0.0), 3) * 0.06;
      float band = sin((vPosition.y + warp) * 12.0) * 0.3;
      vec3 color = mix(vec3(0.85, 0.75, 0.52), vec3(0.72, 0.62, 0.40), 0.5 + band);
      float ringShadow = 1.0 - smoothstep(0.08, 0.22, abs(vPosition.y)) * smoothstep(0.72, 0.45, length(vPosition.xz));
      color *= 1.0 - ringShadow * 0.28;
      vec3 sunDir = normalize(vec3(1.0, 0.15, 0.35));
      float diff = max(dot(normalize(vNormal), sunDir), 0.0);
      gl_FragColor = vec4(color * (0.16 + diff * 0.84), 1.0);
    }
  `,
  Uranus: `
    uniform float uTime;
    varying vec3 vPosition;
    varying vec3 vNormal;
    ${noiseGLSL}
    void main() {
      float subtle = fbm(vPosition * 3.0, 2) * 0.06;
      vec3 color = mix(vec3(0.28, 0.58, 0.65), vec3(0.42, 0.78, 0.82), subtle + 0.5);
      color += sin(vPosition.y * 8.0) * 0.04;
      vec3 sunDir = normalize(vec3(1.0, 0.2, 0.5));
      float diff = max(dot(normalize(vNormal), sunDir), 0.0);
      gl_FragColor = vec4(color * (0.18 + diff * 0.82), 1.0);
    }
  `,
  Neptune: `
    uniform float uTime;
    varying vec3 vPosition;
    varying vec3 vNormal;
    ${noiseGLSL}
    void main() {
      float clouds = fbm(vPosition * 2.0 + vec3(uTime * 0.012, 0.0, 0.0), 4);
      float storm = fbm(vPosition * 4.0, 3);
      vec3 color = mix(vec3(0.08, 0.18, 0.62), vec3(0.14, 0.32, 0.80), clouds);
      color = mix(color, vec3(0.22, 0.48, 0.92), storm * 0.3);
      vec2 gdsCenter = vec2(0.4, 0.6);
      vec2 planetUV = vec2(atan(vPosition.z, vPosition.x) / 6.28318 + 0.5, vPosition.y * 0.5 + 0.5);
      float gds = smoothstep(0.09, 0.04, length((planetUV - gdsCenter) * vec2(1.0, 1.8)));
      color = mix(color, vec3(0.05, 0.10, 0.38), gds);
      vec3 sunDir = normalize(vec3(1.0, 0.2, 0.5));
      float diff = max(dot(normalize(vNormal), sunDir), 0.0);
      gl_FragColor = vec4(color * (0.1 + diff * 0.9), 1.0);
    }
  `
}

export const ringVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

export const saturnRingFragmentShader = `
  uniform float uTime;
  varying vec2 vUv;
  ${noiseGLSL}
  void main() {
    float r = (length(vUv - 0.5) * 2.0 - 0.5) / 0.5;
    float cassini = 1.0 - smoothstep(0.44, 0.46, r) * smoothstep(0.52, 0.50, r);
    float ringA = smoothstep(0.50, 0.52, r) * smoothstep(1.0, 0.95, r);
    float ringB = smoothstep(0.10, 0.15, r) * smoothstep(0.48, 0.44, r);
    float ringC = smoothstep(0.00, 0.08, r) * smoothstep(0.12, 0.10, r) * 0.3;
    float grain = fbm2(vec2(r * 20.0, 0.5 + uTime * 0.03), 2) * 0.15;
    vec3 ringColor = mix(vec3(0.72, 0.62, 0.38), vec3(0.85, 0.75, 0.48), step(0.5, r));
    ringColor += grain;
    float alpha = (ringA * 0.75 + ringB * 0.85 + ringC * 0.3) * cassini;
    alpha *= smoothstep(0.0, 0.05, r) * smoothstep(1.0, 0.92, r);
    gl_FragColor = vec4(ringColor, alpha);
  }
`
