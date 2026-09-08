const REPOSITORY_API = '/__goslides_repository';
const UNAVAILABLE_MESSAGE = 'El guardado en el repositorio no está activo. Reiniciá Studio con npm run dev:studio y volvé a intentarlo.';

export interface RepositoryVersion {
  number: number;
  createdAt: string;
  file: string;
  size: number;
  sha256: string;
  reason: 'save' | 'imported-current';
}

export interface RepositoryHistory {
  presentationId: string;
  title?: string;
  currentFile?: string;
  historyDirectory?: string;
  versions: RepositoryVersion[];
  totalVersions: number;
}

export interface RepositorySaveResult extends RepositoryVersion {
  presentationId: string;
  title: string;
  currentFile: string;
  historyDirectory: string;
  totalVersions: number;
  staged: boolean;
  stageWarning?: string;
}

function describeUnknown(value: unknown): string | null {
  if (typeof value === 'string') return value;
  if (value instanceof Error) return value.message;
  if (value && typeof value === 'object' && 'message' in value && typeof value.message === 'string') return value.message;
  try {
    const serialized = JSON.stringify(value);
    return serialized && serialized !== '{}' ? serialized : null;
  } catch {
    return null;
  }
}

async function errorFromResponse(response: Response) {
  try {
    const payload = await response.json() as { error?: unknown };
    return describeUnknown(payload.error) || `Error del repositorio (${response.status}).`;
  } catch {
    return `Error del repositorio (${response.status}).`;
  }
}

async function assertRepositoryAvailable() {
  let response: Response;
  try {
    response = await fetch(`${REPOSITORY_API}/status`, { cache: 'no-store' });
  } catch {
    throw new Error(UNAVAILABLE_MESSAGE);
  }
  if (!response.ok) throw new Error(`${UNAVAILABLE_MESSAGE} (${await errorFromResponse(response)})`);
  try {
    const payload = await response.json() as { available?: unknown };
    if (payload.available !== true) throw new Error(UNAVAILABLE_MESSAGE);
  } catch (error) {
    if (error instanceof Error && error.message === UNAVAILABLE_MESSAGE) throw error;
    throw new Error(UNAVAILABLE_MESSAGE);
  }
}

async function repositoryJson<T>(response: Response, validate: (value: unknown) => value is T): Promise<T> {
  if (!response.ok) throw new Error(await errorFromResponse(response));
  try {
    const payload: unknown = await response.json();
    if (validate(payload)) return payload;
  } catch {
    // The static Studio often returns its HTML fallback for unknown API routes.
  }
  throw new Error(UNAVAILABLE_MESSAGE);
}

function isSaveResult(value: unknown): value is RepositorySaveResult {
  if (!value || typeof value !== 'object') return false;
  const result = value as Partial<RepositorySaveResult>;
  return typeof result.number === 'number' && typeof result.currentFile === 'string' && typeof result.historyDirectory === 'string' && typeof result.totalVersions === 'number' && typeof result.staged === 'boolean';
}

function isRepositoryHistory(value: unknown): value is RepositoryHistory {
  if (!value || typeof value !== 'object') return false;
  const result = value as Partial<RepositoryHistory>;
  return typeof result.presentationId === 'string' && Array.isArray(result.versions) && typeof result.totalVersions === 'number';
}

export async function saveToPresentationRepository(zip: Blob): Promise<RepositorySaveResult> {
  await assertRepositoryAvailable();
  let response: Response;
  try {
    response = await fetch(`${REPOSITORY_API}/save`, { method: 'POST', headers: { 'Content-Type': 'application/zip', 'X-GoSlides-Repository': '1' }, body: zip });
  } catch {
    throw new Error(UNAVAILABLE_MESSAGE);
  }
  return repositoryJson(response, isSaveResult);
}

export async function loadRepositoryHistory(presentationId: string): Promise<RepositoryHistory> {
  await assertRepositoryAvailable();
  let response: Response;
  try {
    response = await fetch(`${REPOSITORY_API}/versions?presentationId=${encodeURIComponent(presentationId)}`, { cache: 'no-store' });
  } catch {
    throw new Error(UNAVAILABLE_MESSAGE);
  }
  return repositoryJson(response, isRepositoryHistory);
}

export async function loadRepositoryVersion(presentationId: string, number: number): Promise<Blob> {
  await assertRepositoryAvailable();
  let response: Response;
  try {
    response = await fetch(`${REPOSITORY_API}/version?presentationId=${encodeURIComponent(presentationId)}&number=${number}`, { cache: 'no-store' });
  } catch {
    throw new Error(UNAVAILABLE_MESSAGE);
  }
  if (!response.ok) throw new Error(await errorFromResponse(response));
  return response.blob();
}
