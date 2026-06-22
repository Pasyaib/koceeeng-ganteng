export const renderVertexShader = `
  uniform sampler2D tPosition;
  uniform float uParticleSize;
  
  attribute vec2 referenceUv; // UV coordinate to look up in the GPGPU texture
  attribute vec3 aOriginal;   // Original/Home position of the particle
  attribute float aRandomSeed; // Random float per particle for offset or size variance
  
  varying vec3 vOriginal;
  varying vec3 vCurrentPos;
  varying float vRandomSeed;
  
  void main() {
    // Look up current position from GPGPU position texture
    vec3 currentPos = texture2D(tPosition, referenceUv).xyz;
    
    vOriginal = aOriginal;
    vCurrentPos = currentPos;
    vRandomSeed = aRandomSeed;
    
    // Standard projection
    vec4 mvPosition = modelViewMatrix * vec4(currentPos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    // Scale size based on distance for natural perspective, plus seed variation
    float sizeVar = mix(0.7, 1.3, aRandomSeed);
    gl_PointSize = uParticleSize * sizeVar * (300.0 / -mvPosition.z);
    
    // Clamp point size to reasonable limits
    gl_PointSize = clamp(gl_PointSize, 1.0, 64.0);
  }
`;
