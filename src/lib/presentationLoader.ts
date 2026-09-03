import JSZip from 'jszip';
import type { AssetBytes, LoadedPresentation, PresentationDocument, PresentationManifest, Slide } from '../types';

const allowedImageExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg'];

function validateManifest(raw: unknown): asserts raw is PresentationManifest {
  if (!raw || typeof raw !== 'object') throw new Error('presentation.json no contiene un objeto válido.');
  const manifest = raw as Partial<PresentationManifest>;
  if (manifest.format !== 'goslides') throw new Error('El ZIP no es una presentación GoSlides.');
  if (manifest.version !== 1 && manifest.version !== 2) throw new Error(`Versión no soportada: ${String(manifest.version)}. Esta app entiende versiones 1 y 2.`);
  if (!manifest.id || !manifest.title || !Array.isArray(manifest.slides) || !manifest.slides.length) {
    throw new Error('presentation.json necesita id, title y al menos una slide.');
  }
}

function migrateSlide(slide: Slide): Slide {
  return {
    ...slide,
    transition: slide.transition ?? 'fade',
    blocks: slide.blocks ?? [],
    canvas: slide.canvas ?? [],
  };
}

async function loadZip(bytes: ArrayBuffer, sourceLabel: string): Promise<LoadedPresentation> {
  const zip = await JSZip.loadAsync(bytes);
  const manifestFile = zip.file('presentation.json');
  if (!manifestFile) throw new Error('Falta presentation.json en la raíz del ZIP.');

  const manifestRaw = JSON.parse(await manifestFile.async('text')) as unknown;
  validateManifest(manifestRaw);

  const slides: Slide[] = [];
  for (const slidePath of manifestRaw.slides) {
    const file = zip.file(slidePath);
    if (!file) throw new Error(`No existe la slide declarada: ${slidePath}`);
    const slide = JSON.parse(await file.async('text')) as Slide;
    if (!slide.id) throw new Error(`La slide ${slidePath} no tiene id.`);
    slides.push(migrateSlide(slide));
  }

  const assets: Record<string, string> = {};
  const assetFiles: Record<string, AssetBytes> = {};
  const files = Object.values(zip.files).filter((entry) => !entry.dir && entry.name.startsWith('assets/'));
  await Promise.all(files.map(async (entry) => {
    // JSZip siempre reserva un ArrayBuffer común, nunca uno compartido.
    const data = await entry.async('uint8array') as AssetBytes;
    assetFiles[entry.name] = data;
    if (!allowedImageExtensions.some((ext) => entry.name.toLowerCase().endsWith(ext))) return;
    const blob = new Blob([data]);
    assets[entry.name] = URL.createObjectURL(blob);
  }));

  return {
    manifest: { ...manifestRaw, version: 2 },
    slides,
    assets,
    assetFiles,
    sourceLabel,
  };
}

export async function loadPresentationFromFile(file: File): Promise<LoadedPresentation> {
  return loadZip(await file.arrayBuffer(), file.name);
}

export async function loadPresentationFromUrl(url: string, sourceLabel: string): Promise<LoadedPresentation> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`No se pudo descargar la presentación (${response.status}).`);
  return loadZip(await response.arrayBuffer(), sourceLabel);
}

export function loadedToDocument(loaded: LoadedPresentation): PresentationDocument {
  return {
    manifest: { ...loaded.manifest, version: 2 },
    slides: loaded.slides,
    assetFiles: loaded.assetFiles,
    updatedAt: new Date().toISOString(),
  };
}

export function resolveAsset(src: string, assets: Record<string, string>): string {
  return assets[src] ?? src;
}
