import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Copy, Eye, Grid3X3, Maximize2, Network, Plus, Redo2, Save, Trash2, Undo2, X } from 'lucide-react';
import type { ArchitectureDiagramBlock, ArchitectureNode } from '../types';
import { ArchitectureDiagram, ARCHITECTURE_KINDS, boundedNode, nodeSize } from './ArchitectureDiagram';
import { TECH_ICONS, TECH_ICON_CATEGORIES } from './TechIcons';
import { IconGlyph } from './IconLibrary';
import { IconPicker } from '../studio/IconPicker';

type Selection = { type: 'node'; id: string } | { type: 'edge'; index: number } | null;
export function ArchitectureWorkspace({ block, onSave, onClose, initialNode, renderNodeEditor, renderNodeContent }: {
  block: ArchitectureDiagramBlock; onSave?: (block: ArchitectureDiagramBlock) => void; onClose: () => void; initialNode?: string;
  renderNodeEditor?: (node: ArchitectureNode, onChange: (patch: Partial<ArchitectureNode>) => void) => React.ReactNode;
  renderNodeContent?: (node: ArchitectureNode) => React.ReactNode;
}) {
  const [draft, setDraft] = useState(block);
  const current = useRef(block);
  const past = useRef<ArchitectureDiagramBlock[]>([]), future = useRef<ArchitectureDiagramBlock[]>([]);
  const [selection, setSelection] = useState<Selection>(initialNode ? { type: 'node', id: initialNode } : null);
  const [search, setSearch] = useState(''), [pack, setPack] = useState('');
  const [zoom, setZoom] = useState(100), [grid, setGrid] = useState(true), [preview, setPreview] = useState(false);
  const [connecting, setConnecting] = useState(false), [from, setFrom] = useState<string>();
  const dialog = useRef<HTMLDivElement>(null), closeButton = useRef<HTMLButtonElement>(null);
  const editable = Boolean(onSave), inspecting = !editable || preview;
  const selected = selection?.type === 'node' ? draft.nodes.find(node => node.id === selection.id) : undefined;
  const edgeIndex = selection?.type === 'edge' ? selection.index : undefined;
  const edge = edgeIndex === undefined ? undefined : draft.edges[edgeIndex];
  const dirty = draft !== block;

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButton.current?.focus();
    return () => { document.body.style.overflow = overflow; opener?.isConnected && opener.focus({ preventScroll: true }); };
  }, []);
  function checkpoint() {
    past.current = [...past.current.slice(-99), current.current]; future.current = [];
  }
  function edit(next: ArchitectureDiagramBlock, record = true) {
    if (record) checkpoint(); current.current = next; setDraft(next);
  }
  function undo() {
    const previous = past.current.pop(); if (!previous) return;
    future.current.push(current.current); current.current = previous; setDraft(previous); setConnecting(false);
  }
  function redo() {
    const next = future.current.pop(); if (!next) return;
    past.current.push(current.current); current.current = next; setDraft(next);
  }
  function patchNode(id: string, patch: Partial<ArchitectureNode>, record = true) {
    edit({ ...current.current, nodes: current.current.nodes.map(node => node.id === id ? boundedNode({ ...node, ...patch }) : node) }, record);
  }
  function add(item: string, x = 35 + draft.nodes.length % 4 * 9, y = 35 + draft.nodes.length % 3 * 10) {
    if (inspecting) return;
    const tech = item.startsWith('tech:') ? TECH_ICONS.find(icon => icon.id === item.slice(5)) : undefined;
    const kind = ARCHITECTURE_KINDS.find(kind => kind.id === item) ?? ARCHITECTURE_KINDS[1];
    if (item.startsWith('tech:') && !tech) return;
    const node = boundedNode({ id: `node-${crypto.randomUUID()}`, label: tech?.name ?? kind.label, x, y,
      kind: tech ? 'service' : kind.id, icon: tech?.id ?? kind.icon, iconLibrary: tech ? 'tech' : 'lucide',
      color: tech?.color ?? '#818cf8', caption: '', width: kind.id === 'group' && !tech ? 38 : 18, height: kind.id === 'group' && !tech ? 44 : 16 });
    edit({ ...draft, nodes: [...draft.nodes, node] }); setSelection({ type: 'node', id: node.id });
  }
  function choose(id: string) {
    setSelection({ type: 'node', id });
    if (!connecting || inspecting) return;
    if (!from) { setFrom(id); return; }
    if (from === id) return;
    if (!draft.edges.some(edge => edge.from === from && edge.to === id)) edit({ ...draft, edges: [...draft.edges, { from, to: id, lineStyle: 'orthogonal' }] });
    setConnecting(false); setFrom(undefined);
  }
  function remove() {
    if (selected) edit({ ...draft, nodes: draft.nodes.filter(node => node.id !== selected.id), edges: draft.edges.filter(edge => edge.from !== selected.id && edge.to !== selected.id) });
    else if (edgeIndex !== undefined) edit({ ...draft, edges: draft.edges.filter((_, index) => index !== edgeIndex) });
    setSelection(null);
  }
  function duplicate() {
    if (!selected) return;
    const node = boundedNode({ ...selected, id: `node-${crypto.randomUUID()}`, label: `${selected.label} copia`, x: selected.x + 4, y: selected.y + 4 });
    edit({ ...draft, nodes: [...draft.nodes, node] }); setSelection({ type: 'node', id: node.id });
  }
  const patchEdge = (patch: Partial<NonNullable<typeof edge>>) => edit({ ...draft, edges: draft.edges.map((edge, index) => index === edgeIndex ? { ...edge, ...patch } : edge) });
  const tokens = search.toLowerCase().trim().split(/\s+/);
  const matches = TECH_ICONS.filter(icon => (!pack || icon.category === pack) && tokens.every(token => `${icon.name} ${icon.id} ${icon.keywords}`.toLowerCase().includes(token)));
  function itemButton(item: string, label: string, icon: string, library: 'tech' | 'lucide') {
    return <button type="button" key={item} draggable onDragStart={event => event.dataTransfer.setData('application/goslides-architecture', item)} onClick={() => add(item)} title={`Insertar ${label}`} aria-label={`Insertar ${label}`}>
      <IconGlyph name={icon} library={library} size={26}/><span>{label}</span><Plus size={12}/>
    </button>;
  }

  return createPortal(<div className="archw-root" ref={dialog} role="dialog" aria-modal="true" aria-label={editable ? 'Editor de arquitectura' : 'Explorar arquitectura'}
    onPointerDown={event => event.stopPropagation()} onClick={event => event.stopPropagation()}
    onKeyDown={event => {
      event.stopPropagation();
      if (event.key === 'Escape') { event.preventDefault(); if (connecting) { setConnecting(false); setFrom(undefined); } else onClose(); }
      const input = (event.target as HTMLElement).closest('input, textarea, select, [contenteditable=true]');
      if (!input && !inspecting) {
        if (event.key === 'Delete' || event.key === 'Backspace') { event.preventDefault(); remove(); }
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') { event.preventDefault(); event.shiftKey ? redo() : undo(); }
      }
      if (event.key === 'Tab') {
        const items = Array.from(dialog.current!.querySelectorAll<HTMLElement>('button,input,textarea,select,[tabindex="0"]')).filter(item => !item.matches(':disabled') && item.getClientRects().length);
        const first = items[0], last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    }}>
    <header className="archw-header"><div><Network size={22}/><div><strong>Diagrama de arquitectura</strong><small>{draft.nodes.length} elementos · {draft.edges.length} conexiones{editable && dirty ? ' · Cambios sin guardar' : ''}</small></div></div>
      <div>{editable && <><button type="button" onClick={() => { setPreview(!preview); setConnecting(false); }} aria-pressed={preview}><Eye size={16}/>{preview ? 'Volver a editar' : 'Vista previa'}</button><button type="button" className="archw-primary" onClick={() => onSave?.(draft)}><Save size={16}/>Guardar diagrama</button></>}
        <button type="button" ref={closeButton} onClick={onClose}><X size={16}/>{editable ? 'Cancelar' : 'Cerrar'}</button></div>
    </header>
    <div className="archw-layout">
      <aside className="archw-palette" aria-label={inspecting ? 'Elementos del diagrama' : 'Insertar elementos'}>
        {inspecting ? <><h2>Elementos</h2>{draft.nodes.map(node => <button type="button" className={`archw-outline ${selected?.id === node.id ? 'active' : ''}`} key={node.id} onClick={() => choose(node.id)}>{node.label}</button>)}</> : <>
          <h2>Insertar elementos</h2><p>Hacé clic o arrastrá al lienzo.</p>
          <div className="archw-items">{ARCHITECTURE_KINDS.map(kind => itemButton(kind.id, kind.label, kind.icon, 'lucide'))}</div>
          <h2>Tecnología</h2><label>Buscar herramientas<input type="search" placeholder="AWS, Kubernetes, Python…" value={search} onChange={event => setSearch(event.target.value)}/></label>
          <label>Pack de iconos<select value={pack} onChange={event => setPack(event.target.value)}><option value="">Todos los packs</option>{TECH_ICON_CATEGORIES.map(pack => <option key={pack}>{pack}</option>)}</select></label>
          <div className="archw-items">{matches.map(icon => itemButton(`tech:${icon.id}`, icon.name, icon.id, 'tech'))}</div>{!matches.length && <p>Sin resultados.</p>}
        </>}
      </aside>
      <main className="archw-main">
        <div className="archw-toolbar">
          {!inspecting && <><button type="button" title="Deshacer" aria-label="Deshacer" disabled={!past.current.length} onClick={undo}><Undo2 size={16}/></button><button type="button" title="Rehacer" aria-label="Rehacer" disabled={!future.current.length} onClick={redo}><Redo2 size={16}/></button>
            <button type="button" aria-pressed={connecting} disabled={draft.nodes.length < 2} onClick={() => { setConnecting(!connecting); setFrom(undefined); }}><Network size={16}/>Conectar</button></>}
          <button type="button" aria-label="Mostrar cuadrícula" aria-pressed={grid} onClick={() => setGrid(!grid)}><Grid3X3 size={16}/></button>
          <label>Zoom<input type="range" min="50" max="200" step="10" value={zoom} onChange={event => setZoom(Number(event.target.value))}/><span>{zoom}%</span></label>
          <button type="button" title="Ajustar vista" aria-label="Ajustar vista" onClick={() => setZoom(100)}><Maximize2 size={16}/></button>
        </div>
        <div className="archw-scroll"><div className="archw-sheet" style={{ width: `${zoom}%` }}>
          <ArchitectureDiagram block={draft} grid={grid} editable={!inspecting && !connecting} selectedNode={selected?.id} selectedEdge={edgeIndex}
            onNode={choose} onEdge={index => setSelection({ type: 'edge', index })} onBlank={() => setSelection(null)}
            onBeginMove={checkpoint} onMove={(id, patch) => patchNode(id, patch, false)} onDropItem={inspecting ? undefined : add}/>
        </div></div>
        <footer role="status">{connecting ? (from ? 'Elegí el nodo de destino. Esc cancela la conexión.' : 'Elegí el nodo de origen.') : inspecting ? 'Seleccioná un elemento para explorar sus detalles.' : 'Arrastrá los elementos · Conectá origen y destino · Redimensioná desde la esquina'}</footer>
      </main>
      <aside className="archw-properties" aria-label="Propiedades del elemento">
        <h2>{inspecting ? 'Detalle del elemento' : 'Propiedades'}</h2>
        {selected ? inspecting ? <><h3>{selected.label}</h3>{selected.caption && <p>{selected.caption}</p>}<div className="archw-node-content">{renderNodeContent?.(selected) ?? <p>{selected.text}</p>}</div>
        </> : <>
          <div className="archw-action-row"><button type="button" onClick={duplicate}><Copy size={14}/>Duplicar</button><button type="button" onClick={remove}><Trash2 size={14}/>Eliminar</button></div>
          <label>Nombre del elemento<input value={selected.label} onChange={event => patchNode(selected.id, { label: event.target.value })}/></label>
          <label>Descripción breve<input value={selected.caption ?? ''} onChange={event => patchNode(selected.id, { caption: event.target.value })}/></label>
          <label>Tipo de elemento<select value={selected.kind ?? 'service'} onChange={event => patchNode(selected.id, { kind: event.target.value as ArchitectureNode['kind'] })}>{ARCHITECTURE_KINDS.map(kind => <option key={kind.id} value={kind.id}>{kind.label}</option>)}</select></label>
          <div className="archw-numbers">{(['x', 'y', 'width', 'height'] as const).map(key => <label key={key}>{{ x: 'X %', y: 'Y %', width: 'Ancho %', height: 'Alto %' }[key]}<input type="number" min="0" max="100" value={selected[key] ?? nodeSize(selected)[key as 'width' | 'height']} onChange={event => patchNode(selected.id, { [key]: Number(event.target.value) })}/></label>)}</div>
          <label>Color del elemento<input type="color" value={selected.color ?? '#818cf8'} onChange={event => patchNode(selected.id, { color: event.target.value })}/></label>
          <details className="archw-icon-settings"><summary>Icono del elemento</summary><IconPicker element={{ id: selected.id, type: 'icon', name: selected.icon ?? ARCHITECTURE_KINDS.find(kind => kind.id === selected.kind)?.icon ?? 'server', library: selected.iconLibrary ?? 'lucide', brandColors: selected.brandColors, x: 0, y: 0, w: 20, h: 20 }}
            onChange={icon => patchNode(selected.id, { icon: icon.name, iconLibrary: icon.library, brandColors: icon.brandColors })}/></details>
          <label>Texto cuando no hay bloques<textarea rows={4} value={selected.text ?? ''} onChange={event => patchNode(selected.id, { text: event.target.value })}/></label>
          {!selected.blocks?.length && selected.text && <button type="button" onClick={() => patchNode(selected.id, { blocks: [{ type: 'text', text: selected.text! }] })}>Usar texto como bloque</button>}
          {renderNodeEditor?.(selected, patch => patchNode(selected.id, patch))}
        </> : edge ? <>
          <h3>Conexión</h3>{(['from', 'to'] as const).map(key => <label key={key}>{key === 'from' ? 'Origen' : 'Destino'}<select disabled={inspecting} value={edge[key]} onChange={event => patchEdge({ [key]: event.target.value })}>{draft.nodes.filter(node => node.id !== edge[key === 'from' ? 'to' : 'from']).map(node => <option key={node.id} value={node.id}>{node.label}</option>)}</select></label>)}
          <label>Etiqueta de conexión<input readOnly={inspecting} value={edge.label ?? ''} onChange={event => patchEdge({ label: event.target.value })}/></label>
          {!inspecting && <><label>Recorrido<select value={edge.lineStyle ?? 'curve'} onChange={event => patchEdge({ lineStyle: event.target.value as NonNullable<typeof edge>['lineStyle'] })}><option value="curve">Curva</option><option value="straight">Recta</option><option value="orthogonal">Ortogonal</option></select></label>
            <label>Color de conexión<input type="color" value={edge.color ?? '#94a3b8'} onChange={event => patchEdge({ color: event.target.value })}/></label>
            <label className="archw-check"><input type="checkbox" checked={Boolean(edge.dashed)} onChange={event => patchEdge({ dashed: event.target.checked })}/>Línea discontinua</label>
            <label className="archw-check"><input type="checkbox" checked={edge.arrow !== false} onChange={event => patchEdge({ arrow: event.target.checked })}/>Flecha de dirección</label>
            <button type="button" onClick={remove}><Trash2 size={14}/>Eliminar conexión</button></>}
        </> : <div className="archw-empty-properties"><Network size={36}/><h3>Tu arquitectura, en detalle</h3><p>Seleccioná un elemento o una conexión del diagrama para ver sus {inspecting ? 'detalles' : 'propiedades'}.</p></div>}
      </aside>
    </div>
  </div>, document.fullscreenElement ?? document.body);
}
