import fs from 'fs';
const code = fs.readFileSync('kooceeng-bundle.js', 'utf8');

// We want to find the JSX definitions for the UI control groups.
// They typically look like: title: "Dithering", title: "ASCII", etc.
const keywords = [
  'title:"ASCII"',
  'title:"Dithering"',
  'title:"Halftone"',
  'title:"Matrix Rain"',
  'title:"Dots"',
  'title:"Contour"',
  'title:"Pixel Sort"',
  'title:"Blockify"',
  'title:"Threshold"',
  'title:"Edge Detection"',
  'title:"Crosshatch"',
  'title:"Wave Lines"',
  'title:"Noise Field"',
  'title:"Voronoi"',
  'title:"VHS"'
];

for (const kw of keywords) {
  let idx = code.indexOf(kw);
  if (idx !== -1) {
    const start = Math.max(0, idx - 50);
    const end = Math.min(code.length, idx + 1500);
    console.log(`=== Matches for "${kw}": ===`);
    console.log(code.substring(start, end).replace(/\r?\n/g, ' '));
    console.log('=' * 40);
  } else {
    // try lowercase title or label
    console.log(`Could not find UI panel for "${kw}"`);
  }
}
