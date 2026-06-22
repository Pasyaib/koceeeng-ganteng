// WebGL2 Shaders for Retro Image/Video styling
export const vertexShader = `#version 300 es
precision highp float;
out vec2 vTexCoord;
void main() {
  // Generate a fullscreen triangle
  vec2 pos = vec2(
    (gl_VertexID == 1) ? 3.0 : -1.0,
    (gl_VertexID == 2) ? 3.0 : -1.0
  );
  vTexCoord = pos * 0.5 + 0.5;
  gl_Position = vec4(pos, 0.0, 1.0);
}
`;

const sharedHelpers = `
float luminance(vec3 c) {
  return dot(c, vec3(0.299, 0.587, 0.114));
}

vec3 applyBrightnessContrast(vec3 color, float brightness, float contrast) {
  vec3 res = color + vec3(brightness / 100.0);
  float factor = (1.0 + contrast / 100.0) / (1.0 - (contrast / 100.0) * 0.99);
  res = (res - 0.5) * factor + 0.5;
  return clamp(res, 0.0, 1.0);
}

float hash2d(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise2d(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f*f*(3.0-2.0*f);
  float a = hash2d(i + vec2(0.0,0.0));
  float b = hash2d(i + vec2(1.0,0.0));
  float c = hash2d(i + vec2(0.0,1.0));
  float d = hash2d(i + vec2(1.0,1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
`;

export const passthroughFragment = `#version 300 es
precision highp float;
in vec2 vTexCoord;
out vec4 fragColor;
uniform sampler2D inputTexture;
void main() {
  fragColor = texture(inputTexture, vTexCoord);
}
`;

// 1. Halation Fragment
export const halationFragment = `#version 300 es
precision highp float;
in vec2 vTexCoord;
out vec4 fragColor;
uniform sampler2D inputTexture;
uniform vec2 resolution;
uniform float time;
uniform float brightness;
uniform float contrast;

// Uniforms
uniform float halationRadius;
uniform float halationStrength;
uniform float halationThreshold;
uniform vec3 halationTint;

${sharedHelpers}

void main() {
  vec2 uv = vTexCoord;
  vec4 base = texture(inputTexture, uv);
  vec3 col = base.rgb;
  
  // Cross-blur highlights to simulate red film halation bleed
  vec3 blur = vec3(0.0);
  float totalWeight = 0.0;
  vec2 stepSize = halationRadius / resolution;
  
  for (float x = -3.0; x <= 3.0; x += 1.0) {
    for (float y = -3.0; y <= 3.0; y += 1.0) {
      if (abs(x) + abs(y) > 4.0) continue; // Diamond shape filter optimization
      vec2 offset = vec2(x, y) * stepSize;
      vec3 sampleCol = texture(inputTexture, uv + offset).rgb;
      float luma = luminance(sampleCol);
      float distVal = length(vec2(x, y));
      float weight = 1.0 - (distVal / 4.5);
      
      if (luma > halationThreshold) {
        float diff = luma - halationThreshold;
        blur += sampleCol * diff * weight;
      }
      totalWeight += weight;
    }
  }
  
  if (totalWeight > 0.0) {
    blur = blur / totalWeight;
  }
  
  // Halation has a distinct custom halo tone
  vec3 glow = blur * halationStrength * halationTint;
  
  vec3 finalColor = col + glow;
  finalColor = applyBrightnessContrast(finalColor, brightness, contrast);
  fragColor = vec4(finalColor, base.a);
}
`;

// 2. Film Grain Fragment
export const filmGrainFragment = `#version 300 es
precision highp float;
in vec2 vTexCoord;
out vec4 fragColor;
uniform sampler2D inputTexture;
uniform vec2 resolution;
uniform float time;
uniform float brightness;
uniform float contrast;

// Uniforms
uniform float grainSize;
uniform float grainAmount;
uniform float grainSpeed;
uniform int grainColor;

${sharedHelpers}

void main() {
  vec2 uv = vTexCoord;
  vec4 base = texture(inputTexture, uv);
  vec3 col = base.rgb;
  
  // Align coordinates to create grain clusters
  vec2 grainUV = floor(uv * resolution / max(grainSize, 1.0));
  float t = time * grainSpeed;
  
  float noiseR = hash2d(grainUV + vec2(t, 17.0)) - 0.5;
  float noiseG = noiseR;
  float noiseB = noiseR;
  
  if (grainColor == 1) {
    noiseG = hash2d(grainUV + vec2(t * 1.15, 42.0)) - 0.5;
    noiseB = hash2d(grainUV + vec2(t * 0.90, 89.0)) - 0.5;
  }
  
  col.r += noiseR * grainAmount;
  col.g += noiseG * grainAmount;
  col.b += noiseB * grainAmount;
  
  col = applyBrightnessContrast(col, brightness, contrast);
  fragColor = vec4(col, base.a);
}
`;

// 3. Light Leaks Fragment
export const lightLeaksFragment = `#version 300 es
precision highp float;
in vec2 vTexCoord;
out vec4 fragColor;
uniform sampler2D inputTexture;
uniform vec2 resolution;
uniform float time;
uniform float brightness;
uniform float contrast;

// Uniforms
uniform float leakIntensity;
uniform float leakSpeed;
uniform float leakScale;

${sharedHelpers}

void main() {
  vec2 uv = vTexCoord;
  vec4 base = texture(inputTexture, uv);
  vec3 col = base.rgb;
  
  float t = time * leakSpeed;
  vec2 leakUV = uv * leakScale;
  
  // Dynamic smooth fluid flow representing leak structure
  float leakShape = noise2d(leakUV + vec2(t * 0.08, t * 0.04));
  leakShape += 0.5 * noise2d(leakUV * 2.2 - vec2(t * 0.12, -t * 0.08));
  
  // Position leaks mostly near corners/sides
  float edgeGrad = sin(uv.x * 3.14159) * cos(uv.y * 3.14159 * 0.5);
  float leak = smoothstep(0.38, 0.85, leakShape * edgeGrad);
  
  // Vintage camera leak colors: primary amber/orange & secondary soft red
  vec3 primaryLeak = vec3(1.0, 0.38, 0.08) * leak * leakIntensity;
  vec3 secondaryLeak = vec3(1.0, 0.08, 0.18) * pow(leak, 2.2) * leakIntensity * 0.6;
  
  col += primaryLeak + secondaryLeak;
  col = applyBrightnessContrast(col, brightness, contrast);
  fragColor = vec4(col, base.a);
}
`;

// 4. Dust & Scratches Fragment
export const dustScratchesFragment = `#version 300 es
precision highp float;
in vec2 vTexCoord;
out vec4 fragColor;
uniform sampler2D inputTexture;
uniform vec2 resolution;
uniform float time;
uniform float brightness;
uniform float contrast;

// Uniforms
uniform float dustDensity;
uniform float scratchDensity;
uniform vec3 noiseColor;

${sharedHelpers}

void main() {
  vec2 uv = vTexCoord;
  vec4 base = texture(inputTexture, uv);
  vec3 col = base.rgb;
  
  // Keep film damage locked to static intervals of time to feel like frames running at 15 fps
  float frame = floor(time * 15.0);
  
  // 1. Dust generation
  vec2 dustUV = uv + vec2(hash2d(vec2(frame, 5.3)), hash2d(vec2(frame, 12.7)));
  float dustVal = hash2d(floor(dustUV * 360.0));
  if (dustVal < dustDensity * 0.006) {
    float dustType = hash2d(vec2(dustVal, frame));
    vec3 dCol = (dustType > 0.55) ? noiseColor : vec3(0.04); // light lint vs dark carbon particles
    col = mix(col, dCol, 0.92);
  }
  
  // 2. Scratches generation
  for (int i = 0; i < 3; i++) {
    float idx = float(i);
    float scratchX = hash2d(vec2(frame, idx * 22.7));
    if (hash2d(vec2(frame, idx * 84.1)) < scratchDensity * 0.35) {
      float dist = abs(uv.x - scratchX);
      if (dist < 0.00075) {
        float scratchVal = hash2d(vec2(uv.y * 8.0, frame + idx));
        if (scratchVal > 0.2) { // make scratch line intermittent
          float strength = 1.0 - (dist / 0.00075);
          float typeSelect = hash2d(vec2(scratchX, idx));
          vec3 sCol = (typeSelect > 0.6) ? noiseColor : vec3(0.08);
          col = mix(col, sCol, strength * 0.7);
        }
      }
    }
  }
  
  col = applyBrightnessContrast(col, brightness, contrast);
  fragColor = vec4(col, base.a);
}
`;

// 5. Risograph Fragment
export const risographFragment = `#version 300 es
precision highp float;
in vec2 vTexCoord;
out vec4 fragColor;
uniform sampler2D inputTexture;
uniform vec2 resolution;
uniform float time;
uniform float brightness;
uniform float contrast;
uniform vec3 fgColor;
uniform vec3 bgColor;

// Uniforms
uniform float risoGrain;
uniform float risoContrast;

${sharedHelpers}

void main() {
  vec2 uv = vTexCoord;
  vec4 base = texture(inputTexture, uv);
  float luma = luminance(base.rgb);
  
  // Emulate coarse high-contrast ink separation
  float factor = 1.0 + risoContrast / 45.0;
  float cLuma = (luma - 0.5) * factor + 0.5;
  cLuma = clamp(cLuma, 0.0, 1.0);
  
  // High-frequency print paper noise
  float grainNoise = hash2d(gl_FragCoord.xy) - 0.5;
  float noisyLuma = cLuma + grainNoise * risoGrain;
  
  float stepVal = smoothstep(0.38, 0.62, noisyLuma);
  vec3 finalColor = mix(fgColor, bgColor, stepVal);
  
  finalColor = applyBrightnessContrast(finalColor, brightness, contrast);
  fragColor = vec4(finalColor, base.a);
}
`;

// 6. Halftone Fragment
export const halftoneFragment = `#version 300 es
precision highp float;
in vec2 vTexCoord;
out vec4 fragColor;
uniform sampler2D inputTexture;
uniform vec2 resolution;
uniform float time;
uniform float brightness;
uniform float contrast;

// Uniforms
uniform float halftoneSize;
uniform float dotAngle;
uniform vec3 paperColor;
uniform vec3 inkColor;

${sharedHelpers}

void main() {
  vec2 uv = vTexCoord;
  vec4 base = texture(inputTexture, uv);
  vec3 col = mix(vec3(1.0), base.rgb, base.a); 
  
  float lum = luminance(col);
  float aspect = resolution.x / resolution.y;
  
  float rad = dotAngle;
  mat2 rot = mat2(cos(rad), -sin(rad), sin(rad), cos(rad));
  
  vec2 st = uv - 0.5;
  st.x *= aspect;
  st = rot * st;
  
  vec2 nearest = round(st * halftoneSize) / halftoneSize;
  float dist = length(st - nearest);
  
  float radius = (1.0 - lum) * (0.707 / halftoneSize) * 0.9;
  float dot = smoothstep(radius, radius - (1.0 / halftoneSize * 0.1), dist);
  
  vec3 finalCol = mix(paperColor, inkColor, dot);
  finalCol = applyBrightnessContrast(finalCol, brightness, contrast);
  fragColor = vec4(clamp(finalCol, 0.0, 1.0), base.a);
}
`;

// 7. Film Burn Fragment
export const filmBurnFragment = `#version 300 es
precision highp float;
in vec2 vTexCoord;
out vec4 fragColor;
uniform sampler2D inputTexture;
uniform vec2 resolution;
uniform float time;
uniform float brightness;
uniform float contrast;

// Uniforms
uniform float burnIntensity;
uniform float burnSpeed;
uniform float burnScale;

${sharedHelpers}

void main() {
  vec2 uv = vTexCoord;
  vec4 base = texture(inputTexture, uv);
  vec3 col = base.rgb;
  
  // Compute distance to frame boundaries
  float distToEdge = min(min(uv.x, 1.0 - uv.x), min(uv.y, 1.0 - uv.y));
  
  // Organic flowing boundary using Simplex/Perlin-style noise
  float t = time * burnSpeed;
  vec2 noiseUV = uv * burnScale;
  float n = noise2d(noiseUV + vec2(0.0, t));
  n += 0.5 * noise2d(noiseUV * 2.0 - vec2(t * 0.5, 0.0));
  
  // Melt boundary calculation
  float threshold = 0.25;
  float burnGrad = smoothstep(0.0, threshold, distToEdge + (n - 0.5) * burnIntensity * 0.22);
  
  // Dynamic glow colors representing yellow-orange-red hot frames
  vec3 fireCol = vec3(1.0, 0.25, 0.0) * (1.0 - burnGrad) * burnIntensity * 3.2; 
  fireCol += vec3(1.0, 0.82, 0.0) * pow(1.0 - burnGrad, 3.2) * burnIntensity * 2.0;
  
  // Mix charcoal edges
  col = mix(vec3(0.03), col, smoothstep(0.0, 0.05, burnGrad));
  col += fireCol;
  
  col = applyBrightnessContrast(col, brightness, contrast);
  fragColor = vec4(col, base.a);
}
`;

// 8. Polaroid Fade Fragment
export const polaroidFadeFragment = `#version 300 es
precision highp float;
in vec2 vTexCoord;
out vec4 fragColor;
uniform sampler2D inputTexture;
uniform vec2 resolution;
uniform float time;
uniform float brightness;
uniform float contrast;

// Uniforms
uniform float fadeAmount;
uniform float vignette;
uniform float tintWarmth;

${sharedHelpers}

void main() {
  vec2 uv = vTexCoord;
  vec4 base = texture(inputTexture, uv);
  vec3 col = base.rgb;
  
  // 1. Polaroid shadow lift and wash-out color curve
  vec3 faded = col;
  faded = faded * 0.84 + vec3(0.09); // Lift black levels
  float luma = luminance(faded);
  faded = mix(faded, vec3(luma), 0.22); // Slightly desaturate shadows/midtones
  
  col = mix(col, faded, fadeAmount);
  
  // 2. Custom photo tinting (Warmth adjustment)
  vec3 warmTint = vec3(1.06, 0.98, 0.86); // Warm cream highlight tint
  vec3 coolTint = vec3(0.88, 0.96, 1.06); // Cool blue cyan shadow/highlight tint
  
  if (tintWarmth > 0.0) {
    vec3 warmCol = col * mix(vec3(1.0), warmTint, tintWarmth / 50.0);
    col = mix(col, warmCol, smoothstep(0.1, 0.9, luma));
  } else if (tintWarmth < 0.0) {
    vec3 coolCol = col * mix(vec3(1.0), coolTint, -tintWarmth / 50.0);
    col = mix(col, coolCol, smoothstep(0.1, 0.9, luma));
  }
  
  // 3. Polaroid fade border vignettes
  float distVal = distance(uv, vec2(0.5));
  float vigVal = smoothstep(0.78, 0.44, distVal + (1.0 - vignette) * 0.38);
  col *= mix(1.0, vigVal, vignette * 0.76);
  
  col = applyBrightnessContrast(col, brightness, contrast);
  fragColor = vec4(col, base.a);
}
`;

// 9. CRT Scanlines Fragment
export const crtScanlinesFragment = `#version 300 es
precision highp float;
in vec2 vTexCoord;
out vec4 fragColor;
uniform sampler2D inputTexture;
uniform vec2 resolution;
uniform float time;
uniform float brightness;
uniform float contrast;

// Uniforms
uniform float scanlineOpacity;
uniform float scanlineDensity;
uniform float phosphorStrength;

${sharedHelpers}

void main() {
  vec2 uv = vTexCoord;
  vec4 base = texture(inputTexture, uv);
  vec3 col = base.rgb;
  
  // 1. Horizontal scanlines overlay
  float scanline = sin(uv.y * scanlineDensity * 3.14159) * 0.5 + 0.5;
  col = mix(col, col * (1.0 - scanlineOpacity), scanline);
  
  // 2. Vertical phosphor grille mask simulation
  float maskCoord = uv.x * resolution.x * 1.5;
  float rgbMask = fract(maskCoord);
  vec3 maskPattern = vec3(1.0);
  
  if (rgbMask < 0.33) {
    maskPattern = vec3(1.25, 0.85, 0.85); // Red strip
  } else if (rgbMask < 0.66) {
    maskPattern = vec3(0.85, 1.25, 0.85); // Green strip
  } else {
    maskPattern = vec3(0.85, 0.85, 1.25); // Blue strip
  }
  
  col = mix(col, col * maskPattern, phosphorStrength);
  
  col = applyBrightnessContrast(col, brightness, contrast);
  fragColor = vec4(col, base.a);
}
`;

// 10. CMYK Misregistration Fragment
export const cmykMisregistrationFragment = `#version 300 es
precision highp float;
in vec2 vTexCoord;
out vec4 fragColor;
uniform sampler2D inputTexture;
uniform vec2 resolution;
uniform float time;
uniform float brightness;
uniform float contrast;

// Uniforms
uniform float offsetCyan;
uniform float offsetMagenta;
uniform float offsetYellow;

${sharedHelpers}

void main() {
  vec2 uv = vTexCoord;
  vec2 pixelSize = 1.0 / resolution;
  
  // Apply offset displacements to CMY separation plates
  vec2 uvC = uv + vec2(-offsetCyan, offsetCyan) * pixelSize * 0.45;
  vec2 uvM = uv + vec2(offsetMagenta, -offsetMagenta) * pixelSize * 0.45;
  vec2 uvY = uv + vec2(-offsetYellow, -offsetYellow) * pixelSize * 0.45;
  vec2 uvK = uv; // Keep Key (black) outline static for print structural realism
  
  // Sample source image channels
  vec3 colC = texture(inputTexture, uvC).rgb;
  vec3 colM = texture(inputTexture, uvM).rgb;
  vec3 colY = texture(inputTexture, uvY).rgb;
  vec3 colK = texture(inputTexture, uvK).rgb;
  
  // CMYK decomposition for Cyan sample
  float kC = 1.0 - max(max(colC.r, colC.g), colC.b);
  float c = (1.0 - colC.r - kC) / (1.0 - kC + 0.0001);
  
  // CMYK decomposition for Magenta sample
  float kM = 1.0 - max(max(colM.r, colM.g), colM.b);
  float m = (1.0 - colM.g - kM) / (1.0 - kM + 0.0001);
  
  // CMYK decomposition for Yellow sample
  float kY = 1.0 - max(max(colY.r, colY.g), colY.b);
  float y = (1.0 - colY.b - kY) / (1.0 - kY + 0.0001);
  
  // Key extraction from Black sample
  float k = 1.0 - max(max(colK.r, colK.g), colK.b);
  
  // Recombine CMYK plates back to RGB space
  float r = (1.0 - c) * (1.0 - k);
  float g = (1.0 - m) * (1.0 - k);
  float b = (1.0 - y) * (1.0 - k);
  
  vec3 col = clamp(vec3(r, g, b), 0.0, 1.0);
  col = applyBrightnessContrast(col, brightness, contrast);
  
  float a = texture(inputTexture, uv).a;
  fragColor = vec4(col, a);
}
`;

// Global CRT/Postprocessing filter
export const postprocessFragment = `#version 300 es
precision highp float;
in vec2 vTexCoord;
out vec4 fragColor;
uniform sampler2D inputTexture;
uniform sampler2D bloomTexture;
uniform vec2 resolution;
uniform float time;
uniform int bloomEnabled;
uniform float bloomIntensity;
uniform int grainEnabled;
uniform float grainIntensity;
uniform float grainSize;
uniform float grainSpeed;
uniform int chromaticEnabled;
uniform float chromaticOffset;
uniform int scanlinesEnabled;
uniform float scanlinesOpacity;
uniform float scanlinesSpacing;
uniform int vignetteEnabled;
uniform float vignetteIntensity;
uniform float vignetteRadius;
uniform int crtEnabled;
uniform float crtAmount;
uniform int phosphorEnabled;
uniform vec3 phosphorColor;

float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.x, p.y, p.x) * 0.1031);
  p3 = p3 + dot(p3, vec3(p3.y + 33.33, p3.z + 33.33, p3.x + 33.33));
  return fract((p3.x + p3.y) * p3.z);
}

vec2 crtDistort(vec2 uv, float amount) {
  vec2 centered = uv - 0.5;
  float dist = dot(centered, centered);
  vec2 distorted = centered * (1.0 + dist * amount);
  return distorted + 0.5;
}

void main() {
  vec2 pixelSize = 1.0 / resolution;
  vec2 uv = vTexCoord;
  
  // CRT barrel curvature warp
  bool crtActive = crtEnabled == 1 && crtAmount > 0.0;
  if (crtActive) {
    uv = crtDistort(uv, crtAmount);
  }
  
  // Black border for CRT corners
  if (crtActive && (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0)) {
    fragColor = vec4(0.0, 0.0, 0.0, 1.0);
    return;
  }
  
  // Sample color with optional chromatic aberration
  vec4 color;
  if (chromaticEnabled == 1 && chromaticOffset > 0.0) {
    float offset = chromaticOffset * pixelSize.x;
    color.r = texture(inputTexture, uv + vec2(offset, 0.0)).r;
    color.g = texture(inputTexture, uv).g;
    color.b = texture(inputTexture, uv - vec2(offset, 0.0)).b;
    color.a = texture(inputTexture, uv).a;
  } else {
    color = texture(inputTexture, uv);
  }
  
  // Blend bloom glow
  if (bloomEnabled == 1) {
    vec3 bloom = texture(bloomTexture, uv).rgb;
    color.rgb += bloom * bloomIntensity;
  }
  
  // Apply scanlines
  if (scanlinesEnabled == 1) {
    float scanlineVal = sin(uv.y * resolution.y * 3.14159 / scanlinesSpacing) * 0.5 + 0.5;
    color.rgb *= mix(1.0, scanlineVal, scanlinesOpacity * 0.6);
  }
  
  // Apply film grain noise
  if (grainEnabled == 1) {
    vec2 grainUV = floor(uv * resolution / max(grainSize, 1.0)) * max(grainSize, 1.0);
    float noise = hash(grainUV + time * grainSpeed) - 0.5;
    color.rgb += noise * (grainIntensity / 100.0);
  }
  
  // Apply phosphor color screen tint (VT320/Cassette glow)
  if (phosphorEnabled == 1) {
    float luma = dot(color.rgb, vec3(0.299, 0.587, 0.114));
    color.rgb = phosphorColor * luma * 1.3; // Boost brightness slightly
  }
  
  // Vignette
  if (vignetteEnabled == 1) {
    float dist = distance(uv, vec2(0.5));
    float vig = smoothstep(vignetteRadius, vignetteRadius - vignetteIntensity, dist);
    color.rgb *= vig;
  }
  
  fragColor = vec4(clamp(color.rgb, 0.0, 1.0), 1.0);
}
`;

// Simple Bloom shaders (threshold and blur)
export const bloomThresholdFragment = `#version 300 es
precision highp float;
in vec2 vTexCoord;
out vec4 fragColor;
uniform sampler2D inputTexture;
uniform float threshold;
void main() {
  vec3 color = texture(inputTexture, vTexCoord).rgb;
  float luma = dot(color, vec3(0.299, 0.587, 0.114));
  vec3 finalColor = vec3(0.0);
  if (luma > threshold) {
    finalColor = color * (luma - threshold) / (1.0 - threshold);
  }
  fragColor = vec4(finalColor, 1.0);
}
`;

export const bloomBlurFragment = `#version 300 es
precision highp float;
in vec2 vTexCoord;
out vec4 fragColor;
uniform sampler2D inputTexture;
uniform vec2 resolution;
uniform vec2 direction;
void main() {
  vec2 texelSize = 1.0 / resolution;
  vec3 result = texture(inputTexture, vTexCoord).rgb * 0.227027;
  
  // 5-tap Gaussian blur weights
  float weights[4] = float[4](0.1945946, 0.1216216, 0.054054, 0.016216);
  for (int i = 1; i < 5; i++) {
    vec2 offset = direction * float(i) * texelSize;
    result += texture(inputTexture, vTexCoord + offset).rgb * weights[i - 1];
    result += texture(inputTexture, vTexCoord - offset).rgb * weights[i - 1];
  }
  fragColor = vec4(result, 1.0);
}
`;

// 11. Newspaper Fragment
export const newspaperFragment = `#version 300 es
precision highp float;
in vec2 vTexCoord;
out vec4 fragColor;
uniform sampler2D inputTexture;
uniform vec2 resolution;
uniform float time;
uniform float brightness;
uniform float contrast;

uniform float dotDensity;
uniform vec3 paperColor;
uniform vec3 inkColor;

${sharedHelpers}

void main() {
  vec2 uv = vTexCoord;
  vec4 base = texture(inputTexture, uv);
  vec3 col = base.rgb;
  
  float lum = luminance(col);
  
  // Halftone dot
  vec2 gridUV = uv * resolution / (120.0 - dotDensity * 100.0);
  vec2 localUV = fract(gridUV) - 0.5;
  float dist = length(localUV);
  
  // Dot size based on luminance
  float radius = sqrt(1.0 - lum) * 0.7;
  float dot = smoothstep(radius, radius - 0.15, dist);
  
  // Paper texture noise
  float paperNoise = noise2d(uv * 500.0) * 0.05 + noise2d(uv * 100.0) * 0.05;
  vec3 bg = paperColor + paperNoise;
  
  // Mix
  vec3 finalCol = mix(bg, inkColor, dot);
  finalCol = applyBrightnessContrast(finalCol, brightness, contrast);
  fragColor = vec4(finalCol, base.a);
}
`;

// 12. Photocopy Fragment
export const photocopyFragment = `#version 300 es
precision highp float;
in vec2 vTexCoord;
out vec4 fragColor;
uniform sampler2D inputTexture;
uniform vec2 resolution;
uniform float time;
uniform float brightness;
uniform float contrast;

uniform float tonerDarkness;
uniform float smearAmount;
uniform float noiseLevel;
uniform float contrastLimit;
uniform float tonerScarcity;
uniform float scannerLight;

${sharedHelpers}

void main() {
  vec2 uv = vTexCoord;
  
  vec3 smearCol = vec3(0.0);
  float smearLen = smearAmount * 20.0;
  for(float i = 0.0; i < 5.0; i++) {
    vec2 offset = vec2(i * smearLen / resolution.x, 0.0);
    vec4 sBase = texture(inputTexture, uv - offset);
    smearCol += mix(vec3(1.0), sBase.rgb, sBase.a);
  }
  vec3 col = smearCol / 5.0;
  
  float lum = luminance(col);
  
  float thresh = 0.5 + noise2d(uv * 5.0) * noiseLevel;
  float bw = smoothstep(thresh - contrastLimit, thresh + contrastLimit, lum);
  
  float scarcity = noise2d(uv * 50.0);
  if (scarcity < tonerScarcity * 0.5) {
    bw = min(bw + scarcity * 2.0, 1.0);
  }
  
  vec3 outCol = mix(vec3(1.0 - tonerDarkness), vec3(1.0), bw);
  
  float lightBleed = (1.0 - smoothstep(0.0, 0.3, uv.x)) * scannerLight;
  outCol += lightBleed;

  outCol = applyBrightnessContrast(outCol, brightness, contrast);
  fragColor = vec4(clamp(outCol, 0.0, 1.0), 1.0);
}
`;

// 13. Paper Aging Fragment
export const paperAgingFragment = `#version 300 es
precision highp float;
in vec2 vTexCoord;
out vec4 fragColor;
uniform sampler2D inputTexture;
uniform vec2 resolution;
uniform float time;
uniform float brightness;
uniform float contrast;

// Uniforms
uniform float yellowing;
uniform float edgeDarkening;
uniform float wearAndTear;

${sharedHelpers}

void main() {
  vec2 uv = vTexCoord;
  vec4 base = texture(inputTexture, uv);
  vec3 col = mix(vec3(1.0), base.rgb, base.a);
  
  // 1. Yellowing / aging color tint
  // Older paper turns yellow-brownish
  vec3 agedTint = vec3(0.92, 0.82, 0.65);
  col = mix(col, col * agedTint, yellowing);
  
  // 2. Edge darkening / vignette (simulating edge oxidation/dirt)
  float dist = distance(uv, vec2(0.5));
  float edge = smoothstep(0.4, 1.2, dist);
  col = mix(col, col * 0.3, edge * edgeDarkening);
  
  // 3. Wear and tear (cracks, spots, grain)
  // High-frequency paper fibers/spots using noise
  float grainNoise = noise2d(uv * 400.0);
  float spotNoise = noise2d(uv * 15.0);
  
  // Dark mold spots
  if (spotNoise < wearAndTear * 0.15) {
    col *= mix(1.0, 0.5 + spotNoise * 2.0, wearAndTear);
  }
  
  // Fine paper grain
  col -= grainNoise * wearAndTear * 0.08;
  
  col = applyBrightnessContrast(col, brightness, contrast);
  fragColor = vec4(clamp(col, 0.0, 1.0), base.a);
}
`;

// 14. Ink Bleed Fragment
export const inkBleedFragment = `#version 300 es
precision highp float;
in vec2 vTexCoord;
out vec4 fragColor;
uniform sampler2D inputTexture;
uniform vec2 resolution;
uniform float time;
uniform float brightness;
uniform float contrast;

uniform float bleedRadius;
uniform float inkAbsorption;

${sharedHelpers}

void main() {
  vec2 uv = vTexCoord;
  vec2 texel = 1.0 / resolution;
  
  vec3 col = texture(inputTexture, uv).rgb;
  vec4 base = texture(inputTexture, uv);
  
  // Sample surrounding pixels to see if dark ink bleeds into light areas
  vec3 blurCol = vec3(0.0);
  float totalWeight = 0.0;
  float radius = bleedRadius * 5.0;
  
  for(float x = -2.0; x <= 2.0; x++) {
    for(float y = -2.0; y <= 2.0; y++) {
      vec2 offset = vec2(x, y) * texel * radius;
      vec3 sampleCol = texture(inputTexture, uv + offset).rgb;
      float sampleLum = luminance(sampleCol);
      
      // Ink bleeds more if the sample is darker than the center
      float weight = 1.0 + (1.0 - sampleLum) * inkAbsorption;
      blurCol += sampleCol * weight;
      totalWeight += weight;
    }
  }
  
  col = blurCol / totalWeight;
  
  // Add absorption texture
  float paperTexture = noise2d(uv * 400.0);
  col -= paperTexture * inkAbsorption * 0.1;
  
  col = applyBrightnessContrast(col, brightness, contrast);
  fragColor = vec4(clamp(col, 0.0, 1.0), base.a);
}
`;

// 15. Cyanotype Fragment
export const cyanotypeFragment = `#version 300 es
precision highp float;
in vec2 vTexCoord;
out vec4 fragColor;
uniform sampler2D inputTexture;
uniform vec2 resolution;
uniform float time;
uniform float brightness;
uniform float contrast;

uniform float blueIntensity;
uniform float stainAmount;
uniform float exposure;
uniform vec3 paperColor;
uniform vec3 cyanColor;

${sharedHelpers}

void main() {
  vec2 uv = vTexCoord;
  vec4 base = texture(inputTexture, uv);
  vec3 col = base.rgb;
  
  float lum = luminance(col) * exposure;
  
  // Invert and map to custom cyan/blue
  vec3 finalCol = mix(paperColor, cyanColor, lum);
  
  // Chemical stains
  float stain = noise2d(uv * 10.0 + time * 0.05) * stainAmount;
  finalCol += stain * 0.15;
  
  // Edge glow (sun exposure bleed)
  vec2 p = uv * 2.0 - 1.0;
  float edge = smoothstep(0.5, 1.5, length(p));
  finalCol += edge * blueIntensity * 0.5;

  finalCol = applyBrightnessContrast(finalCol, brightness, contrast);
  fragColor = vec4(clamp(finalCol, 0.0, 1.0), base.a);
}
`;

// 16. Screen Print Fragment
export const screenPrintFragment = `#version 300 es
precision highp float;
in vec2 vTexCoord;
out vec4 fragColor;
uniform sampler2D inputTexture;
uniform vec2 resolution;
uniform float time;
uniform float brightness;
uniform float contrast;

uniform float colorCount;
uniform float meshDensity;
uniform float inkBleed;

${sharedHelpers}

void main() {
  vec2 uv = vTexCoord;
  
  vec2 rUV = uv + vec2(inkBleed * 0.005, 0.0);
  vec2 gUV = uv;
  vec2 bUV = uv - vec2(inkBleed * 0.005, 0.0);
  
  vec4 rBase = texture(inputTexture, rUV);
  vec4 gBase = texture(inputTexture, gUV);
  vec4 bBase = texture(inputTexture, bUV);
  
  float r = mix(1.0, rBase.r, rBase.a);
  float g = mix(1.0, gBase.g, gBase.a);
  float b = mix(1.0, bBase.b, bBase.a);
  
  float levels = max(2.0, floor(colorCount));
  r = floor(r * levels) / (levels - 1.0);
  g = floor(g * levels) / (levels - 1.0);
  b = floor(b * levels) / (levels - 1.0);
  
  vec3 col = vec3(r, g, b);
  
  float meshX = sin(uv.x * resolution.x * meshDensity * 0.1);
  float meshY = sin(uv.y * resolution.y * meshDensity * 0.1);
  float mesh = (meshX * meshY) * 0.05;
  col -= mesh;

  col = applyBrightnessContrast(col, brightness, contrast);
  fragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`;

// 17. Thermal Receipt Fragment
export const thermalReceiptFragment = `#version 300 es
precision highp float;
in vec2 vTexCoord;
out vec4 fragColor;
uniform sampler2D inputTexture;
uniform vec2 resolution;
uniform float time;
uniform float brightness;
uniform float contrast;

uniform float fading;
uniform float bandingIntensity;
uniform float paperGloss;
uniform vec3 paperColor;
uniform vec3 inkColor;

${sharedHelpers}

void main() {
  vec2 uv = vTexCoord;
  vec4 base = texture(inputTexture, uv);
  vec3 col = base.rgb;
  
  float lum = luminance(col);
  
  // Heavy thresholding + dithering (simulating cheap thermal)
  float dither = hash2d(uv * resolution) * 0.3;
  float bw = step(0.5 + dither, lum);
  
  // Color of thermal print (black/bluish on white)
  vec3 finalThermalColor = mix(inkColor, paperColor, bw);
  
  // Banding (horizontal heater elements)
  float banding = sin(uv.y * 800.0) * bandingIntensity * 0.1;
  finalThermalColor += banding;
  
  // Fading
  float fadeNoise = noise2d(uv * 3.0) * fading;
  finalThermalColor = mix(finalThermalColor, paperColor, fadeNoise + uv.x * fading * 0.5);
  
  // Gloss
  float gloss = noise2d(uv * 10.0) * paperGloss * 0.1;
  finalThermalColor += gloss;

  finalThermalColor = applyBrightnessContrast(finalThermalColor, brightness, contrast);
  fragColor = vec4(clamp(finalThermalColor, 0.0, 1.0), base.a);
}
`;

// 18. Dot Matrix Fragment
export const dotMatrixFragment = `#version 300 es
precision highp float;
in vec2 vTexCoord;
out vec4 fragColor;
uniform sampler2D inputTexture;
uniform vec2 resolution;
uniform float time;
uniform float brightness;
uniform float contrast;

uniform float dotResolution;
uniform float ribbonWear;
uniform float horizontalBanding;
uniform vec3 paperColor;
uniform vec3 inkColor;

${sharedHelpers}

void main() {
  vec2 uv = vTexCoord;
  
  float res = floor(dotResolution);
  vec2 gridUV = floor(uv * res) / res;
  vec2 localUV = fract(uv * res) - 0.5;
  
  vec3 col = texture(inputTexture, gridUV).rgb;
  float lum = luminance(col);
  
  // Dot logic
  float dist = length(localUV);
  float dotSize = 0.45;
  float dot = 1.0 - smoothstep(dotSize - 0.05, dotSize, dist);
  
  // If too bright, no dot
  if (lum > 0.8) dot = 0.0;
  else if (lum > 0.4) dot *= (1.0 - (lum - 0.4) * 2.5);
  
  // Banding (pass lines)
  float band = sin(uv.y * res * 0.2) * horizontalBanding * 0.5;
  dot *= (1.0 - band);
  
  // Ribbon wear
  float wear = noise2d(gridUV * 10.0) * ribbonWear;
  dot *= (1.0 - wear);
  
  vec3 finalCol = mix(paperColor, inkColor, dot);

  finalCol = applyBrightnessContrast(finalCol, brightness, contrast);
  fragColor = vec4(clamp(finalCol, 0.0, 1.0), 1.0);
}
`;

// 19. Lino Cut Fragment
export const linoCutFragment = `#version 300 es
precision highp float;
in vec2 vTexCoord;
out vec4 fragColor;
uniform sampler2D inputTexture;
uniform vec2 resolution;
uniform float time;
uniform float brightness;
uniform float contrast;

uniform float gougeDirection;
uniform float edgeRoughness;
uniform float inkSplatter;
uniform float woodGrain;
uniform float carvingDepth;

${sharedHelpers}

void main() {
  vec2 uv = vTexCoord;
  vec4 base = texture(inputTexture, uv);
  vec3 col = mix(vec3(1.0), base.rgb, base.a); 
  float lum = luminance(col);
  
  float grainNoise = noise2d(vec2(uv.x * 20.0, uv.y * 300.0)) * woodGrain * 0.3;
  
  float angle = gougeDirection;
  float s = sin(angle), c = cos(angle);
  vec2 rotUV = vec2(uv.x * c - uv.y * s, uv.x * s + uv.y * c);
  
  float gouge = noise2d(vec2(rotUV.x * 200.0, rotUV.y * 10.0)) * edgeRoughness;
  
  float threshOffset = (carvingDepth - 0.5) * 0.4;
  float bw = step(0.5 + threshOffset + gouge * 0.3 + grainNoise, lum);
  
  float splatter = hash2d(uv * 500.0);
  if (splatter > 0.99 - inkSplatter * 0.05) {
    bw = 1.0 - bw;
  }

  vec3 finalCol = vec3(bw);
  finalCol = applyBrightnessContrast(finalCol, brightness, contrast);
  fragColor = vec4(clamp(finalCol, 0.0, 1.0), 1.0);
}
`;

// 20. Carbon Copy Fragment
export const carbonCopyFragment = `#version 300 es
precision highp float;
in vec2 vTexCoord;
out vec4 fragColor;
uniform sampler2D inputTexture;
uniform vec2 resolution;
uniform float time;
uniform float brightness;
uniform float contrast;

uniform float ghostingOffset;
uniform float smudgeAmount;
uniform float penPressure;
uniform vec3 paperColor;
uniform vec3 inkColor;

${sharedHelpers}

void main() {
  vec2 uv = vTexCoord;
  
  // Sample twice for ghosting
  vec2 ghostUV = uv + vec2(ghostingOffset * 0.01, -ghostingOffset * 0.005);
  float lum1 = luminance(texture(inputTexture, uv).rgb);
  float lum2 = luminance(texture(inputTexture, ghostUV).rgb);
  
  float lum = min(lum1, lum2 + 0.3); // ghost is lighter
  
  // Threshold based on pen pressure
  float stroke = smoothstep(0.8 - penPressure * 0.3, 0.3, lum);
  
  // Smudge
  float smudge = noise2d(uv * 50.0) * smudgeAmount;
  stroke += smudge * stroke * 0.5;
  
  vec3 finalCol = mix(paperColor, inkColor, clamp(stroke, 0.0, 1.0));

  finalCol = applyBrightnessContrast(finalCol, brightness, contrast);
  fragColor = vec4(clamp(finalCol, 0.0, 1.0), 1.0);
}
`;

// 21. Typewriter Fragment
export const typewriterFragment = `#version 300 es
precision highp float;
in vec2 vTexCoord;
out vec4 fragColor;
uniform sampler2D inputTexture;
uniform vec2 resolution;
uniform float time;
uniform float brightness;
uniform float contrast;

uniform float ribbonInk;
uniform float strikeMessiness;
uniform float paperGrain;
uniform float letterTilt;
uniform float doubleStrike;

${sharedHelpers}

void main() {
  vec2 uv = vTexCoord;
  
  float tilt = (noise2d(floor(uv * 40.0)) - 0.5) * letterTilt * 0.05;
  mat2 rot = mat2(cos(tilt), -sin(tilt), sin(tilt), cos(tilt));
  vec2 twistedUV = rot * (uv - 0.5) + 0.5;
  
  vec2 messyUV = twistedUV + vec2(hash2d(floor(twistedUV * 100.0)) - 0.5) * strikeMessiness * 0.01;
  vec4 base = texture(inputTexture, messyUV);
  vec3 col = mix(vec3(1.0), base.rgb, base.a); 
  float lum = luminance(col);
  
  if (hash2d(floor(twistedUV * 20.0)) < doubleStrike) {
     vec4 dBase = texture(inputTexture, messyUV + vec2(0.005, 0.002));
     float dLum = luminance(mix(vec3(1.0), dBase.rgb, dBase.a));
     lum = min(lum, dLum);
  }
  
  lum = floor(lum * 5.0) / 5.0;
  
  float fabricX = sin(twistedUV.x * 1000.0);
  float fabricY = sin(twistedUV.y * 1000.0);
  float fabric = (fabricX * fabricY) * ribbonInk * 0.1;
  
  float ink = smoothstep(0.6, 0.2, lum) + fabric;
  float grain = noise2d(twistedUV * 300.0) * paperGrain * 0.2;
  vec3 finalCol = mix(vec3(0.9 + grain), vec3(0.1, 0.1, 0.12), clamp(ink, 0.0, 1.0));

  finalCol = applyBrightnessContrast(finalCol, brightness, contrast);
  fragColor = vec4(clamp(finalCol, 0.0, 1.0), 1.0);
}
`;

// 22. Mimeograph Fragment
export const mimeographFragment = `#version 300 es
precision highp float;
in vec2 vTexCoord;
out vec4 fragColor;
uniform sampler2D inputTexture;
uniform vec2 resolution;
uniform float time;
uniform float brightness;
uniform float contrast;

uniform float rollerMarks;
uniform float inkSoak;
uniform float violetTint;
uniform vec3 paperColor;
uniform vec3 inkColor;

${sharedHelpers}

void main() {
  vec2 uv = vTexCoord;
  vec3 col = texture(inputTexture, uv).rgb;
  float lum = luminance(col);
  
  // Roller marks
  float marks = sin(uv.y * 20.0 + noise2d(uv * 5.0) * 10.0) * rollerMarks * 0.2;
  
  // Ink soak (blur and spread)
  float soak = noise2d(uv * 100.0) * inkSoak * 0.1;
  
  float ink = smoothstep(0.7 + soak, 0.3, lum) + marks;
  
  vec3 mimeoInk = mix(inkColor, vec3(0.5, 0.1, 0.7), violetTint);
  vec3 finalCol = mix(paperColor, mimeoInk, clamp(ink, 0.0, 1.0));

  finalCol = applyBrightnessContrast(finalCol, brightness, contrast);
  fragColor = vec4(clamp(finalCol, 0.0, 1.0), 1.0);
}
`;

// 23. Chromolithograph Fragment
export const chromolithographFragment = `#version 300 es
precision highp float;
in vec2 vTexCoord;
out vec4 fragColor;
uniform sampler2D inputTexture;
uniform vec2 resolution;
uniform float time;
uniform float brightness;
uniform float contrast;

uniform float stippleDensity;
uniform float varnishYellowing;
uniform float colorShift;

${sharedHelpers}

void main() {
  vec2 uv = vTexCoord;
  
  // Color Shift
  vec2 shiftUV = uv + vec2(colorShift * 0.005, -colorShift * 0.005);
  vec3 col = texture(inputTexture, shiftUV).rgb;
  
  // Stipple (grainy color separation)
  float stipple = hash2d(uv * resolution * stippleDensity);
  col += (stipple - 0.5) * 0.15;
  
  // Quantize to soft pastel colors
  col = floor(col * 4.0) / 3.0;
  
  // Varnish
  vec3 varnish = vec3(1.0, 0.9, 0.7) * (1.0 - varnishYellowing * 0.3);
  col *= varnish;

  col = applyBrightnessContrast(col, brightness, contrast);
  fragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`;

// 24. Tintype Fragment
export const tintypeFragment = `#version 300 es
precision highp float;
in vec2 vTexCoord;
out vec4 fragColor;
uniform sampler2D inputTexture;
uniform vec2 resolution;
uniform float time;
uniform float brightness;
uniform float contrast;

uniform float chemicalSwirl;
uniform float edgeBlur;
uniform float silverContrast;

${sharedHelpers}

void main() {
  vec2 uv = vTexCoord;
  
  // Edge Blur
  vec2 p = uv * 2.0 - 1.0;
  float dist = length(p);
  vec2 blurUV = mix(uv, vec2(0.5) + p * 0.95, dist * edgeBlur * 0.5);
  
  vec3 col = texture(inputTexture, blurUV).rgb;
  float lum = luminance(col);
  
  // Contrast boost (murky darks, blown highlights)
  lum = pow(lum, 1.0 + silverContrast);
  
  // Chemical Swirls
  float swirl = noise2d(uv * 3.0 + vec2(time * 0.1, 0.0)) * chemicalSwirl;
  lum += swirl * 0.2;
  
  // Sepia/Silver tint
  vec3 tint = mix(vec3(0.05, 0.03, 0.02), vec3(0.8, 0.75, 0.7), lum);
  
  // Scratches and edge vignette
  float scratch = hash2d(vec2(uv.y * 100.0, 1.0)) > 0.99 ? 0.2 : 0.0;
  tint -= scratch;
  tint -= smoothstep(0.5, 1.5, dist) * 0.8;

  tint = applyBrightnessContrast(tint, brightness, contrast);
  fragColor = vec4(clamp(tint, 0.0, 1.0), 1.0);
}
`;

// Shaders mapping dictionary
export const shaderMap = {
  passthrough: passthroughFragment,
  halation: halationFragment,
  filmGrain: filmGrainFragment,
  lightLeaks: lightLeaksFragment,
  dustScratches: dustScratchesFragment,
  risograph: risographFragment,
  halftone: halftoneFragment,
  filmBurn: filmBurnFragment,
  polaroidFade: polaroidFadeFragment,
  crtScanlines: crtScanlinesFragment,
  cmykMisregistration: cmykMisregistrationFragment,
  newspaper: newspaperFragment,
  photocopy: photocopyFragment,
  paperAging: paperAgingFragment,
  inkBleed: inkBleedFragment,
  cyanotype: cyanotypeFragment,
  screenPrint: screenPrintFragment,
  thermalReceipt: thermalReceiptFragment,
  dotMatrix: dotMatrixFragment,
  linoCut: linoCutFragment,
  carbonCopy: carbonCopyFragment,
  typewriter: typewriterFragment,
  mimeograph: mimeographFragment,
  chromolithograph: chromolithographFragment,
  tintype: tintypeFragment
};
