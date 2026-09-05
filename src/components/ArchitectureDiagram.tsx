import { useId, useRef } from 'react';
import type { ArchitectureDiagramBlock, ArchitectureNode } from '../types';
import { IconGlyph } from './IconLibrary';

export const ARCHITECTURE_KINDS = [
  { id: 'client', label: 'Cliente', icon: 'users' },
  { id: 'service', label: 'Servicio', icon: 'server' },
  { id: 'data', label: 'Base de datos', icon: 'database' },
  { id: 'cloud', label: 'Nube', icon: 'cloud' },
  { id: 'queue', label: 'Cola / eventos', icon: 'layers' },
  { id: 'security', label: 'Seguridad', icon: 'shield' },
  { id: 'group', label: 'Zona / contenedor', icon: 'boxes' },
  { id: 'note', label: 'Nota', icon: 'braces' },
] as const;

export function nodeSize(node: ArchitectureNode) {
  return { width: node.width ?? (node.kind === 'group' ? 35 : 16.6), height: node.height ?? (node.kind === 'group' ? 40 : 14.4) };
}
export function boundedNode(node: ArchitectureNode): ArchitectureNode {
  const size = nodeSize(node);
  const width = Math.max(8, Math.min(90, size.width)), height = Math.max(8, Math.min(90, size.height));
  return { ...node, width, height, x: Math.max(width / 2, Math.min(100 - width / 2, node.x)), y: Math.max(height / 2, Math.min(100 - height / 2, node.y)) };
}
function endpoints(a: ArchitectureNode, b: ArchitectureNode) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const sa = nodeSize(a), sb = nodeSize(b);
  const scale = (w: number, h: number) => 1 / Math.max(Math.abs(dx) / (w / 2), Math.abs(dy) / (h / 2), 1);
  const start = scale(sa.width, sa.height), end = scale(sb.width, sb.height);
  return { x1: (a.x + dx * start) * 10, y1: (a.y + dy * start) * 6, x2: (b.x - dx * end) * 10, y2: (b.y - dy * end) * 6 };
}

export function ArchitectureDiagram({ block, selectedNode, selectedEdge, editable = false, grid = true, onNode, onEdge, onBlank, onBeginMove, onMove, onDropItem }: {
  block: ArchitectureDiagramBlock; selectedNode?: string; selectedEdge?: number; editable?: boolean; grid?: boolean;
  onNode: (id: string, event?: React.MouseEvent<HTMLButtonElement>) => void; onEdge?: (index: number) => void; onBlank?: () => void;
  onBeginMove?: () => void; onMove?: (id: string, patch: Partial<ArchitectureNode>) => void;
  onDropItem?: (item: string, x: number, y: number) => void;
}) {
  const id = useId().replace(/:/g, '');
  const board = useRef<HTMLDivElement>(null);
  const gesture = useRef<{ id: string; x: number; y: number; node: ArchitectureNode; width: number; height: number; resize: boolean; moved: boolean }>();
  const byId = new Map(block.nodes.map(node => [node.id, node]));
  function begin(event: React.PointerEvent<HTMLDivElement>, node: ArchitectureNode) {
    if (!editable || event.button !== 0) return;
    event.stopPropagation();
    onNode(node.id);
    const box = board.current!.getBoundingClientRect();
    gesture.current = { id: node.id, x: event.clientX, y: event.clientY, node, width: box.width, height: box.height, resize: Boolean((event.target as HTMLElement).closest('.archv-resize')), moved: false };
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function move(event: React.PointerEvent<HTMLDivElement>) {
    const drag = gesture.current;
    if (!drag || drag.id !== event.currentTarget.dataset.nodeId) return;
    const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
    if (!drag.moved && Math.hypot(dx, dy) < 3) return;
    if (!drag.moved) { onBeginMove?.(); drag.moved = true; }
    const size = nodeSize(drag.node);
    const patch = drag.resize
      ? { width: Math.round(size.width + dx / drag.width * 200), height: Math.round(size.height + dy / drag.height * 200) }
      : { x: Math.round(drag.node.x + dx / drag.width * 100), y: Math.round(drag.node.y + dy / drag.height * 100) };
    onMove?.(drag.id, boundedNode({ ...drag.node, ...patch }));
  }
  return <div ref={board} className={`archv-diagram ${grid ? 'with-grid' : ''}`} aria-label="Diagrama de arquitectura"
    onClick={event => { if (event.target === event.currentTarget) onBlank?.(); }}
    onDragOver={event => { if (onDropItem) event.preventDefault(); }}
    onDrop={event => {
      if (!onDropItem) return;
      const item = event.dataTransfer.getData('application/goslides-architecture');
      if (!item) return;
      event.preventDefault(); const box = event.currentTarget.getBoundingClientRect();
      onDropItem(item, (event.clientX - box.left) / box.width * 100, (event.clientY - box.top) / box.height * 100);
    }}>
    <svg className="archv-edges" viewBox="0 0 1000 600" preserveAspectRatio="none">
      <defs>{block.edges.map((edge, index) => <marker key={index} id={`${id}-${index}`} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto-start-reverse"><path d="M0 0L8 4L0 8Z" fill={edge.color ?? '#94a3b8'}/></marker>)}</defs>
      {block.edges.map((edge, index) => {
        const a = byId.get(edge.from), b = byId.get(edge.to); if (!a || !b) return null;
        const { x1, y1, x2, y2 } = endpoints(a, b), mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
        const d = edge.lineStyle === 'straight' ? `M${x1} ${y1}L${x2} ${y2}` : edge.lineStyle === 'orthogonal'
          ? `M${x1} ${y1}H${mx}V${y2}H${x2}` : `M${x1} ${y1}C${mx} ${y1} ${mx} ${y2} ${x2} ${y2}`;
        return <g key={index} className={selectedEdge === index ? 'selected' : ''}>
          <path className="archv-edge-hit" d={d} role={onEdge ? 'button' : undefined} tabIndex={onEdge ? 0 : undefined} aria-label={`Conexión ${a.label} a ${b.label}`} onClick={event => { if (onEdge) { event.stopPropagation(); onEdge(index); } }} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onEdge?.(index); } }}/>
          <path className="archv-edge-line" d={d} stroke={edge.color ?? '#94a3b8'} strokeDasharray={edge.dashed ? '7 5' : undefined} markerEnd={edge.arrow === false ? undefined : `url(#${id}-${index})`}/>
          {edge.label && <text x={mx} y={my - 10} textAnchor="middle">{edge.label}</text>}
        </g>;
      })}
    </svg>
    {block.nodes.slice().sort((a, b) => Number(b.kind === 'group') - Number(a.kind === 'group')).map(node => {
      const size = nodeSize(node), kind = ARCHITECTURE_KINDS.find(kind => kind.id === node.kind) ?? ARCHITECTURE_KINDS[1];
      return <div key={node.id} data-node-id={node.id} className={`archv-node kind-${node.kind ?? 'service'} ${selectedNode === node.id ? 'selected' : ''}`}
        style={{ left: `${node.x}%`, top: `${node.y}%`, width: `${size.width}%`, height: `${size.height}%`, '--node-color': node.color ?? '#818cf8' } as React.CSSProperties}
        onPointerDown={event => begin(event, node)} onPointerMove={move} onPointerUp={() => { gesture.current = undefined; }} onPointerCancel={() => { gesture.current = undefined; }}>
        <button type="button" className="archv-node-main" aria-label={node.label} aria-pressed={selectedNode === node.id} onClick={event => { event.stopPropagation(); onNode(node.id, event); }}>
          <span className="archv-node-icon"><IconGlyph name={node.icon ?? kind.icon} library={node.iconLibrary ?? 'lucide'} brandColors={node.brandColors} size="100%"/></span>
          <span className="archv-node-copy"><strong>{node.label}</strong>{node.caption && <small>{node.caption}</small>}</span>
        </button>
        {editable && selectedNode === node.id && <button type="button" className="archv-resize" aria-label={`Redimensionar ${node.label}`} onClick={event => event.stopPropagation()}/>}
      </div>;
    })}
    {!block.nodes.length && <div className="archv-empty">Agregá un elemento para comenzar tu arquitectura</div>}
  </div>;
}
