export const simulationVelocityShader = `
  uniform sampler2D tPosition;
  uniform sampler2D tVelocity;
  uniform sampler2D tOriginal;
  
  uniform vec2 uMouse;
  uniform float uMouseActive;
  uniform float uTime;
  
  // Interaction Settings
  uniform float uAttraction;
  uniform float uRepulsion;
  uniform float uRadius;
  uniform float uReturnSpeed;
  uniform float uInertia;
  uniform float uWaveStrength;
  uniform float uWaveTime;
  uniform vec2 uWaveOrigin;
  uniform float uVortex;
  
  // Pattern Settings
  uniform float uNoiseAmount;
  
  varying vec2 vUv;
  
  // Simplex 2D noise for organic flow
  vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
  float snoise(vec2 v){
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
             -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy) );
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod(i, 289.0);
    vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
    + i.x + vec3(0.0, i1.x, 1.0 ));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
      dot(x12.zw,x12.zw)), 0.0);
    m = m*m ;
    m = m*m ;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 a0 = x - floor(x + 0.5);
    vec3 g = a0*vec3(x0.x,x12.x,x12.z) + h*vec3(x0.y,x12.y,x12.w);
    vec3 f = 1.79284291400159 - 0.85373472095314 * ( rsqrt(g) );
    g.x *= f.x;
    g.y *= f.y;
    g.z *= f.z;
    m *= g;
    return 130.0 * dot(m, vec3(1.0));
  }

  void main() {
    // Read current states
    vec3 pos = texture2D(tPosition, vUv).xyz;
    vec3 vel = texture2D(tVelocity, vUv).xyz;
    vec3 org = texture2D(tOriginal, vUv).xyz;
    
    // 1. Friction & Inertia (uInertia is 0.0 to 1.0, high inertia = less damping)
    float damping = mix(0.88, 0.98, uInertia);
    vel *= damping;
    
    // 2. Spring-back force to original positions
    vec3 toOriginal = org - pos;
    vec3 springForce = toOriginal * (uReturnSpeed * 0.06);
    vel += springForce;
    
    // 3. Mouse attraction/repulsion & vortex forces
    if (uMouseActive > 0.5) {
      vec2 mouseDistVec = pos.xy - uMouse;
      float dist = length(mouseDistVec);
      
      if (dist < uRadius && dist > 0.001) {
        float forceFactor = 1.0 - (dist / uRadius);
        float smoothForce = forceFactor * forceFactor; // Smooth ease
        
        vec2 dir = normalize(mouseDistVec);
        vec3 mouseForce = vec3(0.0);
        
        // Repulsion pushes away, Attraction pulls towards the cursor
        mouseForce.xy += dir * (uRepulsion * 0.08 * smoothForce);
        mouseForce.xy -= dir * (uAttraction * 0.08 * smoothForce);
        
        // Vortex rotational force around mouse
        if (abs(uVortex) > 0.001) {
          vec2 perpDir = vec2(-dir.y, dir.x);
          mouseForce.xy += perpDir * (uVortex * 0.08 * smoothForce);
        }
        
        vel += mouseForce;
      }
    }
    
    // 4. Wave ripple effect originating from uWaveOrigin
    if (uWaveTime > 0.0 && uWaveTime < 3.0 && uWaveStrength > 0.0) {
      vec2 waveDistVec = pos.xy - uWaveOrigin;
      float waveDist = length(waveDistVec);
      
      // Wave propagates outward over time
      float waveSpeed = uRadius * 3.5; // Scale wave speed with interaction radius
      float waveFront = uWaveTime * waveSpeed;
      float waveWidth = uRadius * 0.4;
      
      float distToFront = abs(waveDist - waveFront);
      if (distToFront < waveWidth && waveDist > 0.01) {
        float waveFactor = 1.0 - (distToFront / waveWidth);
        // Smooth sine wave profile
        float waveProfile = sin(waveFactor * 3.14159);
        
        vec2 wavePushDir = normalize(waveDistVec);
        // Attenuate wave strength over time
        float attenuation = exp(-uWaveTime * 1.5);
        vel.xy += wavePushDir * (uWaveStrength * 0.3 * waveProfile * attenuation);
      }
    }
    
    // 5. Perlin/Simplex Curl Noise
    if (uNoiseAmount > 0.0) {
      float scale = 0.4;
      float timeScale = 0.3;
      float nx = snoise(pos.xy * scale + uTime * timeScale);
      float ny = snoise(pos.yx * scale - uTime * timeScale);
      vel.xy += vec2(nx, ny) * (uNoiseAmount * 0.004);
    }
    
    gl_FragColor = vec4(vel, 1.0);
  }
`;
