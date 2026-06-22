import fs from 'fs';
const code = fs.readFileSync('grainrad-bundle.js', 'utf8');

// Search for the definition of Mg.
// Usually defined as const Mg = { ... } or Mg = { ... }
const searchPatterns = [
  'const Mg=',
  'var Mg=',
  'Mg={'
];

for (const pattern of searchPatterns) {
  let idx = code.indexOf(pattern);
  if (idx === -1) {
    idx = code.indexOf(pattern.replace('=', ' = '));
  }
  if (idx !== -1) {
    const start = Math.max(0, idx - 50);
    const end = Math.min(code.length, idx + 1500);
    console.log(`=== Match for ${pattern}: ===`);
    console.log(code.substring(start, end).replace(/\r?\n/g, ' '));
    console.log('-');
  }
}
