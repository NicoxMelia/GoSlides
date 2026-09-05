import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { ArchitectureNode, SlideBlock } from '../types';
import { Maximize2 } from 'lucide-react';
import { ArchitectureDiagram } from './ArchitectureDiagram';
import { ArchitectureWorkspace } from './ArchitectureWorkspace';
import { RichText } from './RichText';
import { SlideOverlay } from './SlideOverlay';

export function ArchitectureBlock({ block, renderContent }: { block: Extract<SlideBlock, { type: 'architecture' }>; renderContent: (node: ArchitectureNode) => React.ReactNode }) {
  const [expanded, setExpanded] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const panel = useRef<HTMLDivElement | null>(null);
  const localId = useId().replace(/:/g, '');
  const panelId = `arch-detail-${localId}`;
  const byId = useMemo(() => new Map(block.nodes.map(node => [node.id, node])), [block.nodes]);
  const selected = active ? byId.get(active) : undefined;
  const view = block.detailView ?? 'drawer';
  const open = Boolean(selected);

  useEffect(() => {
    if (!open) return;
    const opener = trigger.current;
    panel.current?.querySelector<HTMLButtonElement>('.modal-close')?.focus({ preventScroll: true });
    return () => { if (opener?.isConnected) opener.focus({ preventScroll: true }); };
  }, [open, view]);

  const detail = selected && <div ref={panel} id={panelId}
    className={`arch-detail ${view === 'drawer' ? 'slide-drawer side-right width-md' : view === 'modal' ? 'slide-modal' : 'arch-detail-inline'}`}
    role={view === 'inline' ? 'region' : 'dialog'} aria-modal={view === 'inline' ? undefined : true} aria-labelledby={`${panelId}-title`}
    onClick={event => event.stopPropagation()} onKeyDown={event => {
      event.stopPropagation();
      if (event.key === 'Escape') { event.preventDefault(); setActive(null); }
      if (event.key === 'Tab' && view !== 'inline') {
        const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button, a[href], input, select, textarea, [tabindex]')).filter(element => element.tabIndex >= 0 && !element.matches(':disabled') && element.getClientRects().length > 0);
        const first = controls[0], last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus({ preventScroll: true }); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus({ preventScroll: true }); }
      }
    }}>
    <button type="button" className="modal-close" aria-label="Cerrar detalle" onClick={() => setActive(null)}>×</button>
    <span className="arch-detail-eyebrow">Detalle del nodo · {block.nodes.findIndex(node => node.id === active) + 1} / {block.nodes.length}</span>
    <h3 id={`${panelId}-title`}><RichText text={selected.label} /></h3>
    {selected.caption && <p className="arch-detail-caption"><RichText text={selected.caption} /></p>}
    <div className="arch-detail-body">{renderContent(selected)}</div>
    {!selected.blocks?.length && !selected.text && !selected.caption &&
      <p>Este nodo no tiene detalles adicionales.</p>}
  </div>;

  return <div className={`architecture-block archv-block detail-view-${view}`} onClick={event => event.stopPropagation()} onKeyDown={event => {
    if (event.key === 'Escape' && !open) return;
    event.stopPropagation();
    if (event.key === 'Escape') { event.preventDefault(); setActive(null); }
  }}>
    <ArchitectureDiagram block={block} selectedNode={selected?.id} onNode={(id, event) => {
      trigger.current = event?.currentTarget ?? null;
      setActive(active === id ? null : id);
    }}/>
    <button type="button" className="archv-expand" aria-label="Abrir diagrama a pantalla completa" onClick={() => { setActive(null); setExpanded(true); }}><Maximize2 size={14}/>Explorar diagrama</button>
    {expanded && <ArchitectureWorkspace block={block} onClose={() => setExpanded(false)} renderNodeContent={renderContent}/>}
    {detail && (view === 'inline' ? detail : <SlideOverlay anchor={trigger} kind={view} className="arch-detail-backdrop" onClose={() => setActive(null)}>{detail}</SlideOverlay>)}
  </div>;
}
