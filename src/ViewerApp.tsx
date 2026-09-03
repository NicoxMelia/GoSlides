import { useEffect, useState } from 'react';
import { ExternalLink, LockKeyhole, Presentation } from 'lucide-react';
import type { LibraryEntry, LoadedPresentation } from './types';
import { loadPresentationFromUrl } from './lib/presentationLoader';
import { PresentationPlayer } from './components/PresentationPlayer';
import { Brand } from './components/Brand';
import './styles.css';

function getPublicIdFromPath() {
  const match = window.location.pathname.match(/\/p\/([A-Za-z0-9_-]{8,})\/?$/);
  return match?.[1] ?? null;
}

export default function ViewerApp() {
  const publicId = getPublicIdFromPath();
  const [presentation, setPresentation] = useState<LoadedPresentation | null>(null);
  const [status, setStatus] = useState<'loading' | 'idle' | 'error'>(publicId ? 'loading' : 'idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!publicId) return;
    const base = import.meta.env.BASE_URL;
    fetch(`${base}presentations/index.json`)
      .then((response) => {
        if (!response.ok) throw new Error('No se pudo cargar el catálogo público.');
        return response.json() as Promise<LibraryEntry[]>;
      })
      .then(async (entries) => {
        const entry = entries.find((item) => item.publicId === publicId);
        if (!entry) throw new Error('Presentación no encontrada. Verificá el enlace compartido.');
        const loaded = await loadPresentationFromUrl(`${base}presentations/${entry.zip}`, entry.title);
        setPresentation(loaded);
        setStatus('idle');
        document.title = `${entry.title} · GoSlides`;
      })
      .catch((error: unknown) => {
        setMessage(error instanceof Error ? error.message : 'No se pudo abrir la presentación.');
        setStatus('error');
      });
  }, [publicId]);

  if (presentation) return <PresentationPlayer presentation={presentation} />;

  return (
    <div className="viewer-gate" data-theme="dark">
      <header className="topbar"><Brand /></header>
      <main className="viewer-gate-card">
        {status === 'loading' ? <>
          <div className="gate-icon"><Presentation /></div>
          <span>GOSLIDES VIEWER</span>
          <h1>Cargando presentación…</h1>
          <p>Estamos preparando el contenido del enlace.</p>
        </> : status === 'error' ? <>
          <div className="gate-icon"><ExternalLink /></div>
          <span>ENLACE NO VÁLIDO</span>
          <h1>No pudimos abrir esta presentación.</h1>
          <p>{message}</p>
        </> : <>
          <div className="gate-icon"><LockKeyhole /></div>
          <span>GOSLIDES VIEWER</span>
          <h1>Necesitás el enlace de una presentación.</h1>
          <p>Esta página no publica un índice de presentaciones. Abrí el enlace que te compartió el docente.</p>
        </>}
      </main>
    </div>
  );
}
