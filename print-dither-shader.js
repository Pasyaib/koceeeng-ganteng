import fs from 'fs';
const code = fs.readFileSync('shaders-extracted-2.txt', 'utf8');

const matchStr = '// SHADER: dithering';
const idx = code.indexOf(matchStr);
if (idx !== -1) {
  console.log(code.substring(idx, idx + 1800));
} else {
  console.log("Could not find dithering shader");
}
