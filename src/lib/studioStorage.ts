import type { AssetBytes, PresentationDocument, UserSlideTemplate, UserThemePreset } from '../types';

const PROJECTS_KEY = 'goslides-studio-projects-v3';
const VIEWER_URL_KEY = 'goslides-viewer-base-url';
const TEMPLATES_KEY = 'goslides-user-slide-templates-v1';
const THEMES_KEY = 'goslides-user-theme-presets-v1';
const DB_NAME = 'goslides-studio-assets-v3';
const STORE = 'assets';

type StoredDocument = Omit<PresentationDocument, 'assetFiles'>;

export function loadProjects(): StoredDocument[] {
  try {
    const raw = JSON.parse(localStorage.getItem(PROJECTS_KEY) ?? '[]') as StoredDocument[];
    return Array.isArray(raw) ? raw : [];
  } catch { return []; }
}

export function loadUserTemplates(): UserSlideTemplate[] {
  try {
    const raw = JSON.parse(localStorage.getItem(TEMPLATES_KEY) ?? '[]') as UserSlideTemplate[];
    return Array.isArray(raw) ? raw : [];
  } catch { return []; }
}


export function loadUserThemes(): UserThemePreset[] {
  try {
    const raw = JSON.parse(localStorage.getItem(THEMES_KEY) ?? '[]') as UserThemePreset[];
    return Array.isArray(raw) ? raw : [];
  } catch { return []; }
}

export function saveUserTheme(theme: UserThemePreset) {
  const items = loadUserThemes().filter((item) => item.id !== theme.id);
  localStorage.setItem(THEMES_KEY, JSON.stringify([theme, ...items].slice(0, 30)));
}

export function deleteUserTheme(id: string) {
  localStorage.setItem(THEMES_KEY, JSON.stringify(loadUserThemes().filter((item) => item.id !== id)));
}

export function saveUserTemplate(template: UserSlideTemplate) {
  const items = loadUserTemplates().filter((item) => item.id !== template.id);
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify([template, ...items].slice(0, 40)));
}

export function deleteUserTemplate(id: string) {
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(loadUserTemplates().filter((item) => item.id !== id)));
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function saveAssets(id: string, files: Record<string, AssetBytes>) {
  if (!Object.keys(files).length) return;
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(files, id);
    tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function loadProjectAssets(id: string): Promise<Record<string, AssetBytes>> {
  try {
    const db = await openDb();
    const result = await new Promise<Record<string, AssetBytes>>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).get(id);
      req.onsuccess = () => resolve((req.result ?? {}) as Record<string, AssetBytes>);
      req.onerror = () => reject(req.error);
    });
    db.close(); return result;
  } catch { return {}; }
}

export function saveProject(document: PresentationDocument) {
  const projects = loadProjects().filter((item) => item.manifest.id !== document.manifest.id);
  const serializable: StoredDocument = {
    manifest: { ...document.manifest, version: 2 }, slides: document.slides, updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(PROJECTS_KEY, JSON.stringify([serializable, ...projects].slice(0, 50)));
  if (document.assetFiles) void saveAssets(document.manifest.id, document.assetFiles);
}

export function deleteProject(id: string) {
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(loadProjects().filter((item) => item.manifest.id !== id)));
  void openDb().then((db) => { const tx = db.transaction(STORE, 'readwrite'); tx.objectStore(STORE).delete(id); tx.oncomplete = () => db.close(); });
}

export function getViewerBaseUrl() { return localStorage.getItem(VIEWER_URL_KEY) ?? ''; }
export function setViewerBaseUrl(url: string) { localStorage.setItem(VIEWER_URL_KEY, url.trim().replace(/\/$/, '')); }
