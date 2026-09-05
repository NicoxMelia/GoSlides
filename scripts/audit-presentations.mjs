import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const exampleRoot = path.join(root,'examples');
let errors=[]; let warnings=[]; let slideCount=0; let elementCount=0; let blockCount=0;
const validAnimations=new Set(['none','fade','slide-up','slide-left','slide-right','zoom','bounce','blur','rotate','motion-path']);
const validTransitions=new Set(['none','fade','slide','zoom','wipe','flip','morph']);
const validBlockTypes=new Set(['text','markdown','bullets','cards','stats','compare','code','terminal','image','timeline','tabs','steps','architecture','quote','callout','quadrant','columns','tooltip','modal','accordion','drawer','flipcard','beforeAfter','hotspots','chart','simulation']);
const validDensities=new Set(['visual','balanced','detailed','documentary']);
const validDepths=new Set(['summary','class','workshop','reference']);
const validInteractions=new Set(['none','occasional','frequent']);
const validOverflowStrategies=new Set(['split','reveal','appendix','preserve']);

function problem(kind,file,msg){(kind==='error'?errors:warnings).push(`${path.relative(root,file)}: ${msg}`)}
function readJson(file){try{return JSON.parse(fs.readFileSync(file,'utf8'))}catch(err){problem('error',file,`JSON inválido: ${err.message}`);return null}}
function auditAuthoring(authoring,file){
  if(authoring==null)return;
  if(typeof authoring!=='object'||Array.isArray(authoring)){problem('error',file,'authoring debe ser un objeto');return}
  if(authoring.density!=null&&!validDensities.has(authoring.density))problem('error',file,`authoring.density inválido: ${authoring.density}`);
  if(authoring.depth!=null&&!validDepths.has(authoring.depth))problem('error',file,`authoring.depth inválido: ${authoring.depth}`);
  if(authoring.interaction!=null&&!validInteractions.has(authoring.interaction))problem('error',file,`authoring.interaction inválido: ${authoring.interaction}`);
  if(authoring.overflowStrategy!=null&&!validOverflowStrategies.has(authoring.overflowStrategy))problem('error',file,`authoring.overflowStrategy inválido: ${authoring.overflowStrategy}`);
  if(authoring.durationMinutes!=null&&(!Number.isInteger(authoring.durationMinutes)||authoring.durationMinutes<=0))problem('error',file,'authoring.durationMinutes debe ser un entero positivo');
  if(authoring.preserveSourceMaterial!=null&&typeof authoring.preserveSourceMaterial!=='boolean')problem('error',file,'authoring.preserveSourceMaterial debe ser booleano');
}
function auditCanvas(canvas,file,scope='slide'){
  if(!Array.isArray(canvas)) return;
  const ids=new Set();
  for(const el of canvas){ elementCount++;
    if(!el?.id){problem('error',file,`${scope}: elemento sin id`);continue}
    if(ids.has(el.id))problem('error',file,`${scope}: id duplicado ${el.id}`); ids.add(el.id);
    if(el.type!=='connector'){
      for(const key of ['x','y','w','h']) if(!Number.isFinite(el[key]))problem('error',file,`${el.id}: ${key} no numérico`);
      if(el.w<=0||el.h<=0)problem('error',file,`${el.id}: tamaño inválido ${el.w}×${el.h}`);
      if(el.x < -0.01 || el.y < -0.01 || el.x+el.w > 100.01 || el.y+el.h > 100.01) problem('warning',file,`${el.id}: fuera del canvas (${el.x},${el.y},${el.w},${el.h})`);
    }
    if(el.fragment!=null && (!Number.isInteger(el.fragment)||el.fragment<0))problem('error',file,`${el.id}: fragment inválido ${el.fragment}`);
    if(el.animation && !validAnimations.has(el.animation))problem('error',file,`${el.id}: animación desconocida ${el.animation}`);
    if(el.animationDuration!=null && el.animationDuration<=0)problem('error',file,`${el.id}: duración inválida`);
    if(el.type==='block')auditBlock(el.block,file,`${scope}.${el.id}.block`);
  }
  const nodeIds=new Set(canvas.filter(x=>x.type!=='connector').map(x=>x.id));
  for(const el of canvas){
    if(el.type==='connector'){
      if(!nodeIds.has(el.from))problem('error',file,`${el.id}: connector.from inexistente ${el.from}`);
      if(!nodeIds.has(el.to))problem('error',file,`${el.id}: connector.to inexistente ${el.to}`);
      if(el.from===el.to)problem('warning',file,`${el.id}: conector hacia sí mismo`);
    }
    if(el.triggerId && !nodeIds.has(el.triggerId))problem('error',file,`${el.id}: triggerId inexistente ${el.triggerId}`);
  }
}
function auditArchitecture(block,file,index){
  const ids=new Set();
  for(const n of block.nodes??[]){
    if(ids.has(n.id))problem('error',file,`architecture[${index}] node id duplicado ${n.id}`);ids.add(n.id);
    if(n.x<0||n.x>100||n.y<0||n.y>100)problem('warning',file,`architecture[${index}] ${n.id} fuera de rango (${n.x},${n.y})`);
  }
  for(const e of block.edges??[]){if(!ids.has(e.from)||!ids.has(e.to))problem('error',file,`architecture[${index}] edge inválido ${e.from}->${e.to}`)}
}
function nestedBlockGroups(block){
  if(block.type==='architecture')return (block.nodes??[]).map((node,index)=>({label:`nodes[${index}]`,blocks:node.blocks??[]}));
  if(block.type==='columns')return (block.items??[]).map((item,index)=>({label:`columnas[${index}]`,blocks:item.blocks??[]}));
  if(block.type==='tabs')return (block.tabs??[]).map((item,index)=>({label:`tabs[${index}]`,blocks:item.blocks??[]}));
  if(block.type==='steps'||block.type==='accordion')return (block.items??[]).map((item,index)=>({label:`${block.type}[${index}]`,blocks:item.blocks??[]}));
  if(block.type==='hotspots')return (block.points??[]).map((item,index)=>({label:`hotspots[${index}]`,blocks:item.blocks??[]}));
  if(block.type==='modal'||block.type==='drawer')return [{label:block.type,blocks:block.blocks??[]}];
  return [];
}
function auditBlock(block,file,label,depth=0){
  blockCount++;
  if(!block?.type){problem('error',file,`${label}: bloque sin type`);return}
  if(!validBlockTypes.has(block.type))problem('error',file,`${label}: tipo de bloque desconocido ${block.type}`);
  if(block.fragment!=null && (!Number.isInteger(block.fragment)||block.fragment<0))problem('error',file,`${label}: fragment inválido`);
  if(block.animation && !validAnimations.has(block.animation))problem('error',file,`${label}: animación desconocida ${block.animation}`);
  if(block.type==='architecture')auditArchitecture(block,file,label);
  if(block.type==='chart' && (block.labels?.length??0)!==(block.values?.length??0))problem('error',file,`${label}: labels (${block.labels?.length}) y values (${block.values?.length}) no coinciden`);
  if(depth>=8 && nestedBlockGroups(block).some(group=>group.blocks.length)){problem('warning',file,`${label}: profundidad de bloques mayor a 8`);return}
  for(const group of nestedBlockGroups(block))group.blocks.forEach((inner,index)=>auditBlock(inner,file,`${label}.${group.label}[${index}]`,depth+1));
}
function auditSlide(slide,file,manifest){
  slideCount++;
  if(!slide?.id)problem('error',file,'slide sin id');
  if(slide.transition && !validTransitions.has(slide.transition))problem('error',file,`transición desconocida ${slide.transition}`);
  const blocks=slide.blocks??[];
  blocks.forEach((block,index)=>auditBlock(block,file,`bloque[${index}]`));
  auditCanvas(slide.canvas??[],file,'slide');
  if(slide.masterId && !(manifest.masters??[]).some(m=>m.id===slide.masterId))problem('error',file,`masterId inexistente ${slide.masterId}`);
  if(slide.sectionId && !(manifest.sections??[]).some(s=>s.id===slide.sectionId))problem('warning',file,`sectionId inexistente ${slide.sectionId}`);
  if(!['free','center','title'].includes(slide.layout) && (slide.title?.length??0)>55)problem('warning',file,`título largo (${slide.title.length} caracteres): revisar wrap visual`);
}

if(!fs.existsSync(exampleRoot)){console.error('No existe examples/');process.exit(2)}
for(const name of fs.readdirSync(exampleRoot)){
  const dir=path.join(exampleRoot,name); if(!fs.statSync(dir).isDirectory())continue;
  const mf=path.join(dir,'presentation.json'); if(!fs.existsSync(mf))continue;
  const manifest=readJson(mf); if(!manifest)continue;
  if(manifest.format!=='goslides')problem('error',mf,`format inesperado ${manifest.format}`);
  if(!Array.isArray(manifest.slides)||!manifest.slides.length)problem('error',mf,'sin slides');
  auditAuthoring(manifest.authoring,mf);
  const slideIds=new Set();
  for(const rel of manifest.slides??[]){const sf=path.join(dir,rel);if(!fs.existsSync(sf)){problem('error',mf,`slide no existe: ${rel}`);continue;}const s=readJson(sf);if(!s)continue;if(slideIds.has(s.id))problem('error',sf,`slide id duplicado ${s.id}`);slideIds.add(s.id);auditSlide(s,sf,manifest)}
  for(const master of manifest.masters??[])auditCanvas(master.canvas??[],mf,`master ${master.id}`);
}

console.log(`Audit GoSlides: ${slideCount} slides · ${blockCount} bloques · ${elementCount} elementos`);
if(warnings.length){console.log(`\nWarnings (${warnings.length}):`);for(const w of warnings)console.log(`  - ${w}`)}
if(errors.length){console.error(`\nErrores (${errors.length}):`);for(const e of errors)console.error(`  - ${e}`);process.exit(1)}
console.log('\n✓ Integridad estructural OK');
