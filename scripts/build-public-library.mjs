import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import JSZip from 'jszip';

const root = process.cwd();
const sourceDir = path.join(root, 'presentations');
const publicRoot = path.join(root, '.generated-public');
const outDir = path.join(publicRoot, 'presentations');
const capabilitiesOutDir = path.join(publicRoot, 'capabilities');

fs.rmSync(publicRoot, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(capabilitiesOutDir, { recursive: true });
fs.writeFileSync(path.join(publicRoot, '.nojekyll'), '');

const capabilityPack = path.join(root, 'templates', 'goslides-ai-capabilities.zip');
if (fs.existsSync(capabilityPack)) fs.copyFileSync(capabilityPack, path.join(capabilitiesOutDir, 'goslides-ai-capabilities.zip'));

if (!fs.existsSync(sourceDir)) fs.mkdirSync(sourceDir, { recursive: true });
const zipFiles = fs.readdirSync(sourceDir).filter((name) => name.toLowerCase().endsWith('.zip')).sort();
const entries = [];
const seen = new Set();

function fallbackPublicId(id) {
  return crypto.createHash('sha256').update(`goslides:${id}`).digest('base64url').slice(0, 22);
}

for (const zipName of zipFiles) {
  try {
    const bytes = fs.readFileSync(path.join(sourceDir, zipName));
    const zip = await JSZip.loadAsync(bytes);
    const manifestFile = zip.file('presentation.json');
    if (!manifestFile) throw new Error('presentation.json not found');
    const manifest = JSON.parse(await manifestFile.async('text'));
    if (manifest.format !== 'goslides' || ![1, 2].includes(manifest.version) || !manifest.id || !manifest.title || !Array.isArray(manifest.slides)) {
      throw new Error('invalid GoSlides manifest (supported: v1/v2)');
    }

    const publicId = manifest.publicId || fallbackPublicId(manifest.id);
    if (!/^[A-Za-z0-9_-]{8,}$/.test(publicId)) throw new Error('invalid publicId');
    if (seen.has(publicId)) throw new Error(`duplicate publicId: ${publicId}`);
    seen.add(publicId);

    // Sanitize public copy: presenter notes are removed before publishing.
    for (const slidePath of manifest.slides) {
      const slideFile = zip.file(slidePath);
      if (!slideFile) throw new Error(`missing slide: ${slidePath}`);
      const slide = JSON.parse(await slideFile.async('text'));
      delete slide.notes;
      if (Array.isArray(slide.canvas)) {
        const hiddenIds = new Set(slide.canvas.filter((item) => item?.hidden).map((item) => item.id));
        slide.canvas = slide.canvas
          .filter((item) => !item?.hidden)
          .filter((item) => item?.type !== 'connector' || (!hiddenIds.has(item.from) && !hiddenIds.has(item.to)))
          .map((item) => { const clean = { ...item }; delete clean.comments; if (clean.triggerId && hiddenIds.has(clean.triggerId)) delete clean.triggerId; return clean; });
      }
      zip.file(slidePath, `${JSON.stringify(slide, null, 2)}\n`);
    }
    const cleanMasters = Array.isArray(manifest.masters) ? manifest.masters.map((master) => {
      const clean = { ...master };
      if (Array.isArray(clean.canvas)) {
        const hiddenIds = new Set(clean.canvas.filter((item) => item?.hidden).map((item) => item.id));
        clean.canvas = clean.canvas
          .filter((item) => !item?.hidden)
          .filter((item) => item?.type !== 'connector' || (!hiddenIds.has(item.from) && !hiddenIds.has(item.to)))
          .map((item) => { const next = { ...item }; delete next.comments; if (next.triggerId && hiddenIds.has(next.triggerId)) delete next.triggerId; return next; });
      }
      return clean;
    }) : undefined;
    const publicManifest = { ...manifest, publicId, ...(cleanMasters ? { masters: cleanMasters } : {}) };
    zip.file('presentation.json', `${JSON.stringify(publicManifest, null, 2)}\n`);

    const publicZipName = `${publicId}.zip`;
    const publicBytes = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE', compressionOptions: { level: 6 } });
    fs.writeFileSync(path.join(outDir, publicZipName), publicBytes);

    entries.push({
      id: manifest.id,
      publicId,
      title: manifest.title,
      subtitle: manifest.subtitle ?? '',
      description: manifest.description ?? `${manifest.slides.length} slides`,
      tags: Array.isArray(manifest.tags) ? manifest.tags : [],
      zip: publicZipName,
      slideCount: manifest.slides.length,
    });
  } catch (error) {
    console.warn(`[public-library] ${zipName}: ignored (${error instanceof Error ? error.message : String(error)})`);
  }
}

fs.writeFileSync(path.join(outDir, 'index.json'), `${JSON.stringify(entries, null, 2)}\n`);
console.log(`[public-library] ${entries.length} sanitized presentation(s) generated`);
