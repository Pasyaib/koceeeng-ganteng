import fs from 'fs';
const code = fs.readFileSync('grainrad-bundle.js', 'utf8');

const shaderVars = {
  ascii: 'OS',
  passthrough: 'kS',
  characterMatch: 'RS',
  postprocess: 'DS',
  bloomThreshold: 'US',
  bloomBlur: 'MS',
  dithering: 'LS',
  halftone: 'zS',
  threshold: 'jS',
  edgeDetection: 'FS',
  dots: 'NS',
  blockify: 'BS',
  crosshatch: 'IS',
  waveLines: '_S',
  pixelSort: 'GS'
};

const output = [];

for (const [name, varName] of Object.entries(shaderVars)) {
  // Search for varName = ` or similar
  const pattern = varName + '=`';
  let idx = code.indexOf(pattern);
  if (idx === -1) {
    // try with space
    idx = code.indexOf(varName + ' = `');
  }
  if (idx !== -1) {
    // Find the matching closing backtick `
    const startOfShader = idx + pattern.length;
    let endOfShader = startOfShader;
    while (endOfShader < code.length) {
      if (code[endOfShader] === '`') {
        // Check if backtick is escaped
        let escCount = 0;
        let p = endOfShader - 1;
        while (p >= startOfShader && code[p] === '\\') {
          escCount++;
          p--;
        }
        if (escCount % 2 === 0) {
          break;
        }
      }
      endOfShader++;
    }
    const shaderText = code.substring(startOfShader, endOfShader);
    output.push(`\n// ==========================================\n// SHADER: ${name} (var ${varName})\n// ==========================================\n${shaderText}`);
    console.log(`Extracted shader ${name} of length ${shaderText.length}`);
  } else {
    console.log(`Could not find shader ${name} (var ${varName})`);
  }
}

fs.writeFileSync('shaders-extracted-2.txt', output.join('\n'));
console.log("Wrote all found shaders to shaders-extracted-2.txt");
