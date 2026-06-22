import fs from 'fs';
const code = fs.readFileSync('shaders-extracted-2.txt', 'utf8');

const matchStr = '// SHADER: dithering';
const idx = code.indexOf(matchStr);
if (idx !== -1) {
  // Let's print out parts of the dithering shader to see the method implementations
  const lines = code.substring(idx).split('\n');
  console.log("Dithering methods definition:");
  // Let's search inside the lines for method checks, like method == 0
  const matchedLines = [];
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('method') || lines[i].includes('Bayer') || lines[i].includes('floyd') || lines[i].includes('atkinson')) {
      matchedLines.push(`${i}: ${lines[i]}`);
    }
  }
  console.log(matchedLines.slice(0, 30).join('\n'));
} else {
  console.log("Could not find dithering shader");
}
