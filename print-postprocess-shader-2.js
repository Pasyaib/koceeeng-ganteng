import fs from 'fs';
const code = fs.readFileSync('shaders-extracted-2.txt', 'utf8');

const matchStr = '// SHADER: postprocess';
const idx = code.indexOf(matchStr);
if (idx !== -1) {
  // Print from line 100 to 700 of that section
  const lines = code.substring(idx).split('\n');
  console.log(lines.slice(45, 120).join('\n'));
} else {
  console.log("Could not find postprocess shader");
}
