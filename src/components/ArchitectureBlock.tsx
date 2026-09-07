import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { ArchitectureNode, SlideBlock } from '../types';
import { RichText } from './RichText';
import { SlideOverlay } from './SlideOverlay';

function architectureEndpoints(a: ArchitectureNode, b: ArchitectureNode) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const scale = 1 / Math.max(Math.abs(dx) / 8.3, Math.abs(dy) / 7.2, 1);
  return { x1: a.x + dx * scale, y1: a.y + dy * scale, x2: b.x - dx * scale, y2: b.y - dy * scale };
}

export function ArchitectureBlock({ block, renderContent }: { block: Extract<SlideBlock, { type: 'architecture' }>; renderContent: (node: ArchitectureNode) => React.ReactNode }) {
  const [active, setActive] = useState<string | null>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const panel = useRef<HTMLDivElement | null>(null);
  const localId = useId().replace(/:/g, '');
  const markerId = `arch-arrow-${localId}`, panelId = `arch-detail-${localId}`;
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
    {(['incoming', 'outgoing'] as const).map(direction => {
      const links = block.edges.flatMap((edge, index) => {
        if ((direction === 'incoming' ? edge.to : edge.from) !== active) return [];
        const node = byId.get(direction === 'incoming' ? edge.from : edge.to);
        return node ? [{ node, label: edge.label, index }] : [];
      });
      return links.length > 0 && <div className="arch-detail-connections" key={direction}>
        <h4>{direction === 'incoming' ? 'Recibe de' : 'Continúa hacia'}</h4>
        {links.map(({ node, label, index }) => <button type="button" key={index} onClick={() => {
          setActive(node.id);
          panel.current?.querySelector<HTMLButtonElement>('.modal-close')?.focus({ preventScroll: true });
          panel.current?.scrollTo({ top: 0 });
        }}><span>{node.label}{label && <small>{label}</small>}</span><span aria-hidden="true">→</span></button>)}
      </div>;
    })}
    {!selected.blocks?.length && !selected.text && !selected.caption && !block.edges.some(edge =>
      (edge.from === active && byId.has(edge.to)) || (edge.to === active && byId.has(edge.from))) &&
      <p>Este nodo no tiene detalles adicionales.</p>}
  </div>;

  return <div className={`architecture-block detail-view-${view}`} onClick={event => event.stopPropagation()} onKeyDown={event => {
    if (event.key === 'Escape' && !open) return;
    event.stopPropagation();
    if (event.key === 'Escape') { event.preventDefault(); setActive(null); }
  }}>
    <div className="architecture-canvas">
      <svg className="arch-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <defs><marker id={markerId} markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0,0 L0,7 L7,3.5 z" /></marker></defs>
        {block.edges.map((edge, index) => {
          const a = byId.get(edge.from), b = byId.get(edge.to);
          if (!a || !b) return null;
          const { x1, y1, x2, y2 } = architectureEndpoints(a, b), mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
          return <g key={index} className={active === edge.from || active === edge.to ? 'active' : ''}>
            <path d={`M ${x1} ${y1} Q ${mx} ${my - 1.2} ${x2} ${y2}`} markerEnd={`url(#${markerId})`} />
            {edge.label && <text className="arch-edge-label" x={mx} y={my - 2.8}>{edge.label}</text>}
          </g>;
        })}
      </svg>
      {block.nodes.map(node => <button type="button" key={node.id}
        className={`arch-node ${node.kind ?? 'service'} ${active === node.id ? 'active' : ''}`}
        style={{ left: `${node.x}%`, top: `${node.y}%` }} aria-expanded={active === node.id}
        aria-controls={active === node.id ? panelId : undefined} aria-haspopup={view === 'inline' ? undefined : 'dialog'}
        onClick={event => {
          trigger.current = event.currentTarget;
          setActive(active === node.id ? null : node.id);
        }}>
        <i className="arch-kind" aria-hidden="true" /><strong>{node.label}</strong>{node.caption && <span>{node.caption}</span>}
      </button>)}
      <span className="arch-interaction-hint">Hacé clic en un nodo para explorar</span>
    </div>
    {detail && (view === 'inline' ? detail : <SlideOverlay anchor={trigger} kind={view} className="arch-detail-backdrop" onClose={() => setActive(null)}>{detail}</SlideOverlay>)}
  </div>;
}
