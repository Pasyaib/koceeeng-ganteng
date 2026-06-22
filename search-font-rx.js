import fs from 'fs';
const code = fs.readFileSync('grainrad-bundle.js', 'utf8');

// Search for Rx() or const Rx = or Rx=
let pos = -1;
while ((pos = code.indexOf('Rx', pos + 1)) !== -1) {
  const prevChar = code[pos - 1] || '';
  const nextChar = code[pos + 2] || '';
  // Check if it looks like a function definition
  if (!/[a-zA-Z0-9_$]/.test(prevChar) && (nextChar === '=' || nextChar === '(' || code[pos + 3] === '=' || code.substring(pos, pos+10).includes('function'))) {
    const start = Math.max(0, pos - 100);
    const end = Math.min(code.length, pos + 800);
    console.log(`Match at index ${pos}:`);
    console.log(code.substring(start, end).replace(/\r?\n/g, ' '));
    console.log('-');
  }
}
