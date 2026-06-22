import fs from 'fs';
const code = fs.readFileSync('kooceeng-bundle.js', 'utf8');

const functions = {
  ascii: 'o3',
  halftone: 's3',
  pixelSort: 'c3',
  dithering: 'f3',
  dots: 'd3',
  contour: 'p3',
  edgeDetection: 'm3',
  threshold: 'g3'
};

for (const [name, fnName] of Object.entries(functions)) {
  // Search for "const o3 = () =>" or "o3 = () =>" or "o3=()" or "o3=async()" or "o3=t=>"
  let idx = code.indexOf(fnName + '=()=>');
  if (idx === -1) idx = code.indexOf('const ' + fnName + '=()=>');
  if (idx === -1) idx = code.indexOf(fnName + '=r=>');
  if (idx === -1) idx = code.indexOf(fnName + ' =');
  
  if (idx !== -1) {
    const start = Math.max(0, idx - 100);
    const end = Math.min(code.length, idx + 1800);
    console.log(`=== Matches for "${name}" (function ${fnName}): ===`);
    console.log(code.substring(start, end).replace(/\r?\n/g, ' '));
    console.log('-'.repeat(60));
  } else {
    console.log(`Could not find function for "${name}" (${fnName})`);
  }
}
