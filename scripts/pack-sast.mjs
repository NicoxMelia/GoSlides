import fs from 'node:fs';
import path from 'node:path';
import JSZip from 'jszip';

const root = process.cwd();
const src = path.join(root, 'examples', 'sast-horusec-presentation');
const outDir = path.join(root, 'presentations');
const out = path.join(outDir, 'sast-horusec.zip');
fs.mkdirSync(outDir, { recursive: true });
const zip = new JSZip();

function addDirectory(dir, relative = '') {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    const rel = path.posix.join(relative, entry.name);
    if (entry.isDirectory()) addDirectory(full, rel);
    else zip.file(rel, fs.readFileSync(full));
  }
}

addDirectory(src);
const bytes = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE', compressionOptions: { level: 9 } });
fs.writeFileSync(out, bytes);
console.log(`Created ${out}`);
