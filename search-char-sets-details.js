import fs from 'fs';
const code = fs.readFileSync('kooceeng-bundle.js', 'utf8');

// We see "emoji:" ·•○◎●◐◑◒◓◔◕◖◗",custom:" .:+*#@"},Mg="
// Let's print out 500 characters before this match
const searchStr = 'emoji:" ·•○◎●◐◑◒◓◔◕◖◗"';
const idx = code.indexOf(searchStr);
if (idx !== -1) {
  const start = Math.max(0, idx - 800);
  const end = idx + searchStr.length + 300;
  console.log("Found characters definition block:");
  console.log(code.substring(start, end));
} else {
  console.log("Could not find the search string");
}
