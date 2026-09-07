import type { CanvasElement, Slide, SlideBlock, SlideMaster, ThemeConfig } from '../types';
import { createInternalId } from '../lib/ids';
import fcefynLogo from '../assets/templates/facultad/logo_fcefyn.png?inline';
import uncLogo from '../assets/templates/facultad/logo_unc.png?inline';

export const facultyAssets: Record<string, string> = {
  'assets/logo_fcefyn.png': fcefynLogo,
  'assets/logo_unc.png': uncLogo,
};
export const facultyTheme: ThemeConfig = {
  mode: 'light', visualStyle: 'modern', accent: '#1c4439',
  fontFamily: 'Inter, Arial, sans-serif', headingFontFamily: 'Inter, Arial, sans-serif',
  slideBackground: '#ffffff', surfaceColor: '#f2f6f5', textColor: '#15344b', mutedColor: '#596a74',
  radius: 12, tokens: { spacing: 16, cardRadius: 12, shadowStrength: 0, borderColor: '#dce5e2' },
};
const masterId = 'master-facultad-unc-fcefyn';
const navy = '#103b59', green = '#1c4439', orange = '#cf8326', muted = '#596a74';
const text = (name:string, value:string, x:number,y:number,w:number,h:number,size=18,color=navy,weight=400): CanvasElement => ({
  id:createInternalId('text'),type:'text',layerName:name,text:value,x,y,w,h,
  style:{fontSize:size,fontWeight:weight,color,lineHeight:1.25},
});
const shape = (name:string,x:number,y:number,w:number,h:number,background:string): CanvasElement => ({
  id:createInternalId('shape'),type:'shape',shape:'rectangle',layerName:name,x,y,w,h,
  style:{background,borderWidth:0,borderRadius:0},
});
const block = (name:string,value:SlideBlock,x=6,y=43,w=88,h=40): CanvasElement => ({
  id:createInternalId('block'),type:'block',layerName:name,block:value,x,y,w,h,fit:'stretch',
  style:{fontSize:value.type==='code'?75:60},
});
const rule = (name:string,x:number,y:number,w:number,color:string,thickness=1):CanvasElement => ({
  id:createInternalId('line'),type:'freehand',layerName:name,x,y,w,h:.5,
  points:[{x:0,y:50},{x:100,y:50}],stroke:color,strokeWidth:thickness,
});

export function createFacultyMasters(): SlideMaster[] {
  return [{id:masterId,name:'UNC · FCEFyN — identidad clara',background:'#ffffff',canvas:[
    {...shape('Fondo blanco',0,0,100,100,'#ffffff'),locked:true,zIndex:0},
    {id:createInternalId('image'),type:'image',layerName:'Logo UNC',src:'assets/logo_unc.png',alt:'Universidad Nacional de Córdoba',x:6,y:6,w:11,h:11,fit:'contain'},
    // El recuadro recorta únicamente el margen blanco del PNG; se conserva el archivo original.
    {id:createInternalId('image'),type:'image',layerName:'Logo FCEFyN',src:'assets/logo_fcefyn.png',alt:'Facultad de Ciencias Exactas, Físicas y Naturales',x:70,y:8,w:24,h:8,fit:'cover'},
    rule('Línea del encabezado',6,21,88,'#dce5e2'),
    rule('Acento institucional',6,21,7,orange,3),
    rule('Línea del pie',6,91,88,'#dce5e2'),
    text('Datos de la cátedra','CÁTEDRA · CARRERA · AÑO',6,93, 60,3,9,muted,500),
    text('Institución','UNC · FCEFyN',79,93,15,3,9,green,600),
  ]}];
}
const slide = (title:string,canvas:CanvasElement[],notes:string[]=[]):Slide => ({
  id:createInternalId('slide'),title,layout:'free',masterId,background:'#ffffff',transition:'fade',blocks:[],canvas,notes,
});
const heading = (section:string,title:string):CanvasElement[] => [
  text('Sección',section.toUpperCase(),6,27, 80,4,11,green,600),
  text('Título',title,6,33,88,8,31,navy,700),
];

export function createFacultySlides(): Slide[] {
  return [
    slide('Título de la clase',[
      text('Tipo de presentación','CLASE · UNIDAD 01',6,30,82,5,12,green,600),
      text('Título de portada','Título de la clase\no presentación',6,40, 80,20,44,navy,700),
      text('Subtítulo','Una pregunta, un problema o una idea para comenzar.',6,65,86,6,17,muted),
      text('Docente y asignatura','Nombre del docente · Asignatura\nCarrera · Fecha',6,77,80,9,13,green),
    ],['Reemplazá los textos de ejemplo. Los logos y el pie se editan desde el master compartido.']),
    slide('Objetivos de aprendizaje',[
      ...heading('El recorrido','¿Qué vamos a aprender?'),
      ...[['01','Comprender','Presentá el concepto central\ny su importancia.'],['02','Relacionar','Conectá la teoría con\nun caso concreto.'],['03','Aplicar','Resolvé una actividad\ny explicá tu decisión.']].flatMap(([number,title,body],i)=>{
        const x=6+i*30;
        return [shape(`Fondo ${title}`,x,48,28, 30,'#f2f6f5'),text(`Número ${number}`,number,x+2,51,23,5,13,orange,600),text(`Objetivo ${number}`,title,x+2,59,24,5,19,green,600),text(`Descripción ${number}`,body,x+2,67,24,8,13,muted)];
      }),
    ]),
    slide('Separador de unidad',[
      text('Número de unidad','01',6, 30,25,24, 80,orange,600),
      text('Etiqueta de unidad','UNIDAD / EJE TEMÁTICO',35,39, 50,5,11,green,600),
      text('Título de unidad','Nombre de la unidad',35,49,59,15,35,navy,700),
      text('Pregunta disparadora','¿Qué pregunta guía este tema?',35,69, 50,8,17,muted),
    ]),
    slide('Desarrollo de un concepto',[
      ...heading('Marco conceptual','Una idea, bien explicada'),
      text('Explicación','Definí el concepto con claridad.\n\nExplicá cómo funciona, cuándo se utiliza y qué relación tiene con los temas anteriores.',6,47,51, 30,18,navy),
      shape('Recuadro destacado',64,47,30,34,'#f2f6f5'),
      text('Etiqueta destacada','IDEA CLAVE',67,51,24,5,11,green,600),
      text('Síntesis','Escribí acá la idea\nque tus estudiantes\ndeben recordar.',67,61,24,15,17,green,600),
    ]),
    slide('Comparación',[
      ...heading('Análisis','Comparar para comprender'),
      block('Alternativas',{type:'compare',left:{label:'CONCEPTO A',title:'Primer enfoque',items:['Definición o propósito','Características principales','Cuándo conviene utilizarlo']},right:{label:'CONCEPTO B',title:'Segundo enfoque',items:['Definición o propósito','Diferencias relevantes','Ejemplo de aplicación'],highlight:true}},6,46,88,37),
    ]),
    slide('Ejemplo técnico',[
      ...heading('De la teoría a la práctica','Un ejemplo paso a paso'),
      block('Código de ejemplo',{type:'code',title:'ejemplo.py',language:'python',frameStyle:'paper',codeTheme:'github-light',showLineNumbers:true,showWindowControls:false,code:'def promedio(valores):\n    return sum(valores) / len(valores)\n\nnotas = [7, 8, 9]\nprint(promedio(notas))'},6,46,56,37),
      text('Consigna de lectura','OBSERVÁ Y EXPLICÁ',67,48,27,5,11,green,600),
      text('Preguntas del ejemplo','¿Qué datos recibe?\n\n¿Qué operación realiza?\n\n¿Qué resultado esperás?',67,57,27,23,16,navy),
    ],['Ejemplo ilustrativo. Reemplazá el código por uno de la asignatura o cambiá el bloque por una imagen o un diagrama.']),
    slide('Actividad práctica',[
      ...heading('Trabajo en clase','Ahora, resolvamos un caso'),
      text('Consigna','Presentá una situación o problema que permita aplicar lo trabajado.',6,46,84,8,20,navy),
      text('Pasos de la actividad','1. Identificá los datos y las restricciones.\n\n2. Proponé una solución y justificá tu elección.\n\n3. Compará los resultados con el grupo.',6,59, 80,24,17,navy),
    ]),
    slide('Síntesis y bibliografía',[
      ...heading('Para seguir estudiando','Ideas clave y fuentes'),
      text('Título de síntesis','Nos llevamos',6,48, 40,5,20,green,600),
      text('Resumen','• Concepto principal\n\n• Relación con la práctica\n\n• Pregunta para profundizar',6,58, 40,25,17,navy),
      shape('Fondo de bibliografía',54,47,40,37,'#f2f6f5'),
      text('Título de bibliografía','Bibliografía y recursos',57,51,34,6,18,green,600),
      text('Referencias','Autor/a · Título · Año\nCapítulo o páginas de consulta\n\nMaterial de la cátedra\nEnlace al recurso o aula virtual',57,61,34, 19,13,muted),
    ]),
    slide('Cierre',[
      text('Etiqueta de cierre','CIERRE DE LA CLASE',6, 30, 80,5,12,green,600),
      text('Pregunta final','¿Qué preguntas\nnos quedan?',6,43, 80,20,44,navy,700),
      text('Próximo encuentro','Próxima clase · Lectura o actividad sugerida',6, 70, 80,6,18,muted),
      text('Contacto','Docente · Correo / aula virtual',6,81, 80,5,13,green),
    ]),
  ];
}
