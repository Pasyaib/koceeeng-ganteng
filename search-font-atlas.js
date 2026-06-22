import fs from 'fs';
const code = fs.readFileSync('kooceeng-bundle.js', 'utf8');

const keywords = ['atlas', 'fontAtlas', 'FontAtlas', 'canvas', 'getContext("2d")', 'fontSize', 'font ='];

for (const kw of keywords) {
  let idx = -1;
  let count = 0;
  console.log(`=== Matches for "${kw}": ===`);
  while ((idx = code.indexOf(kw, idx + 1)) !== -1) {
    count++;
    if (count > 5) break;
    const start = Math.max(0, idx - 150);
    const end = Math.min(code.length, idx + kw.length + 300);
    console.log(`Match at ${idx}:`);
    console.log(code.substring(start, end).replace(/\r?\n/g, ' '));
    console.log('-');
  }
}
