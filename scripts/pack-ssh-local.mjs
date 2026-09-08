import fs from 'node:fs';
import path from 'node:path';
import JSZip from 'jszip';

const root = process.cwd();
const source = path.join(root, 'examples', 'ssh-red-local-presentation');
const outputDirectory = path.join(root, 'presentations');
const output = path.join(outputDirectory, 'ssh-red-local.zip');
const zip = new JSZip();

function addDirectory(directory, relative = '') {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolutePath = path.join(directory, entry.name);
    const zipPath = path.posix.join(relative, entry.name);
    if (entry.isDirectory()) addDirectory(absolutePath, zipPath);
    else zip.file(zipPath, fs.readFileSync(absolutePath));
  }
}

fs.mkdirSync(outputDirectory, { recursive: true });
addDirectory(source);

const bytes = await zip.generateAsync({
  type: 'nodebuffer',
  compression: 'DEFLATE',
  compressionOptions: { level: 9 },
});

fs.writeFileSync(output, bytes);
console.log(`Created ${output}`);
