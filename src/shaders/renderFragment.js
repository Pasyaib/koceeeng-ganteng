export const renderFragmentShader = `
  uniform int uColorMode; // 0 = Gradient, 1 = Rainbow, 2 = Single Color
  uniform vec3 uColor1;   // Blue/Cyan
  uniform vec3 uColor2;   // Purple/Magenta
  uniform vec3 uColor3;   // Orange/Peach
  uniform vec3 uSingleColor;
  uniform float uIntensity;
  uniform float uOpacity;
  uniform float uTime;
  uniform float uMaxRadius;
  
  varying vec3 vOriginal;
  varying vec3 vCurrentPos;
  varying float vRandomSeed;
  
  // Helper to convert HSL to RGB (for Rainbow Mode)
  vec3 hsl2rgb(vec3 c) {
    vec3 rgb = clamp(abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0, 0.0, 1.0);
    return c.z + c.y * (rgb-0.5)*(1.0-abs(2.0*c.z-1.0));
  }
  
  void main() {
    // 1. Draw smooth glowing circular particle
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;
    
    // Soft core glow profile
    float glow = exp(-dist * 4.5);
    float edgeSmooth = smoothstep(0.5, 0.2, dist);
    float alpha = (edgeSmooth * 0.3 + glow * 0.7) * uOpacity;
    
    // 2. Color calculation
    vec3 finalColor = vec3(1.0);
    float radius = length(vOriginal.xy);
    float normRadius = clamp(radius / uMaxRadius, 0.0, 1.0);
    
    if (uColorMode == 0) {
      // Premium Gradient: Blue -> Purple -> Orange
      if (normRadius < 0.5) {
        finalColor = mix(uColor1, uColor2, normRadius * 2.0);
      } else {
        finalColor = mix(uColor2, uColor3, (normRadius - 0.5) * 2.0);
      }
    } else if (uColorMode == 1) {
      // Rainbow Mode: Cycle hue based on angle, radius, and time
      float angle = atan(vOriginal.y, vOriginal.x);
      float hue = (angle + 3.14159) / (2.0 * 3.14159);
      hue = fract(hue + normRadius * 0.3 + uTime * 0.05);
      finalColor = hsl2rgb(vec3(hue, 0.85, 0.6));
    } else {
      // Single Color Mode
      finalColor = uSingleColor;
    }
    
    // Apply intensity multiplier
    finalColor *= uIntensity;
    
    gl_FragColor = vec4(finalColor, alpha);
  }
`;
