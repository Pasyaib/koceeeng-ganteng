import fs from 'fs';
const code = fs.readFileSync('grainrad-bundle.js', 'utf8');

function findKeywords(keywords) {
  for (const keyword of keywords) {
    console.log(`=== Matches for "${keyword}": ===`);
    let idx = -1;
    let count = 0;
    while ((idx = code.indexOf(keyword, idx + 1)) !== -1) {
      count++;
      if (count > 8) {
        console.log("... truncated (too many matches) ...");
        break;
      }
      const start = Math.max(0, idx - 150);
      const end = Math.min(code.length, idx + keyword.length + 300);
      console.log(`Match at index ${idx}:`);
      console.log(code.substring(start, end).replace(/\r?\n/g, ' '));
      console.log('-'.repeat(60));
    }
  }
}

findKeywords(['theme-vt320', 'vt320', 'ascii', 'dither', 'halftone', 'matrix', 'vhs', 'pixelSort', 'voronoi']);
