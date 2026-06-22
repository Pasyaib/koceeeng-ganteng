import fs from 'fs';
const code = fs.readFileSync('shaders-extracted-2.txt', 'utf8');

const matchStr = '// SHADER: postprocess';
const idx = code.indexOf(matchStr);
if (idx !== -1) {
  console.log(code.substring(idx, idx + 2500));
} else {
  console.log("Could not find postprocess shader");
}
