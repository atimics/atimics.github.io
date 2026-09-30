#!/usr/bin/env node
'use strict';
// Reproduce the tested V3 runtime without changing or duplicating V2's sources.
// Patch offsets are Unicode code points, not bytes or UTF-16 code units.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = __dirname;
const output = path.resolve(process.argv[2] || path.join(root, 'dist'));
const base = path.resolve(process.argv[3] || path.join(root, '../v2'));
if (output === base) throw Error("Refusing to overwrite the V2 baseline");
const sha = s => crypto.createHash('sha256').update(s).digest('hex');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'patches.json'), 'utf8'));
if (manifest.schema !== 1) throw Error('Unsupported patch schema');
const generated = new Map();
for (const [name, spec] of Object.entries(manifest.files)) {
  if (path.basename(name) !== name) throw Error('Unsafe output filename');
  const source = fs.readFileSync(path.join(base, name), 'utf8');
  if (sha(source) !== spec.baseSHA256) throw Error(`Pinned V2 source differs: ${name}`);
  const chars = Array.from(source);
  let cursor = 0, result = '';
  for (const [start, end, text] of spec.edits) {
    if (!Number.isInteger(start) || !Number.isInteger(end) || start < cursor || end < start || end > chars.length || typeof text !== 'string') throw Error(`Invalid patch: ${name}`);
    result += chars.slice(cursor, start).join('') + text;
    cursor = end;
  }
  result += chars.slice(cursor).join('');
  if (sha(result) !== spec.outputSHA256) throw Error(`Generated source differs: ${name}`);
  generated.set(name, result);
}
// Validate everything before writing. No downloads, eval, package install or V2 writes.
fs.mkdirSync(output, {recursive: true});
for (const [name, source] of generated) fs.writeFileSync(path.join(output, name), source);
for (const name of ['systems.js', 'expansion.js', 'systems.test.cjs', 'expansion-browser.py', 'README.md', 'PARITY.md']) {
  const source = path.join(root, name), target = path.join(output, name);
  if (source !== target) fs.copyFileSync(source, target);
}
const hashes = {};
for (const name of ['index.html','core.js','systems.js','render.js','game.js','expansion.js','ui.js']) hashes[name] = sha(fs.readFileSync(path.join(output,name)));
fs.writeFileSync(path.join(output, 'SHA256SUMS.json'), JSON.stringify(hashes, null, 2) + '\n');
console.log(`Built Voxel Wild 3 in ${output}; all ${generated.size} patched-file hashes verified.`);
