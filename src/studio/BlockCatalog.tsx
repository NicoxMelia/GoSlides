import { useState } from 'react';
import type { ReactNode } from 'react';
import type { SlideBlock } from '../types';

export const blockTypes: SlideBlock['type'][] = ['text','markdown','bullets','cards','stats','compare','code','terminal','image','timeline','quote','callout','quadrant','columns','tabs','steps','accordion','modal','drawer','architecture','tooltip','flipcard','beforeAfter','hotspots','chart','simulation'];
export const blockLabels: Record<SlideBlock['type'], string> = { text:'Texto', markdown:'Markdown', bullets:'Lista', cards:'Tarjetas', stats:'KPIs', compare:'Comparación', code:'Código', terminal:'Terminal', image:'Imagen', timeline:'Línea de tiempo', quote:'Cita', callout:'Aviso', quadrant:'Matriz 2×2', columns:'Columnas', tabs:'Pestañas', steps:'Pasos', accordion:'Acordeón', modal:'Modal', drawer:'Panel de detalle', architecture:'Arquitectura', tooltip:'Tooltip', flipcard:'Tarjeta reversible', beforeAfter:'Antes / Después', hotspots:'Puntos interactivos', chart:'Gráfico', simulation:'Simulación' };
const categories = {
  'Texto': ['text','markdown','bullets','quote','callout'],
  'Visuales': ['cards','compare','image','quadrant','columns','architecture'],
  'Datos y código': ['stats','code','terminal','timeline','chart'],
  'Interactivos': ['tabs','steps','accordion','modal','drawer','tooltip','flipcard','beforeAfter','hotspots','simulation'],
};

/** Ejemplos SVG estáticos: no montan controles interactivos dentro de los botones. */
export function BlockPreview({ type }: { type: SlideBlock['type'] }) {
  const accent = '#a99bff', soft = '#8290b3', white = '#e6ecfc';
  const box = (x:number,y:number,w:number,h:number,fill='#222c43') => <rect x={x} y={y} width={w} height={h} rx="5" fill={fill} stroke="#3b4660"/>;
  const label = (x:number,y:number,value:string,size=9,color=white) => <text x={x} y={y} fill={color} fontSize={size} fontFamily="system-ui,sans-serif">{value}</text>;
  const lines = (x:number,y:number,w=100,count=3) => <g fill={soft}>{Array.from({length:count},(_,i)=><rect key={i} x={x} y={y+i*9} width={w*(i===count-1?.7:1)} height="3" rx="1.5" opacity={.7-i*.12}/>)}</g>;
  const image = <><path d="M20 81L57 42L89 70L115 49L161 81Z" fill="#5265a1"/><circle cx="130" cy="32" r="9" fill="#b9a8ff"/></>;
  const window = <>{box(12,13,156,82,'#121a2c')}<path d="M12 30H168" stroke="#3b4660"/><circle cx="22" cy="22" r="2" fill="#fb7185"/><circle cx="30" cy="22" r="2" fill="#fbbf24"/><circle cx="38" cy="22" r="2" fill="#4ade80"/></>;
  let content: ReactNode;
  switch(type) {
    case 'text': content=<>{label(18,34,'Una idea que contar',13)}{lines(18,47,142,5)}</>; break;
    case 'markdown': content=<>{label(18,30,'# Una idea',14,accent)}{label(18,49,'Texto con formato',10)}{lines(18,60,138,2)}{box(18,82,70,12)}{label(24,91,'</> código',7)}</>; break;
    case 'bullets': content=<>{[30,53,76].map((y,i)=><g key={y}><circle cx="24" cy={y} r="3" fill={accent}/>{label(36,y+3,['Primera idea','Segundo punto','Conclusión'][i],10)}{lines(36,y+10,104,1)}</g>)}</>; break;
    case 'cards': content=<>{[13,68,123].map((x,i)=><g key={x}>{box(x,23,45,65)}<rect x={x+8} y="32" width="12" height="12" rx="3" fill={accent}/>{label(x+8,60,`Idea ${i+1}`,8)}{lines(x+8,69,30,2)}</g>)}</>; break;
    case 'stats': content=<>{[16,71,126].map((x,i)=><g key={x}>{label(x,54,['98%','2.4k','+32'][i],19,accent)}{label(x,72,['Calidad','Usuarios','Mejora'][i],8)}</g>)}</>; break;
    case 'compare': content=<>{box(13,20,73,72)}{box(94,20,73,72)}{label(24,39,'Opción A',10,accent)}{label(105,39,'Opción B',10,'#67e8c5')}{lines(24,51,49,4)}{lines(105,51,49,4)}</>; break;
    case 'code': content=<>{window}{label(24,48,'def saludar():',10,accent)}{label(34,65,'print("Hola")',10,'#67e8c5')}{label(24,83,'saludar()',10)}</>; break;
    case 'terminal': content=<>{window}{label(23,48,'$ deploy app',10,'#67e8c5')}{label(23,65,'✓ Build completado',9)}{label(23,81,'› Listo para usar',9,soft)}</>; break;
    case 'image': content=<>{box(12,13,156,82)}{image}</>; break;
    case 'timeline': content=<><path d="M25 53H155" stroke={accent} strokeWidth="2"/>{[25,90,155].map((x,i)=><g key={x}><circle cx={x} cy="53" r="5" fill={accent}/>{label(x-12,34,`0${i+1}`,10)}{label(x-14,77,['Idea','Diseño','Entrega'][i],8)}</g>)}</>; break;
    case 'quote': content=<>{label(17,51,'“',42,accent)}{label(45,43,'Las ideas crecen',12)}{label(45,61,'al compartirlas.',12)}{label(45,83,'— Autor',8,soft)}</>; break;
    case 'callout': content=<>{box(13,29,154,54)}<rect x="13" y="29" width="4" height="54" rx="2" fill={accent}/>{label(25,50,'ⓘ Importante',11,accent)}{lines(25,62,126,2)}</>; break;
    case 'quadrant': content=<>{[16,94].flatMap((x,i)=>[15,58].map((y,j)=><g key={`${x}-${y}`}>{box(x,y,70,35,i===j?'#37305b':'#222c43')}{label(x+10,y+21,['Planificar','Priorizar','Delegar','Actuar'][i*2+j],8)}</g>))}</>; break;
    case 'columns': content=<>{label(17,32,'Título',12,accent)}{lines(17,45,64,5)}{box(98,23,65,62)}{lines(108,37,44,4)}</>; break;
    case 'tabs': content=<>{box(13,17,154,76)}{box(19,22,42,17,'#4c3d80')}{label(27,34,'Vista A',8)}{label(77,34,'Vista B',8,soft)}{label(126,34,'Vista C',8,soft)}{lines(24,52,126,4)}</>; break;
    case 'steps': content=<>{[28,89,150].map((x,i)=><g key={x}><circle cx={x} cy="29" r="10" fill={i===0?'#7560cc':'#293550'}/>{label(x-3,32,String(i+1),9)}</g>)}<path d="M40 29H77M101 29H138" stroke={soft}/>{box(17,50,146,41)}{label(28,67,'Primer paso',10,accent)}{lines(28,77,113,1)}</>; break;
    case 'accordion': content=<>{[17,66,84].map((y,i)=><g key={y}>{box(16,y,148,i===0?42:15)}{label(24,y+11,['Detalles','Recursos','Más información'][i],8)}{label(150,y+11,i===0?'−':'+',9)}{i===0&&lines(25,y+22,113,2)}</g>)}</>; break;
    case 'modal': content=<>{lines(15,20,145,8)}<rect width="180" height="108" fill="#090d18" opacity=".5"/>{box(39,25,103,63,'#303b56')}{label(50,42,'Más detalles',10)}{label(129,37,'×',10)}{lines(50,53,79,2)}{box(89,72,40,9,'#7560cc')}</>; break;
    case 'drawer': content=<>{lines(14,26,70,6)}{box(95,10,77,88,'#303b56')}{label(105,28,'Detalle',10)}{label(159,23,'×',10)}{lines(105,40,57,6)}</>; break;
    case 'architecture': content=<><path d="M53 54H75M111 54H134" stroke={accent} strokeWidth="2"/><path d="M70 50L75 54L70 58M129 50L134 54L129 58" fill="none" stroke={accent}/>{[10,74,134].map((x,i)=><g key={x}>{box(x,34,39,39)}{label(x+6,57,['Web','API','DB'][i],10,accent)}</g>)}</>; break;
    case 'tooltip': content=<>{label(25,77,'Una palabra con ayuda',11)}<path d="M70 53L80 63L90 53" fill="#4c3d80"/>{box(35,21,115,33,'#4c3d80')}{label(45,42,'Información extra',10)}</>; break;
    case 'flipcard': content=<>{box(17,22,61,66)}{label(29,58,'Frente',11,accent)}{box(102,22,61,66,'#37305b')}{label(112,58,'Dorso',11)}<path d="M80 40Q95 20 105 38M82 79Q96 94 108 78" fill="none" stroke={accent} strokeWidth="2"/></>; break;
    case 'beforeAfter': content=<>{box(13,15,154,78)}<path d="M20 80L59 43L90 80" fill="#52607b"/><path d="M90 80L121 36L163 80" fill="#9b87ed"/><path d="M90 15V93" stroke={white} strokeWidth="2"/><circle cx="90" cy="54" r="9" fill={white}/>{label(85,57,'↔',10,'#222c43')}{label(21,30,'Antes',8)}{label(127,30,'Después',8)}</>; break;
    case 'hotspots': content=<>{box(12,13,156,82)}{image}{[[55,54],[128,67]].map(([x,y],i)=><g key={x}><circle cx={x} cy={y} r="11" fill="#7560cc" stroke={white}/>{label(x-3,y+3,String(i+1),10)}</g>)}</>; break;
    case 'chart': content=<><path d="M22 21V87H160" fill="none" stroke={soft}/>{[34,67,100,133].map((x,i)=><rect key={x} x={x} y={[57,39,49,22][i]} width="20" height={[29,47,37,64][i]} rx="3" fill={i===3?accent:'#5969ad'}/>)}</>; break;
    case 'simulation': content=<>{label(18,26,'Simulación',11)}{box(18,37,144,39)}<path d="M28 66L53 56L81 62L105 46L150 42" fill="none" stroke={accent} strokeWidth="2"/><path d="M24 85L24 97L34 91Z" fill="#67e8c5"/><path d="M46 91H152" stroke={soft}/><circle cx="80" cy="91" r="4" fill={accent}/></>; break;
  }
  return <svg viewBox="0 0 180 108" className="block-preview" aria-hidden="true" focusable="false"><rect width="180" height="108" rx="7" fill="#151d30"/>{content}</svg>;
}

const normalize = (value:string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
export function BlockCatalog({ onInsert }: { onInsert: (type:SlideBlock['type']) => void }) {
  const [query,setQuery]=useState(''), [category,setCategory]=useState('');
  const matches=blockTypes.filter(type=>(!category || (categories[category as keyof typeof categories] as string[]).includes(type)) && normalize(`${blockLabels[type]} ${type}`).includes(normalize(query.trim())));
  return <section className="block-catalog" aria-label="Catálogo de bloques">
    <h3>Bloques</h3><p>Elegí una vista para agregarla a la diapositiva.</p>
    <label className="catalog-search">Buscar bloques<input type="search" placeholder="Código, tarjetas, arquitectura…" value={query} onChange={event=>setQuery(event.target.value)}/></label>
    <label className="catalog-category">Categoría<select value={category} onChange={event=>setCategory(event.target.value)}><option value="">Todos los bloques</option>{Object.keys(categories).map(name=><option key={name}>{name}</option>)}</select></label>
    <div className="block-catalog-grid">{matches.map(type=><button type="button" className="block-catalog-card" key={type} aria-label={`Insertar bloque ${blockLabels[type]}`} onClick={()=>onInsert(type)}><BlockPreview type={type}/><span>{blockLabels[type]}</span></button>)}</div>
    {!matches.length&&<p role="status">No hay bloques que coincidan con la búsqueda.</p>}
  </section>;
}
