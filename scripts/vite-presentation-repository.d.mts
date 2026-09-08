import type { Plugin } from 'vite';

export interface RepositoryVersionRecord {
  number: number;
  createdAt: string;
  file: string;
  size: number;
  sha256: string;
  reason: 'save' | 'imported-current';
}

export function savePresentationSnapshot(root: string, bytes: Uint8Array): Promise<RepositoryVersionRecord>;
export function listPresentationVersions(root: string, presentationId: string): { presentationId: string; versions: RepositoryVersionRecord[]; totalVersions: number };
export function readPresentationVersion(root: string, presentationId: string, number: number): { bytes: Uint8Array; entry: RepositoryVersionRecord };
export default function presentationRepositoryPlugin(): Plugin;
