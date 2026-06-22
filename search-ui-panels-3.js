import fs from 'fs';
const code = fs.readFileSync('kooceeng-bundle.js', 'utf8');

const functions = {
  ascii: 'o3',
  halftone: 's3',
  pixelSort: 'c3',
  dithering: 'f3'
};

for (const [name, fnName] of Object.entries(functions)) {
  let idx = -1;
  console.log(`=== Matches for "${name}" (searching for "${fnName}"): ===`);
  
  // Let's search for exact assignments to fnName
  let searchStr = fnName + '=';
  let pos = -1;
  while ((pos = code.indexOf(searchStr, pos + 1)) !== -1) {
    // Make sure it is not part of a larger word
    const prevChar = code[pos - 1] || '';
    if (!/[a-zA-Z0-9_$]/.test(prevChar)) {
      const start = Math.max(0, pos - 50);
      const end = Math.min(code.length, pos + 1200);
      console.log(`Match at index ${pos}:`);
      console.log(code.substring(start, end).replace(/\r?\n/g, ' '));
      console.log('-');
    }
  }
}
