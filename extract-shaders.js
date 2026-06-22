import fs from 'fs';
const code = fs.readFileSync('grainrad-bundle.js', 'utf8');

// Find the index range where post-processing shaders are defined.
// We know from the search that "voronoi(p: vec2f" is around 428406
// and the shader map mapping "vhs:qS,voronoi:YS" is around 431899.
const start = 405000;
const end = 434000;
fs.writeFileSync('shaders-extracted.txt', code.substring(start, end));
console.log(`Extracted ${end - start} characters to shaders-extracted.txt`);
