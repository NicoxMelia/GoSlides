import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink, Grid2X2, Maximize2, Minimize2, Moon, NotebookText, PanelTop, Sun, X } from 'lucide-react';
import type { LoadedPresentation, ThemeMode } from '../types';
import { Brand } from './Brand';
import { maxFragmentForSlide, SlideRenderer } from './SlideRenderer';

interface PlayerProps {
  presentation: LoadedPresentation;
  onClose?: () => void;
  showPresenterTools?: boolean;
  compactChrome?: boolean;
  audienceUrl?: string;
}

function formatClock(seconds: number) {
  const m = Math.floor(seconds / 60); const s = seconds % 60;
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

export function PresentationPlayer({ presentation, onClose, showPresenterTools = false, compactChrome = false, audienceUrl }: PlayerProps) {
  const [index, setIndex] = useState(0);
  const [fragmentStep, setFragmentStep] = useState(0);
  const [overview, setOverview] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [presenterOpen, setPresenterOpen] = useState(false);
  const [mode, setMode] = useState<ThemeMode>(presentation.manifest.theme?.mode ?? 'dark');
  const [fullscreen, setFullscreen] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const slide = presentation.slides[index];
  const accent = presentation.manifest.theme?.accent ?? '#7c5cff';
  const maxFragment = maxFragmentForSlide(slide);
  const syncId = presentation.manifest.publicId ?? presentation.manifest.id;
  const channelRef = useRef<BroadcastChannel | null>(null);

  const goTo = (target: number) => {
    const nextIndex = Math.max(0, Math.min(presentation.slides.length - 1, target));
    const apply = () => { setIndex(nextIndex); setFragmentStep(0); };
    const wantsMorph = presentation.slides[nextIndex]?.transition === 'morph';
    const doc = document as Document & { startViewTransition?: (cb: () => void) => { finished: Promise<void> } };
    if (wantsMorph && doc.startViewTransition) doc.startViewTransition(apply); else apply();
  };
  const next = () => { if (fragmentStep < maxFragment) setFragmentStep((v) => v + 1); else goTo(index + 1); };
  const previous = () => { if (fragmentStep > 0) setFragmentStep((v) => v - 1); else goTo(index - 1); };

  useEffect(() => { const id = window.setInterval(() => setElapsed((v) => v + 1), 1000); return () => clearInterval(id); }, []);

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get('sync');
    if (!('BroadcastChannel' in window)) return;
    if (showPresenterTools || requested === syncId) {
      const channel = new BroadcastChannel(`goslides-presenter-${syncId}`);
      channelRef.current = channel;
      if (!showPresenterTools && requested === syncId) {
        channel.onmessage = (event) => {
          if (event.data?.type !== 'state') return;
          setIndex(Math.max(0, Math.min(presentation.slides.length - 1, Number(event.data.index) || 0)));
          setFragmentStep(Math.max(0, Number(event.data.fragmentStep) || 0));
        };
        channel.postMessage({ type: 'audience-ready' });
      }
      return () => { channel.close(); channelRef.current = null; };
    }
  }, [showPresenterTools, syncId, presentation.slides.length]);

  useEffect(() => {
    if (!showPresenterTools) return;
    channelRef.current?.postMessage({ type: 'state', index, fragmentStep });
  }, [showPresenterTools, index, fragmentStep]);

  useEffect(() => {
    const handle = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.matches('input,textarea,select,[contenteditable="true"]')) return;
      if (event.key === 'ArrowRight' || event.key === 'PageDown' || event.key === ' ') { event.preventDefault(); next(); }
      if (event.key === 'ArrowLeft' || event.key === 'PageUp') { event.preventDefault(); previous(); }
      if (event.key === 'Home') goTo(0);
      if (event.key === 'End') goTo(presentation.slides.length - 1);
      if (event.key.toLowerCase() === 'o') setOverview((v) => !v);
      if (showPresenterTools && event.key.toLowerCase() === 'n') setNotesOpen((v) => !v);
      if (showPresenterTools && event.key.toLowerCase() === 'p') setPresenterOpen((v) => !v);
      if (event.key === 'Escape') { if (overview) setOverview(false); if (presenterOpen) setPresenterOpen(false); }
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [overview, presenterOpen, presentation.slides.length, showPresenterTools, index, fragmentStep, maxFragment]);

  useEffect(() => { const handle = () => setFullscreen(Boolean(document.fullscreenElement)); document.addEventListener('fullscreenchange', handle); return () => document.removeEventListener('fullscreenchange', handle); }, []);

  const progress = useMemo(() => ((index + 1) / presentation.slides.length) * 100, [index, presentation.slides.length]);
  async function toggleFullscreen() { if (!document.fullscreenElement) await rootRef.current?.requestFullscreen(); else await document.exitFullscreen(); }
  function openAudienceWindow() {
    if (!audienceUrl) return;
    const separator = audienceUrl.includes('?') ? '&' : '?';
    window.open(`${audienceUrl}${separator}sync=${encodeURIComponent(syncId)}`, 'goslides-audience', 'popup=yes,width=1280,height=800');
    window.setTimeout(() => channelRef.current?.postMessage({ type: 'state', index, fragmentStep }), 500);
  }

  return <div className={`player ${compactChrome ? 'compact-player' : ''}`} data-theme={mode} data-visual-style={presentation.manifest.theme?.visualStyle??'modern'} data-icon-library={presentation.manifest.theme?.iconLibrary??'lucide'} ref={rootRef} style={{ '--accent':accent,'--slide-bg':presentation.manifest.theme?.slideBackground,'--text':presentation.manifest.theme?.textColor,'--muted':presentation.manifest.theme?.mutedColor,'--panel':presentation.manifest.theme?.surfaceColor,'--theme-radius':`${presentation.manifest.theme?.radius??18}px`,'--heading-font':presentation.manifest.theme?.headingFontFamily,'--gs-space':`${presentation.manifest.theme?.tokens?.spacing??16}px`,'--gs-card-radius':`${presentation.manifest.theme?.tokens?.cardRadius??18}px`,'--gs-token-border':presentation.manifest.theme?.tokens?.borderColor,fontFamily:presentation.manifest.theme?.fontFamily } as React.CSSProperties}>
    <header className="player-toolbar"><div className="player-left">{onClose && <button className="icon-button" onClick={onClose} title="Cerrar"><X size={18} /></button>}<Brand /><span className="toolbar-divider" /><div className="deck-title"><strong>{presentation.manifest.title}</strong><small>{presentation.manifest.subtitle ?? 'GoSlides Viewer'}</small></div></div><div className="player-actions">
      {showPresenterTools && audienceUrl && <button className="icon-button" onClick={openAudienceWindow} title="Abrir pantalla del público sincronizada"><ExternalLink size={18} /></button>}{showPresenterTools && <button className="icon-button" onClick={() => setPresenterOpen(true)} title="Vista del presentador (P)"><PanelTop size={18} /></button>}
      {showPresenterTools && <button className="icon-button" onClick={() => setNotesOpen((v) => !v)} title="Notas (N)"><NotebookText size={18} /></button>}
      <button className="icon-button" onClick={() => setOverview((v) => !v)} title="Vista general (O)"><Grid2X2 size={18} /></button>
      <button className="icon-button" onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')} title="Cambiar tema">{mode === 'dark' ? <Sun size={18} /> : <Moon size={18} />}</button>
      <button className="icon-button" onClick={toggleFullscreen} title="Pantalla completa">{fullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}</button>
    </div></header>

    <main className={`player-main ${showPresenterTools && notesOpen ? 'with-notes' : ''}`}><div className="stage-frame">
      <SlideRenderer key={slide.id} slide={slide} master={(presentation.manifest.masters??[]).find(m=>m.id===slide.masterId)} assets={presentation.assets} slideNumber={index + 1} total={presentation.slides.length} fragmentStep={fragmentStep} />
      <button className="nav-arrow prev" onClick={previous} disabled={index === 0 && fragmentStep === 0} aria-label="Anterior"><ChevronLeft /></button>
      <button className="nav-arrow next" onClick={next} disabled={index === presentation.slides.length - 1 && fragmentStep >= maxFragment} aria-label="Siguiente"><ChevronRight /></button>
    </div>{showPresenterTools && notesOpen && <aside className="speaker-notes"><span>Notas del presentador</span><h3>{slide.title ?? `Slide ${index + 1}`}</h3>{slide.notes?.length ? <ul>{slide.notes.map((note, i) => <li key={i}>{note}</li>)}</ul> : <p>Esta slide no tiene notas.</p>}<div className="shortcuts"><strong>Atajos</strong><p>← → navegar/fragments · O overview · N notas · P presentador · Home/End</p></div></aside>}</main>

    <footer className="player-footer"><div className="progress-track"><span style={{ width: `${progress}%` }} /></div><span>{index + 1} / {presentation.slides.length}{maxFragment > 0 ? ` · paso ${fragmentStep}/${maxFragment}` : ''}</span></footer>

    {overview && <div className="overview-overlay"><div className="overview-head"><div><span>Vista general</span><h2>{presentation.manifest.title}</h2></div><button className="icon-button" onClick={() => setOverview(false)}><X /></button></div><div className="overview-grid">{presentation.slides.map((item, i) => <button className={i === index ? 'active' : ''} onClick={() => { goTo(i); setOverview(false); }} key={item.id}><div className="overview-render"><SlideRenderer slide={item} master={(presentation.manifest.masters??[]).find(m=>m.id===item.masterId)} assets={presentation.assets} slideNumber={i + 1} total={presentation.slides.length} /></div></button>)}</div></div>}

    {showPresenterTools && presenterOpen && <div className="presenter-overlay"><header><div><span>GOSLIDES PRESENTER</span><strong>{presentation.manifest.title}</strong></div><div className="presenter-clock">{formatClock(elapsed)}</div>{audienceUrl && <button className="secondary-button compact" onClick={openAudienceWindow}><ExternalLink size={15}/> Abrir pantalla</button>}<button className="icon-button" onClick={() => setPresenterOpen(false)}><X /></button></header><main>
      <section className="presenter-current"><span>ACTUAL · {index + 1}/{presentation.slides.length}</span><div><SlideRenderer slide={slide} master={(presentation.manifest.masters??[]).find(m=>m.id===slide.masterId)} assets={presentation.assets} slideNumber={index + 1} total={presentation.slides.length} fragmentStep={fragmentStep} /></div></section>
      <section className="presenter-next"><span>SIGUIENTE</span><div>{presentation.slides[index + 1] ? <SlideRenderer slide={presentation.slides[index + 1]} master={(presentation.manifest.masters??[]).find(m=>m.id===presentation.slides[index+1].masterId)} assets={presentation.assets} slideNumber={index + 2} total={presentation.slides.length} fragmentStep={0} /> : <div className="presenter-end">Fin de la presentación</div>}</div></section>
      <aside className="presenter-notes"><span>NOTAS</span><h3>{slide.title ?? `Slide ${index + 1}`}</h3>{slide.notes?.length ? <ul>{slide.notes.map((note,i)=><li key={i}>{note}</li>)}</ul> : <p>Sin notas.</p>}<div className="presenter-controls"><button onClick={previous}><ChevronLeft /> Anterior</button><button onClick={next}>Siguiente <ChevronRight /></button></div></aside>
    </main></div>}
  </div>;
}
