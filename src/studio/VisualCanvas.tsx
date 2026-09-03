import { useId, useMemo, useRef, useState } from 'react';
import type { CanvasElement, Slide, SlideMaster } from '../types';
import { resolveAsset } from '../lib/presentationLoader';
import { IconGlyph } from '../components/IconLibrary';
import { RichText } from '../components/RichText';
import { CodeBlockView } from '../components/CodeBlock';
import { Block, arrowMarkerIsOutline, arrowMarkerPath, blockZoomStyle } from '../components/SlideRenderer';

function styleFor(element: CanvasElement): React.CSSProperties {
  const s = element.style ?? {};
  return {
    left: `${element.x}%`, top: `${element.y}%`, width: `${element.w}%`, height: `${element.h}%`, transform: `rotate(${element.rotation ?? 0}deg)`, zIndex: element.zIndex ?? 1,
    color: s.color, background: s.background, borderColor: s.borderColor, borderWidth: s.borderWidth, borderStyle: s.borderWidth ? 'solid' : undefined,
    borderRadius: s.borderRadius, opacity: s.opacity, fontSize: s.fontSize ? `${s.fontSize / 10}cqw` : undefined, fontWeight: s.fontWeight,
    textAlign: s.textAlign, fontStyle: s.fontStyle, lineHeight: s.lineHeight, letterSpacing: s.letterSpacing, fontFamily: s.fontFamily,
    textTransform: s.textTransform === 'none' ? undefined : s.textTransform, boxShadow: s.shadow ? '0 18px 45px rgba(0,0,0,.28)' : undefined,
    ...(element.type === 'block' ? { fontSize: undefined } : null),
  };
}

function ElementPreview({ element, assets }: { element: CanvasElement; assets: Record<string, string> }) {
  const localId=useId().replace(/[:]/g,'');
  if (element.type === 'text') return <div className="vc-content vc-text"><RichText text={element.text} /></div>;
  if (element.type === 'shape') return <div className={`vc-content vc-shape shape-${element.shape}`}><span><RichText text={element.text ?? ''} /></span></div>;
  if (element.type === 'vector') { const points=element.shape==='triangle'?'50,6 94,92 6,92':element.shape==='hexagon'?'25,7 75,7 96,50 75,93 25,93 4,50':element.shape==='chevron'?'8,14 58,14 94,50 58,86 8,86 42,50':element.shape==='diamond'?'50,4 96,50 50,96 4,50':element.shape==='pentagon'?'50,4 96,38 78,94 22,94 4,38':element.shape==='octagon'?'30,4 70,4 96,30 96,70 70,96 30,96 4,70 4,30':element.shape==='cross'?'36,4 64,4 64,36 96,36 96,64 64,64 64,96 36,96 36,64 4,64 4,36 36,36':element.shape==='parallelogram'?'22,6 96,6 78,94 4,94':element.shape==='trapezoid'?'24,8 76,8 96,92 4,92':'50,4 61,36 95,36 67,56 78,91 50,70 22,91 33,56 5,36 39,36'; const mode=element.vectorStyle??'solid',fill=mode==='outline'||mode==='sketch'?'none':element.fill??'var(--accent)',stroke=mode==='solid'?(element.stroke??'transparent'):(element.stroke??element.fill??'var(--accent)'); return <div className={`vc-content vc-vector vector-style-${mode} ${(element.style?.sketch||mode==='sketch')?'element-sketch':''}`}><svg viewBox="0 0 100 100" preserveAspectRatio="none">{mode==='duotone'&&<polygon points={points} fill={element.fill??'var(--accent)'} opacity=".22" transform="translate(4 4) scale(.92)"/>}<polygon points={points} fill={fill} stroke={stroke} strokeWidth={mode==='outline'||mode==='sketch'?Math.max(2,element.strokeWidth??2):element.strokeWidth??1}/></svg></div>; }
  if (element.type === 'image') return <div className={`vc-content vc-image mask-${element.mask??'none'}`}>{element.src ? <img src={resolveAsset(element.src, assets)} alt={element.alt ?? ''} style={{ objectFit: element.fit ?? 'cover', objectPosition: `${element.objectPositionX ?? 50}% ${element.objectPositionY ?? 50}%`, filter: `grayscale(${element.grayscale ?? 0}%) brightness(${element.brightness ?? 100}%) contrast(${element.contrast??100}%) saturate(${element.saturate??100}%)`, transform:`scale(${element.flipX?-1:1},${element.flipY?-1:1}) scale(${element.cropZoom??1})` }} /> : <span>Elegí una imagen</span>}</div>;
  if (element.type === 'code') return <div className="vc-content vc-code"><CodeBlockView code={element.code} language={element.language} title={element.title} frameStyle={element.frameStyle} codeTheme={element.codeTheme} showLineNumbers={element.showLineNumbers} showWindowControls={element.showWindowControls} compact/></div>;
  if (element.type === 'emoji') return <div className="vc-content vc-emoji" title={element.shortcode ? `${element.shortcode} · ${element.description ?? ''}` : element.description}><span>{element.emoji}</span></div>;
  if (element.type === 'icon') return <div className={`vc-content vc-icon ${element.style?.sketch?'element-sketch':''}`}><IconGlyph name={element.name} library={element.library} size="58%" />{element.label && <small>{element.label}</small>}</div>;
  if (element.type === 'freehand') return <div className="vc-content vc-freehand element-sketch"><svg viewBox="0 0 100 100" preserveAspectRatio="none"><polyline points={element.points.map(p=>`${p.x},${p.y}`).join(' ')} fill="none" stroke={element.stroke??element.style?.color??'currentColor'} strokeWidth={element.strokeWidth??3} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke"/></svg></div>;
  if (element.type === 'table') return <div className="vc-content vc-table-wrap"><table className={`vc-table ${element.striped?'striped':''} ${element.compact?'compact':''}`}><tbody>{element.rows.map((row,r)=><tr key={r}>{row.map((cell,c)=>{const Tag=element.headerRow&&r===0?'th':'td';return <Tag key={c}>{cell}</Tag>;})}</tr>)}</tbody></table></div>;
  if (element.type === 'block') return <div className={`vc-content vc-block fit-${element.fit??'stretch'}`}><div className="vc-block-inner"><div className="canvas-block-scale" style={blockZoomStyle(element)}><Block block={element.block} assets={assets} /></div></div></div>;
  if (element.type === 'connector') return null;
  const horizontal = element.direction === 'left' || element.direction === 'right';
  const arrowStyle=element.arrowStyle??'modern';
  const markerPath=arrowMarkerPath(arrowStyle);
  return <div className={`vc-content vc-arrow arrow-style-${arrowStyle} ${element.style?.sketch?'element-sketch':''}`}><svg viewBox="0 0 100 100" preserveAspectRatio="none"><defs><marker id={`edit-arrow-${localId}-${element.id}`} markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto"><path d={markerPath} fill={arrowMarkerIsOutline(arrowStyle)?'none':'currentColor'} stroke="currentColor" strokeWidth={arrowMarkerIsOutline(arrowStyle)?1.4:.25} strokeLinecap="round" strokeLinejoin="round"/></marker></defs><line x1={element.direction === 'left' ? 94 : horizontal ? 6 : 50} y1={element.direction === 'up' ? 94 : horizontal ? 50 : 6} x2={element.direction === 'left' ? 6 : horizontal ? 94 : 50} y2={element.direction === 'up' ? 6 : horizontal ? 50 : 94} markerStart={arrowStyle==='double'?`url(#edit-arrow-${localId}-${element.id})`:undefined} markerEnd={`url(#edit-arrow-${localId}-${element.id})`} style={{ strokeWidth: element.thickness ?? 5 }} /></svg></div>;
}

function editorConnectorEndpoints(a: Exclude<CanvasElement,Extract<CanvasElement,{type:'connector'}>>, b: Exclude<CanvasElement,Extract<CanvasElement,{type:'connector'}>>) {
  const ax=a.x+a.w/2,ay=a.y+a.h/2,bx=b.x+b.w/2,by=b.y+b.h/2,dx=bx-ax,dy=by-ay;
  const sa=1/Math.max(Math.abs(dx)/Math.max(1,a.w/2),Math.abs(dy)/Math.max(1,a.h/2),1);
  const sb=1/Math.max(Math.abs(dx)/Math.max(1,b.w/2),Math.abs(dy)/Math.max(1,b.h/2),1);
  return {x1:ax+dx*sa,y1:ay+dy*sa,x2:bx-dx*sb,y2:by-dy*sb};
}

function ConnectorOverlay({ elements, selectedIds, onSelect }: { elements: CanvasElement[]; selectedIds: string[]; onSelect: (ids: string[]) => void }) {
  const layerId=useId().replace(/[:]/g,'');
  const nodes = useMemo(() => new Map(elements.filter((x):x is Exclude<CanvasElement,Extract<CanvasElement,{type:'connector'}>>=>x.type!=='connector'&&!x.hidden).map(x=>[x.id,x])), [elements]);
  const connectors = elements.filter((x): x is Extract<CanvasElement,{type:'connector'}> => x.type === 'connector' && !x.hidden);
  return <svg className="editor-smart-connectors" viewBox="0 0 100 100" preserveAspectRatio="none">{connectors.map((connector)=>{
    const a=nodes.get(connector.from);const b=nodes.get(connector.to);if(!a||!b)return null;
    const {x1,y1,x2,y2}=editorConnectorEndpoints(a,b),color=connector.style?.color??'var(--accent)',mx=(x1+x2)/2,my=(y1+y2)/2,markerId=`editor-arrow-${layerId}-${connector.id.replace(/[^a-zA-Z0-9_-]/g,'-')}`;
    const path=`M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
    return <g key={connector.id} className={selectedIds.includes(connector.id)?'selected':''} onPointerDown={(e)=>{e.preventDefault();e.stopPropagation();onSelect([connector.id]);}}><defs><marker id={markerId} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill={color}/></marker></defs><path className="connector-hit" d={path}/><path d={path} fill="none" stroke={color} strokeWidth={(connector.thickness??3)/10} strokeDasharray={connector.dashed?'1.2 1.2':undefined} markerEnd={`url(#${markerId})`}/>{connector.label&&<text className="connector-label" x={mx} y={my-1.6}>{connector.label}</text>}</g>;
  })}</svg>;
}

type Guide = { axis: 'x'|'y'; value: number };

function snappedPosition(moving: CanvasElement, desiredX: number, desiredY: number, others: CanvasElement[]) {
  const threshold = 0.7;
  const xCandidates = [0,50,100]; const yCandidates = [0,50,100];
  others.filter(x=>x.type!=='connector').forEach((o)=>{xCandidates.push(o.x,o.x+o.w/2,o.x+o.w);yCandidates.push(o.y,o.y+o.h/2,o.y+o.h);});
  const movingX = [desiredX, desiredX+moving.w/2, desiredX+moving.w];
  const movingY = [desiredY, desiredY+moving.h/2, desiredY+moving.h];
  let bestXDelta:number|undefined, bestXGuide:number|undefined, bestYDelta:number|undefined, bestYGuide:number|undefined;
  xCandidates.forEach((candidate)=>movingX.forEach((point)=>{const delta=candidate-point;if(Math.abs(delta)<=threshold&&(bestXDelta===undefined||Math.abs(delta)<Math.abs(bestXDelta))){bestXDelta=delta;bestXGuide=candidate;}}));
  yCandidates.forEach((candidate)=>movingY.forEach((point)=>{const delta=candidate-point;if(Math.abs(delta)<=threshold&&(bestYDelta===undefined||Math.abs(delta)<Math.abs(bestYDelta))){bestYDelta=delta;bestYGuide=candidate;}}));
  return { x: desiredX+(bestXDelta??0), y:desiredY+(bestYDelta??0), guides:[...(bestXGuide===undefined?[]:[{axis:'x' as const,value:bestXGuide}]),...(bestYGuide===undefined?[]:[{axis:'y' as const,value:bestYGuide}])] };
}

export function VisualCanvas({ slide, master, assets, selectedIds, onSelect, onContextMenuElement, onChangeMany, onBeginGesture, drawMode=false, onAddFreehand, transparent=false }: {
  slide: Slide;
  master?: SlideMaster;
  assets: Record<string,string>;
  selectedIds: string[];
  onSelect: (ids: string[]) => void;
  onContextMenuElement?: (id:string,x:number,y:number)=>void;
  onChangeMany: (elements: CanvasElement[]) => void;
  onBeginGesture: () => void;
  drawMode?: boolean;
  onAddFreehand?: (element: Extract<CanvasElement,{type:'freehand'}>) => void;
  transparent?: boolean;
}) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [guides,setGuides]=useState<Guide[]>([]);
  const [selectionBox,setSelectionBox]=useState<{x:number;y:number;w:number;h:number}|null>(null);
  const [drawing,setDrawing]=useState<Array<{x:number;y:number}>>([]);
  const drawingRef=useRef<Array<{x:number;y:number}>>([]);
  // Los elementos del Master se mezclan acá con los de la slide: se editan igual que
  // cualquier otro (seleccionar, arrastrar, redimensionar), sin un modo aparte. El
  // caller reparte los cambios de vuelta entre slide.canvas y master.canvas según a
  // quién pertenecía cada id (ver `patchCanvas` en StudioEditor).
  const masterElementIds=useMemo(()=>new Set((master?.canvas??[]).map(x=>x.id)),[master]);
  const elements=useMemo(()=>[...(master?.canvas??[]),...(slide.canvas??[])],[master,slide.canvas]);

  function choose(event: React.PointerEvent, element: CanvasElement) {
    const groupIds = element.groupId ? elements.filter(x=>x.groupId===element.groupId).map(x=>x.id) : [element.id];
    if (event.shiftKey || event.ctrlKey || event.metaKey) {
      const next=new Set(selectedIds); groupIds.forEach(id=>next.has(id)?next.delete(id):next.add(id)); onSelect([...next]);
    } else if (!selectedIds.includes(element.id)) onSelect(groupIds);
    return groupIds;
  }

  function beginDraw(event: React.PointerEvent<HTMLDivElement>){
    const box=canvasRef.current?.getBoundingClientRect();if(!box||!onAddFreehand)return;
    event.preventDefault();event.stopPropagation();onSelect([]);
    const point=(e:{clientX:number;clientY:number})=>({x:Math.max(0,Math.min(100,((e.clientX-box.left)/box.width)*100)),y:Math.max(0,Math.min(100,((e.clientY-box.top)/box.height)*100))});
    const pts=[point(event)];drawingRef.current=pts;setDrawing(pts);const node=event.currentTarget;node.setPointerCapture(event.pointerId);
    const move=(e:PointerEvent)=>{const next=point(e);const current=drawingRef.current;const last=current[current.length-1];if(last&&Math.hypot(next.x-last.x,next.y-last.y)<.25)return;const updated=[...current,next];drawingRef.current=updated;setDrawing(updated);};
    const up=()=>{const current=drawingRef.current;drawingRef.current=[];setDrawing([]);if(current.length>1){const xs=current.map(p=>p.x),ys=current.map(p=>p.y),minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys),w=Math.max(1,maxX-minX),h=Math.max(1,maxY-minY);onAddFreehand({id:`freehand-${crypto.randomUUID?.()??Date.now().toString(36)}`,type:'freehand',layerName:'Dibujo libre',x:minX,y:minY,w,h,zIndex:Math.max(1,...elements.map(x=>x.zIndex??1))+1,points:current.map(p=>({x:((p.x-minX)/w)*100,y:((p.y-minY)/h)*100})),stroke:'var(--text)',strokeWidth:3,style:{opacity:1,sketch:true}});}node.removeEventListener('pointermove',move);node.removeEventListener('pointerup',up);node.removeEventListener('pointercancel',up);};
    node.addEventListener('pointermove',move);node.addEventListener('pointerup',up);node.addEventListener('pointercancel',up);
  }

  function beginSelection(event: React.PointerEvent<HTMLDivElement>){
    if(drawMode){beginDraw(event);return;}
    const target=event.target as HTMLElement;if(event.currentTarget!==event.target&&!target.classList.contains('vc-grid'))return;
    const box=canvasRef.current?.getBoundingClientRect();if(!box)return;event.preventDefault();onSelect([]);
    const sx=Math.max(0,Math.min(100,((event.clientX-box.left)/box.width)*100)),sy=Math.max(0,Math.min(100,((event.clientY-box.top)/box.height)*100));
    const node=event.currentTarget;node.setPointerCapture(event.pointerId);
    const move=(e:PointerEvent)=>{const ex=Math.max(0,Math.min(100,((e.clientX-box.left)/box.width)*100)),ey=Math.max(0,Math.min(100,((e.clientY-box.top)/box.height)*100));const rect={x:Math.min(sx,ex),y:Math.min(sy,ey),w:Math.abs(ex-sx),h:Math.abs(ey-sy)};setSelectionBox(rect);const ids=elements.filter(el=>el.type!=='connector'&&!el.hidden&&!el.locked&&el.x<rect.x+rect.w&&el.x+el.w>rect.x&&el.y<rect.y+rect.h&&el.y+el.h>rect.y).map(el=>el.id);onSelect(ids);};
    const up=()=>{setSelectionBox(null);node.removeEventListener('pointermove',move);node.removeEventListener('pointerup',up);};node.addEventListener('pointermove',move);node.addEventListener('pointerup',up);
  }

  function beginDrag(event: React.PointerEvent, element: CanvasElement) {
    if (drawMode) return;
    if ((event.target as HTMLElement).classList.contains('resize-handle') || element.type==='connector') return;
    event.preventDefault(); event.stopPropagation();
    const chosen=choose(event,element);
    // Un elemento bloqueado igual se puede seleccionar (para ver/editar sus propiedades
    // o desbloquearlo desde el panel) - lo único que se corta acá es el arrastre.
    if (element.locked) return;
    const activeIds=(selectedIds.includes(element.id)?selectedIds:chosen).filter(id=>{const item=elements.find(x=>x.id===id);return item?.type!=='connector'&&!item?.locked;});
    const box=canvasRef.current?.getBoundingClientRect(); if(!box)return;
    onBeginGesture();
    const startX=event.clientX,startY=event.clientY;
    const originals=new Map(elements.filter(x=>activeIds.includes(x.id)).map(x=>[x.id,{...x}]));
    const target=event.currentTarget as HTMLElement; target.setPointerCapture(event.pointerId);
    const move=(e:PointerEvent)=>{
      const dx=((e.clientX-startX)/box.width)*100,dy=((e.clientY-startY)/box.height)*100;
      const anchor=originals.get(element.id)!;
      const others=elements.filter(x=>!activeIds.includes(x.id));
      const snap=snappedPosition(anchor,Math.max(0,Math.min(100-anchor.w,anchor.x+dx)),Math.max(0,Math.min(100-anchor.h,anchor.y+dy)),others);
      setGuides(snap.guides);
      const appliedDx=snap.x-anchor.x,appliedDy=snap.y-anchor.y;
      onChangeMany(elements.map((item)=>{const original=originals.get(item.id);if(!original)return item;return {...original,x:Math.max(0,Math.min(100-original.w,original.x+appliedDx)),y:Math.max(0,Math.min(100-original.h,original.y+appliedDy))};}));
    };
    const up=()=>{setGuides([]);target.removeEventListener('pointermove',move);target.removeEventListener('pointerup',up);};
    target.addEventListener('pointermove',move);target.addEventListener('pointerup',up);
  }

  function beginResize(event: React.PointerEvent, element: CanvasElement) {
    event.preventDefault();event.stopPropagation();onSelect([element.id]);const box=canvasRef.current?.getBoundingClientRect();if(!box)return;onBeginGesture();
    const startX=event.clientX,startY=event.clientY,ow=element.w,oh=element.h;const target=event.currentTarget as HTMLElement;target.setPointerCapture(event.pointerId);
    const move=(e:PointerEvent)=>{const dw=((e.clientX-startX)/box.width)*100,dh=((e.clientY-startY)/box.height)*100;onChangeMany(elements.map(x=>x.id===element.id?{...element,w:Math.max(4,Math.min(100-element.x,ow+dw)),h:Math.max(4,Math.min(100-element.y,oh+dh))}:x));};
    const up=()=>{target.removeEventListener('pointermove',move);target.removeEventListener('pointerup',up);};target.addEventListener('pointermove',move);target.addEventListener('pointerup',up);
  }

  return <div className={`visual-canvas ${transparent?'hybrid-editor-canvas':''} ${drawMode?'draw-mode':''}`} ref={canvasRef} style={{background:transparent?'transparent':slide.background||master?.background||undefined}} onPointerDown={beginSelection}>
    <div className="vc-grid"/>{drawing.length>1&&<svg className="freehand-live-overlay" viewBox="0 0 100 100" preserveAspectRatio="none"><polyline points={drawing.map(p=>`${p.x},${p.y}`).join(' ')} fill="none" stroke="var(--accent)" strokeWidth="0.45" strokeLinecap="round" strokeLinejoin="round"/></svg>}<ConnectorOverlay elements={elements} selectedIds={selectedIds} onSelect={onSelect}/>
    {selectionBox&&<div className="selection-marquee" style={{left:`${selectionBox.x}%`,top:`${selectionBox.y}%`,width:`${selectionBox.w}%`,height:`${selectionBox.h}%`}}/>}
    {guides.map((g,i)=><span key={`${g.axis}-${g.value}-${i}`} className={`snap-guide ${g.axis}`} style={g.axis==='x'?{left:`${g.value}%`}:{top:`${g.value}%`}}/>)}
    <svg className="motion-path-overlay" viewBox="0 0 100 100" preserveAspectRatio="none">{elements.filter(e=>selectedIds.includes(e.id)&&e.type!=='connector'&&((e.motionPathX??0)!==0||(e.motionPathY??0)!==0)).map(e=>{const x=e.x+e.w/2,y=e.y+e.h/2,tx=x+(e.motionPathX??0),ty=y+(e.motionPathY??0);return <g key={e.id}><line x1={x} y1={y} x2={tx} y2={ty}/><circle cx={tx} cy={ty} r="1.1"/></g>})}</svg>
    {elements.filter(e=>e.type!=='connector'&&!e.hidden).slice().sort((a,b)=>(a.zIndex??0)-(b.zIndex??0)).map((element)=><div key={element.id} className={`visual-element ${selectedIds.includes(element.id)?'selected':''} ${element.locked?'locked':''} ${masterElementIds.has(element.id)?'from-master':''}`} style={styleFor(element)} onPointerDown={(e)=>beginDrag(e,element)} onContextMenu={(e)=>{e.preventDefault();e.stopPropagation();onContextMenuElement?.(element.id,e.clientX,e.clientY);}}>
      <ElementPreview element={element} assets={assets}/>{element.groupId&&<span className="group-badge">G</span>}{masterElementIds.has(element.id)&&<span className="master-badge" title={`Elemento del Master${master?.name?` "${master.name}"`:''}`}>M</span>}
      {selectedIds.includes(element.id)&&<><span className="element-label">{element.type}</span>{selectedIds.length===1&&!element.locked&&<button className="resize-handle" onPointerDown={(e)=>beginResize(e,element)} aria-label="Redimensionar"/>}</>}
    </div>)}
    {selectedIds.length>1&&<div className="multi-selection-label">{selectedIds.length} elementos seleccionados</div>}
  </div>;
}
