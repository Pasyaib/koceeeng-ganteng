export const simulationPositionShader = `
  uniform sampler2D tPosition;
  uniform sampler2D tVelocity;
  
  varying vec2 vUv;
  
  void main() {
    vec3 pos = texture2D(tPosition, vUv).xyz;
    vec3 vel = texture2D(tVelocity, vUv).xyz;
    
    // Integrate position: P_new = P_old + V * dt
    // We scale by a constant time step or simply add velocity directly as velocity is already delta-scaled
    pos += vel;
    
    gl_FragColor = vec4(pos, 1.0);
  }
`;
