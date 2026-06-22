import re

with open("src/shaders.js", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Alpha fix
# Replace base.rgb with mix(vec3(1.0), base.rgb, base.a); for transparent backgrounds
content = re.sub(r'vec4 base = texture\(inputTexture, uv\);\s*vec3 col = base\.rgb;', 
                 r'vec4 base = texture(inputTexture, uv);\n  vec3 col = mix(vec3(1.0), base.rgb, base.a);', 
                 content)

# 2. Replace 5 shaders entirely
halftone_new = """export const halftoneFragment = `#version 300 es
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
`;"""

photocopy_new = """export const photocopyFragment = `#version 300 es
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
`;"""

linocut_new = """export const linoCutFragment = `#version 300 es
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
`;"""

screenprint_new = """export const screenPrintFragment = `#version 300 es
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
`;"""

typewriter_new = """export const typewriterFragment = `#version 300 es
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
`;"""

content = re.sub(r'export const halftoneFragment = `#version 300 es[\s\S]*?^};\n`', halftone_new, content, flags=re.MULTILINE)
content = re.sub(r'export const photocopyFragment = `#version 300 es[\s\S]*?^};\n`', photocopy_new, content, flags=re.MULTILINE)
content = re.sub(r'export const linoCutFragment = `#version 300 es[\s\S]*?^};\n`', linocut_new, content, flags=re.MULTILINE)
content = re.sub(r'export const screenPrintFragment = `#version 300 es[\s\S]*?^};\n`', screenprint_new, content, flags=re.MULTILINE)
content = re.sub(r'export const typewriterFragment = `#version 300 es[\s\S]*?^};\n`', typewriter_new, content, flags=re.MULTILINE)

# The halftone regex failed before. Let's just fix halftone manually if it didn't match.
if 'halftoneSize;' not in content:
    # Meaning my messed up regex replaced it badly before. I will just replace from export const halftoneFragment down to export const filmBurnFragment.
    content = re.sub(r'export const halftoneFragment = `#version 300 es[\s\S]*?// 7. Film Burn Fragment', halftone_new + '\n\n// 7. Film Burn Fragment', content, flags=re.MULTILINE)

with open("src/shaders.js", "w", encoding="utf-8") as f:
    f.write(content)
