/**
 * Reformats intGridCsv arrays in LDtk level files so each grid row
 * sits on one line, making the layout visually readable.
 * Run manually or automatically via the "Run on Save" VS Code extension.
 */

import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const levelsDir = join(__dirname, '../public/assets/levels');
const files = readdirSync(levelsDir).filter(f => f.endsWith('.ldtkl'));

files.forEach(filename => {
  const filePath = join(levelsDir, filename);
  let raw = readFileSync(filePath, 'utf8');
  let searchFrom = 0;
  let count = 0;

  while (true) {
    const keyIdx = raw.indexOf('"intGridCsv"', searchFrom);
    if (keyIdx === -1) break;

    const bracketStart = raw.indexOf('[', keyIdx);

    // Find the matching closing bracket
    let depth = 0, bracketEnd = -1;
    for (let i = bracketStart; i < raw.length; i++) {
      if (raw[i] === '[') depth++;
      else if (raw[i] === ']') { depth--; if (depth === 0) { bracketEnd = i; break; } }
    }

    const arr = JSON.parse(raw.substring(bracketStart, bracketEnd + 1));
    if (arr.length === 0) { searchFrom = bracketEnd + 1; continue; }

    // Find __cWid in the surrounding layer (search backwards from keyIdx)
    const chunk = raw.substring(0, keyIdx);
    const cWidMatches = chunk.match(/"__cWid"\s*:\s*(\d+)/g);
    const cWid = cWidMatches
      ? parseInt(cWidMatches[cWidMatches.length - 1].match(/\d+/)[0])
      : null;

    if (!cWid) { searchFrom = bracketEnd + 1; continue; }

    const rows = [];
    for (let i = 0; i < arr.length; i += cWid) {
      rows.push(arr.slice(i, i + cWid).join(', '));
    }
    const formatted = '[\n\t\t\t\t\t\t' + rows.join(',\n\t\t\t\t\t\t') + '\n\t\t\t\t\t]';

    raw = raw.substring(0, bracketStart) + formatted + raw.substring(bracketEnd + 1);
    searchFrom = bracketStart + formatted.length;
    count++;
  }

  if (count > 0) {
    writeFileSync(filePath, raw, 'utf8');
    console.log(`Formatted ${count} array(s) in ${filename}`);
  }
});
