import { createContext, useContext, useEffect, useRef } from 'react';
import type { ReactNode, RefObject } from 'react';
import { createPortal } from 'react-dom';
import { RichText } from './RichText';

const OverlayDepth = createContext(0);

/** Los overlays anidados comparten el viewport de la slide y respetan su orden. */
export function SlideOverlay({ anchor, kind, onClose, children, className = '' }: {
  anchor: RefObject<HTMLElement>; kind: 'modal' | 'drawer'; onClose: () => void; children: ReactNode; className?: string;
}) {
  const depth = useContext(OverlayDepth) + 1;
  const host = anchor.current?.closest<HTMLElement>('.slide-stage, .visual-canvas, .editor-canvas-shell') ?? document.body;
  return <OverlayDepth.Provider value={depth}>{createPortal(
    <div className={`slide-overlay slide-${kind}-backdrop ${className}`} style={{ zIndex: 100 + depth }} onClick={event => { event.stopPropagation(); onClose(); }}>{children}</div>, host,
  )}</OverlayDepth.Provider>;
}

export function SlideDialog({ anchor, kind, title, side = 'right', width = 'md', onClose, children }: {
  anchor: RefObject<HTMLElement>; kind: 'modal' | 'drawer'; title: string; side?: 'left' | 'right'; width?: 'sm' | 'md' | 'lg'; onClose: () => void; children: ReactNode;
}) {
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const opener = anchor.current;
    panel.current?.querySelector<HTMLButtonElement>('.modal-close')?.focus({ preventScroll: true });
    return () => { if (opener?.isConnected) opener.focus({ preventScroll: true }); };
  }, [anchor]);
  return <SlideOverlay anchor={anchor} kind={kind} onClose={onClose}>
    <div ref={panel} className={kind === 'modal' ? 'slide-modal' : `slide-drawer side-${side} width-${width}`} role="dialog" aria-modal="true" aria-label={title}
      onClick={event => event.stopPropagation()} onKeyDown={event => {
        event.stopPropagation();
        if (event.key === 'Escape') { event.preventDefault(); onClose(); }
        if (event.key === 'Tab') {
          const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button, a[href], input, select, textarea, [tabindex]')).filter(element => element.tabIndex >= 0 && !element.matches(':disabled') && element.getClientRects().length > 0);
          const first = controls[0], last = controls[controls.length - 1];
          if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus({ preventScroll: true }); }
          else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus({ preventScroll: true }); }
        }
      }}>
      <button type="button" className="modal-close" aria-label="Cerrar" onClick={onClose}>×</button>
      <h3><RichText text={title} /></h3>{children}
    </div>
  </SlideOverlay>;
}
