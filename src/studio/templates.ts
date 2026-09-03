import type { CanvasElement, PresentationDocument, Slide, SlideBlock } from '../types';
import { createInternalId, createPublicId } from '../lib/ids';

export type SlideTemplate = 'title' | 'section' | 'free' | 'text' | 'twoColumn' | 'bullets' | 'cards' | 'compare' | 'process' | 'code' | 'terminal' | 'tabs' | 'steps' | 'chart' | 'interactive' | 'quote' | 'dashboard' | 'architecture' | 'photo' | 'closing';

export function createBlankDocument(): PresentationDocument {
  const id = createInternalId('presentation');
  return {
    manifest: {
      format: 'goslides', version: 2, id, publicId: createPublicId(), title: 'Nueva presentación', subtitle: 'Editá el título y comenzá a crear',
      description: '', tags: [], theme: { mode: 'dark', accent: '#7c5cff', fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif', headingFontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif', slideBackground:'#111522', surfaceColor:'#1a2030', textColor:'#f7f8fc', mutedColor:'#aeb6cb', radius:18 }, masters: [], slides: ['slides/01.json'],
    },
    slides: [createSlide('title')], assetFiles: {}, updatedAt: new Date().toISOString(),
  };
}

export function createCanvasElement(type: CanvasElement['type']): CanvasElement {
  const id = createInternalId('el');
  const base = { id, layerName: type === 'text' ? 'Texto' : type[0].toUpperCase() + type.slice(1), x: 20, y: 20, w: 35, h: 18, zIndex: 1, animation: 'fade' as const, style: { color: '#f7f8fc', fontSize: 30, fontWeight: 700, textAlign: 'left' as const } };
  switch (type) {
    case 'text': return { ...base, type: 'text', text: 'Nuevo texto' };
    case 'shape': return { ...base, type: 'shape', shape: 'rounded', text: 'Forma', style: { ...base.style, background: '#202334', borderColor: '#4b5168', borderWidth: 1, borderRadius: 18, textAlign: 'center' } };
    case 'vector': return { ...base, type:'vector', layerName:'Vector', shape:'star', fill:'#7c5cff', stroke:'#ffffff', strokeWidth:1.5, vectorStyle:'solid', x:38, y:28, w:24, h:32, style:{opacity:1} }; 
    case 'image': return { ...base, type: 'image', layerName: 'Imagen', src: '', alt: 'Imagen', fit: 'cover', objectPositionX: 50, objectPositionY: 50, grayscale: 0, brightness: 100, contrast:100, saturate:100, flipX:false, flipY:false, w: 40, h: 35 }; 
    case 'arrow': return { ...base, type: 'arrow', direction: 'right', thickness: 5, arrowStyle:'modern', w: 25, h: 8, style: { color: '#7c5cff' } };
    case 'code': return { ...base, type: 'code', language: 'typescript', title: 'example.ts', code: 'const message = \"Hola GoSlides\";\nconsole.log(message);', frameStyle:'carbon', codeTheme:'seti', showLineNumbers:true, showWindowControls:true, w: 52, h: 36 };
    case 'emoji': return { ...base, type:'emoji', layerName:'Emoji', emoji:'✨', shortcode:':sparkles:', description:'Nueva funcionalidad', x:44, y:34, w:12, h:22, style:{fontSize:64,textAlign:'center',opacity:1} };
    case 'icon': return { ...base, type: 'icon', name: 'sparkles', library: 'lucide', label: '', x: 44, y: 38, w: 12, h: 20, style: { color: '#8b6cff' } };
    case 'freehand': return { ...base, type:'freehand', layerName:'Dibujo libre', x:20, y:20, w:30, h:20, points:[{x:0,y:50},{x:25,y:35},{x:50,y:60},{x:75,y:30},{x:100,y:50}], stroke:'#f7f8fc', strokeWidth:3, style:{opacity:1,sketch:true} };
    case 'table': return { ...base, type: 'table', layerName: 'Tabla', x: 12, y: 28, w: 76, h: 42, headerRow: true, rows: [['Opción','CPU','RAM'],['HPA','Sí','Sí'],['KEDA','Sí','Sí']], style: { color: '#f7f8fc', background: '#151a29', borderColor: '#343b52', borderWidth: 1, fontSize: 18, fontWeight: 500 } };
    case 'connector': return { ...base, type: 'connector', layerName: 'Conector', x: 0, y: 0, w: 100, h: 100, from: '', to: '', thickness: 3, style: { color: '#8b6cff' } };
    case 'block': return createBlockElement('text');
  }
}

/**
 * Tamaño inicial (en % de la slide) por tipo de bloque. Sólo es un punto de partida:
 * una vez insertado el bloque se arrastra y redimensiona como cualquier otro elemento.
 */
const blockGeometry: Record<SlideBlock['type'], { w: number; h: number }> = {
  text: { w: 56, h: 14 }, markdown: { w: 60, h: 46 }, bullets: { w: 52, h: 26 }, cards: { w: 80, h: 34 },
  stats: { w: 76, h: 22 }, compare: { w: 80, h: 42 }, code: { w: 62, h: 40 }, terminal: { w: 62, h: 30 },
  image: { w: 46, h: 40 }, timeline: { w: 62, h: 34 }, tabs: { w: 64, h: 32 }, steps: { w: 68, h: 34 },
  architecture: { w: 78, h: 46 }, quote: { w: 62, h: 22 }, callout: { w: 58, h: 18 }, tooltip: { w: 26, h: 10 },
  modal: { w: 26, h: 10 }, flipcard: { w: 30, h: 24 }, beforeAfter: { w: 70, h: 30 }, hotspots: { w: 56, h: 44 },
  chart: { w: 66, h: 40 }, simulation: { w: 60, h: 34 }, quadrant: { w: 66, h: 46 }, columns: { w: 82, h: 44 },
};

/**
 * Crea un elemento de canvas que envuelve un SlideBlock, de modo que cualquier bloque
 * insertado sea arrastrable y redimensionable igual que un texto o una forma.
 */
export function createBlockElement(type: SlideBlock['type']): Extract<CanvasElement, { type: 'block' }> {
  const { w, h } = blockGeometry[type] ?? { w: 56, h: 26 };
  return {
    id: createInternalId('el'), type: 'block', block: defaultBlock(type), fit: stretchByDefault.has(type) ? 'stretch' : 'auto',
    layerName: blockLayerNames[type] ?? type,
    x: Math.max(0, Math.round((100 - w) / 2)), y: Math.max(0, Math.round((100 - h) / 2)),
    w, h, zIndex: 4, animation: 'fade', style: { opacity: 1 },
  };
}

/** Bloques con marco propio: conviene que llenen el recuadro en vez de conservar su alto natural. */
const stretchByDefault = new Set<SlideBlock['type']>(['chart', 'image', 'architecture', 'hotspots', 'code', 'terminal', 'markdown', 'simulation', 'quadrant', 'columns']);

/** Envuelve un SlideBlock existente (p. ej. uno del flujo clásico) en un elemento libre. */
export function blockElementFrom(block: SlideBlock): Extract<CanvasElement, { type: 'block' }> {
  return { ...createBlockElement(block.type), block, fragment: block.fragment, animation: block.animation ?? 'fade', animationDuration: block.animationDuration, animationDelay: block.animationDelay, animationEasing: block.animationEasing };
}

const blockLayerNames: Partial<Record<SlideBlock['type'], string>> = {
  text: 'Texto', markdown: 'Markdown', bullets: 'Bullets', cards: 'Cards', stats: 'KPIs', compare: 'Comparación',
  code: 'Código', terminal: 'Terminal', image: 'Imagen', timeline: 'Timeline', quote: 'Quote', callout: 'Callout',
  tabs: 'Tabs', steps: 'Steps', architecture: 'Arquitectura', tooltip: 'Tooltip', modal: 'Modal',
  flipcard: 'Flip card', beforeAfter: 'Before / After', hotspots: 'Hotspots', chart: 'Chart', simulation: 'Simulación',
};

function freeText(text:string,x:number,y:number,w:number,h:number,size:number,weight=700,color='#f7f8fc'):Extract<CanvasElement,{type:'text'}>{
  return {id:createInternalId('el'),layerName:'Texto',type:'text',x,y,w,h,zIndex:3,text,style:{color,fontSize:size,fontWeight:weight,textAlign:'left'}};
}

export function createSlide(template: SlideTemplate): Slide {
  const id = createInternalId('slide');
  const base: Slide = { id, layout: 'default', title: 'Nueva slide', blocks: [], canvas: [], transition: 'fade' };
  switch (template) {
    case 'title': return { id, layout: 'center', eyebrow: 'NUEVA PRESENTACIÓN', title: 'Título de la presentación', subtitle: 'Subtítulo o idea principal', blocks: [], canvas: [], transition: 'fade' };
    case 'section': return { id, layout:'center', eyebrow:'SECCIÓN 01', title:'Nueva sección', subtitle:'Una pausa visual para introducir el próximo tema.', blocks:[], canvas:[], transition:'wipe', background:'linear-gradient(135deg,#12182a,#211a3a)' }; 
    case 'free': return { id, layout: 'free', title: '', blocks: [], transition: 'fade', canvas: [
      freeText('Diseñá **libremente**',8,10,72,16,54,800),
      freeText('Arrastrá, redimensioná y personalizá los elementos.',8,28,58,12,24,400,'#b8bdd0'),
    ] };
    case 'text': return { ...base, eyebrow: 'CONTEXTO', title: 'Título de la slide', blocks: [{ type: 'text', text: 'Escribí acá el contenido principal de la slide.', lead: true }] };
    case 'twoColumn': return { id,layout:'free',transition:'fade',canvas:[freeText('Dos columnas',6,7,70,10,44,800),{...createCanvasElement('shape'),id:createInternalId('el'),layerName:'Columna A',x:6,y:24,w:42,h:60,text:'**Idea principal**\n\nTexto de la primera columna.',style:{color:'#f7f8fc',background:'#171d2d',borderColor:'#303953',borderWidth:1,borderRadius:20,fontSize:24,fontWeight:500,textAlign:'left'}} as Extract<CanvasElement,{type:'shape'}>,{...createCanvasElement('shape'),id:createInternalId('el'),layerName:'Columna B',x:52,y:24,w:42,h:60,text:'**Segunda idea**\n\nTexto de la segunda columna.',style:{color:'#f7f8fc',background:'#171d2d',borderColor:'#303953',borderWidth:1,borderRadius:20,fontSize:24,fontWeight:500,textAlign:'left'}} as Extract<CanvasElement,{type:'shape'}>]};
    case 'bullets': return { ...base, eyebrow: 'PUNTOS CLAVE', title: 'Ideas principales', blocks: [{ type: 'bullets', items: ['Primer punto', 'Segundo punto', 'Tercer punto'] }] };
    case 'cards': return { ...base, eyebrow: 'RESUMEN', title: 'Tres ideas para recordar', blocks: [{ type: 'cards', columns: 3, items: [
      { title: 'Idea 1', text: 'Descripción breve de la primera idea.', icon: 'sparkles' }, { title: 'Idea 2', text: 'Descripción breve de la segunda idea.', icon: 'layers' }, { title: 'Idea 3', text: 'Descripción breve de la tercera idea.', icon: 'zap' },
    ] }] };
    case 'compare': return { ...base, eyebrow: 'COMPARACIÓN', title: 'Alternativa A vs B', blocks: [{ type: 'compare', left: { label: 'OPCIÓN A', title: 'Alternativa A', items: ['Característica 1', 'Característica 2'] }, right: { label: 'OPCIÓN B', title: 'Alternativa B', items: ['Característica 1', 'Característica 2'], highlight: true } }] };
    case 'process': return { id,layout:'free',transition:'slide',canvas:[freeText('Proceso',7,8,65,10,44,800),...['Descubrir','Diseñar','Construir','Validar'].map((label,i)=>({id:createInternalId('el'),layerName:label,type:'shape' as const,shape:'rounded' as const,x:6+i*23,y:38,w:18,h:20,zIndex:2,text:`**${i+1}**\n${label}`,fragment:i,animation:'slide-left' as const,style:{color:'#f7f8fc',background:i===3?'#4938aa':'#171d2d',borderColor:'#343d58',borderWidth:1,borderRadius:18,fontSize:20,fontWeight:650,textAlign:'center' as const}}))]};
    case 'code': return { ...base, eyebrow: 'CÓDIGO', title: 'Ejemplo práctico', blocks: [{ type: 'code', language: 'typescript', title: 'example.ts', code: 'const message = \"Hola GoSlides\";\nconsole.log(message);', frameStyle:'carbon', codeTheme:'seti', showLineNumbers:true, showWindowControls:true }] };
    case 'terminal': return { ...base, eyebrow: 'TERMINAL', title: 'Ejecución', blocks: [{ type: 'terminal', title: 'Terminal', command: 'npm run dev', output: '> ready in 420ms\n> http://localhost:5173/' }] };
    case 'tabs': return { ...base, eyebrow: 'INTERACTIVO', title: 'Explorá cada alternativa', blocks: [{ type: 'tabs', tabs: [{ label: 'Opción A', title: 'Primera opción', text: 'Contenido de la primera pestaña.' }, { label: 'Opción B', title: 'Segunda opción', text: 'Contenido de la segunda pestaña.' }] }] };
    case 'steps': return { ...base, eyebrow: 'PASO A PASO', title: 'Procedimiento', blocks: [{ type: 'steps', items: [{ title: 'Preparar', text: 'Prepará los elementos necesarios.' }, { title: 'Ejecutar', text: 'Realizá la acción principal.' }, { title: 'Validar', text: 'Comprobá el resultado.' }] }] };
    case 'chart': return { ...base, eyebrow: 'DATOS', title: 'Evolución de la métrica', blocks: [{ type: 'chart', chart: 'bar', title: 'Uso por alternativa', labels: ['A', 'B', 'C', 'D'], values: [42, 68, 53, 84], suffix: '%', showValues:true }] };
    case 'interactive': return { ...base, eyebrow: 'INTERACTIVO', title: 'Explorá la información', blocks: [
      { type: 'tooltip', label: '¿Qué es esto?', text: 'Un tooltip permite ampliar una idea sin llenar la slide de texto.' },
      { type: 'flipcard', frontTitle: 'HPA', frontText: 'Tocá para girar', backTitle: 'Horizontal Pod Autoscaler', backText: 'Escala réplicas según métricas configuradas.' },
    ] };
    case 'quote': return { ...base, eyebrow: 'IDEA CENTRAL', title: 'Concepto para destacar', blocks: [{ type: 'quote', text: 'Una idea importante merece espacio visual.', author: 'GoSlides' }] };
    case 'dashboard': return { id,layout:'free',transition:'fade',background:'linear-gradient(135deg,#0d1323,#151a2b)',canvas:[
      freeText('Dashboard ejecutivo',6,6,70,10,42,800),freeText('Métricas clave de la presentación',6,16,55,8,20,450,'#aeb6cb'),
      ...[['84%','Conversión',7],['+23%','Crecimiento',36],['1.8x','Eficiencia',65]].map(([value,label,x])=>({id:createInternalId('el'),layerName:`KPI ${label}`,type:'shape' as const,shape:'rounded' as const,x:Number(x),y:32,w:25,h:25,zIndex:2,text:`**${value}**\n${label}`,style:{color:'#f7f8fc',background:'#171e30',borderColor:'#303a55',borderWidth:1,borderRadius:20,fontSize:24,fontWeight:650,textAlign:'center' as const}})),
      freeText('Usá esta plantilla para resultados, estado y métricas.',7,70,82,10,23,500,'#c3c8d8')
    ]};
    case 'architecture': {
      const a={...createCanvasElement('shape'),id:'node-'+createInternalId('a'),layerName:'Frontend',x:8,y:40,w:22,h:18,text:'Frontend'} as Extract<CanvasElement,{type:'shape'}>;
      const b={...createCanvasElement('shape'),id:'node-'+createInternalId('b'),layerName:'API',x:39,y:40,w:22,h:18,text:'API'} as Extract<CanvasElement,{type:'shape'}>;
      const c={...createCanvasElement('shape'),id:'node-'+createInternalId('c'),layerName:'Database',x:70,y:40,w:22,h:18,text:'Database'} as Extract<CanvasElement,{type:'shape'}>;
      const ab={...createCanvasElement('connector'),id:createInternalId('conn'),from:a.id,to:b.id,label:'HTTP'} as Extract<CanvasElement,{type:'connector'}>;
      const bc={...createCanvasElement('connector'),id:createInternalId('conn'),from:b.id,to:c.id,label:'SQL'} as Extract<CanvasElement,{type:'connector'}>;
      return {id,layout:'free',transition:'fade',canvas:[freeText('Arquitectura',7,8,65,12,46,800),a,b,c,ab,bc]};
    }
    case 'photo': return {id,layout:'free',transition:'fade',background:'#0b0d13',canvas:[freeText('Imagen protagonista',6,7,65,12,48,800),freeText('Subí una imagen y usá los controles de focal point, brillo y filtros.',6,20,44,14,20,450,'#b7bdce'),{...createCanvasElement('image'),id:createInternalId('el'),layerName:'Hero image',x:54,y:7,w:40,h:82,src:'',alt:'Imagen principal',fit:'cover',objectPositionX:50,objectPositionY:50,contrast:100,saturate:100,style:{borderRadius:26,shadow:true}} as Extract<CanvasElement,{type:'image'}>]};
    case 'closing': return {id,layout:'center',eyebrow:'CIERRE',title:'Gracias',subtitle:'Preguntas · próximos pasos · contacto',blocks:[],canvas:[],transition:'zoom',background:'radial-gradient(circle at 50% 30%,#32266b,#111522 62%)'};
  }
}

export function defaultBlock(type: SlideBlock['type']): SlideBlock {
  switch (type) {
    case 'text': return { type: 'text', text: 'Nuevo texto.' };
    case 'markdown': return { type: 'markdown', appearance: 'modern', markdown: '# Bloque Markdown\n\nEscribí **Markdown** directamente en la slide.\n\n- Listas\n- `código inline`\n- [enlaces](https://example.com)\n\n```ts\nconst hello = \"GoSlides\";\n```' };
    case 'bullets': return { type: 'bullets', items: ['Punto 1', 'Punto 2'] };
    case 'cards': return { type: 'cards', columns: 2, items: [{ title: 'Card 1', text: 'Descripción' }, { title: 'Card 2', text: 'Descripción' }] };
    case 'stats': return { type: 'stats', items: [{ value: '42%', label: 'Métrica' }, { value: '3x', label: 'Resultado' }] };
    case 'compare': return { type: 'compare', left: { label: 'A', title: 'Opción A', items: ['Punto 1'] }, right: { label: 'B', title: 'Opción B', items: ['Punto 1'], highlight: true } };
    case 'code': return { type: 'code', language: 'text', code: '// código', frameStyle:'carbon', codeTheme:'seti', showLineNumbers:true, showWindowControls:true };
    case 'terminal': return { type: 'terminal', command: 'echo "Hola"', output: 'Hola' };
    case 'image': return { type: 'image', src: 'assets/imagen.png', alt: 'Imagen' };
    case 'timeline': return { type: 'timeline', items: [{ title: 'Paso 1', text: 'Descripción' }, { title: 'Paso 2', text: 'Descripción' }] };
    case 'tabs': return { type: 'tabs', tabs: [{ label: 'Tab 1', text: 'Contenido' }, { label: 'Tab 2', text: 'Contenido' }] };
    case 'steps': return { type: 'steps', items: [{ title: 'Paso 1', text: 'Descripción' }, { title: 'Paso 2', text: 'Descripción' }] };
    case 'architecture': return { type: 'architecture', nodes: [{ id: 'a', label: 'A', x: 30, y: 50 }, { id: 'b', label: 'B', x: 70, y: 50 }], edges: [{ from: 'a', to: 'b' }] };
    case 'quote': return { type: 'quote', text: 'Texto destacado' };
    case 'callout': return { type: 'callout', title: 'Importante', text: 'Mensaje destacado.', tone: 'info' };
    case 'tooltip': return { type: 'tooltip', label: 'Pasá el mouse', text: 'Información adicional.' };
    case 'modal': return { type: 'modal', buttonLabel: 'Más información', title: 'Detalle', text: 'Contenido ampliado.' };
    case 'flipcard': return { type: 'flipcard', frontTitle: 'Frente', frontText: 'Tocá para girar', backTitle: 'Dorso', backText: 'Contenido oculto.' };
    case 'beforeAfter': return { type: 'beforeAfter', beforeLabel: 'Antes', afterLabel: 'Después', beforeText: 'Estado inicial', afterText: 'Estado final' };
    case 'hotspots': return { type: 'hotspots', src: 'assets/imagen.png', alt: 'Imagen con hotspots', points: [{ x: 50, y: 50, label: '1', text: 'Punto de interés' }] };
    case 'chart': return { type: 'chart', chart: 'bar', title:'Datos', labels:['A','B','C'], values:[35,62,81], showValues:true };
    case 'simulation': return { type: 'simulation', title:'Simulación', min:0,max:100,initial:45,unit:'%',metricLabel:'Carga',podsBase:1,podsStep:20 };
    case 'quadrant': return { type: 'quadrant', title: 'Matriz 2x2', rowAxis: 'Fila', colAxis: 'Columna', rowLabels: ['Fila A', 'Fila B'], colLabels: ['Columna A', 'Columna B'], cells: [{ title: 'Caso 1', tone: 'success' }, { title: 'Caso 2', tone: 'danger' }, { title: 'Caso 3', tone: 'danger' }, { title: 'Caso 4', tone: 'success' }] };
    case 'columns': return { type: 'columns', items: [{ title: 'Columna 1', blocks: [{ type: 'text', text: 'Contenido de la columna 1.' }] }, { title: 'Columna 2', blocks: [{ type: 'text', text: 'Contenido de la columna 2.' }] }] };
  }
}
