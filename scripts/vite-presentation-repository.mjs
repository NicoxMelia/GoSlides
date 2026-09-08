import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import JSZip from 'jszip';
import { buildPublicLibrary } from './build-public-library.mjs';

const API_PREFIX = '/__goslides_repository';
const MAX_ZIP_BYTES = 150 * 1024 * 1024;

function slugify(value) {
  return String(value ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'presentacion';
}

function historyKey(id) {
  const readable = slugify(id).slice(0, 64);
  const digest = crypto.createHash('sha256').update(id).digest('hex').slice(0, 10);
  return `${readable}-${digest}`;
}

function timestampForFile(iso) {
  return iso.replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

async function manifestFromZip(bytes) {
  const zip = await JSZip.loadAsync(bytes);
  const file = zip.file('presentation.json');
  if (!file) throw new Error('El ZIP no contiene presentation.json.');
  const manifest = JSON.parse(await file.async('text'));
  if (manifest?.format !== 'goslides' || ![1, 2].includes(manifest.version) || typeof manifest.id !== 'string' || !manifest.id || typeof manifest.title !== 'string' || !manifest.title || !Array.isArray(manifest.slides)) {
    throw new Error('La presentación no tiene un manifest GoSlides válido.');
  }
  return manifest;
}

function writeAtomic(filePath, bytes) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const temporary = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(temporary, bytes);
  fs.renameSync(temporary, filePath);
}

function readIndex(indexPath) {
  if (!fs.existsSync(indexPath)) return null;
  try {
    const parsed = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
    return parsed?.format === 'goslides-version-history' && Array.isArray(parsed.versions) ? parsed : null;
  } catch {
    return null;
  }
}

async function findPublishedFile(root, manifest) {
  const directory = path.join(root, 'presentations');
  fs.mkdirSync(directory, { recursive: true });
  for (const name of fs.readdirSync(directory).filter((entry) => entry.toLowerCase().endsWith('.zip')).sort()) {
    const filePath = path.join(directory, name);
    try {
      const candidate = await manifestFromZip(fs.readFileSync(filePath));
      if (candidate.id === manifest.id || (manifest.publicId && candidate.publicId === manifest.publicId)) return { name, filePath };
    } catch {
      // An unrelated or malformed ZIP must not prevent saving this presentation.
    }
  }
  let name = `${slugify(manifest.title)}.zip`;
  if (fs.existsSync(path.join(directory, name))) name = `${slugify(manifest.title)}-${historyKey(manifest.id).slice(-10)}.zip`;
  return { name, filePath: path.join(directory, name) };
}

function versionRecord(number, createdAt, relativeFile, bytes, reason = 'save') {
  return {
    number,
    createdAt,
    file: relativeFile.replaceAll(path.sep, '/'),
    size: bytes.length,
    sha256: crypto.createHash('sha256').update(bytes).digest('hex'),
    reason,
  };
}

function stageFiles(root, relativePaths) {
  try {
    execFileSync('git', ['add', '--', ...relativePaths], { cwd: root, stdio: 'pipe' });
    return { staged: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { staged: false, stageWarning: `Los archivos se guardaron, pero Git no pudo prepararlos automáticamente: ${message}` };
  }
}

export async function savePresentationSnapshot(root, inputBytes) {
  const bytes = Buffer.isBuffer(inputBytes) ? inputBytes : Buffer.from(inputBytes);
  if (!bytes.length) throw new Error('No se recibió contenido para guardar.');
  if (bytes.length > MAX_ZIP_BYTES) throw new Error('El ZIP supera el límite de 150 MB.');

  const manifest = await manifestFromZip(bytes);
  const key = historyKey(manifest.id);
  const historyRoot = path.join(root, 'presentation-history', key);
  const versionsRoot = path.join(historyRoot, 'versions');
  const indexPath = path.join(historyRoot, 'index.json');
  const published = await findPublishedFile(root, manifest);
  const existingIndex = readIndex(indexPath);
  const index = existingIndex ?? {
    format: 'goslides-version-history',
    version: 1,
    presentationId: manifest.id,
    publicId: manifest.publicId ?? null,
    title: manifest.title,
    currentFile: `presentations/${published.name}`,
    versions: [],
  };

  fs.mkdirSync(versionsRoot, { recursive: true });

  // When adopting an already-published deck, preserve that file as the first
  // immutable version before replacing it with the new editor state.
  if (!index.versions.length && fs.existsSync(published.filePath)) {
    const previousBytes = fs.readFileSync(published.filePath);
    const stat = fs.statSync(published.filePath);
    const createdAt = stat.mtime.toISOString();
    const relativeFile = path.join('versions', `000001-${timestampForFile(createdAt)}.zip`);
    writeAtomic(path.join(historyRoot, relativeFile), previousBytes);
    index.versions.push(versionRecord(1, createdAt, relativeFile, previousBytes, 'imported-current'));
  }

  const nextNumber = Math.max(0, ...index.versions.map((entry) => Number(entry.number) || 0)) + 1;
  const createdAt = new Date().toISOString();
  const relativeVersionFile = path.join('versions', `${String(nextNumber).padStart(6, '0')}-${timestampForFile(createdAt)}.zip`);
  const absoluteVersionFile = path.join(historyRoot, relativeVersionFile);
  writeAtomic(absoluteVersionFile, bytes);
  writeAtomic(published.filePath, bytes);

  const record = versionRecord(nextNumber, createdAt, relativeVersionFile, bytes);
  index.publicId = manifest.publicId ?? index.publicId ?? null;
  index.title = manifest.title;
  index.currentFile = `presentations/${published.name}`;
  index.updatedAt = createdAt;
  index.versions.push(record);
  writeAtomic(indexPath, `${JSON.stringify(index, null, 2)}\n`);

  // Studio's "Publicadas / Viewer" reads this sanitized library. Refresh it as
  // part of the save so the panel and student preview point at the new ZIP.
  await buildPublicLibrary(root);

  const staged = stageFiles(root, [index.currentFile, `presentation-history/${key}`]);
  return { ...record, presentationId: manifest.id, title: manifest.title, currentFile: index.currentFile, historyDirectory: `presentation-history/${key}`, totalVersions: index.versions.length, ...staged };
}

export function listPresentationVersions(root, presentationId) {
  if (!presentationId) throw new Error('Falta el ID de la presentación.');
  const key = historyKey(presentationId);
  const indexPath = path.join(root, 'presentation-history', key, 'index.json');
  const index = readIndex(indexPath);
  if (!index || index.presentationId !== presentationId) return { presentationId, versions: [], totalVersions: 0 };
  return {
    presentationId,
    title: index.title,
    currentFile: index.currentFile,
    historyDirectory: `presentation-history/${key}`,
    versions: [...index.versions].reverse(),
    totalVersions: index.versions.length,
  };
}

export function readPresentationVersion(root, presentationId, number) {
  const listing = listPresentationVersions(root, presentationId);
  const entry = listing.versions.find((version) => Number(version.number) === Number(number));
  if (!entry) throw new Error(`No existe la versión ${number}.`);
  const historyRoot = path.join(root, 'presentation-history', historyKey(presentationId));
  const filePath = path.resolve(historyRoot, entry.file);
  if (!filePath.startsWith(`${path.resolve(historyRoot)}${path.sep}`)) throw new Error('Ruta de versión inválida.');
  return { bytes: fs.readFileSync(filePath), entry };
}

function sendJson(response, status, payload) {
  response.statusCode = status;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Cache-Control', 'no-store');
  response.end(JSON.stringify(payload));
}

function readRequestBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    request.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_ZIP_BYTES) {
        reject(new Error('El ZIP supera el límite de 150 MB.'));
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });
    request.on('end', () => resolve(Buffer.concat(chunks)));
    request.on('error', reject);
  });
}

function repositoryMiddleware(root) {
  return async (request, response, next) => {
    const url = new URL(request.url ?? '/', 'http://localhost');
    if (!url.pathname.startsWith(API_PREFIX)) return next();
    try {
      if (request.method === 'GET' && url.pathname === `${API_PREFIX}/status`) return sendJson(response, 200, { available: true });
      if (request.method === 'GET' && url.pathname === `${API_PREFIX}/versions`) {
        return sendJson(response, 200, listPresentationVersions(root, url.searchParams.get('presentationId') ?? ''));
      }
      if (request.method === 'GET' && url.pathname === `${API_PREFIX}/version`) {
        const result = readPresentationVersion(root, url.searchParams.get('presentationId') ?? '', Number(url.searchParams.get('number')));
        response.statusCode = 200;
        response.setHeader('Content-Type', 'application/zip');
        response.setHeader('Content-Length', String(result.bytes.length));
        response.setHeader('Cache-Control', 'no-store');
        return response.end(result.bytes);
      }
      if (request.method === 'POST' && url.pathname === `${API_PREFIX}/save`) {
        if (request.headers['x-goslides-repository'] !== '1') return sendJson(response, 403, { error: 'Solicitud de repositorio no autorizada.' });
        const result = await savePresentationSnapshot(root, await readRequestBody(request));
        return sendJson(response, 201, result);
      }
      return sendJson(response, 404, { error: 'Endpoint de repositorio desconocido.' });
    } catch (error) {
      return sendJson(response, 400, { error: error instanceof Error ? error.message : String(error) });
    }
  };
}

export default function presentationRepositoryPlugin() {
  let projectRoot = process.cwd();
  return {
    name: 'goslides-presentation-repository',
    apply: 'serve',
    configResolved(config) { projectRoot = config.root; },
    configureServer(server) { server.middlewares.use(repositoryMiddleware(projectRoot)); },
    configurePreviewServer(server) { server.middlewares.use(repositoryMiddleware(projectRoot)); },
  };
}
