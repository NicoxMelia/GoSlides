import fs from 'node:fs';
import path from 'node:path';
const dist = path.join(process.cwd(), 'dist');
const index = path.join(dist, 'index.html');
const fallback = path.join(dist, '404.html');
if (!fs.existsSync(index)) throw new Error('dist/index.html not found');
fs.copyFileSync(index, fallback);
console.log('[pages] 404.html SPA fallback created');
