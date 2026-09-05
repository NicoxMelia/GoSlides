import type { AuthoringPreferences, CanvasElement, ContentDensity, Slide, SlideBlock } from '../types';

export interface RenderedOverflow {
  vertical: boolean;
  horizontal: boolean;
  clippedRegions: number;
}

export interface SlideContentAnalysis {
  status: 'ok' | 'warning' | 'overflow';
  score: number;
  metrics: {
    surfaceCharacters: number;
    totalCharacters: number;
    blocks: number;
    interactiveBlocks: number;
    canvasElements: number;
    clippedRegions: number;
  };
  issues: string[];
  recommendations: string[];
}

const densityLimits: Record<ContentDensity, { characters: number; blocks: number; canvas: number }> = {
  visual: { characters: 420, blocks: 4, canvas: 8 },
  balanced: { characters: 800, blocks: 7, canvas: 14 },
  detailed: { characters: 1350, blocks: 11, canvas: 20 },
  documentary: { characters: 2200, blocks: 16, canvas: 28 },
};

const interactiveTypes = new Set<SlideBlock['type']>(['architecture','tabs','steps','accordion','modal','drawer','tooltip','flipcard','beforeAfter','hotspots','simulation']);
const ignoredStringKeys = new Set(['type','id','src','from','to','icon','tone','appearance','language','frameStyle','codeTheme','chart','animation','animationEasing','side','width','fit','detailView','kind']);

function meaningfulCharacters(value: unknown, key = ''): number {
  if (typeof value === 'string') return ignoredStringKeys.has(key) ? 0 : value.trim().length;
  if (Array.isArray(value)) return value.reduce((sum, item) => sum + meaningfulCharacters(item), 0);
  if (!value || typeof value !== 'object') return 0;
  return Object.entries(value as Record<string, unknown>).reduce((sum, [nextKey, item]) => sum + meaningfulCharacters(item, nextKey), 0);
}

function nestedBlocks(block: SlideBlock): SlideBlock[][] {
  if (block.type === 'architecture') return block.nodes.map(node => node.blocks ?? []);
  if (block.type === 'columns') return block.items.map((item) => item.blocks);
  if (block.type === 'tabs') return block.tabs.map((item) => item.blocks ?? []);
  if (block.type === 'steps' || block.type === 'accordion') return block.items.map((item) => item.blocks ?? []);
  if (block.type === 'hotspots') return block.points.map((point) => point.blocks ?? []);
  if (block.type === 'modal' || block.type === 'drawer') return [block.blocks ?? []];
  return [];
}

function countBlocks(blocks: SlideBlock[]): number {
  return blocks.reduce((sum, block) => sum + 1 + nestedBlocks(block).reduce((inner, group) => inner + countBlocks(group), 0), 0);
}

function countInteractive(blocks: SlideBlock[]): number {
  return blocks.reduce((sum, block) => sum + (interactiveTypes.has(block.type) ? 1 : 0) + nestedBlocks(block).reduce((inner, group) => inner + countInteractive(group), 0), 0);
}

function surfaceCharacters(block: SlideBlock): number {
  if (block.type === 'architecture') return block.nodes.reduce((sum, node) => sum + meaningfulCharacters(node.label) + meaningfulCharacters(node.caption), 0) + meaningfulCharacters(block.edges);
  if (block.type === 'drawer' || block.type === 'modal') return meaningfulCharacters(block.buttonLabel);
  if (block.type === 'tooltip') return meaningfulCharacters(block.label);
  if (block.type === 'flipcard') return meaningfulCharacters(block.frontTitle) + meaningfulCharacters(block.frontText);
  if (block.type === 'hotspots') return meaningfulCharacters(block.alt) + block.points.reduce((sum, point) => sum + meaningfulCharacters(point.label), 0);
  if (block.type === 'tabs') {
    const first=block.tabs[0];
    return meaningfulCharacters(block.tabs.map((tab)=>tab.label)) + (first ? meaningfulCharacters(first.title) + meaningfulCharacters(first.text) + (first.blocks??[]).reduce((sum,item)=>sum+surfaceCharacters(item),0) : 0);
  }
  if (block.type === 'steps') {
    const first=block.items[0];
    return meaningfulCharacters(block.title) + meaningfulCharacters(block.items.map((item)=>item.title)) + (first ? meaningfulCharacters(first.text) + (first.blocks??[]).reduce((sum,item)=>sum+surfaceCharacters(item),0) : 0);
  }
  if (block.type === 'accordion') {
    const first=block.items[0];
    return meaningfulCharacters(block.title) + meaningfulCharacters(block.items.map((item)=>item.title)) + (first ? meaningfulCharacters(first.text) + (first.blocks??[]).reduce((sum,item)=>sum+surfaceCharacters(item),0) : 0);
  }
  return meaningfulCharacters(block);
}

function canvasCharacters(element: CanvasElement): number {
  if (element.hidden || element.type === 'connector') return 0;
  if (element.type === 'text') return meaningfulCharacters(element.text);
  if (element.type === 'shape') return meaningfulCharacters(element.text);
  if (element.type === 'code') return meaningfulCharacters(element.title) + meaningfulCharacters(element.code);
  if (element.type === 'table') return meaningfulCharacters(element.rows);
  if (element.type === 'icon') return meaningfulCharacters(element.label);
  if (element.type === 'block') return surfaceCharacters(element.block);
  return 0;
}

export function analyzeSlideContent(slide: Slide, preferences: AuthoringPreferences = {}, rendered: RenderedOverflow = { vertical:false, horizontal:false, clippedRegions:0 }): SlideContentAnalysis {
  const density=preferences.density??'balanced';
  const overflowStrategy=preferences.overflowStrategy??'reveal';
  const limits=densityLimits[density];
  const blocks=slide.blocks??[];
  const canvas=(slide.canvas??[]).filter((element)=>!element.hidden&&element.type!=='connector');
  const headingCharacters=meaningfulCharacters(slide.eyebrow)+meaningfulCharacters(slide.title)+meaningfulCharacters(slide.subtitle)+meaningfulCharacters(slide.footer);
  const visibleBlockCharacters=blocks.reduce((sum,block)=>sum+surfaceCharacters(block),0);
  const surface=headingCharacters+visibleBlockCharacters+canvas.reduce((sum,element)=>sum+canvasCharacters(element),0);
  const total=headingCharacters+meaningfulCharacters(blocks)+canvas.reduce((sum,element)=>sum+canvasCharacters(element),0);
  const blockCount=countBlocks(blocks)+canvas.reduce((sum,element)=>sum+(element.type==='block'?countBlocks([element.block]):0),0);
  const interactive=countInteractive(blocks)+canvas.reduce((sum,element)=>sum+(element.type==='block'?countInteractive([element.block]):0),0);
  const outOfBounds=canvas.filter((element)=>element.x<0||element.y<0||element.x+element.w>100||element.y+element.h>100).length;
  const issues:string[]=[];
  const recommendations:string[]=[];

  if(rendered.clippedRegions>0)issues.push(`${rendered.clippedRegions} región${rendered.clippedRegions===1?'':'es'} presenta${rendered.clippedRegions===1?'':'n'} contenido recortado en el render actual.`);
  if(surface>limits.characters)issues.push(`La superficie contiene ${surface} caracteres; el perfil ${density} recomienda hasta ${limits.characters}.`);
  if(blockCount>limits.blocks)issues.push(`Hay ${blockCount} bloques para un objetivo de ${limits.blocks} en este perfil.`);
  if(canvas.length>limits.canvas)issues.push(`El canvas contiene ${canvas.length} elementos visibles; el objetivo es ${limits.canvas}.`);
  if(outOfBounds)issues.push(`${outOfBounds} elemento${outOfBounds===1?'':'s'} queda${outOfBounds===1?'':'n'} fuera del canvas.`);
  if(interactive>6)issues.push(`Hay ${interactive} controles interactivos; conviene evitar más de seis por slide.`);
  const interactionOpportunity=preferences.interaction==='frequent'&&interactive===0&&(blockCount>=3||surface>limits.characters*.65);

  if(rendered.clippedRegions>0||surface>limits.characters){
    if(overflowStrategy==='split')recommendations.push('Dividí la slide conservando la secuencia narrativa y el material fuente.');
    else if(overflowStrategy==='appendix')recommendations.push('Mové evidencia y detalle secundario a un apéndice enlazado desde esta slide.');
    else if(overflowStrategy==='preserve')recommendations.push('Conservá todo el material y distribuílo entre más slides y capas progresivas.');
    else recommendations.push('Mové evidencia o implementación a un acordeón o panel de detalle.');
  }
  if(blockCount>limits.blocks)recommendations.push('Dividí la slide en dos y conservá una sola idea principal por superficie.');
  if(outOfBounds)recommendations.push('Reencuadrá los elementos fuera del canvas o aplicá Smart Layout.');
  if(interactionOpportunity)recommendations.push('El perfil frecuente permite convertir alternativas en tabs, procesos en steps o explicaciones en accordion.');
  if(!issues.length)recommendations.push('La slide entra dentro del perfil elegido y no presenta recortes detectables.');

  const ratios=[surface/limits.characters,blockCount/limits.blocks,canvas.length/limits.canvas,rendered.clippedRegions?1.5:0];
  const score=Math.max(0,Math.round(Math.max(...ratios)*100));
  const status=rendered.clippedRegions>0?'overflow':issues.length?'warning':'ok';
  return {status,score,metrics:{surfaceCharacters:surface,totalCharacters:total,blocks:blockCount,interactiveBlocks:interactive,canvasElements:canvas.length,clippedRegions:rendered.clippedRegions},issues,recommendations};
}
