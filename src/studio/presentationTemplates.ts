import type { PresentationDocument, Slide, ThemeConfig } from '../types';
import { createInternalId, createPublicId } from '../lib/ids';
import { createSlide, type SlideTemplate } from './templates';

export type PresentationTemplateCategory = 'Educación' | 'Negocios' | 'Informes' | 'Creatividad' | 'Tecnología';

export interface PresentationTemplateDefinition {
  id: string;
  name: string;
  description: string;
  category: PresentationTemplateCategory;
  badge: string;
  slideCount: number;
  theme: ThemeConfig;
  previewSlide: Slide;
}

interface InternalTemplate extends Omit<PresentationTemplateDefinition, 'previewSlide'> {
  createSlides: () => Slide[];
}

const make = (template: SlideTemplate, patch: Partial<Slide>): Slide => ({ ...createSlide(template), ...patch });

const midnight: ThemeConfig = {
  mode: 'dark', accent: '#8b6cff', fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
  headingFontFamily: 'Manrope, ui-sans-serif, sans-serif', slideBackground: '#101522', surfaceColor: '#1a2030',
  textColor: '#f7f8fc', mutedColor: '#aeb6cb', radius: 20,
};

const catalog: InternalTemplate[] = [
  {
    id: 'clase-moderna', name: 'Clase moderna', category: 'Educación', badge: 'MÁS ELEGIDA', slideCount: 7,
    description: 'Una clase clara y dinámica, lista para explicar conceptos, ejemplos y conclusiones.',
    theme: { ...midnight, accent: '#7c5cff' },
    createSlides: () => [
      make('title', { eyebrow: 'CLASE · UNIDAD 01', title: 'El tema de tu próxima clase', subtitle: 'Una introducción breve que despierte curiosidad y anticipe el recorrido.' }),
      make('section', { eyebrow: '01 · PUNTO DE PARTIDA', title: 'Empecemos por una pregunta', subtitle: '¿Qué sabemos hasta ahora y qué vamos a descubrir?' }),
      make('bullets', { eyebrow: 'OBJETIVOS', title: 'Al terminar esta clase vas a poder…', blocks: [{ type: 'bullets', items: ['Comprender el concepto principal', 'Reconocerlo en ejemplos concretos', 'Aplicarlo en una actividad breve'] }] }),
      make('cards', { eyebrow: 'CONCEPTO CENTRAL', title: 'Tres ideas para construir el tema', blocks: [{ type: 'cards', columns: 3, items: [{ title: 'Idea clave', text: 'Definí el concepto con palabras simples.', icon: 'sparkles' }, { title: 'Ejemplo', text: 'Conectalo con una situación cotidiana.', icon: 'layers' }, { title: 'Aplicación', text: 'Mostrá para qué sirve y cómo se usa.', icon: 'zap' }] }] }),
      make('interactive', { eyebrow: 'ACTIVIDAD', title: 'Pausa para pensar', blocks: [{ type: 'flipcard', frontTitle: '¿Qué pasaría si…?', frontText: 'Pensá una respuesta y luego girá la tarjeta.', backTitle: 'Una posible respuesta', backText: 'Usá este espacio para explicar la idea y abrir la conversación.' }] }),
      make('quote', { eyebrow: 'PARA RECORDAR', title: 'La idea que no puede faltar', blocks: [{ type: 'quote', text: 'Escribí acá la síntesis más importante de la clase.', author: 'Concepto central' }] }),
      make('closing', { eyebrow: 'CIERRE DE CLASE', title: '¿Con qué idea te quedás?', subtitle: 'Preguntas · síntesis · próximo encuentro' }),
    ],
  },
  {
    id: 'pitch-startup', name: 'Pitch de proyecto', category: 'Negocios', badge: '7 SLIDES', slideCount: 7,
    description: 'Contá el problema, tu propuesta y la oportunidad con una narrativa breve y convincente.',
    theme: { ...midnight, accent: '#31d6c8', slideBackground: '#07191d', surfaceColor: '#10282d', mutedColor: '#94bec1' },
    createSlides: () => [
      make('title', { eyebrow: 'PITCH · 2026', title: 'Una idea que cambia la forma de hacer las cosas', subtitle: 'Nombre del proyecto · Una frase para explicar por qué importa' }),
      make('cards', { eyebrow: 'EL PROBLEMA', title: 'Hoy, las personas se enfrentan a…', blocks: [{ type: 'cards', columns: 3, items: [{ title: 'Fricción', text: 'El proceso actual consume demasiado tiempo.', icon: 'zap' }, { title: 'Costo', text: 'Las alternativas son caras o difíciles de adoptar.', icon: 'layers' }, { title: 'Oportunidad', text: 'Hay una necesidad clara todavía sin resolver.', icon: 'sparkles' }] }] }),
      make('text', { eyebrow: 'LA PROPUESTA', title: 'Una solución simple para un problema real', blocks: [{ type: 'text', text: 'Explicá en una frase qué hacés, para quién y cuál es el beneficio principal.', lead: true }] }),
      make('chart', { eyebrow: 'TRACCIÓN', title: 'Las señales que validan la oportunidad', blocks: [{ type: 'chart', chart: 'bar', title: 'Crecimiento mensual', labels: ['Ene', 'Feb', 'Mar', 'Abr'], values: [24, 43, 67, 89], suffix: '%', showValues: true }] }),
      make('compare', { eyebrow: 'DIFERENCIAL', title: 'Por qué nuestra propuesta gana', blocks: [{ type: 'compare', left: { label: 'HOY', title: 'Alternativas actuales', items: ['Procesos fragmentados', 'Mucho trabajo manual', 'Resultados difíciles de medir'] }, right: { label: 'CON NOSOTROS', title: 'Nueva experiencia', items: ['Todo en un mismo lugar', 'Automatización inteligente', 'Impacto visible desde el día uno'], highlight: true } }] }),
      make('process', { title: 'Un plan claro para los próximos meses' }),
      make('closing', { eyebrow: 'LA OPORTUNIDAD', title: 'Construyamos esto juntos', subtitle: 'Próximo paso · contacto@proyecto.com' }),
    ],
  },
  {
    id: 'informe-ejecutivo', name: 'Informe ejecutivo', category: 'Informes', badge: 'DATOS', slideCount: 6,
    description: 'Resultados, hallazgos y próximos pasos en un formato sobrio pensado para decidir.',
    theme: { mode: 'light', accent: '#1769d2', fontFamily: '"DM Sans", ui-sans-serif, sans-serif', headingFontFamily: '"DM Sans", ui-sans-serif, sans-serif', slideBackground: '#f7f9fc', surfaceColor: '#ffffff', textColor: '#142236', mutedColor: '#66758b', radius: 12, tokens: { cardRadius: 12, shadowStrength: .55, borderColor: 'rgba(20,34,54,.12)' } },
    createSlides: () => [
      make('title', { eyebrow: 'INFORME · Q3 2026', title: 'Resultados y decisiones del trimestre', subtitle: 'Equipo / organización · Septiembre 2026' }),
      make('text', { eyebrow: 'PANORAMA', title: 'Los indicadores que resumen el trimestre', blocks: [{ type: 'stats', items: [{ value: '84%', label: 'Objetivo alcanzado', hint: '+12 pts vs. Q2' }, { value: '+23%', label: 'Crecimiento', hint: 'Sobre el período anterior' }, { value: '1,8x', label: 'Eficiencia', hint: 'Retorno por recurso' }] }] }),
      make('chart', { eyebrow: 'EVOLUCIÓN', title: 'La tendencia detrás de los resultados', blocks: [{ type: 'chart', chart: 'area', title: 'Índice de desempeño', labels: ['Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep'], values: [42, 48, 55, 68, 73, 84], suffix: '%', showValues: true }] }),
      make('compare', { eyebrow: 'LECTURA', title: 'Planificado vs. observado', blocks: [{ type: 'compare', left: { label: 'PLAN', title: 'Lo que esperábamos', items: ['Crecimiento sostenido', 'Adopción gradual', 'Eficiencia operativa'] }, right: { label: 'RESULTADO', title: 'Lo que ocurrió', items: ['Meta superada', 'Adopción acelerada', 'Menor costo por operación'], highlight: true } }] }),
      make('steps', { eyebrow: 'PRÓXIMOS PASOS', title: 'Tres decisiones para el próximo trimestre', blocks: [{ type: 'steps', items: [{ title: 'Consolidar', text: 'Escalar lo que ya demuestra resultados.' }, { title: 'Corregir', text: 'Atender los dos desvíos prioritarios.' }, { title: 'Medir', text: 'Acordar responsables e indicadores.' }] }] }),
      make('closing', { eyebrow: 'CIERRE', title: 'Decisiones y preguntas', subtitle: 'Resumen ejecutivo · próximos pasos' }),
    ],
  },
  {
    id: 'portfolio-creativo', name: 'Portfolio creativo', category: 'Creatividad', badge: 'VISUAL', slideCount: 6,
    description: 'Un recorrido editorial para presentar tu trabajo, enfoque y proceso con personalidad.',
    theme: { mode: 'light', accent: '#e24472', fontFamily: 'Lora, Georgia, serif', headingFontFamily: '"Playfair Display", Georgia, serif', slideBackground: '#fff8f5', surfaceColor: '#ffffff', textColor: '#2b1820', mutedColor: '#8b6572', radius: 26, tokens: { cardRadius: 26, shadowStrength: .5, borderColor: 'rgba(226,68,114,.16)' } },
    createSlides: () => [
      make('title', { eyebrow: 'PORTFOLIO · SELECCIÓN 2026', title: 'Ideas que toman forma', subtitle: 'Nombre Apellido · Dirección creativa / Diseño / Fotografía' }),
      make('text', { eyebrow: 'SOBRE MÍ', title: 'Diseño para que las ideas se sientan', blocks: [{ type: 'text', text: 'Contá brevemente cuál es tu mirada, qué problemas te interesa resolver y qué hace distinto a tu trabajo.', lead: true }] }),
      make('cards', { eyebrow: 'PROYECTOS SELECCIONADOS', title: 'Una muestra de mi trabajo reciente', blocks: [{ type: 'cards', columns: 3, items: [{ title: 'Proyecto Uno', text: 'Identidad · Estrategia', badge: '01' }, { title: 'Proyecto Dos', text: 'Producto · Experiencia', badge: '02' }, { title: 'Proyecto Tres', text: 'Campaña · Dirección', badge: '03' }] }] }),
      make('steps', { eyebrow: 'PROCESO', title: 'De la primera pregunta al resultado final', blocks: [{ type: 'steps', items: [{ title: 'Explorar', text: 'Entender la oportunidad y su contexto.' }, { title: 'Dar forma', text: 'Probar direcciones y construir el sistema.' }, { title: 'Entregar', text: 'Refinar cada detalle y medir el resultado.' }] }] }),
      make('quote', { eyebrow: 'ENFOQUE', title: 'Una forma de trabajar', blocks: [{ type: 'quote', text: 'Las mejores soluciones aparecen cuando estrategia, oficio y curiosidad trabajan juntas.', author: 'Tu manifiesto creativo' }] }),
      make('closing', { eyebrow: 'HABLEMOS', title: '¿Creamos algo juntos?', subtitle: 'hola@portfolio.com · @tuusuario' }),
    ],
  },
  {
    id: 'propuesta-tech', name: 'Propuesta técnica', category: 'Tecnología', badge: 'TECH', slideCount: 7,
    description: 'Arquitectura, código y plan de implementación para explicar una solución técnica sin ruido.',
    theme: { ...midnight, accent: '#4ade80', fontFamily: '"JetBrains Mono", monospace', headingFontFamily: '"Space Grotesk", ui-sans-serif, sans-serif', slideBackground: '#07110b', surfaceColor: '#0f1d14', mutedColor: '#82a58d', radius: 10, tokens: { cardRadius: 10, shadowStrength: .7, borderColor: 'rgba(74,222,128,.22)' } },
    createSlides: () => [
      make('title', { eyebrow: 'TECH PROPOSAL · V1.0', title: 'Una arquitectura preparada para crecer', subtitle: 'Equipo de plataforma · Revisión técnica' }),
      make('text', { eyebrow: 'CONTEXTO', title: 'Qué necesitamos resolver', blocks: [{ type: 'text', text: 'Resumí el escenario actual, la restricción principal y el resultado técnico que se busca.', lead: true }] }),
      make('architecture', { title: 'Arquitectura propuesta' }),
      make('code', { eyebrow: 'IMPLEMENTACIÓN', title: 'La interfaz principal', blocks: [{ type: 'code', language: 'typescript', title: 'service.ts', code: 'export async function execute(input: Request) {\n  const result = await pipeline.run(input);\n  return { ok: true, result };\n}', frameStyle: 'carbon', codeTheme: 'one-dark', showLineNumbers: true, showWindowControls: true }] }),
      make('process', { title: 'Implementación incremental y observable' }),
      make('compare', { eyebrow: 'TRADE-OFFS', title: 'La decisión técnica', blocks: [{ type: 'compare', left: { label: 'ALTERNATIVA A', title: 'Mantener el enfoque actual', items: ['Menor cambio inicial', 'Escalado manual', 'Mayor costo operativo'] }, right: { label: 'RECOMENDADA', title: 'Arquitectura propuesta', items: ['Adopción gradual', 'Escalado automático', 'Observabilidad integrada'], highlight: true } }] }),
      make('closing', { eyebrow: 'NEXT()', title: 'Acordemos el primer incremento', subtitle: 'Decisiones abiertas · responsables · fecha de inicio' }),
    ],
  },
  {
    id: 'workshop-sketch', name: 'Workshop colaborativo', category: 'Educación', badge: 'SKETCH', slideCount: 6,
    description: 'Una plantilla estilo pizarrón para facilitar talleres, dinámicas y conversaciones de equipo.',
    theme: { mode: 'light', visualStyle: 'sketch', iconLibrary: 'phosphor', accent: '#6657cc', fontFamily: '"Virgil 3 YOFF", "Patrick Hand", cursive', headingFontFamily: '"Virgil 3 YOFF", Caveat, cursive', slideBackground: '#fffdf6', surfaceColor: '#fff9e9', textColor: '#282a32', mutedColor: '#696b74', radius: 10, tokens: { borderColor: 'rgba(102,87,204,.25)' } },
    createSlides: () => [
      make('title', { eyebrow: 'WORKSHOP · 90 MIN', title: 'Diseñemos respuestas juntos', subtitle: 'Un espacio para explorar, priorizar y decidir.' }),
      make('section', { eyebrow: 'PRIMER MOMENTO', title: 'Abrimos el mapa', subtitle: 'Acordemos el desafío antes de saltar a las soluciones.', background: 'linear-gradient(135deg,#fff7df,#fffdf6)' }),
      make('bullets', { eyebrow: 'REGLAS DEL JUEGO', title: 'Cómo vamos a trabajar', blocks: [{ type: 'bullets', items: ['Una conversación a la vez', 'Primero cantidad, después calidad', 'Construimos sobre las ideas de otros'] }] }),
      make('cards', { eyebrow: 'DINÁMICA', title: 'Observar · imaginar · elegir', blocks: [{ type: 'cards', columns: 3, items: [{ title: 'Observar', text: '¿Qué está pasando hoy?', icon: 'sparkles' }, { title: 'Imaginar', text: '¿Qué podría ser diferente?', icon: 'layers' }, { title: 'Elegir', text: '¿Qué probamos primero?', icon: 'zap' }] }] }),
      make('steps', { eyebrow: 'PLAN DE ACCIÓN', title: 'De la conversación al próximo paso', blocks: [{ type: 'steps', items: [{ title: 'Prioridad', text: 'Elegimos una oportunidad.' }, { title: 'Experimento', text: 'Definimos una prueba pequeña.' }, { title: 'Compromiso', text: 'Acordamos quién y cuándo.' }] }] }),
      make('closing', { eyebrow: 'CHECK-OUT', title: 'Una idea. Un compromiso.', subtitle: '¿Qué te llevás del workshop?' }),
    ],
  },
];

export const presentationTemplates: PresentationTemplateDefinition[] = catalog.map((template) => ({
  id: template.id,
  name: template.name,
  description: template.description,
  category: template.category,
  badge: template.badge,
  slideCount: template.slideCount,
  theme: template.theme,
  previewSlide: template.createSlides()[0],
}));

export function createPresentationFromTemplate(templateId: string): PresentationDocument {
  const template = catalog.find((item) => item.id === templateId);
  if (!template) throw new Error('La plantilla seleccionada no existe.');
  const id = createInternalId('presentation');
  const slides = template.createSlides();
  return {
    manifest: {
      format: 'goslides', version: 2, id, publicId: createPublicId(), title: template.name,
      subtitle: template.description, description: '', tags: [template.category.toLowerCase(), 'plantilla'],
      theme: { ...template.theme, tokens: template.theme.tokens ? { ...template.theme.tokens } : undefined },
      masters: [], slides: slides.map((_, index) => `slides/${String(index + 1).padStart(2, '0')}.json`),
    },
    slides,
    assetFiles: {},
    updatedAt: new Date().toISOString(),
  };
}
