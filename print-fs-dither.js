import fs from 'fs';
const code = fs.readFileSync('shaders-extracted-2.txt', 'utf8');

const matchStr = 'fn interleavedGradientNoise';
const idx = code.indexOf(matchStr);
if (idx !== -1) {
  console.log(code.substring(idx - 100, idx + 1000));
} else {
  console.log("Could not find interleavedGradientNoise function");
}
