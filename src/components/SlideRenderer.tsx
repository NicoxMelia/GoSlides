import { Fragment, useId, useMemo, useState } from 'react';
import {
  AlertTriangle, Check, CheckCircle2, Info, ShieldAlert,
} from 'lucide-react';
import type { AnimationMeta, ArchitectureNode, ArrowStyle, CanvasElement, Slide, SlideBlock, SlideMaster } from '../types';
import { resolveAsset } from '../lib/presentationLoader';
import { IconGlyph } from './IconLibrary';
import { RichText } from './RichText';
import { CodeBlockView } from './CodeBlock';
import { MarkdownBlockView } from './MarkdownBlock';

function easingValue(easing?: AnimationMeta['animationEasing']) {
  if (easing === 'spring') return 'cubic-bezier(.2,1.45,.45,1)';
  return easing ?? 'ease';
}
function Animated({ meta, step, children, hiddenOverride, onClick, wrapperStyle, className='' }: { meta: AnimationMeta; step: number; children: React.ReactNode; hiddenOverride?: boolean; onClick?: () => void; wrapperStyle?: React.CSSProperties; className?: string }) {
  const fragment = meta.fragment ?? 0; const hidden = hiddenOverride ?? (fragment > step);
  const style = {
    '--anim-duration': `${Math.max(.1, meta.animationDuration ?? .38)}s`,
    '--anim-delay': `${Math.max(0, meta.animationDelay ?? 0)}s`,
    '--anim-easing': easingValue(meta.animationEasing),
    '--motion-x': `${meta.motionPathX ?? 0}cqw`,
    '--motion-y': `${(meta.motionPathY ?? 0) * 0.5625}cqw`,
    ...wrapperStyle,
  } as React.CSSProperties;
  return <div className={`fragment-item ${className} ${hidden ? 'fragment-hidden' : 'fragment-visible'} anim-${meta.animation ?? 'none'} ${onClick?'fragment-trigger':''}`} style={style} data-fragment={fragment} onClick={onClick}>{children}</div>;
}

const toneIcons = { info: Info, success: CheckCircle2, warning: AlertTriangle, danger: ShieldAlert } as const;

export function Block({ block, assets, step = 999 }: { block: SlideBlock; assets: Record<string, string>; step?: number }) {
  if (block.type === 'text') return <p className={block.lead ? 'slide-lead' : 'slide-text'}><RichText text={block.text} /></p>;
  if (block.type === 'markdown') return <MarkdownBlockView markdown={block.markdown} appearance={block.appearance} />;
  if (block.type === 'bullets') return <ul className="bullet-list">{block.items.map((item, i) => <li key={i}><span><Check size={16} /></span><RichText text={item} /></li>)}</ul>;
  if (block.type === 'cards') return <div className={`cards-grid cols-${block.columns ?? Math.min(3, block.items.length)}`}>{block.items.map((item, index) => <article className="info-card" key={`${item.title}-${index}`}><div className="card-icon"><IconGlyph name={item.icon ?? 'sparkles'} size={20} strokeWidth={2} /></div>{item.badge && <span className="tiny-badge">{item.badge}</span>}<h3><RichText text={item.title} /></h3><p><RichText text={item.text} /></p></article>)}</div>;
  if (block.type === 'stats') return <div className="stats-grid">{block.items.map((item, i) => <div className="stat" key={i}><strong>{item.value}</strong><span>{item.label}</span>{item.hint && <small>{item.hint}</small>}</div>)}</div>;
  if (block.type === 'compare') return <div className="compare-grid">{[block.left, block.right].map((column) => <article className={`compare-card ${column.highlight ? 'highlight' : ''}`} key={column.label}><span className="compare-label">{column.label}</span><h3>{column.title}</h3>{column.subtitle && <p>{column.subtitle}</p>}<ul>{column.items.map((item, i) => <li key={i}><Check size={15} />{item}</li>)}</ul></article>)}</div>;
  if (block.type === 'code') return <CodeBlockView code={block.code} language={block.language} title={block.title} frameStyle={block.frameStyle} codeTheme={block.codeTheme} showLineNumbers={block.showLineNumbers} showWindowControls={block.showWindowControls}/>;
  if (block.type === 'terminal') return <div className="terminal-shell"><div className="terminal-header"><i /><i /><i /><span>{block.title ?? 'Terminal'}</span></div><div className="terminal-body"><div><span className="prompt">$</span> {block.command}</div>{block.output && <pre>{block.output}</pre>}</div></div>;
  if (block.type === 'image') return <figure className="slide-image"><img src={resolveAsset(block.src, assets)} alt={block.alt ?? ''} style={{ objectFit: block.fit ?? 'contain' }} />{block.caption && <figcaption>{block.caption}</figcaption>}</figure>;
  if (block.type === 'timeline') return <div className="timeline">{block.items.map((item, i) => <div className="timeline-item" key={i}><span>{String(i + 1).padStart(2, '0')}</span><div><h3>{item.title}</h3>{item.text && <p>{item.text}</p>}</div></div>)}</div>;
  if (block.type === 'quote') return <blockquote className="quote"><p>“{block.text}”</p>{block.author && <footer>{block.author}</footer>}</blockquote>;
  if (block.type === 'callout') { const tone = block.tone ?? 'info'; const ToneIcon = toneIcons[tone]; return <div className={`callout ${tone}`}><div className="callout-head"><ToneIcon size={15} />{block.title && <strong><RichText text={block.title} /></strong>}</div><p><RichText text={block.text} /></p></div>; }
  if (block.type === 'quadrant') return <QuadrantBlock block={block} />;
  if (block.type === 'columns') return <ColumnsBlock block={block} assets={assets} step={step} />;
  if (block.type === 'tabs') return <TabsBlock block={block} />;
  if (block.type === 'steps') return <StepsBlock block={block} />;
  if (block.type === 'architecture') return <ArchitectureBlock block={block} />;
  if (block.type === 'tooltip') return <TooltipBlock block={block} />;
  if (block.type === 'modal') return <ModalBlock block={block} />;
  if (block.type === 'flipcard') return <FlipCardBlock block={block} />;
  if (block.type === 'beforeAfter') return <BeforeAfterBlock block={block} />;
  if (block.type === 'hotspots') return <HotspotsBlock block={block} assets={assets} />;
  if (block.type === 'chart') return <ChartBlock block={block} />;
  if (block.type === 'simulation') return <SimulationBlock block={block} />;
  return null;
}

function TabsBlock({ block }: { block: Extract<SlideBlock, { type: 'tabs' }> }) { const [active, setActive] = useState(0); const tab = block.tabs[active]; return <div className="tabs-block"><div className="tabs-list">{block.tabs.map((item, i) => <button className={active === i ? 'active' : ''} onClick={() => setActive(i)} key={item.label}>{item.label}</button>)}</div><div className="tab-panel">{tab?.title && <h3>{tab.title}</h3>}<p>{tab?.text}</p></div></div>; }
function StepsBlock({ block }: { block: Extract<SlideBlock, { type: 'steps' }> }) { const [active, setActive] = useState(0); return <div className="steps-block">{block.title && <h3>{block.title}</h3>}<div className="step-chips">{block.items.map((item, i) => <button className={active === i ? 'active' : ''} onClick={() => setActive(i)} key={item.title}><span>{i + 1}</span>{item.title}</button>)}</div><div className="step-detail"><strong>{block.items[active]?.title}</strong><p>{block.items[active]?.text}</p></div></div>; }
function TooltipBlock({ block }: { block: Extract<SlideBlock, { type: 'tooltip' }> }) { return <span className="tooltip-block" tabIndex={0}>{block.label}<span className="tooltip-bubble">{block.text}</span></span>; }
function ModalBlock({ block }: { block: Extract<SlideBlock, { type: 'modal' }> }) { const [open, setOpen] = useState(false); return <><button className="interactive-button" onClick={() => setOpen(true)}>{block.buttonLabel}</button>{open && <div className="slide-modal-backdrop" onClick={() => setOpen(false)}><div className="slide-modal" onClick={(e) => e.stopPropagation()}><button className="modal-close" onClick={() => setOpen(false)}>×</button><h3>{block.title}</h3><p>{block.text}</p></div></div>}</>; }
function FlipCardBlock({ block }: { block: Extract<SlideBlock, { type: 'flipcard' }> }) { const [flipped, setFlipped] = useState(false); return <button className={`flip-card ${flipped ? 'flipped' : ''}`} onClick={() => setFlipped(!flipped)}><span className="flip-inner"><span className="flip-face flip-front"><strong>{block.frontTitle}</strong>{block.frontText && <small>{block.frontText}</small>}</span><span className="flip-face flip-back"><strong>{block.backTitle}</strong><small>{block.backText}</small></span></span></button>; }
function BeforeAfterBlock({ block }: { block: Extract<SlideBlock, { type: 'beforeAfter' }> }) { const [value, setValue] = useState(50); return <div className="before-after"><div className="before-after-copy"><div><span>{block.beforeLabel ?? 'Antes'}</span><p>{block.beforeText}</p></div><div><span>{block.afterLabel ?? 'Después'}</span><p>{block.afterText}</p></div></div><input aria-label="Comparar antes y después" type="range" min="0" max="100" value={value} onChange={(e) => setValue(Number(e.target.value))} /><div className="before-after-track"><span style={{ width: `${value}%` }} /></div></div>; }
function HotspotsBlock({ block, assets }: { block: Extract<SlideBlock, { type: 'hotspots' }>; assets: Record<string, string> }) { const [active, setActive] = useState<number | null>(null); return <div className="hotspot-wrap"><img src={resolveAsset(block.src, assets)} alt={block.alt ?? ''} />{block.points.map((point, i) => <Fragment key={i}><button className={`hotspot-dot ${active === i ? 'active' : ''}`} style={{ left: `${point.x}%`, top: `${point.y}%` }} onClick={() => setActive(active === i ? null : i)}>{point.label}</button>{active === i && <div className="hotspot-pop" style={{ left: `${Math.min(point.x + 4, 68)}%`, top: `${Math.min(point.y + 4, 72)}%` }}>{point.text}</div>}</Fragment>)}</div>; }

/** Matriz 2x2 (p.ej. verdadero/falso positivo/negativo): dos ejes con etiqueta y cuatro celdas con tono semántico. */
function QuadrantBlock({ block }: { block: Extract<SlideBlock, { type: 'quadrant' }> }) {
  const [tl, tr, bl, br] = block.cells;
  const Cell = ({ cell }: { cell: typeof tl }) => <div className={`quadrant-cell tone-${cell.tone ?? 'neutral'}`}><strong><RichText text={cell.title} /></strong>{cell.text && <span><RichText text={cell.text} /></span>}</div>;
  return <div className="quadrant-block">
    {block.title && <h3>{block.title}</h3>}
    <div className="quadrant-grid">
      <div className="quadrant-corner">{block.rowAxis && <span>{block.rowAxis}</span>}{block.colAxis && <em>{block.colAxis}</em>}</div>
      <div className="quadrant-colhead">{block.colLabels[0]}</div>
      <div className="quadrant-colhead">{block.colLabels[1]}</div>
      <div className="quadrant-rowhead">{block.rowLabels[0]}</div>
      <Cell cell={tl} />
      <Cell cell={tr} />
      <div className="quadrant-rowhead">{block.rowLabels[1]}</div>
      <Cell cell={bl} />
      <Cell cell={br} />
    </div>
  </div>;
}

/** Layout de N columnas dentro de una slide estructurada, cada una con su propia pila de bloques. */
function ColumnsBlock({ block, assets, step }: { block: Extract<SlideBlock, { type: 'columns' }>; assets: Record<string, string>; step: number }) {
  const template = (block.ratio && block.ratio.length === block.items.length ? block.ratio : block.items.map(() => 1)).map((r) => `${r}fr`).join(' ');
  return <div className="columns-block" style={{ gridTemplateColumns: template, gap: block.gap ? `${block.gap}cqw` : undefined }}>
    {block.items.map((column, i) => <div className="columns-col" key={i}>{column.title && <h4><RichText text={column.title} /></h4>}{column.blocks.map((inner, bi) => <Animated key={bi} meta={inner} step={step}><Block block={inner} assets={assets} step={step} /></Animated>)}</div>)}
  </div>;
}

function ChartBlock({ block }: { block: Extract<SlideBlock, { type: 'chart' }> }) {
  const max = Math.max(1, ...block.values); const total = Math.max(1, block.values.reduce((sum, value) => sum + Math.max(0, value), 0));
  const points = block.values.map((v, i) => `${(i / Math.max(1, block.values.length - 1)) * 92 + 4},${92 - (v / max) * 78}`).join(' '); const areaPoints = `4,92 ${points} 96,92`;
  const palette = ['var(--accent)', '#4ecdc4', '#ffb454', '#ff6b8a', '#7aa2f7', '#a8d86d', '#c792ea', '#89ddff']; let cursor = 0;
  const stops = block.values.map((value, index) => { const from = cursor; cursor += (Math.max(0, value) / total) * 100; return `${palette[index % palette.length]} ${from}% ${cursor}%`; }).join(',');
  const radar = block.values.map((v,i)=>{const angle=(Math.PI*2*i/Math.max(3,block.values.length))-Math.PI/2;const r=(v/max)*38;return `${50+Math.cos(angle)*r},${50+Math.sin(angle)*r}`}).join(' ');
  return <div className={`chart-block chart-${block.chart}`}>{block.title && <h3>{block.title}</h3>}
    {block.chart === 'bar' && <div className="bar-chart">{block.values.map((value, i) => <div className="bar-col" key={i}>{block.showValues !== false && <strong>{value}{block.suffix ?? ''}</strong>}<div><span style={{ height: `${(value / max) * 100}%` }} /></div><small>{block.labels[i] ?? ''}</small></div>)}</div>}
    {(block.chart === 'line' || block.chart === 'area') && <div className={`line-chart ${block.chart === 'area' ? 'area-chart' : ''}`}><svg viewBox="0 0 100 100" preserveAspectRatio="none">{block.chart === 'area' && <polygon className="area-fill" points={areaPoints} />}<polyline points={points} /><g>{block.values.map((value, i) => <circle key={i} cx={(i / Math.max(1, block.values.length - 1)) * 92 + 4} cy={92 - (value / max) * 78} r="1.5" />)}</g></svg><div className="line-labels">{block.labels.map((label, i) => <small key={`${label}-${i}`}>{label}{block.showValues !== false ? <b>{block.values[i]}{block.suffix ?? ''}</b> : null}</small>)}</div></div>}
    {(block.chart === 'donut' || block.chart === 'pie') && <div className={`donut-chart ${block.chart==='pie'?'pie-chart':''}`}><div className="donut-ring" style={{ background: `conic-gradient(${stops})` }}>{block.chart==='donut'&&<span><strong>{block.values.reduce((a,b)=>a+b,0)}{block.suffix ?? ''}</strong><small>Total</small></span>}</div><div className="donut-legend">{block.labels.map((label,i)=><div key={`${label}-${i}`}><i style={{background:palette[i%palette.length]}}/><span>{label}</span>{block.showValues !== false && <strong>{block.values[i]}{block.suffix ?? ''}</strong>}</div>)}</div></div>}
    {block.chart === 'radar' && <div className="radar-chart"><svg viewBox="0 0 100 100"><polygon className="radar-grid" points="50,10 88,38 74,84 26,84 12,38"/><polygon className="radar-fill" points={radar}/>{block.values.map((v,i)=>{const angle=(Math.PI*2*i/Math.max(3,block.values.length))-Math.PI/2;const r=(v/max)*38;return <circle key={i} cx={50+Math.cos(angle)*r} cy={50+Math.sin(angle)*r} r="1.7"/>})}</svg><div className="radar-labels">{block.labels.map((label,i)=><span key={label}>{label}{block.showValues!==false&&<b>{block.values[i]}{block.suffix??''}</b>}</span>)}</div></div>}
    {block.chart === 'progress' && <div className="progress-chart">{block.values.map((value,i)=><div key={i}><span>{block.labels[i]??`Serie ${i+1}`}<b>{value}{block.suffix??''}</b></span><div><i style={{width:`${Math.min(100,(value/max)*100)}%`}}/></div></div>)}</div>}
    {block.chart === 'gauge' && <div className="gauge-chart"><div className="gauge-ring" style={{'--gauge':`${Math.min(100,Math.max(0,block.suffix==='%'?(block.values[0]??0):((block.values[0]??0)/(max||1)*100)))}%`} as React.CSSProperties}><span><strong>{block.values[0]??0}{block.suffix??''}</strong><small>{block.labels[0]??'Valor'}</small></span></div></div>}
    {block.chart === 'funnel' && <div className="funnel-chart">{block.values.map((value,i)=><div key={i} style={{width:`${Math.max(22,(value/max)*100)}%`}}><span>{block.labels[i]??`Etapa ${i+1}`}</span>{block.showValues!==false&&<strong>{value}{block.suffix??''}</strong>}</div>)}</div>}
    {(block.xLabel||block.yLabel)&&<div className="chart-axis-labels">{block.yLabel&&<span className="axis-y">{block.yLabel}</span>}{block.xLabel&&<span className="axis-x">{block.xLabel}</span>}</div>}
    {block.showLegend&&!['donut','pie'].includes(block.chart)&&<div className="chart-inline-legend">{block.labels.map((label,i)=><span key={`${label}-${i}`}><i style={{background:palette[i%palette.length]}}/>{label}</span>)}</div>}
  </div>;
}
function SimulationBlock({ block }: { block: Extract<SlideBlock, { type: 'simulation' }> }) { const min = block.min ?? 0; const max = block.max ?? 100; const [value, setValue] = useState(block.initial ?? Math.round((min + max) / 2)); const percent = ((value - min) / Math.max(1, max - min)) * 100; const pods = Math.max(1, (block.podsBase ?? 1) + Math.floor((value - min) / Math.max(1, block.podsStep ?? 20))); return <div className="simulation-block">{block.title && <h3>{block.title}</h3>}<div className="sim-head"><span>{block.metricLabel ?? 'Carga'}</span><strong>{value}{block.unit ?? '%'}</strong></div><input type="range" min={min} max={max} value={value} onChange={(e) => setValue(Number(e.target.value))} /><div className="meter"><span style={{ width: `${percent}%` }} /></div><div className="pods"><span>Pods</span><div>{Array.from({ length: Math.min(12, pods) }).map((_, i) => <i key={i} />)}</div><strong>{pods}</strong></div></div>; }

function nodeClass(node: ArchitectureNode) { return `arch-node ${node.kind ?? 'service'}`; }
function architectureEndpoints(a: ArchitectureNode, b: ArchitectureNode) {
  const dx=b.x-a.x,dy=b.y-a.y;
  const scale=1/Math.max(Math.abs(dx)/8.3,Math.abs(dy)/7.2,1);
  return {x1:a.x+dx*scale,y1:a.y+dy*scale,x2:b.x-dx*scale,y2:b.y-dy*scale};
}
function ArchitectureBlock({ block }: { block: Extract<SlideBlock, { type: 'architecture' }> }) {
  const [active, setActive] = useState<string | null>(null);
  const markerId = `arch-arrow-${useId().replace(/[:]/g,'')}`;
  const byId = useMemo(() => new Map(block.nodes.map((n) => [n.id, n])), [block.nodes]);
  return <div className="architecture-canvas"><svg className="arch-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><defs><marker id={markerId} markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0,0 L0,7 L7,3.5 z"/></marker></defs>{block.edges.map((edge, i) => { const a = byId.get(edge.from); const b = byId.get(edge.to); if (!a || !b) return null; const {x1,y1,x2,y2}=architectureEndpoints(a,b); const mx=(x1+x2)/2,my=(y1+y2)/2; return <g key={i} className={active === edge.from || active === edge.to ? 'active' : ''}><path d={`M ${x1} ${y1} Q ${mx} ${my-1.2} ${x2} ${y2}`} markerEnd={`url(#${markerId})`} />{edge.label && <text className="arch-edge-label" x={mx} y={my-2.8}>{edge.label}</text>}</g>; })}</svg>{block.nodes.map((node) => <button key={node.id} className={`${nodeClass(node)} ${active === node.id ? 'active' : ''}`} style={{ left: `${node.x}%`, top: `${node.y}%` }} onClick={() => setActive(active === node.id ? null : node.id)}><i className="arch-kind" aria-hidden="true"/><strong>{node.label}</strong>{node.caption && <span>{node.caption}</span>}</button>)}</div>;
}

function canvasWrapperStyle(element: CanvasElement): React.CSSProperties {
  return { position:'absolute',left:`${element.x}%`,top:`${element.y}%`,width:`${element.w}%`,height:`${element.h}%`,zIndex:element.zIndex??1 };
}
function canvasStyle(element: CanvasElement, embedded=false): React.CSSProperties {
  const s = element.style ?? {};
  const style = { left:embedded?'0':`${element.x}%`,top:embedded?'0':`${element.y}%`,width:embedded?'100%':`${element.w}%`,height:embedded?'100%':`${element.h}%`,transform:`rotate(${element.rotation??0}deg)`,zIndex:embedded?1:(element.zIndex??1),color:s.color,background:s.background,borderColor:s.borderColor,borderWidth:s.borderWidth,borderStyle:s.borderWidth?'solid':undefined,borderRadius:s.borderRadius,opacity:s.opacity,fontSize:s.fontSize?`${s.fontSize/10}cqw`:undefined,fontWeight:s.fontWeight,textAlign:s.textAlign,fontStyle:s.fontStyle,lineHeight:s.lineHeight,letterSpacing:s.letterSpacing,fontFamily:s.fontFamily,textTransform:s.textTransform==='none'?undefined:s.textTransform,boxShadow:s.shadow?'0 18px 45px rgba(0,0,0,.28)':undefined } as React.CSSProperties & { viewTransitionName?: string };
  if (element.morphId) style.viewTransitionName = `gs-${element.morphId.replace(/[^a-zA-Z0-9_-]/g,'-')}`;
  // Un bloque no hereda tamaño de fuente: su CSS interno usa medidas propias y la
  // escala se aplica como zoom sobre `.canvas-block-scale` (ver blockZoomStyle).
  if (element.type === 'block') style.fontSize = undefined;
  return style;
}

/**
 * Escala de texto de un bloque libre. Se guarda en `style.fontSize` (30 = 100%) y se
 * aplica como `zoom` sobre un wrapper *interior* al contenedor de container-query:
 * así las medidas en `cqw` del bloque se resuelven contra el recuadro sin zoom y
 * recién después se escalan, en vez de anularse entre sí.
 */
export function blockZoomStyle(element: Extract<CanvasElement, { type: 'block' }>): React.CSSProperties {
  return { '--block-zoom': (element.style?.fontSize ?? 30) / 30 } as React.CSSProperties;
}
function vectorPoints(shape: Extract<CanvasElement,{type:'vector'}>['shape']) {
  if(shape==='triangle')return '50,6 94,92 6,92';
  if(shape==='hexagon')return '25,7 75,7 96,50 75,93 25,93 4,50';
  if(shape==='chevron')return '8,14 58,14 94,50 58,86 8,86 42,50';
  if(shape==='diamond')return '50,4 96,50 50,96 4,50';
  if(shape==='pentagon')return '50,4 96,38 78,94 22,94 4,38';
  if(shape==='octagon')return '30,4 70,4 96,30 96,70 70,96 30,96 4,70 4,30';
  if(shape==='cross')return '36,4 64,4 64,36 96,36 96,64 64,64 64,96 36,96 36,64 4,64 4,36 36,36';
  if(shape==='parallelogram')return '22,6 96,6 78,94 4,94';
  if(shape==='trapezoid')return '24,8 76,8 96,92 4,92';
  return '50,4 61,36 95,36 67,56 78,91 50,70 22,91 33,56 5,36 39,36';
}
function CanvasItem({ element, assets, embedded=false }: { element: CanvasElement; assets: Record<string, string>; embedded?: boolean }) {
  const localId = useId().replace(/[:]/g,'');
  if (element.type === 'text') return <div className={`canvas-render-item canvas-text ${element.style?.sketch?'element-sketch':''}`} style={canvasStyle(element,embedded)}><RichText text={element.text} /></div>;
  if (element.type === 'shape') return <div className={`canvas-render-item canvas-shape shape-${element.shape} ${element.style?.sketch?'element-sketch':''}`} style={canvasStyle(element,embedded)}><span><RichText text={element.text ?? ''} /></span></div>;
  if (element.type === 'vector') { const mode=element.vectorStyle??'solid'; const fill=mode==='outline'||mode==='sketch'?'none':element.fill??'var(--accent)'; const stroke=mode==='solid'?(element.stroke??'transparent'):(element.stroke??element.fill??'var(--accent)'); return <div className={`canvas-render-item canvas-vector vector-style-${mode} ${(element.style?.sketch||mode==='sketch')?'element-sketch':''}`} style={canvasStyle(element,embedded)}><svg viewBox="0 0 100 100" preserveAspectRatio="none">{mode==='duotone'&&<polygon points={vectorPoints(element.shape)} fill={element.fill??'var(--accent)'} opacity=".22" transform="translate(4 4) scale(.92)"/>}<polygon points={vectorPoints(element.shape)} fill={fill} stroke={stroke} strokeWidth={mode==='outline'||mode==='sketch'?Math.max(2,element.strokeWidth??2):element.strokeWidth??1}/></svg></div>; }
  if (element.type === 'image') { const scale=`scale(${element.flipX?-1:1},${element.flipY?-1:1}) scale(${element.cropZoom??1})`; const mask=element.mask??'none'; return <div className={`canvas-render-item canvas-image mask-${mask}`} style={canvasStyle(element,embedded)}>{element.src ? <img src={resolveAsset(element.src, assets)} alt={element.alt ?? ''} style={{ objectFit: element.fit ?? 'cover', objectPosition: `${element.objectPositionX ?? 50}% ${element.objectPositionY ?? 50}%`, filter:`grayscale(${element.grayscale??0}%) brightness(${element.brightness??100}%) contrast(${element.contrast??100}%) saturate(${element.saturate??100}%)`,transform:scale }} /> : <div className="canvas-image-placeholder">Seleccioná una imagen en Studio</div>}</div>; }
  if (element.type === 'code') return <div className="canvas-render-item canvas-code" style={canvasStyle(element,embedded)}><CodeBlockView code={element.code} language={element.language} title={element.title} frameStyle={element.frameStyle} codeTheme={element.codeTheme} showLineNumbers={element.showLineNumbers} showWindowControls={element.showWindowControls}/></div>;
  if (element.type === 'emoji') return <div className="canvas-render-item canvas-emoji" style={canvasStyle(element,embedded)} title={element.shortcode ? `${element.shortcode} · ${element.description ?? ''}` : element.description}><span>{element.emoji}</span></div>;
  if (element.type === 'icon') return <div className={`canvas-render-item canvas-icon ${element.style?.sketch?'element-sketch':''}`} style={canvasStyle(element,embedded)}><IconGlyph name={element.name} library={element.library} size="55%" />{element.label && <small>{element.label}</small>}</div>;
  if (element.type === 'freehand') { const pts=element.points.map(p=>`${p.x},${p.y}`).join(' '); return <div className="canvas-render-item canvas-freehand element-sketch" style={canvasStyle(element,embedded)}><svg viewBox="0 0 100 100" preserveAspectRatio="none"><polyline points={pts} fill="none" stroke={element.stroke??element.style?.color??'currentColor'} strokeWidth={element.strokeWidth??3} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke"/></svg></div>; }
  if (element.type === 'table') return <div className="canvas-render-item canvas-table-wrap" style={canvasStyle(element,embedded)}><table className={`canvas-table ${element.striped?'striped':''} ${element.compact?'compact':''}`}><tbody>{element.rows.map((row, r) => <tr key={r}>{row.map((cell, c) => { const Tag = element.headerRow && r === 0 ? 'th' : 'td'; return <Tag key={c}><RichText text={cell} /></Tag>; })}</tr>)}</tbody></table></div>;
  if (element.type === 'block') return <div className={`canvas-render-item canvas-block fit-${element.fit??'stretch'} ${element.style?.sketch?'element-sketch':''}`} style={canvasStyle(element,embedded)}><div className="canvas-block-inner"><div className="canvas-block-scale" style={blockZoomStyle(element)}><Block block={element.block} assets={assets} /></div></div></div>;
  if (element.type === 'connector') return null;
  const horizontal = element.direction === 'left' || element.direction === 'right';
  const arrowStyle=element.arrowStyle??'modern';
  const x1=element.direction === 'left' ? 94 : horizontal ? 6 : 50, y1=element.direction === 'up' ? 94 : horizontal ? 50 : 6, x2=element.direction === 'left' ? 6 : horizontal ? 94 : 50, y2=element.direction === 'up' ? 6 : horizontal ? 50 : 94;
  const markerPath=arrowMarkerPath(arrowStyle);
  return <div className={`canvas-render-item canvas-arrow arrow-${element.direction ?? 'right'} arrow-style-${arrowStyle} ${element.style?.sketch?'element-sketch':''}`} style={canvasStyle(element,embedded)}><svg viewBox="0 0 100 100" preserveAspectRatio="none"><defs><marker id={`arrow-${localId}-${element.id}`} markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto"><path d={markerPath} fill={arrowMarkerIsOutline(arrowStyle)?'none':'currentColor'} stroke="currentColor" strokeWidth={arrowMarkerIsOutline(arrowStyle)?1.4:.25} strokeLinecap="round" strokeLinejoin="round"/></marker></defs><line x1={x1} y1={y1} x2={x2} y2={y2} markerStart={arrowStyle==='double'?`url(#arrow-${localId}-${element.id})`:undefined} markerEnd={`url(#arrow-${localId}-${element.id})`} style={{ strokeWidth: element.thickness ?? 5 }} /></svg></div>;
}
function connectorEndpoints(a: Exclude<CanvasElement,Extract<CanvasElement,{type:'connector'}>>, b: Exclude<CanvasElement,Extract<CanvasElement,{type:'connector'}>>) {
  const ax=a.x+a.w/2,ay=a.y+a.h/2,bx=b.x+b.w/2,by=b.y+b.h/2,dx=bx-ax,dy=by-ay;
  const sa=1/Math.max(Math.abs(dx)/Math.max(1,a.w/2),Math.abs(dy)/Math.max(1,a.h/2),1);
  const sb=1/Math.max(Math.abs(dx)/Math.max(1,b.w/2),Math.abs(dy)/Math.max(1,b.h/2),1);
  return {x1:ax+dx*sa,y1:ay+dy*sa,x2:bx-dx*sb,y2:by-dy*sb};
}
function ConnectorLayer({ elements, step }: { elements: CanvasElement[]; step: number }) {
  const layerId = useId().replace(/[:]/g,'');
  const nodes=new Map(elements.filter((x):x is Exclude<CanvasElement,Extract<CanvasElement,{type:'connector'}>>=>x.type!=='connector'&&!x.hidden).map(x=>[x.id,x]));
  const connectors=elements.filter((x):x is Extract<CanvasElement,{type:'connector'}>=>x.type==='connector'&&!x.hidden);
  return <svg className="smart-connectors" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">{connectors.map(connector=>{
    if((connector.fragment??0)>step)return null;
    const a=nodes.get(connector.from),b=nodes.get(connector.to);if(!a||!b)return null;
    const {x1,y1,x2,y2}=connectorEndpoints(a,b),color=connector.style?.color??'var(--accent)',markerId=`smart-arrow-${layerId}-${connector.id.replace(/[^a-zA-Z0-9_-]/g,'-')}`;
    const mx=(x1+x2)/2,my=(y1+y2)/2;
    const path=`M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
    return <g key={connector.id} style={{opacity:connector.style?.opacity??1}}><defs><marker id={markerId} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill={color}/></marker></defs><path d={path} fill="none" stroke={color} strokeWidth={(connector.thickness??3)/10} strokeDasharray={connector.dashed?'1.2 1.2':undefined} markerEnd={`url(#${markerId})`}/>{connector.label&&<text className="connector-label" x={mx} y={my-1.6}>{connector.label}</text>}</g>;
  })}</svg>;
}

function LayerCanvas({ elements, assets, step, className='' }: {elements:CanvasElement[];assets:Record<string,string>;step:number;className?:string}) {
  const [triggered,setTriggered]=useState<Set<string>>(()=>new Set());
  const triggerSources=new Set(elements.map(e=>e.triggerId).filter(Boolean) as string[]);
  return <div className={`free-canvas ${className}`}><ConnectorLayer elements={elements} step={step}/>{elements.filter(e=>e.type!=='connector'&&!e.hidden).slice().sort((a,b)=>(a.zIndex??0)-(b.zIndex??0)).map(element=><Animated key={element.id} className="canvas-fragment" wrapperStyle={canvasWrapperStyle(element)} meta={element} step={step} hiddenOverride={element.triggerId? !triggered.has(element.triggerId):undefined} onClick={triggerSources.has(element.id)?()=>setTriggered(current=>new Set([...current,element.id])):undefined}><CanvasItem element={element} assets={assets} embedded/></Animated>)}</div>;
}

/** Punta de flecha por familia. `minimal` y `wedge` se dibujan sólo con stroke. */
export const ARROW_MARKER_PATHS: Record<ArrowStyle, string> = {
  classic: 'M0,0 L0,6 L9,3 z',
  modern: 'M0,0 L0,6 L9,3 z',
  rounded: 'M1,0 Q9,3 1,6 Q4,3 1,0',
  minimal: 'M1,1 L8,3 L1,5',
  double: 'M0,0 L0,6 L9,3 z',
  sketch: 'M0,0 L9,3 L0,6 L2,3 Z',
  dotted: 'M0,0 L0,6 L9,3 z',
  wedge: 'M0,1.2 L9,3 L0,4.8',
  blunt: 'M6.6,0 L9,0 L9,6 L6.6,6 z',
};
export function arrowMarkerPath(style: ArrowStyle) { return ARROW_MARKER_PATHS[style] ?? ARROW_MARKER_PATHS.classic; }
/** Familias sin relleno: la punta queda abierta y se define por el trazo. */
export function arrowMarkerIsOutline(style: ArrowStyle) { return style === 'minimal' || style === 'wedge'; }

export function maxFragmentForSlide(slide: Slide) { return Math.max(0,...(slide.blocks??[]).map(x=>x.fragment??0),...(slide.canvas??[]).filter(x=>!x.hidden).map(x=>x.fragment??0)); }
export function SlideRenderer({ slide, assets, slideNumber, total, fragmentStep=999, master }: {slide:Slide;assets:Record<string,string>;slideNumber:number;total:number;fragmentStep?:number;master?:SlideMaster}) {
  const background=slide.background??master?.background; const bgStyle=background?({background} as React.CSSProperties):undefined; const free=slide.layout==='free';
  return <section className={`slide-stage layout-${slide.layout??'default'} transition-${slide.transition??'none'}`} style={bgStyle}>
    <div className="slide-chrome"><span>{String(slideNumber).padStart(2,'0')}</span><span>/</span><span>{String(total).padStart(2,'0')}</span></div>
    {master?.canvas?.length ? <LayerCanvas className="master-canvas" elements={master.canvas} assets={assets} step={999}/> : null}
    {free ? <LayerCanvas elements={slide.canvas??[]} assets={assets} step={fragmentStep}/> : <><div className="slide-content">{slide.eyebrow&&<div className="slide-eyebrow">{slide.eyebrow}</div>}{slide.title&&<h1>{slide.title}</h1>}{slide.subtitle&&<p className="slide-subtitle">{slide.subtitle}</p>}<div className="blocks">{slide.blocks?.map((block,index)=><Animated key={index} meta={block} step={fragmentStep}><Block block={block} assets={assets} step={fragmentStep}/></Animated>)}</div></div>{(slide.canvas?.length??0)>0&&<LayerCanvas className="hybrid-overlay-canvas" elements={slide.canvas??[]} assets={assets} step={fragmentStep}/>}</>}
    {(slide.footer??master?.footer)&&<div className="slide-footer">{slide.footer??master?.footer}</div>}
  </section>;
}
