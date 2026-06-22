import fs from 'fs';
const code = fs.readFileSync('shaders-extracted-2.txt', 'utf8');

const matchStr = '// SHADER: ascii';
const idx = code.indexOf(matchStr);
if (idx !== -1) {
  console.log(code.substring(idx, idx + 1800));
} else {
  console.log("Could not find ascii shader");
}

const matchStr2 = '// SHADER: characterMatch';
const idx2 = code.indexOf(matchStr2);
if (idx2 !== -1) {
  console.log(code.substring(idx2, idx2 + 1800));
} else {
  console.log("Could not find characterMatch shader");
}
